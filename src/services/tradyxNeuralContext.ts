// ============================================================================
// TRADYX NEURAL CORE — EVENT BUS & LIVE SYSTEM TELEMETRY AGGREGATOR
// (src/services/tradyxNeuralContext.ts)
// Captures the live state of the entire Tradyx OS:
// 1. Circular 30-event behavioral stream (navigation, ATLAS, trades, alerts, Ulysses)
// 2. Quantitative History & Wallet analytics (last 30 trades + Bias Telemetry)
// 3. Onboarding diagnostic profile & active risk limits
// 4. Contextual cross-screen Copilot handoff ("Chiedi a Tradyx AI")
// ============================================================================

import { create } from 'zustand';
import { Trade } from '../types/trade';
import { GlobalHub } from '../types/atlas';
import { useTradeStore, DEFAULT_MOCK_TRADES } from '../store/useTradeStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { getStoredAlerts } from './priceAlertService';
import {
    getCortisolClearingStatus,
    analyzeDispositionEffect,
    analyzeDelayDiscounting
} from './neuroPsychService';

export type NeuralEventType =
    | 'NAVIGATE'
    | 'ATLAS_COUNTRY_OPEN'
    | 'ATLAS_COUNTRY_CLOSE'
    | 'ATLAS_TICKER_VIEW'
    | 'WATCHLIST_UPDATE'
    | 'PRICE_ALERT_CREATED'
    | 'PRICE_ALERT_DELETED'
    | 'TRADE_CREATED'
    | 'TRADE_DELETED'
    | 'TRADE_RESTORED'
    | 'ULYSSES_TRIGGERED'
    | 'ULYSSES_UNLOCKED'
    | 'ULYSSES_BREAK'
    | 'COPILOT_ASK_CONTEXT';

export interface NeuralTelemetryEvent {
    id: string;
    type: NeuralEventType;
    timestamp: string; // HH:mm:ss
    isoTimestamp: string;
    summary: string;
    metadata?: Record<string, string | number | boolean | null>;
}

export interface ActiveAtlasHubSnapshot {
    countryName: string;
    iso2: string;
    city: string;
    exchangeCode: string;
    centralBank: string;
    policyRate: number;
    inflationCpi: number;
    gdpGrowth: number;
    yield10y: number;
    primaryIndex: string;
    fxPair: string;
    topStocks: string[];
    openedAt: string;
}

export interface PendingCopilotRequest {
    id: string;
    prompt: string;
    source: string;
    createdAt: number;
}

export interface AssetPerformanceStat {
    symbol: string;
    trades: number;
    winRatePct: number;
    netPnl: number;
}

export interface TimeSlotPerformanceStat {
    slot: string;
    trades: number;
    winRatePct: number;
    netPnl: number;
}

export interface BiasTelemetry {
    revengeTrading: {
        countWithin10MinAfterLoss: number;
        lossesInRevengeTrades: number;
        revengeWinRatePct: number;
        score: number; // 0-100
        summary: string;
    };
    tiltOversizing: {
        avgSizeAfterLoss: number;
        avgSizeAfterWin: number;
        sizeMultiplierAfterLoss: number;
        score: number; // 0-100
        summary: string;
    };
    overtrading: {
        todayTradeCount: number;
        historicalDailyAvg: number;
        ratio: number;
        isAlert: boolean;
        summary: string;
    };
    bestAsset: AssetPerformanceStat | null;
    worstAsset: AssetPerformanceStat | null;
    bestTimeSlot: TimeSlotPerformanceStat | null;
    worstTimeSlot: TimeSlotPerformanceStat | null;
    cortisolClearingActive: boolean;
    cortisolRemainingMinutes: number;
    dispositionEffectDetected: boolean;
    delayDiscountingDetected: boolean;
    emotionalStatusLabel: 'Lucido' | 'Cautela' | 'Allerta';
}

