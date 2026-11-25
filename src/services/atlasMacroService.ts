// ============================================================================
// TRADYX ATLAS MACROECONOMICS & WORLD BANK OPEN DATA API SERVICE
// (src/services/atlasMacroService.ts)
// Fetches live World Bank v2 macroeconomic & FDI series per ISO3 country with
// local caching and seamless merge over curated institutional baselines.
// ============================================================================

import { GlobalHub, HubMacroData, FdiHistoryPoint } from '../types/atlas';
import { getApiAuthHeaders } from './authService';

export interface EnrichedMacroResult {
    macro: HubMacroData;
    fdiHistory5Y: FdiHistoryPoint[];
    marketCapToGdpPct: number;
    totalMarketCapBn: number;
    isWorldBankLive: boolean;
    lastSyncedAt: string;
}

const macroCache = new Map<string, { data: EnrichedMacroResult; expiresAt: number }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

interface WbEntry {
    date: string;
    value: number | null;
}

async function fetchWorldBankIndicator(iso3: string, indicator: string, mrv = 5): Promise<WbEntry[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3200);
    try {
        const url = `https://api.worldbank.org/v2/country/${encodeURIComponent(
            iso3
        )}/indicator/${indicator}?format=json&mrv=${mrv}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) return [];
        const json = await res.json();
        if (!Array.isArray(json) || !Array.isArray(json[1])) return [];
        return json[1]
            .filter((item: any) => item && item.value !== null && item.value !== undefined)
            .map((item: any) => ({
                date: String(item.date),
                value: Number(item.value)
            }));
    } catch {
        return [];
    } finally {
        clearTimeout(timer);
    }
}

export async function fetchCountryMacroData(hub: GlobalHub): Promise<EnrichedMacroResult> {
    const cached = macroCache.get(hub.iso3);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
    }

    // 1. Primary path: Secure Vercel API Gateway (/api/atlas/macro — 12h Upstash Redis cache + World Bank + FRED)
    try {
        const authHeaders = await getApiAuthHeaders();
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        const params = new URLSearchParams({ iso3: hub.iso3, iso2: hub.iso2 });
        const res = await fetch(`/api/atlas/macro?${params.toString()}`, {
            headers: authHeaders,
            signal: controller.signal
        });
        clearTimeout(timer);

        if (res.ok) {
            const srv = await res.json();
            if (srv && typeof srv === 'object') {
                const mergedMacro: HubMacroData = { ...hub.macro };
                let hasLiveUpdate = false;

                if (typeof srv.gdpNominalBn === 'number') {
                    mergedMacro.gdpNominalBn = srv.gdpNominalBn;
                    hasLiveUpdate = true;
                }
                if (typeof srv.gdpGrowth === 'number') {
                    mergedMacro.gdpGrowth = srv.gdpGrowth;
                    hasLiveUpdate = true;
                }
                if (typeof srv.inflationCpi === 'number') {
                    mergedMacro.inflationCpi = srv.inflationCpi;
                    hasLiveUpdate = true;
                }
                if (typeof srv.unemployment === 'number') {
                    mergedMacro.unemployment = srv.unemployment;
                    hasLiveUpdate = true;
                }
                if (typeof srv.policyRateFred === 'number') {
                    mergedMacro.policyRate = srv.policyRateFred;
                    hasLiveUpdate = true;
                }
                if (hasLiveUpdate) {
                    mergedMacro.source = 'worldbank_live';
                }

                const fdiHistory5Y =
                    Array.isArray(srv.fdiHistory5Y) && srv.fdiHistory5Y.length >= 3
                        ? srv.fdiHistory5Y
                        : hub.fdiHistory5Y;

                let marketCapToGdpPct = hub.equityMarket.marketCapToGdpPct;
                let totalMarketCapBn = hub.equityMarket.totalMarketCapBn;
                if (typeof srv.marketCapToGdpPct === 'number' && srv.marketCapToGdpPct > 1) {
                    marketCapToGdpPct = srv.marketCapToGdpPct;
                    totalMarketCapBn = Number(
                        ((mergedMacro.gdpNominalBn * marketCapToGdpPct) / 100).toFixed(1)
                    );
                }

                const result: EnrichedMacroResult = {
                    macro: mergedMacro,
                    fdiHistory5Y,
                    marketCapToGdpPct,
                    totalMarketCapBn,
                    isWorldBankLive: hasLiveUpdate,
                    lastSyncedAt: srv.lastSyncedAt || new Date().toISOString()
                };
                macroCache.set(hub.iso3, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
                return result;
            }
        }
    } catch {
        // Fallback smoothly to direct public World Bank v2 API when running local Vite dev
    }

    const [gdpSeries, growthSeries, cpiSeries, unempSeries, fdiSeries, mcapSeries] =
        await Promise.all([
            fetchWorldBankIndicator(hub.iso3, 'NY.GDP.MKTP.CD', 2),
            fetchWorldBankIndicator(hub.iso3, 'NY.GDP.MKTP.KD.ZG', 2),
            fetchWorldBankIndicator(hub.iso3, 'FP.CPI.TOTL.ZG', 2),
            fetchWorldBankIndicator(hub.iso3, 'SL.UEM.TOTL.ZS', 2),
            fetchWorldBankIndicator(hub.iso3, 'BX.KLT.DINV.CD.WD', 5),
            fetchWorldBankIndicator(hub.iso3, 'CM.MKT.LCAP.GD.ZS', 2)
        ]);

    let hasLiveUpdate = false;
    const mergedMacro: HubMacroData = { ...hub.macro };

    if (gdpSeries[0]?.value) {
        mergedMacro.gdpNominalBn = Number((gdpSeries[0].value / 1e9).toFixed(1));
        hasLiveUpdate = true;
    }
    if (growthSeries[0]?.value !== undefined && growthSeries[0]?.value !== null) {
        mergedMacro.gdpGrowth = Number(growthSeries[0].value.toFixed(2));
        hasLiveUpdate = true;
    }
    if (cpiSeries[0]?.value !== undefined && cpiSeries[0]?.value !== null) {
        mergedMacro.inflationCpi = Number(cpiSeries[0].value.toFixed(2));
        hasLiveUpdate = true;
    }
    if (unempSeries[0]?.value !== undefined && unempSeries[0]?.value !== null) {
        mergedMacro.unemployment = Number(unempSeries[0].value.toFixed(1));
        hasLiveUpdate = true;
    }

    if (hasLiveUpdate) {
        mergedMacro.source = 'worldbank_live';
    }

    let fdiHistory5Y = hub.fdiHistory5Y;
    if (fdiSeries.length >= 3) {
        const sorted = [...fdiSeries]
            .sort((a, b) => Number(a.date) - Number(b.date))
            .slice(-5)
            .map((p) => ({
                year: p.date,
                inflowBn: Number(Math.max(0.1, Math.abs((p.value || 0) / 1e9)).toFixed(2))
            }));
        if (sorted.length >= 3) {
            fdiHistory5Y = sorted;
        }
    }

    let marketCapToGdpPct = hub.equityMarket.marketCapToGdpPct;
    let totalMarketCapBn = hub.equityMarket.totalMarketCapBn;

    if (mcapSeries[0]?.value && mcapSeries[0].value > 1) {
        marketCapToGdpPct = Number(mcapSeries[0].value.toFixed(1));
        totalMarketCapBn = Number(((mergedMacro.gdpNominalBn * marketCapToGdpPct) / 100).toFixed(1));
    }

    const result: EnrichedMacroResult = {
        macro: mergedMacro,
        fdiHistory5Y,
        marketCapToGdpPct,
        totalMarketCapBn,
        isWorldBankLive: hasLiveUpdate,
        lastSyncedAt: new Date().toISOString()
    };

    macroCache.set(hub.iso3, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
}
