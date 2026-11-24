// ============================================================================
// TRADYX ATLAS — INSTITUTIONAL COUNTRY DRILL-DOWN PANEL
// (src/components/atlas/CountryDrilldownDrawer.tsx)
// Mobile: Full-Screen (100dvh, zero overlap) | Desktop: 68% max-w-4xl right drawer
// Header: Back, Flag, Country/City(Code), Live Exchange Status, Central Bank,
//         Sovereign Rating + 3 Highlight KPI Cards (Index, FX, 2Y/10Y Bond)
// Tab 1: Mercati & Broker (1000ms ticks, LAST/BID/ASK, VAR 24H, MIN/MAX, TREND)
// Tab 2: News & AI Impact (20+ news, BULLISH/BEARISH/NEUTRAL filters + search)
// Tab 3: Macro & Flussi FDI (3 working sub-tabs: FDI + Donut/Bar/Area, Equity
//        Market Cap + Donut/Bar/Live Top Corps, 13-KPI Fondamentali & Borsa)
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
    ArrowLeft,
    Activity,
    Newspaper,
    BarChart3,
    Play,
    Pause,
    ExternalLink,
    TrendingUp,
    TrendingDown,
    Sparkles,
    Search,
    CandlestickChart,
    Building2,
    Landmark,
    ShieldCheck,
    RefreshCw,
    Zap
} from 'lucide-react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    AreaChart,
    Area,
    CartesianGrid,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    GlobalHub,
    AtlasLiveAsset,
    AtlasAssetCategory,
    AtlasNewsItem
} from '../../types/atlas';
import { getExchangeStatus } from '../../data/globalHubs';
import { fetchCountryNewsWithAIImpact } from '../../services/atlasNewsService';
import { fetchCountryMacroData, EnrichedMacroResult } from '../../services/atlasMacroService';

type DrawerMainTab = 'MARKETS' | 'NEWS' | 'MACRO';
type MacroSubTab = 'FDI_FLOWS' | 'EQUITY_CAP' | 'FUNDAMENTALS';

interface CountryDrilldownDrawerProps {
    hub: GlobalHub;
    localAssets: AtlasLiveAsset[];
    globalAssets: AtlasLiveAsset[];
    isLiveRunning: boolean;
    onToggleLive: () => void;
    lastTickTime: string;
    onClose: () => void;
    onOpenAssetChart: (asset: AtlasLiveAsset) => void;
    onTickerClick: (tickerSymbol: string) => void;
}

const MARKET_SUB_FILTERS: Array<{ id: AtlasAssetCategory; label: string }> = [
    { id: 'COUNTRY', label: 'Mercati del Paese' },
    { id: 'INDICES', label: 'Indici' },
    { id: 'STOCKS', label: 'Azioni' },
    { id: 'FOREX', label: 'Forex' },
    { id: 'BONDS', label: 'Bond' },
    { id: 'COMMODITIES', label: 'Commodities' },
    { id: 'CRYPTO', label: 'Crypto' }
];

const CHART_PALETTE = ['#10B981', '#38BDF8', '#FACC15', '#818CF8', '#FB7185', '#F97316', '#2DD4BF'];

const MiniSparkline: React.FC<{ data: number[]; isPositive: boolean }> = ({ data, isPositive }) => {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 62;
    const height = 22;

    const points = data
        .map((v, i) => {
            const px = (i / (data.length - 1)) * width;
            const py = height - ((v - min) / range) * (height - 4) - 2;
            return `${px.toFixed(1)},${py.toFixed(1)}`;
        })
        .join(' ');

    return (
        <svg width={width} height={height} className="overflow-visible shrink-0">
            <polyline
                fill="none"
                stroke={isPositive ? '#10B981' : '#DC2626'}
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
        </svg>
    );
};

