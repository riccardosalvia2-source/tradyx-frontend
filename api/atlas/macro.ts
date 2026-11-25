// ============================================================================
// TRADYX API GATEWAY — ATLAS MACROECONOMICS & FDI AGGREGATOR
// (api/atlas/macro.ts)
// Aggregates World Bank Open Data v2 + FRED API (when FRED_API_KEY is present)
// with 12-hour distributed caching (Upstash Redis -> in-memory fallback).
// ============================================================================

import { ApiRequest, ApiResponse, getQueryParam, handleCorsAndMethod } from '../_lib/http';
import { verifyAuth } from '../_lib/authGuard';
import { macroQuerySchema, sendValidationError } from '../_lib/validators';
import { CACHE_TTL, withCache } from '../_lib/cacheAndRateLimit';

interface WbEntry {
    date: string;
    value: number;
}

export interface MacroGatewayPayload {
    iso3: string;
    iso2?: string;
    gdpNominalBn: number | null;
    gdpGrowth: number | null;
    inflationCpi: number | null;
    unemployment: number | null;
    policyRateFred: number | null;
    us10yYieldFred: number | null;
    marketCapToGdpPct: number | null;
    fdiHistory5Y: Array<{ year: string; inflowBn: number }>;
    providersUsed: string[];
    isLive: boolean;
    lastSyncedAt: string;
}

async function fetchWorldBankIndicator(iso3: string, indicator: string, mrv = 5): Promise<WbEntry[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3800);
    try {
        const url = `https://api.worldbank.org/v2/country/${encodeURIComponent(
            iso3
        )}/indicator/${indicator}?format=json&mrv=${mrv}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) return [];
        const json = (await res.json()) as unknown;
        if (!Array.isArray(json) || !Array.isArray(json[1])) return [];
        return json[1]
            .filter((item: any) => item && item.value !== null && item.value !== undefined)
            .map((item: any) => ({
                date: String(item.date),
                value: Number(item.value)
            }))
            .filter((item: WbEntry) => Number.isFinite(item.value));
    } catch {
        return [];
    } finally {
        clearTimeout(timer);
    }
}

async function fetchFredLatestObservation(seriesId: string, apiKey: string): Promise<number | null> {
    if (!apiKey) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3200);
    try {
        const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${encodeURIComponent(
            seriesId
        )}&api_key=${encodeURIComponent(apiKey)}&file_type=json&sort_order=desc&limit=5`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) return null;
        const json = (await res.json()) as { observations?: Array<{ value?: string }> };
        if (!Array.isArray(json?.observations)) return null;
        for (const obs of json.observations) {
            const val = Number(obs?.value);
            if (Number.isFinite(val)) return Number(val.toFixed(2));
        }
        return null;
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
    if (!handleCorsAndMethod(req, res, ['GET'])) return;

    await verifyAuth(req, res, { requireAuth: false });

    const parsed = macroQuerySchema.safeParse({
        iso3: getQueryParam(req, 'iso3'),
        iso2: getQueryParam(req, 'iso2')
    });

    if (!parsed.success) {
        sendValidationError(res, parsed.error);
        return;
    }

    const { iso3, iso2 } = parsed.data;
    const cacheKey = `tradyx:atlas:macro:v1:${iso3}`;

    const cached = await withCache<MacroGatewayPayload>(
        cacheKey,
        CACHE_TTL.MACRO_SECONDS, // 12 hours
        async () => {
            const fredKey = (process.env.FRED_API_KEY || '').trim();
            const providersUsed: string[] = [];

            const [gdpSeries, growthSeries, cpiSeries, unempSeries, fdiSeries, mcapSeries] =
                await Promise.all([
                    fetchWorldBankIndicator(iso3, 'NY.GDP.MKTP.CD', 2),
                    fetchWorldBankIndicator(iso3, 'NY.GDP.MKTP.KD.ZG', 2),
                    fetchWorldBankIndicator(iso3, 'FP.CPI.TOTL.ZG', 2),
                    fetchWorldBankIndicator(iso3, 'SL.UEM.TOTL.ZS', 2),
                    fetchWorldBankIndicator(iso3, 'BX.KLT.DINV.CD.WD', 5),
                    fetchWorldBankIndicator(iso3, 'CM.MKT.LCAP.GD.ZS', 2)
                ]);

            const hasWb =
                gdpSeries.length > 0 ||
                growthSeries.length > 0 ||
                cpiSeries.length > 0 ||
                unempSeries.length > 0;
            if (hasWb) providersUsed.push('worldbank_v2');

            let policyRateFred: number | null = null;
            let us10yYieldFred: number | null = null;

            if (fredKey) {
                const fredRateSeries =
                    iso3 === 'USA'
                        ? 'FEDFUNDS'
                        : ['ITA', 'DEU', 'FRA', 'ESP', 'NLD', 'BEL', 'AUT', 'IRL', 'PRT', 'FIN'].includes(
                              iso3
                          )
                        ? 'ECBDFR'
                        : null;

                const [rateVal, yield10y] = await Promise.all([
                    fredRateSeries ? fetchFredLatestObservation(fredRateSeries, fredKey) : Promise.resolve(null),
                    iso3 === 'USA' ? fetchFredLatestObservation('DGS10', fredKey) : Promise.resolve(null)
                ]);

                policyRateFred = rateVal;
                us10yYieldFred = yield10y;
                if (policyRateFred !== null || us10yYieldFred !== null) {
                    providersUsed.push('fred_api');
                }
            }

            const fdiHistory5Y =
                fdiSeries.length >= 3
                    ? [...fdiSeries]
                          .sort((a, b) => Number(a.date) - Number(b.date))
                          .slice(-5)
                          .map((p) => ({
                              year: p.date,
                              inflowBn: Number(Math.max(0.1, Math.abs(p.value / 1e9)).toFixed(2))
                          }))
                    : [];

            return {
                iso3,
                iso2,
                gdpNominalBn: gdpSeries[0] ? Number((gdpSeries[0].value / 1e9).toFixed(1)) : null,
                gdpGrowth: growthSeries[0] ? Number(growthSeries[0].value.toFixed(2)) : null,
                inflationCpi: cpiSeries[0] ? Number(cpiSeries[0].value.toFixed(2)) : null,
                unemployment: unempSeries[0] ? Number(unempSeries[0].value.toFixed(1)) : null,
                policyRateFred,
                us10yYieldFred,
                marketCapToGdpPct:
                    mcapSeries[0] && mcapSeries[0].value > 1
                        ? Number(mcapSeries[0].value.toFixed(1))
                        : null,
                fdiHistory5Y,
                providersUsed,
                isLive: providersUsed.length > 0,
                lastSyncedAt: new Date().toISOString()
            };
        }
    );

    res.setHeader('Cache-Control', 'public, s-maxage=43200, stale-while-revalidate=3600');
    res.setHeader('X-Tradyx-Cache', `${cached.hit ? 'HIT' : 'MISS'} (${cached.layer})`);
    res.status(200).json({
        ...cached.data,
        cacheHit: cached.hit,
        cacheLayer: cached.layer
    });
}