export interface TradyxLiveContext {
    capturedAt: string;
    activeTab: string;
    activeAtlasHub: ActiveAtlasHubSnapshot | null;
    lastViewedTicker: string | null;
    walletAndRisk: {
        baseCurrency: string;
        startingCapital: number;
        currentBalance: number;
        netPnlTotal: number;
        todayPnl: number;
        dailyDrawdownPct: number;
        dailyDrawdownLimitPct: number;
        propFirmShieldEnabled: boolean;
        propFirmAccountSize: number;
        maxRiskPerTrade: number;
        maxRiskType: 'PERCENT' | 'FIXED';
    };
    performanceMetrics: {
        totalTradesAnalyzed: number;
        winRatePct: number;
        profitFactor: number;
        avgWin: number;
        avgLoss: number;
        realizedRR: number;
        consecutiveLosses: number;
        consecutiveWins: number;
    };
    biasTelemetry: BiasTelemetry;
    onboardingProfile: {
        preferredMarket: string;
        accountType: 'PROP_FIRM' | 'PERSONAL';
        primaryEmotionalTrigger: string | null;
        archetypeTitle: string | null;
        ulyssesStrictMode: boolean;
        ulyssesLossThreshold: number;
    };
    activePriceAlerts: Array<{
        symbol: string;
        condition: 'ABOVE' | 'BELOW';
        targetPrice: number;
        note?: string;
    }>;
    recentTrades: Array<{
        id: string;
        asset_pair: string;
        direction: 'LONG' | 'SHORT';
        pnl: number;
        roi?: number;
        position_size: number;
        entry_price?: number;
        exit_price?: number;
        strategy?: string;
        emotional_state?: string;
        errors: string[];
        notes?: string;
        timestamp: string;
        hourOfDay: number;
        minutesSincePreviousTrade: number | null;
    }>;
    sessionEvents: NeuralTelemetryEvent[];
}

const MAX_EVENTS = 30;
const SESSION_STORAGE_KEY = 'tradyx_neural_events_v1';

function loadSessionEvents(): NeuralTelemetryEvent[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed.slice(0, MAX_EVENTS);
        }
    } catch {
        // Ignore storage errors
    }
    return [];
}

function saveSessionEvents(events: NeuralTelemetryEvent[]): void {
    if (typeof window === 'undefined') return;
    try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(events.slice(0, MAX_EVENTS)));
    } catch {
        // Ignore storage errors
    }
}

interface NeuralTelemetryState {
    activeTab: string;
    events: NeuralTelemetryEvent[];
    activeAtlasHub: ActiveAtlasHubSnapshot | null;
    lastViewedTicker: string | null;
    pendingCopilotRequest: PendingCopilotRequest | null;
    recordEvent: (
        type: NeuralEventType,
        summary: string,
        metadata?: Record<string, string | number | boolean | null>
    ) => void;
    setActiveTab: (tab: string) => void;
    setActiveAtlasHub: (hub: GlobalHub | null) => void;
    setLastViewedTicker: (ticker: string | null) => void;
    queueCopilotPrompt: (prompt: string, source: string) => void;
    consumePendingCopilotRequest: () => PendingCopilotRequest | null;
}