export const CountryDrilldownDrawer: React.FC<CountryDrilldownDrawerProps> = ({
    hub,
    localAssets,
    globalAssets,
    isLiveRunning,
    onToggleLive,
    lastTickTime,
    onClose,
    onOpenAssetChart,
    onTickerClick
}) => {
    const [activeTab, setActiveTab] = useState<DrawerMainTab>('MARKETS');
    const [assetCategory, setAssetCategory] = useState<AtlasAssetCategory>('COUNTRY');
    const [assetSearch, setAssetSearch] = useState<string>('');

    // Tab 2: News & AI Impact state
    const [newsItems, setNewsItems] = useState<AtlasNewsItem[]>([]);
    const [isLoadingNews, setIsLoadingNews] = useState<boolean>(true);
    const [newsSentimentFilter, setNewsSentimentFilter] = useState<
        'ALL' | 'BULLISH' | 'BEARISH' | 'NEUTRAL'
    >('ALL');
    const [newsSearch, setNewsSearch] = useState<string>('');

    // Tab 3: Macro & FDI 3 Sub-Tabs
    const [macroSubTab, setMacroSubTab] = useState<MacroSubTab>('FDI_FLOWS');
    const [macroData, setMacroData] = useState<EnrichedMacroResult>(() => ({
        macro: hub.macro,
        fdiHistory5Y: hub.fdiHistory5Y,
        marketCapToGdpPct: hub.equityMarket.marketCapToGdpPct,
        totalMarketCapBn: hub.equityMarket.totalMarketCapBn,
        isWorldBankLive: false,
        lastSyncedAt: new Date().toISOString()
    }));
    const [isLoadingMacro, setIsLoadingMacro] = useState<boolean>(false);

    const exchangeStatus = useMemo(() => getExchangeStatus(hub), [hub, lastTickTime]);

    // Sync News & World Bank Macro whenever hub changes
    useEffect(() => {
        let isMounted = true;
        setAssetCategory('COUNTRY');
        setAssetSearch('');
        setNewsSentimentFilter('ALL');
        setNewsSearch('');
        setIsLoadingNews(true);
        setIsLoadingMacro(true);

        setMacroData({
            macro: hub.macro,
            fdiHistory5Y: hub.fdiHistory5Y,
            marketCapToGdpPct: hub.equityMarket.marketCapToGdpPct,
            totalMarketCapBn: hub.equityMarket.totalMarketCapBn,
            isWorldBankLive: false,
            lastSyncedAt: new Date().toISOString()
        });

        fetchCountryNewsWithAIImpact(hub)
            .then((items) => {
                if (isMounted) setNewsItems(items);
            })
            .finally(() => {
                if (isMounted) setIsLoadingNews(false);
            });

        fetchCountryMacroData(hub)
            .then((enriched) => {
                if (isMounted) setMacroData(enriched);
            })
            .finally(() => {
                if (isMounted) setIsLoadingMacro(false);
            });

        return () => {
            isMounted = false;
        };
    }, [hub]);

    const displayedAssets = useMemo(() => {
        const pool =
            assetCategory === 'COUNTRY'
                ? localAssets
                : globalAssets.filter((a) => a.category === assetCategory);

        const q = assetSearch.trim().toLowerCase();
        if (!q) return pool;
        return pool.filter(
            (a) => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
        );
    }, [assetCategory, localAssets, globalAssets, assetSearch]);

    const filteredNews = useMemo(() => {
        const q = newsSearch.trim().toLowerCase();
        return newsItems.filter((n) => {
            const matchesSentiment =
                newsSentimentFilter === 'ALL' || n.aiImpact.sentiment === newsSentimentFilter;
            const matchesText =
                !q ||
                n.title.toLowerCase().includes(q) ||
                n.source.toLowerCase().includes(q) ||
                n.aiImpact.operationalImpact.toLowerCase().includes(q) ||
                n.aiImpact.impactedTickers.some((t) => t.toLowerCase().includes(q));
            return matchesSentiment && matchesText;
        });
    }, [newsItems, newsSentimentFilter, newsSearch]);

    const formatNum = (val: number, decimals = 2, unit?: string) => {
        const str = val.toLocaleString('it-IT', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
        if (unit === '%') return `${str}%`;
        if (unit === '$' || unit === '€') return `${unit}${str}`;
        return str;
    };

    // Header 3 Highlight Mini-KPIs (live updated)
    const primaryIndexLive = localAssets[0];
    const fxLive = localAssets.find((a) => a.category === 'FOREX');
    const latestFdiBn =
        macroData.fdiHistory5Y[macroData.fdiHistory5Y.length - 1]?.inflowBn ?? 0;

    return (
        <div className="fixed inset-0 z-[70] flex justify-end pointer-events-none">
            {/* Desktop left-side transparent click zone leaving 3D globe visible & interactive */}
            <div
                onClick={onClose}
                className="hidden lg:block flex-1 pointer-events-auto cursor-pointer bg-black/20"
                title="Clicca per tornare al Globo 3D"
            />

            {/* Main Panel: Full-Screen on Mobile (w-full h-[100dvh]), Wide 68% max-w-4xl Drawer on Desktop */}
            <aside className="relative pointer-events-auto w-full h-[100dvh] lg:w-[68%] lg:max-w-4xl bg-[#08090C]/95 backdrop-blur-2xl lg:border-l lg:border-white/[0.12] shadow-2xl flex flex-col overflow-hidden text-white">
                {/* ========================================================= */}
                {/* FIXED INSTITUTIONAL COUNTRY HEADER                        */}
                {/* ========================================================= */}
                <header className="shrink-0 px-4 sm:px-5 pt-[max(env(safe-area-inset-top,14px),14px)] pb-3 border-b border-white/[0.08] bg-[#08090C]/95 backdrop-blur-xl space-y-3">
                    {/* Row 1: Back Button + Live Exchange Status + Sovereign Rating */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-bold text-slate-100 transition active:scale-95 cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4 text-[#10B981]" />
                            <span>Torna alla Mappa</span>
                        </button>

                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-black border ${
                                    exchangeStatus.isOpen
                                        ? 'bg-emerald-500/15 text-[#10B981] border-emerald-500/40'
                                        : 'bg-slate-800/80 text-slate-400 border-slate-700'
                                }`}
                            >
                                <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                        exchangeStatus.isOpen
                                            ? 'bg-[#10B981] animate-ping'
                                            : 'bg-slate-500'
                                    }`}
                                />
                                <span>
                                    {exchangeStatus.label} · {exchangeStatus.localTimeStr}
                                </span>
                            </span>

                            <span className="px-2 py-1 rounded-full text-[10px] font-mono font-black bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/35">
                                RATING {macroData.macro.sovereignRating}
                            </span>
                        </div>
                    </div>

                    {/* Row 2: Flag, PAESE / Città (Codice Borsa) + Central Bank */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-2xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-2xl shrink-0">
                                {hub.flag}
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-sm sm:text-lg font-black text-white tracking-tight truncate">
                                    {hub.countryName.toUpperCase()} / {hub.city}{' '}
                                    <span className="text-[#10B981] font-mono text-xs sm:text-sm">
                                        ({hub.exchangeCode})
                                    </span>
                                </h2>
                                <p className="text-[11px] font-mono text-slate-400 truncate">
                                    {macroData.macro.centralBank} · Tasso{' '}
                                    <strong className="text-slate-200">
                                        {macroData.macro.policyRate.toFixed(2)}%
                                    </strong>{' '}
                                    · {hub.exchangeName}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Row 3: 3 Mini-Card KPI in Evidenza (Indice Nazionale, Valuta, Bond 2Y/10Y) */}
                    <div className="grid grid-cols-3 gap-2 font-mono">
                        <button
                            type="button"
                            onClick={() => primaryIndexLive && onOpenAssetChart(primaryIndexLive)}
                            className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-left transition cursor-pointer"
                        >
                            <span className="text-[9px] uppercase text-slate-400 block truncate">
                                {hub.primaryIndex.symbol}
                            </span>
                            <div className="flex items-baseline justify-between gap-1 mt-0.5">
                                <strong className="text-xs sm:text-sm font-black text-white tabular-nums truncate">
                                    {(
                                        primaryIndexLive?.price ?? hub.primaryIndex.basePrice
                                    ).toLocaleString('it-IT', { maximumFractionDigits: 1 })}
                                </strong>
                                <span
                                    className={`text-[9px] font-bold tabular-nums ${
                                        (primaryIndexLive?.changePct ?? hub.primaryIndex.changePct) >=
                                        0
                                            ? 'text-[#10B981]'
                                            : 'text-[#DC2626]'
                                    }`}
                                >
                                    {(primaryIndexLive?.changePct ?? hub.primaryIndex.changePct) >=
                                    0
                                        ? '+'
                                        : ''}
                                    {(
                                        primaryIndexLive?.changePct ?? hub.primaryIndex.changePct
                                    ).toFixed(2)}
                                    %
                                </span>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => fxLive && onOpenAssetChart(fxLive)}
                            className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-left transition cursor-pointer"
                        >
                            <span className="text-[9px] uppercase text-slate-400 block truncate">
                                VALUTA · {hub.fxPairLabel}
                            </span>
                            <div className="flex items-baseline justify-between gap-1 mt-0.5">
                                <strong className="text-xs sm:text-sm font-black text-cyan-300 tabular-nums truncate">
                                    {(fxLive?.price ?? hub.fxBaseRate).toLocaleString('it-IT', {
                                        maximumFractionDigits: 4
                                    })}
                                </strong>
                                <span className="text-[9px] text-slate-400">
                                    {hub.currencyCode}
                                </span>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => onTickerClick(`${hub.iso2}10Y`)}
                            className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-left transition cursor-pointer"
                        >
                            <span className="text-[9px] uppercase text-slate-400 block truncate">
                                {hub.iso2} BOND 2Y / 10Y
                            </span>
                            <strong className="text-xs sm:text-sm font-black text-[#FACC15] tabular-nums block mt-0.5 truncate">
                                {hub.bondYields.y2.toFixed(2)}% / {hub.bondYields.y10.toFixed(2)}%
                            </strong>
                        </button>
                    </div>

                    {/* Row 4: 3 Main Tabs */}
                    <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                        <button
                            type="button"
                            onClick={() => setActiveTab('MARKETS')}
                            className={`py-2 px-2 rounded-xl text-[10px] sm:text-xs font-mono font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                activeTab === 'MARKETS'
                                    ? 'bg-[#10B981] text-[#050A08] shadow-md shadow-emerald-500/20'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Activity className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Mercati &amp; Broker</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('NEWS')}
                            className={`py-2 px-2 rounded-xl text-[10px] sm:text-xs font-mono font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                activeTab === 'NEWS'
                                    ? 'bg-[#10B981] text-[#050A08] shadow-md shadow-emerald-500/20'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Newspaper className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">News &amp; AI Impact</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('MACRO')}
                            className={`py-2 px-2 rounded-xl text-[10px] sm:text-xs font-mono font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                activeTab === 'MACRO'
                                    ? 'bg-[#10B981] text-[#050A08] shadow-md shadow-emerald-500/20'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Macro &amp; Flussi FDI</span>
                        </button>
                    </div>
                </header>

                {/* ========================================================= */}
                {/* SCROLLABLE TAB BODY                                       */}
                {/* ========================================================= */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 pb-[max(env(safe-area-inset-bottom,24px),28px)] space-y-4">
                    {/* ======================================================= */}
                    {/* TAB 1: MERCATI & BROKER (LIVE 1s TERMINAL TABLE)        */}
                    {/* ======================================================= */}
                    {activeTab === 'MARKETS' && (
                        <div className="space-y-3.5">
                            {/* Controls: LIVE 1s + Play/Pause + Quick Ticker Filter */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                                <div className="flex items-center justify-between sm:justify-start gap-2.5">
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-black border ${
                                            isLiveRunning
                                                ? 'bg-emerald-500/15 text-[#10B981] border-emerald-500/40'
                                                : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                                        }`}
                                    >
                                        <span
                                            className={`w-2 h-2 rounded-full ${
                                                isLiveRunning
                                                    ? 'bg-[#10B981] animate-pulse'
                                                    : 'bg-amber-400'
                                            }`}
                                        />
                                        <span>{isLiveRunning ? 'LIVE 1s' : 'IN PAUSA'}</span>
                                    </span>

                                    <span className="text-[10px] font-mono text-slate-400">
                                        {lastTickTime}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={onToggleLive}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-[10px] font-mono font-bold text-slate-200 cursor-pointer"
                                    >
                                        {isLiveRunning ? (
                                            <>
                                                <Pause className="w-3 h-3 text-amber-400" />
                                                <span>Pausa</span>
                                            </>
                                        ) : (
                                            <>
                                                <Play className="w-3 h-3 text-[#10B981]" />
                                                <span>Play</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="relative sm:w-56">
                                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={assetSearch}
                                        onChange={(e) => setAssetSearch(e.target.value)}
                                        placeholder="Filtra ticker..."
                                        className="w-full h-9 pl-8 pr-3 rounded-xl bg-[#08090C] border border-white/[0.1] text-xs font-mono text-white placeholder-slate-500 focus:border-[#10B981] outline-none"
                                    />
                                </div>
                            </div>

                            {/* Sub-filter Pills */}
                            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                                {MARKET_SUB_FILTERS.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setAssetCategory(cat.id)}
                                        className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold shrink-0 border transition cursor-pointer ${
                                            assetCategory === cat.id
                                                ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]'
                                                : 'bg-white/[0.03] text-slate-400 border-white/[0.08] hover:text-white'
                                        }`}
                                    >
                                        {cat.id === 'COUNTRY'
                                            ? `${hub.flag} ${cat.label}`
                                            : cat.label}
                                    </button>
                                ))}
                            </div>

                            {/* Broker-Grade Terminal Table */}
                            <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-white/[0.02]">
                                {/* Table Column Header */}
                                <div className="grid grid-cols-12 gap-2 px-3.5 py-2.5 bg-white/[0.04] border-b border-white/[0.08] text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                                    <div className="col-span-5 sm:col-span-4">STRUMENTO</div>
                                    <div className="col-span-4 sm:col-span-3 text-right">
                                        LAST · BID/ASK
                                    </div>
                                    <div className="col-span-3 sm:col-span-2 text-right">
                                        VAR. 24H
                                    </div>
                                    <div className="hidden sm:block sm:col-span-2 text-center">
                                        MIN / MAX GIORNO
                                    </div>
                                    <div className="hidden sm:block sm:col-span-1 text-right">
                                        TREND
                                    </div>
                                </div>

                                <div className="divide-y divide-white/[0.06]">
                                    {displayedAssets.map((asset) => {
                                        const isPos = asset.changePct >= 0;
                                        const dec = asset.decimals ?? (asset.price < 5 ? 4 : 2);
                                        const rangeSpan = Math.max(
                                            0.0001,
                                            asset.dayHigh - asset.dayLow
                                        );
                                        const posPct = Math.max(
                                            4,
                                            Math.min(
                                                96,
                                                ((asset.price - asset.dayLow) / rangeSpan) * 100
                                            )
                                        );
                                        const rowFlash =
                                            asset.flash === 'up'
                                                ? 'bg-emerald-500/[0.12]'
                                                : asset.flash === 'down'
                                                ? 'bg-rose-500/[0.12]'
                                                : 'hover:bg-white/[0.04]';

                                        return (
                                            <div
                                                key={asset.id}
                                                onClick={() => onOpenAssetChart(asset)}
                                                className={`grid grid-cols-12 gap-2 items-center px-3.5 py-3 transition-colors duration-300 cursor-pointer ${rowFlash}`}
                                            >
                                                {/* STRUMENTO */}
                                                <div className="col-span-5 sm:col-span-4 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-black font-mono text-white truncate">
                                                            {asset.symbol}
                                                        </span>
                                                        <span className="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase bg-white/[0.07] text-slate-400 shrink-0">
                                                            {asset.category}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                                        {asset.name}
                                                    </p>
                                                </div>

                                                {/* LAST · BID/ASK */}
                                                <div className="col-span-4 sm:col-span-3 text-right font-mono">
                                                    <div
                                                        className={`text-xs font-black tabular-nums ${
                                                            asset.flash === 'up'
                                                                ? 'text-[#10B981]'
                                                                : asset.flash === 'down'
                                                                ? 'text-[#DC2626]'
                                                                : 'text-white'
                                                        }`}
                                                    >
                                                        {formatNum(asset.price, dec, asset.unit)}
                                                    </div>
                                                    <div className="text-[9px] text-slate-500 tabular-nums">
                                                        {asset.bid.toLocaleString('it-IT', {
                                                            maximumFractionDigits: dec
                                                        })}{' '}
                                                        /{' '}
                                                        {asset.ask.toLocaleString('it-IT', {
                                                            maximumFractionDigits: dec
                                                        })}
                                                    </div>
                                                </div>

                                                {/* VAR. 24H (% e punti) */}
                                                <div className="col-span-3 sm:col-span-2 text-right font-mono">
                                                    <div
                                                        className={`text-xs font-black tabular-nums inline-flex items-center justify-end gap-0.5 ${
                                                            isPos
                                                                ? 'text-[#10B981]'
                                                                : 'text-[#DC2626]'
                                                        }`}
                                                    >
                                                        {isPos ? (
                                                            <TrendingUp className="w-3 h-3 shrink-0" />
                                                        ) : (
                                                            <TrendingDown className="w-3 h-3 shrink-0" />
                                                        )}
                                                        <span>
                                                            {isPos ? '+' : ''}
                                                            {asset.changePct.toFixed(2)}%
                                                        </span>
                                                    </div>
                                                    <div className="text-[9px] text-slate-400 tabular-nums">
                                                        {asset.changePts >= 0 ? '+' : ''}
                                                        {asset.changePts.toLocaleString('it-IT', {
                                                            maximumFractionDigits: dec
                                                        })}
                                                    </div>
                                                </div>

                                                {/* MIN / MAX GIORNO Range Bar */}
                                                <div className="hidden sm:flex sm:col-span-2 flex-col gap-1 px-1 font-mono">
                                                    <div className="w-full h-1.5 rounded-full bg-white/[0.08] relative">
                                                        <div
                                                            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#FACC15] shadow-[0_0_6px_#FACC15]"
                                                            style={{ left: `calc(${posPct}% - 4px)` }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between text-[8px] text-slate-500 tabular-nums">
                                                        <span>
                                                            {asset.dayLow.toLocaleString('it-IT', {
                                                                maximumFractionDigits: dec > 2 ? 3 : 1
                                                            })}
                                                        </span>
                                                        <span>
                                                            {asset.dayHigh.toLocaleString('it-IT', {
                                                                maximumFractionDigits: dec > 2 ? 3 : 1
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* TREND Sparkline */}
                                                <div className="hidden sm:flex sm:col-span-1 justify-end">
                                                    <MiniSparkline
                                                        data={asset.sparkline}
                                                        isPositive={isPos}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {displayedAssets.length === 0 && (
                                        <div className="p-6 text-center text-xs font-mono text-slate-400">
                                            Nessuno strumento trovato per &quot;{assetSearch}&quot;.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
                                <span className="inline-flex items-center gap-1.5">
                                    <CandlestickChart className="w-3.5 h-3.5 text-[#10B981]" />
                                    <span>
                                        Tocca qualsiasi riga per aprire il Grafico Live e registrare un trade in History
                                    </span>
                                </span>
                            </div>
                        </div>
                    )}

                    {/* ======================================================= */}
                    {/* TAB 2: NEWS & AI IMPACT (20+ NEWS + FILTERS + SEARCH)   */}
                    {/* ======================================================= */}
                    {activeTab === 'NEWS' && (
                        <div className="space-y-3.5">
                            {/* Sentiment Filters + Search Bar */}
                            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2.5">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-[#10B981]" />
                                        <span className="text-xs font-mono font-bold text-white">
                                            {filteredNews.length} / {newsItems.length} Notizie · AI Impact
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        {(['ALL', 'BULLISH', 'BEARISH', 'NEUTRAL'] as const).map(
                                            (sent) => (
                                                <button
                                                    key={sent}
                                                    type="button"
                                                    onClick={() => setNewsSentimentFilter(sent)}
                                                    className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-black border transition cursor-pointer ${
                                                        newsSentimentFilter === sent
                                                            ? 'bg-[#10B981] text-[#050A08] border-[#10B981]'
                                                            : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:text-white'
                                                    }`}
                                                >
                                                    {sent === 'ALL' ? 'TUTTE' : sent}
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>

                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={newsSearch}
                                        onChange={(e) => setNewsSearch(e.target.value)}
                                        placeholder="Cerca notizie, banche centrali, ticker o settori..."
                                        className="w-full h-9 pl-8 pr-3 rounded-xl bg-[#08090C] border border-white/[0.1] text-xs font-mono text-white placeholder-slate-500 focus:border-[#10B981] outline-none"
                                    />
                                </div>
                            </div>

                            {isLoadingNews ? (
                                <div className="py-12 flex flex-col items-center justify-center gap-3 text-xs font-mono text-slate-400">
                                    <RefreshCw className="w-5 h-5 text-[#10B981] animate-spin" />
                                    <span>
                                        Elaborazione feed news e AI Market Impact per {hub.countryName}...
                                    </span>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredNews.map((news) => {
                                        const sentClasses =
                                            news.aiImpact.sentiment === 'BULLISH'
                                                ? 'bg-emerald-500/15 text-[#10B981] border-emerald-500/40'
                                                : news.aiImpact.sentiment === 'BEARISH'
                                                ? 'bg-rose-500/15 text-rose-400 border-rose-500/40'
                                                : 'bg-slate-700/50 text-slate-300 border-slate-600/60';

                                        return (
                                            <article
                                                key={news.id}
                                                className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3"
                                            >
                                                <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="px-2 py-0.5 rounded bg-white/[0.07] text-slate-200 font-bold uppercase">
                                                            {news.category}
                                                        </span>
                                                        <span className="text-slate-300 font-semibold">
                                                            {news.source}
                                                        </span>
                                                        {news.isLiveFeed && (
                                                            <span className="text-[#10B981] font-bold">
                                                                · LIVE
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="shrink-0">{news.timeAgo}</span>
                                                </div>

                                                <a
                                                    href={news.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group flex items-start justify-between gap-2 text-xs sm:text-sm font-extrabold text-white hover:text-[#10B981] leading-snug transition"
                                                >
                                                    <span>{news.title}</span>
                                                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#10B981] shrink-0 mt-0.5" />
                                                </a>

                                                {/* Dedicated AI MARKET IMPACT Box */}
                                                <div className="p-3 rounded-xl bg-[#05080F]/90 border border-white/[0.07] space-y-2">
                                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-black text-cyan-300 uppercase">
                                                            <Zap className="w-3 h-3 text-[#10B981]" />
                                                            <span>AI MARKET IMPACT</span>
                                                        </span>
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-black border ${sentClasses}`}
                                                        >
                                                            {news.aiImpact.sentiment}
                                                        </span>
                                                    </div>

                                                    <p className="text-[11px] text-slate-300 leading-relaxed">
                                                        {news.aiImpact.operationalImpact}
                                                    </p>

                                                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                                        {news.aiImpact.impactedTickers.map(
                                                            (ticker) => (
                                                                <button
                                                                    key={ticker}
                                                                    type="button"
                                                                    onClick={() =>
                                                                        onTickerClick(ticker)
                                                                    }
                                                                    className="px-2 py-0.5 rounded-md bg-[#10B981]/10 hover:bg-[#10B981] text-[#10B981] hover:text-[#050A08] border border-[#10B981]/30 text-[10px] font-mono font-black transition cursor-pointer"
                                                                >
                                                                    {ticker}
                                                                </button>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ======================================================= */}
                    {/* TAB 3: MACRO & FLUSSI FDI (3 WORKING SUB-TABS)          */}
                    {/* ======================================================= */}
                    {activeTab === 'MACRO' && (
                        <div className="space-y-4">
                            {/* 3-Way Interactive Sub-Tab Switch */}
                            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                                <button
                                    type="button"
                                    onClick={() => setMacroSubTab('FDI_FLOWS')}
                                    className={`py-2 px-2 rounded-xl text-[10px] sm:text-[11px] font-mono font-extrabold transition cursor-pointer ${
                                        macroSubTab === 'FDI_FLOWS'
                                            ? 'bg-white text-[#08090C] shadow'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Macro &amp; Flussi FDI
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMacroSubTab('EQUITY_CAP')}
                                    className={`py-2 px-2 rounded-xl text-[10px] sm:text-[11px] font-mono font-extrabold transition cursor-pointer ${
                                        macroSubTab === 'EQUITY_CAP'
                                            ? 'bg-white text-[#08090C] shadow'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Equity Market Cap
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMacroSubTab('FUNDAMENTALS')}
                                    className={`py-2 px-2 rounded-xl text-[10px] sm:text-[11px] font-mono font-extrabold transition cursor-pointer ${
                                        macroSubTab === 'FUNDAMENTALS'
                                            ? 'bg-white text-[#08090C] shadow'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Fondamentali &amp; Borsa
                                </button>
                            </div>

                            {/* SUB-TAB 1: MACRO & FLUSSI FDI */}
                            {macroSubTab === 'FDI_FLOWS' && (
                                <div className="space-y-4">
                                    {/* 3 KPI Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono">
                                        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-emerald-500/25 space-y-1">
                                            <span className="text-[9px] uppercase text-slate-400 block">
                                                Flussi FDI Netti (Ultimo Anno)
                                            </span>
                                            <strong className="text-lg font-black text-[#10B981] tabular-nums block">
                                                ${latestFdiBn.toLocaleString('it-IT')}B
                                            </strong>
                                        </div>
                                        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                                            <span className="text-[9px] uppercase text-slate-400 block">
                                                Investimenti Esteri (FDI / PIL)
                                            </span>
                                            <strong className="text-lg font-black text-cyan-400 tabular-nums block">
                                                {macroData.macro.fdiToGdpPct.toFixed(2)}%
                                            </strong>
                                        </div>
                                        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                                            <span className="text-[9px] uppercase text-slate-400 block">
                                                Investimenti Fissi Lordi (CAPEX)
                                            </span>
                                            <strong className="text-lg font-black text-[#FACC15] tabular-nums block">
                                                {macroData.macro.grossFixedCapexPct.toFixed(1)}% PIL
                                            </strong>
                                        </div>
                                    </div>

                                    {/* 5-Year Historical FDI AreaChart */}
                                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-[10px] font-mono uppercase font-bold text-[#10B981]">
                                                    Trend Storico Afflussi FDI (5 Anni)
                                                </span>
                                                <h3 className="text-xs sm:text-sm font-black text-white">
                                                    Investimenti Diretti Esteri Netti ($ Miliardi)
                                                </h3>
                                            </div>
                                            <span className="text-[10px] font-mono text-slate-400">
                                                {macroData.isWorldBankLive
                                                    ? 'World Bank Live'
                                                    : 'Baseline'}
                                            </span>
                                        </div>

                                        <div className="w-full h-48">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart
                                                    data={macroData.fdiHistory5Y}
                                                    margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                                                >
                                                    <defs>
                                                        <linearGradient
                                                            id="atlasFdiGrad"
                                                            x1="0"
                                                            y1="0"
                                                            x2="0"
                                                            y2="1"
                                                        >
                                                            <stop
                                                                offset="5%"
                                                                stopColor="#10B981"
                                                                stopOpacity={0.45}
                                                            />
                                                            <stop
                                                                offset="95%"
                                                                stopColor="#10B981"
                                                                stopOpacity={0}
                                                            />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid
                                                        strokeDasharray="3 3"
                                                        stroke="rgba(255,255,255,0.06)"
                                                    />
                                                    <XAxis
                                                        dataKey="year"
                                                        tick={{ fill: '#94A3B8', fontSize: 10 }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    <YAxis
                                                        tick={{ fill: '#94A3B8', fontSize: 10 }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                        unit="B"
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: '#0D111A',
                                                            border: '1px solid rgba(255,255,255,0.12)',
                                                            borderRadius: '12px',
                                                            fontSize: '11px',
                                                            color: '#FFF'
                                                        }}
                                                        formatter={(v: any) => [`$${v}B`, 'FDI Netti']}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="inflowBn"
                                                        stroke="#10B981"
                                                        strokeWidth={2.4}
                                                        fill="url(#atlasFdiGrad)"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Donut + Horizontal Bar Chart: "In cosa investono maggiormente" */}
                                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                                        <div>
                                            <span className="text-[10px] font-mono uppercase font-bold text-[#FACC15]">
                                                In cosa investono maggiormente ({hub.countryName})
                                            </span>
                                            <h3 className="text-xs sm:text-sm font-black text-white">
                                                Ripartizione per Settore Produttivo (%)
                                            </h3>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                                            {/* Donut Chart */}
                                            <div className="sm:col-span-5 h-52">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={hub.fdiSectors}
                                                            dataKey="share"
                                                            nameKey="sector"
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={44}
                                                            outerRadius={76}
                                                            paddingAngle={2}
                                                        >
                                                            {hub.fdiSectors.map((entry, idx) => (
                                                                <Cell
                                                                    key={entry.sector}
                                                                    fill={
                                                                        CHART_PALETTE[
                                                                            idx %
                                                                                CHART_PALETTE.length
                                                                        ]
                                                                    }
                                                                />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            contentStyle={{
                                                                backgroundColor: '#0D111A',
                                                                border: '1px solid rgba(255,255,255,0.12)',
                                                                borderRadius: '10px',
                                                                fontSize: '11px',
                                                                color: '#FFF'
                                                            }}
                                                            formatter={(v: any) => [`${v}%`, 'Quota']}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>

                                            {/* Horizontal Bars */}
                                            <div className="sm:col-span-7 h-56">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={hub.fdiSectors}
                                                        layout="vertical"
                                                        margin={{ top: 4, right: 16, left: 6, bottom: 4 }}
                                                    >
                                                        <CartesianGrid
                                                            strokeDasharray="3 3"
                                                            stroke="rgba(255,255,255,0.06)"
                                                            horizontal={false}
                                                        />
                                                        <XAxis
                                                            type="number"
                                                            unit="%"
                                                            tick={{ fill: '#94A3B8', fontSize: 10 }}
                                                            axisLine={false}
                                                            tickLine={false}
                                                        />
                                                        <YAxis
                                                            type="category"
                                                            dataKey="sector"
                                                            width={102}
                                                            tick={{ fill: '#E2E8F0', fontSize: 10 }}
                                                            axisLine={false}
                                                            tickLine={false}
                                                        />
                                                        <Tooltip
                                                            contentStyle={{
                                                                backgroundColor: '#0D111A',
                                                                border: '1px solid rgba(255,255,255,0.12)',
                                                                borderRadius: '10px',
                                                                fontSize: '11px',
                                                                color: '#FFF'
                                                            }}
                                                            formatter={(v: any) => [`${v}%`, 'Quota']}
                                                        />
                                                        <Bar dataKey="share" radius={[0, 6, 6, 0]}>
                                                            {hub.fdiSectors.map((entry, idx) => (
                                                                <Cell
                                                                    key={entry.sector}
                                                                    fill={
                                                                        CHART_PALETTE[
                                                                            idx %
                                                                                CHART_PALETTE.length
                                                                        ]
                                                                    }
                                                                />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SUB-TAB 2: EQUITY MARKET CAP */}
                            {macroSubTab === 'EQUITY_CAP' && (
                                <div className="space-y-4">
                                    {/* 3 KPI Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono">
                                        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-emerald-500/25 space-y-1">
                                            <span className="text-[9px] uppercase text-slate-400 block">
                                                Capitalizzazione Borsa Totale
                                            </span>
                                            <strong className="text-lg font-black text-[#10B981] tabular-nums block">
                                                ${macroData.totalMarketCapBn.toLocaleString('it-IT')}B
                                            </strong>
                                        </div>

                                        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                                            <span className="text-[9px] uppercase text-slate-400 block">
                                                Market Cap / PIL (Buffett)
                                            </span>
                                            <strong className="text-lg font-black text-[#FACC15] tabular-nums block">
                                                {macroData.marketCapToGdpPct.toFixed(1)}%
                                            </strong>
                                        </div>

                                        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                                            <span className="text-[9px] uppercase text-slate-400 block">
                                                Borsa Principale &amp; Listino
                                            </span>
                                            <strong className="text-xs font-black text-white block truncate">
                                                {hub.exchangeCode} · {hub.primaryIndex.symbol}
                                            </strong>
                                            <span className="text-[9px] text-slate-400 block truncate">
                                                {hub.exchangeName}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Donut + Horizontal Bar Chart of Listed Equity Sectors */}
                                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                                        <h3 className="text-xs sm:text-sm font-black text-white">
                                            Peso dei Settori Quotati in Borsa (%)
                                        </h3>

                                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                                            <div className="sm:col-span-5 h-52">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={hub.equityMarket.topSectors}
                                                            dataKey="weight"
                                                            nameKey="name"
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={44}
                                                            outerRadius={76}
                                                            paddingAngle={2}
                                                        >
                                                            {hub.equityMarket.topSectors.map(
                                                                (s, idx) => (
                                                                    <Cell
                                                                        key={s.name}
                                                                        fill={
                                                                            CHART_PALETTE[
                                                                                idx %
                                                                                    CHART_PALETTE.length
                                                                            ]
                                                                        }
                                                                    />
                                                                )
                                                            )}
                                                        </Pie>
                                                        <Tooltip
                                                            contentStyle={{
                                                                backgroundColor: '#0D111A',
                                                                border: '1px solid rgba(255,255,255,0.12)',
                                                                borderRadius: '10px',
                                                                fontSize: '11px',
                                                                color: '#FFF'
                                                            }}
                                                            formatter={(v: any) => [`${v}%`, 'Peso']}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>

                                            <div className="sm:col-span-7 h-52">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={hub.equityMarket.topSectors}
                                                        layout="vertical"
                                                        margin={{ top: 4, right: 16, left: 6, bottom: 4 }}
                                                    >
                                                        <CartesianGrid
                                                            strokeDasharray="3 3"
                                                            stroke="rgba(255,255,255,0.06)"
                                                            horizontal={false}
                                                        />
                                                        <XAxis
                                                            type="number"
                                                            unit="%"
                                                            tick={{ fill: '#94A3B8', fontSize: 10 }}
                                                            axisLine={false}
                                                            tickLine={false}
                                                        />
                                                        <YAxis
                                                            type="category"
                                                            dataKey="name"
                                                            width={96}
                                                            tick={{ fill: '#E2E8F0', fontSize: 10 }}
                                                            axisLine={false}
                                                            tickLine={false}
                                                        />
                                                        <Tooltip
                                                            contentStyle={{
                                                                backgroundColor: '#0D111A',
                                                                border: '1px solid rgba(255,255,255,0.12)',
                                                                borderRadius: '10px',
                                                                fontSize: '11px',
                                                                color: '#FFF'
                                                            }}
                                                            formatter={(v: any) => [`${v}%`, 'Peso']}
                                                        />
                                                        <Bar dataKey="weight" radius={[0, 6, 6, 0]}>
                                                            {hub.equityMarket.topSectors.map(
                                                                (s, idx) => (
                                                                    <Cell
                                                                        key={s.name}
                                                                        fill={
                                                                            CHART_PALETTE[
                                                                                idx %
                                                                                    CHART_PALETTE.length
                                                                            ]
                                                                        }
                                                                    />
                                                                )
                                                            )}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Top National Listed Corporations Table (Live Prices + Relative Weight Bars) */}
                                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                                                <Building2 className="w-4 h-4 text-[#10B981]" />
                                                <span>Peso Top Aziende Nazionali Quotate (Live)</span>
                                            </span>
                                            <span className="text-[10px] font-mono text-slate-400">
                                                Tocca per Grafico
                                            </span>
                                        </div>

                                        <div className="space-y-2.5">
                                            {(() => {
                                                const maxCap = Math.max(
                                                    1,
                                                    ...hub.topStocks.map((c) => c.marketCapBn)
                                                );
                                                return hub.topStocks.map((company) => {
                                                    const liveRow = localAssets.find(
                                                        (a) => a.symbol === company.symbol
                                                    );
                                                    const livePrice =
                                                        liveRow?.price ?? company.basePrice;
                                                    const livePct = liveRow?.changePct ?? 0.55;
                                                    const isPos = livePct >= 0;
                                                    const weightPct = Math.max(
                                                        12,
                                                        Math.round((company.marketCapBn / maxCap) * 100)
                                                    );

                                                    return (
                                                        <button
                                                            key={company.symbol}
                                                            type="button"
                                                            onClick={() =>
                                                                onTickerClick(company.symbol)
                                                            }
                                                            className="w-full p-3 rounded-xl bg-[#08090C]/85 hover:bg-white/[0.06] border border-white/[0.07] hover:border-[#10B981]/50 transition text-left space-y-2 cursor-pointer"
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs font-black font-mono text-[#10B981]">
                                                                            {company.symbol}
                                                                        </span>
                                                                        <span className="text-xs font-bold text-white truncate">
                                                                            {company.name}
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-[10px] font-mono text-slate-400">
                                                                        {company.sector} · Cap $
                                                                        {company.marketCapBn.toLocaleString(
                                                                            'it-IT'
                                                                        )}
                                                                        B
                                                                    </span>
                                                                </div>

                                                                <div className="text-right font-mono shrink-0">
                                                                    <span className="text-xs font-black text-white tabular-nums block">
                                                                        {livePrice.toLocaleString(
                                                                            'it-IT',
                                                                            {
                                                                                minimumFractionDigits: 2,
                                                                                maximumFractionDigits: 2
                                                                            }
                                                                        )}
                                                                    </span>
                                                                    <span
                                                                        className={`text-[10px] font-bold tabular-nums ${
                                                                            isPos
                                                                                ? 'text-[#10B981]'
                                                                                : 'text-[#DC2626]'
                                                                        }`}
                                                                    >
                                                                        {isPos ? '+' : ''}
                                                                        {livePct.toFixed(2)}%
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Relative Market Cap Weight Bar */}
                                                            <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                                                <div
                                                                    className="h-full rounded-full bg-gradient-to-r from-[#10B981] to-cyan-400"
                                                                    style={{
                                                                        width: `${weightPct}%`
                                                                    }}
                                                                />
                                                            </div>
                                                        </button>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SUB-TAB 3: FONDAMENTALI & BORSA (13-KPI 3-COLUMN GRID) */}
                            {macroSubTab === 'FUNDAMENTALS' && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
                                        <span className="flex items-center gap-1.5">
                                            <Landmark className="w-3.5 h-3.5 text-[#10B981]" />
                                            <span>Quadri Macroeconomici &amp; Sovrani</span>
                                        </span>
                                        <span className="text-[#10B981] font-bold">
                                            {isLoadingMacro
                                                ? 'Sync World Bank...'
                                                : macroData.isWorldBankLive
                                                ? 'World Bank API Live'
                                                : 'Institutional Feed'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono">
                                        {[
                                            {
                                                label: 'Rating Sovrano',
                                                value: macroData.macro.sovereignRating,
                                                accent: 'text-[#FACC15]'
                                            },
                                            {
                                                label: 'Banca Centrale',
                                                value: macroData.macro.centralBank,
                                                accent: 'text-white text-xs'
                                            },
                                            {
                                                label: 'Borsa Locale & Orari',
                                                value: `${hub.exchangeCode} (${hub.openHour}:00-${hub.closeHour}:00)`,
                                                accent: exchangeStatus.isOpen
                                                    ? 'text-[#10B981] text-xs'
                                                    : 'text-slate-200 text-xs'
                                            },
                                            {
                                                label: 'Tasso Banca Centrale',
                                                value: `${macroData.macro.policyRate.toFixed(2)}%`,
                                                accent: 'text-[#FACC15]'
                                            },
                                            {
                                                label: 'Inflazione (CPI YoY)',
                                                value: `${macroData.macro.inflationCpi.toFixed(1)}%`,
                                                accent:
                                                    macroData.macro.inflationCpi > 4
                                                        ? 'text-rose-400'
                                                        : 'text-[#10B981]'
                                            },
                                            {
                                                label: 'Crescita PIL (GDP YoY)',
                                                value: `${macroData.macro.gdpGrowth >= 0 ? '+' : ''}${macroData.macro.gdpGrowth.toFixed(1)}%`,
                                                accent:
                                                    macroData.macro.gdpGrowth >= 0
                                                        ? 'text-[#10B981]'
                                                        : 'text-rose-400'
                                            },
                                            {
                                                label: 'PIL Nominale Totale',
                                                value: `$${macroData.macro.gdpNominalBn.toLocaleString('it-IT')}B`,
                                                accent: 'text-white'
                                            },
                                            {
                                                label: 'PIL Pro Capite',
                                                value: `$${macroData.macro.gdpPerCapitaUsd.toLocaleString('it-IT')}`,
                                                accent: 'text-cyan-300'
                                            },
                                            {
                                                label: 'Tasso Disoccupazione',
                                                value: `${macroData.macro.unemployment.toFixed(1)}%`,
                                                accent: 'text-slate-100'
                                            },
                                            {
                                                label: 'Debito Pubblico / PIL',
                                                value: `${macroData.macro.debtToGdp.toFixed(1)}%`,
                                                accent:
                                                    macroData.macro.debtToGdp > 100
                                                        ? 'text-amber-400'
                                                        : 'text-slate-100'
                                            },
                                            {
                                                label: 'Bilancia Commerciale',
                                                value: `${macroData.macro.tradeBalanceBn >= 0 ? '+' : '-'}$${Math.abs(macroData.macro.tradeBalanceBn).toLocaleString('it-IT')}B`,
                                                accent:
                                                    macroData.macro.tradeBalanceBn >= 0
                                                        ? 'text-[#10B981]'
                                                        : 'text-rose-400'
                                            },
                                            {
                                                label: 'Partite Correnti / PIL',
                                                value: `${macroData.macro.currentAccountToGdp >= 0 ? '+' : ''}${macroData.macro.currentAccountToGdp.toFixed(2)}%`,
                                                accent:
                                                    macroData.macro.currentAccountToGdp >= 0
                                                        ? 'text-[#10B981]'
                                                        : 'text-amber-400'
                                            },
                                            {
                                                label: 'Riserve Valutarie',
                                                value: `$${macroData.macro.fxReservesBn.toLocaleString('it-IT')}B`,
                                                accent: 'text-cyan-400'
                                            }
                                        ].map((kpi) => (
                                            <div
                                                key={kpi.label}
                                                className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-1"
                                            >
                                                <span className="text-[9px] uppercase text-slate-400 block leading-tight">
                                                    {kpi.label}
                                                </span>
                                                <strong
                                                    className={`text-sm sm:text-base font-black tabular-nums block leading-snug ${kpi.accent}`}
                                                >
                                                    {kpi.value}
                                                </strong>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5 px-1 pt-1">
                                        <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                                        <span>
                                            Fonte: World Bank Open Data API v2, Banche Centrali &amp; dataset istituzionale Tradyx.
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
};

export default CountryDrilldownDrawer;