export const useNeuralTelemetryStore = create<NeuralTelemetryState>((set, get) => ({
    activeTab: 'HOME',
    events: loadSessionEvents(),
    activeAtlasHub: null,
    lastViewedTicker: null,
    pendingCopilotRequest: null,

    recordEvent: (type, summary, metadata) => {
        const now = new Date();
        const evt: NeuralTelemetryEvent = {
            id: `ev-${now.getTime()}-${Math.random().toString(36).slice(2, 6)}`,
            type,
            timestamp: now.toLocaleTimeString('it-IT', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }),
            isoTimestamp: now.toISOString(),
            summary,
            metadata
        };
        const next = [evt, ...get().events].slice(0, MAX_EVENTS);
        saveSessionEvents(next);
        set({ events: next });
    },

    setActiveTab: (tab: string) => {
        const upper = tab.toUpperCase();
        if (get().activeTab === upper) return;
        set({ activeTab: upper });
        get().recordEvent('NAVIGATE', `Navigazione verso schermata ${upper}`, { tab: upper });
    },

    setActiveAtlasHub: (hub: GlobalHub | null) => {
        if (!hub) {
            const prev = get().activeAtlasHub;
            set({ activeAtlasHub: null });
            if (prev) {
                get().recordEvent(
                    'ATLAS_COUNTRY_CLOSE',
                    `Chiusa scheda ATLAS ${prev.countryName} (${prev.city})`,
                    { iso2: prev.iso2 }
                );
            }
            return;
        }

        const snapshot: ActiveAtlasHubSnapshot = {
            countryName: hub.countryName,
            iso2: hub.iso2,
            city: hub.city,
            exchangeCode: hub.exchangeCode,
            centralBank: hub.macro.centralBank,
            policyRate: hub.macro.policyRate,
            inflationCpi: hub.macro.inflationCpi,
            gdpGrowth: hub.macro.gdpGrowth,
            yield10y: hub.bondYields.y10,
            primaryIndex: hub.primaryIndex.symbol,
            fxPair: hub.fxPairLabel,
            topStocks: hub.topStocks.map((s) => s.symbol).slice(0, 6),
            openedAt: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
        };
        set({ activeAtlasHub: snapshot });
        get().recordEvent(
            'ATLAS_COUNTRY_OPEN',
            `Aperto paese ATLAS ${hub.countryName} / ${hub.city} (${hub.primaryIndex.symbol}, ${hub.macro.centralBank} ${hub.macro.policyRate}%, ${hub.iso2}10Y ${hub.bondYields.y10}%)`,
            { iso2: hub.iso2, index: hub.primaryIndex.symbol }
        );
    },

    setLastViewedTicker: (ticker: string | null) => {
        if (!ticker) return;
        const clean = ticker.trim().toUpperCase();
        set({ lastViewedTicker: clean });
        get().recordEvent('ATLAS_TICKER_VIEW', `Ispezionato grafico/quotazione ${clean}`, {
            ticker: clean
        });
    },

    queueCopilotPrompt: (prompt: string, source: string) => {
        const req: PendingCopilotRequest = {
            id: `ask-${Date.now()}`,
            prompt: prompt.trim(),
            source,
            createdAt: Date.now()
        };
        set({ pendingCopilotRequest: req });
        get().recordEvent('COPILOT_ASK_CONTEXT', `Aperto Tradyx AI da ${source}`, { source });
    },

    consumePendingCopilotRequest: () => {
        const current = get().pendingCopilotRequest;
        if (current) {
            set({ pendingCopilotRequest: null });
        }
        return current;
    }
}));

/**
 * Convenience global event emitter callable from any store or component without React hooks.
 */
export function recordNeuralEvent(
    type: NeuralEventType,
    summary: string,
    metadata?: Record<string, string | number | boolean | null>
): void {
    useNeuralTelemetryStore.getState().recordEvent(type, summary, metadata);
}

function getTimeSlotLabel(hour: number): string {
    if (hour >= 0 && hour < 8) return '00:00–08:00 (Asia)';
    if (hour >= 8 && hour < 12) return '08:00–12:00 (Europa Apertura)';
    if (hour >= 12 && hour < 15) return '12:00–15:00 (Pre-NY)';
    if (hour >= 15 && hour < 19) return '15:00–19:00 (Wall Street)';
    return '19:00–24:00 (Sessione Serale)';
}

/**
 * Computes the complete live omniscient context (`TradyxLiveContext`) across:
 * - Last 30 trades from History & Wallet
 * - Automatic quantitative metrics & Bias Telemetry
 * - Onboarding psychological profile & risk limits
 * - Active ATLAS hub, Price Alerts & last 30 live UI events
 */
export function buildTradyxLiveContext(): TradyxLiveContext {
    const tradeState = useTradeStore.getState();
    const settings = useSettingsStore.getState();
    const neural = useNeuralTelemetryStore.getState();

    const rawTrades: Trade[] =
        Array.isArray(tradeState.trades) && tradeState.trades.length > 0
            ? tradeState.trades
            : DEFAULT_MOCK_TRADES;

    // Sort newest -> oldest and slice last 30 trades
    const sorted = [...rawTrades].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const last30 = sorted.slice(0, 30);

    // 1. Wallet & Risk Metrics
    const startingCapital = settings.propFirmShieldEnabled
        ? settings.propFirmAccountSize || 100000
        : settings.monthlyBudget || 10000;
    const netPnlTotal = Number(
        last30.reduce((acc, t) => acc + (Number(t.pnl) || 0), 0).toFixed(2)
    );
    const currentBalance = Number((startingCapital + netPnlTotal).toFixed(2));

    const todayIso = new Date().toISOString().slice(0, 10);
    const todaysTrades = sorted.filter((t) => (t.created_at || '').startsWith(todayIso));
    const todayPnl = Number(
        todaysTrades.reduce((acc, t) => acc + (Number(t.pnl) || 0), 0).toFixed(2)
    );
    const dailyDrawdownPct =
        todayPnl < 0 && startingCapital > 0
            ? Number(((Math.abs(todayPnl) / startingCapital) * 100).toFixed(2))
            : 0;
    const dailyDrawdownLimitPct = settings.propFirmShieldEnabled
        ? settings.propFirmMaxDailyLossPercent || 4.0
        : 5.0;

    // 2. Performance Metrics
    const wins = last30.filter((t) => (Number(t.pnl) || 0) > 0);
    const losses = last30.filter((t) => (Number(t.pnl) || 0) < 0);
    const winRatePct =
        last30.length > 0 ? Number(((wins.length / last30.length) * 100).toFixed(1)) : 0;

    const grossProfit = wins.reduce((acc, t) => acc + (Number(t.pnl) || 0), 0);
    const grossLoss = Math.abs(losses.reduce((acc, t) => acc + (Number(t.pnl) || 0), 0));
    const profitFactor =
        grossLoss > 0
            ? Number((grossProfit / grossLoss).toFixed(2))
            : grossProfit > 0
            ? 9.99
            : 0;

    const avgWin = wins.length > 0 ? Number((grossProfit / wins.length).toFixed(2)) : 0;
    const avgLoss = losses.length > 0 ? Number((grossLoss / losses.length).toFixed(2)) : 0;
    const realizedRR = avgLoss > 0 ? Number((avgWin / avgLoss).toFixed(2)) : avgWin > 0 ? 3.0 : 0;

    let consecutiveLosses = 0;
    for (const t of last30) {
        if ((Number(t.pnl) || 0) < 0) consecutiveLosses += 1;
        else break;
    }
    let consecutiveWins = 0;
    for (const t of last30) {
        if ((Number(t.pnl) || 0) > 0) consecutiveWins += 1;
        else break;
    }

    // 3. Automatic Bias Telemetry (Revenge Trading, Tilt Oversizing, Overtrading, Asset/Hour matrix)
    let revengeCount = 0;
    let revengeLosses = 0;
    const sizesAfterLoss: number[] = [];
    const sizesAfterWin: number[] = [];

    const assetMap = new Map<string, { trades: number; wins: number; netPnl: number }>();
    const slotMap = new Map<string, { trades: number; wins: number; netPnl: number }>();
    const dayCounts = new Map<string, number>();

    const normalizedRecent = last30.map((t, idx) => {
        const prevChrono = last30[idx + 1]; // older trade right before this one
        let deltaMins: number | null = null;
        if (prevChrono?.created_at && t.created_at) {
            const diff = new Date(t.created_at).getTime() - new Date(prevChrono.created_at).getTime();
            if (Number.isFinite(diff) && diff >= 0) {
                deltaMins = Math.round(diff / 60000);
            }
            const prevPnl = Number(prevChrono.pnl) || 0;
            const curSize = Number(t.position_size) || 1;
            if (prevPnl < 0) {
                sizesAfterLoss.push(curSize);
                if (deltaMins !== null && deltaMins < 10) {
                    revengeCount += 1;
                    if ((Number(t.pnl) || 0) < 0) revengeLosses += 1;
                }
            } else if (prevPnl > 0) {
                sizesAfterWin.push(curSize);
            }
        }

        const dt = t.created_at ? new Date(t.created_at) : new Date();
        const hour = Number.isNaN(dt.getTime()) ? 12 : dt.getHours();
        const dayKey = (t.created_at || todayIso).slice(0, 10);
        dayCounts.set(dayKey, (dayCounts.get(dayKey) || 0) + 1);

        const sym = (t.asset_pair || 'UNKNOWN').toUpperCase();
        const aEntry = assetMap.get(sym) || { trades: 0, wins: 0, netPnl: 0 };
        aEntry.trades += 1;
        if ((Number(t.pnl) || 0) > 0) aEntry.wins += 1;
        aEntry.netPnl = Number((aEntry.netPnl + (Number(t.pnl) || 0)).toFixed(2));
        assetMap.set(sym, aEntry);

        const slot = getTimeSlotLabel(hour);
        const sEntry = slotMap.get(slot) || { trades: 0, wins: 0, netPnl: 0 };
        sEntry.trades += 1;
        if ((Number(t.pnl) || 0) > 0) sEntry.wins += 1;
        sEntry.netPnl = Number((sEntry.netPnl + (Number(t.pnl) || 0)).toFixed(2));
        slotMap.set(slot, sEntry);

        return {
            id: t.id,
            asset_pair: sym,
            direction: (t.direction === 'SHORT' ? 'SHORT' : 'LONG') as 'LONG' | 'SHORT',
            pnl: Number(t.pnl) || 0,
            roi: t.roi != null ? Number(t.roi) : undefined,
            position_size: Number(t.position_size) || 1,
            entry_price: t.entry_price != null ? Number(t.entry_price) : undefined,
            exit_price: t.exit_price != null ? Number(t.exit_price) : undefined,
            strategy: t.strategy || undefined,
            emotional_state: t.emotional_state || undefined,
            errors: Array.isArray(t.errors) ? t.errors : [],
            notes: t.notes ? t.notes.slice(0, 220) : undefined,
            timestamp: Number.isNaN(dt.getTime())
                ? 'N/D'
                : dt.toLocaleString('it-IT', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                  }),
            hourOfDay: hour,
            minutesSincePreviousTrade: deltaMins
        };
    });

    const revengeWinRatePct =
        revengeCount > 0
            ? Number((((revengeCount - revengeLosses) / revengeCount) * 100).toFixed(1))
            : 100;
    const revengeScore = Math.min(100, revengeCount * 28 + revengeLosses * 14);

    const avgSizeAfterLoss =
        sizesAfterLoss.length > 0
            ? Number(
                  (sizesAfterLoss.reduce((a, b) => a + b, 0) / sizesAfterLoss.length).toFixed(3)
              )
            : 0;
    const avgSizeAfterWin =
        sizesAfterWin.length > 0
            ? Number((sizesAfterWin.reduce((a, b) => a + b, 0) / sizesAfterWin.length).toFixed(3))
            : 0;
    const sizeMultiplierAfterLoss =
        avgSizeAfterWin > 0 && avgSizeAfterLoss > 0
            ? Number((avgSizeAfterLoss / avgSizeAfterWin).toFixed(2))
            : 1.0;
    const tiltScore =
        sizeMultiplierAfterLoss > 1.15
            ? Math.min(100, Math.round((sizeMultiplierAfterLoss - 1) * 110))
            : 0;

    const distinctDays = Math.max(1, dayCounts.size);
    const historicalDailyAvg = Number((last30.length / distinctDays).toFixed(1));
    const todayTradeCount = todaysTrades.length;
    const overtradingRatio =
        historicalDailyAvg > 0 ? Number((todayTradeCount / historicalDailyAvg).toFixed(2)) : 0;
    const overtradingAlert = todayTradeCount >= 4 && overtradingRatio >= 1.5;

    const assetStats: AssetPerformanceStat[] = Array.from(assetMap.entries()).map(
        ([symbol, v]) => ({
            symbol,
            trades: v.trades,
            winRatePct: Number(((v.wins / v.trades) * 100).toFixed(1)),
            netPnl: v.netPnl
        })
    );
    const sortedAssetsByPnl = [...assetStats].sort((a, b) => b.netPnl - a.netPnl);
    const bestAsset = sortedAssetsByPnl[0] || null;
    const worstAsset =
        sortedAssetsByPnl.length > 1 ? sortedAssetsByPnl[sortedAssetsByPnl.length - 1] : null;

    const slotStats: TimeSlotPerformanceStat[] = Array.from(slotMap.entries()).map(([slot, v]) => ({
        slot,
        trades: v.trades,
        winRatePct: Number(((v.wins / v.trades) * 100).toFixed(1)),
        netPnl: v.netPnl
    }));
    const sortedSlotsByPnl = [...slotStats].sort((a, b) => b.netPnl - a.netPnl);
    const bestTimeSlot = sortedSlotsByPnl[0] || null;
    const worstTimeSlot =
        sortedSlotsByPnl.length > 1 ? sortedSlotsByPnl[sortedSlotsByPnl.length - 1] : null;

    const cortisol = getCortisolClearingStatus(last30);
    const disposition = analyzeDispositionEffect(last30);
    const delayDiscounting = analyzeDelayDiscounting(last30);

    const isHighAlert =
        consecutiveLosses >= 2 ||
        cortisol.isClearingActive ||
        revengeScore >= 50 ||
        tiltScore >= 45 ||
        dailyDrawdownPct >= dailyDrawdownLimitPct * 0.65;
    const isCaution =
        !isHighAlert &&
        (overtradingAlert ||
            disposition.detected ||
            delayDiscounting.detected ||
            dailyDrawdownPct >= dailyDrawdownLimitPct * 0.35);

    const emotionalStatusLabel: 'Lucido' | 'Cautela' | 'Allerta' = isHighAlert
        ? 'Allerta'
        : isCaution
        ? 'Cautela'
        : 'Lucido';

    // 4. Price Alerts Snapshot
    let activePriceAlerts: TradyxLiveContext['activePriceAlerts'] = [];
    try {
        activePriceAlerts = getStoredAlerts()
            .filter((a) => a.isActive)
            .slice(0, 10)
            .map((a) => ({
                symbol: a.symbol,
                condition: a.condition,
                targetPrice: a.targetPrice,
                note: a.note
            }));
    } catch {
        activePriceAlerts = [];
    }

    const diag = settings.diagnosticProfile;

    return {
        capturedAt: new Date().toISOString(),
        activeTab: neural.activeTab,
        activeAtlasHub: neural.activeAtlasHub,
        lastViewedTicker: neural.lastViewedTicker,
        walletAndRisk: {
            baseCurrency: settings.baseCurrency?.code || 'EUR',
            startingCapital,
            currentBalance,
            netPnlTotal,
            todayPnl,
            dailyDrawdownPct,
            dailyDrawdownLimitPct,
            propFirmShieldEnabled: settings.propFirmShieldEnabled,
            propFirmAccountSize: settings.propFirmAccountSize,
            maxRiskPerTrade: settings.maxRiskPerTrade,
            maxRiskType: settings.maxRiskType
        },
        performanceMetrics: {
            totalTradesAnalyzed: last30.length,
            winRatePct,
            profitFactor,
            avgWin,
            avgLoss,
            realizedRR,
            consecutiveLosses,
            consecutiveWins
        },
        biasTelemetry: {
            revengeTrading: {
                countWithin10MinAfterLoss: revengeCount,
                lossesInRevengeTrades: revengeLosses,
                revengeWinRatePct,
                score: revengeScore,
                summary:
                    revengeCount > 0
                        ? `${revengeCount} trade aperti entro 10 min da uno stop loss (${revengeLosses} in perdita, WR ${revengeWinRatePct}%).`
                        : 'Nessun re-entry impulsivo entro 10 minuti da una perdita negli ultimi 30 trade.'
            },
            tiltOversizing: {
                avgSizeAfterLoss,
                avgSizeAfterWin,
                sizeMultiplierAfterLoss,
                score: tiltScore,
                summary:
                    sizeMultiplierAfterLoss > 1.15
                        ? `Size media dopo perdita (${avgSizeAfterLoss}) superiore di ${sizeMultiplierAfterLoss}x rispetto a dopo profitto (${avgSizeAfterWin}).`
                        : `Size stabile dopo perdite (${sizeMultiplierAfterLoss}x vs post-profitto).`
            },
            overtrading: {
                todayTradeCount,
                historicalDailyAvg,
                ratio: overtradingRatio,
                isAlert: overtradingAlert,
                summary: overtradingAlert
                    ? `Oggi ${todayTradeCount} trade contro una media storica di ${historicalDailyAvg}/giorno (${overtradingRatio}x).`
                    : `Ritmo operativo regolare (${todayTradeCount} oggi vs media ${historicalDailyAvg}/giorno).`
            },
            bestAsset,
            worstAsset,
            bestTimeSlot,
            worstTimeSlot,
            cortisolClearingActive: cortisol.isClearingActive,
            cortisolRemainingMinutes: cortisol.remainingMinutes,
            dispositionEffectDetected: disposition.detected,
            delayDiscountingDetected: delayDiscounting.detected,
            emotionalStatusLabel
        },
        onboardingProfile: {
            preferredMarket: settings.preferredMarket || 'Crypto & Indici',
            accountType: settings.propFirmShieldEnabled ? 'PROP_FIRM' : 'PERSONAL',
            primaryEmotionalTrigger:
                diag?.answers?.lossTrigger ||
                diag?.answers?.mainEnemy ||
                diag?.result?.riskBadgeTitle ||
                null,
            archetypeTitle: diag?.result?.archetypeLabel || null,
            ulyssesStrictMode: settings.ulyssesStrictMode,
            ulyssesLossThreshold: settings.ulyssesLossThreshold
        },
        activePriceAlerts,
        recentTrades: normalizedRecent,
        sessionEvents: neural.events.slice(0, 30)
    };
}
