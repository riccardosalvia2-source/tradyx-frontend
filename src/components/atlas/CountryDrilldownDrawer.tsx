// ============================================================================
// TRADYX ATLAS — COUNTRY DRILL-DOWN PANEL (FULL-SCREEN MOBILE / WIDE DRAWER)
// (src/components/atlas/CountryDrilldownDrawer.tsx)
// Tab A: MERCATI LIVE (1s) — Local Country + All Global Markets + Trade Bridge
// Tab B: NEWS & AI IMPACT — 20+ Country & Global News with Unique AI Impact
// Tab C: MACRO, FDI & EQUITY MARKET CAP — 3 Working Interactive Sub-Views
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
    Globe,
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
type MacroSubTab = 'INDICATORS' | 'FDI' | 'EQUITY_CAP';

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

const CATEGORY_TABS: Array<{ id: AtlasAssetCategory; label: string }> = [
    { id: 'COUNTRY', label: 'Mercati del Paese' },
    { id: 'INDICES', label: 'Indici' },
    { id: 'STOCKS', label: 'Azioni' },
    { id: 'FOREX', label: 'Forex' },
    { id: 'BONDS', label: 'Bond Sovrani' },
    { id: 'COMMODITIES', label: 'Commodities' },
    { id: 'CRYPTO', label: 'Crypto' },
    { id: 'ETF', label: 'ETF' }
];

const SECTOR_BAR_COLORS = ['#10B981', '#38BDF8', '#FACC15', '#818CF8', '#FB7185', '#34D399'];

const MiniSparkline: React.FC<{ data: number[]; isPositive: boolean }> = ({ data, isPositive }) => {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 58;
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
                strokeWidth="1.6"
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

    // Tab B: News & AI Impact state
    const [newsItems, setNewsItems] = useState<AtlasNewsItem[]>([]);
    const [isLoadingNews, setIsLoadingNews] = useState<boolean>(true);
    const [newsSentimentFilter, setNewsSentimentFilter] = useState<
        'ALL' | 'BULLISH' | 'BEARISH' | 'VOLATILITÀ'
    >('ALL');

    // Tab C: Macro, FDI & Equity Market Cap state
    const [macroSubTab, setMacroSubTab] = useState<MacroSubTab>('INDICATORS');
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

    // Load country news & World Bank macro whenever selected hub changes
    useEffect(() => {
        let isMounted = true;
        setAssetCategory('COUNTRY');
        setAssetSearch('');
        setNewsSentimentFilter('ALL');
        setIsLoadingNews(true);
        setIsLoadingMacro(true);

        // Immediately seed baseline macro for instant responsiveness
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

    // Filtered live market assets
    const displayedAssets = useMemo(() => {
        const pool =
            assetCategory === 'COUNTRY'
                ? localAssets
                : globalAssets.filter((a) => a.category === assetCategory);

        const q = assetSearch.trim().toLowerCase();
        if (!q) return pool;
        return pool.filter(
            (a) =>
                a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
        );
    }, [assetCategory, localAssets, globalAssets, assetSearch]);

    const filteredNews = useMemo(() => {
        if (newsSentimentFilter === 'ALL') return newsItems;
        return newsItems.filter((n) => n.aiImpact.sentiment === newsSentimentFilter);
    }, [newsItems, newsSentimentFilter]);

    const formatAssetPrice = (asset: AtlasLiveAsset) => {
        const dec = asset.decimals ?? (asset.price < 5 ? 4 : 2);
        const formatted = asset.price.toLocaleString('it-IT', {
            minimumFractionDigits: dec,
            maximumFractionDigits: dec
        });
        if (asset.unit === '%') return `${formatted}%`;
        if (asset.unit === '$' || asset.unit === '€') return `${asset.unit}${formatted}`;
        return formatted;
    };

    return (
        <div className="fixed inset-0 z-[70] flex justify-end pointer-events-auto">
            {/* Desktop backdrop click-to-close */}
            <div
                onClick={onClose}
                className="hidden lg:block fixed inset-0 bg-black/50 backdrop-blur-[2px]"
            />

            {/* Main Panel: Full-Screen on Mobile (100dvh, zero overlap), Wide Drawer on Desktop */}
            <aside className="relative w-full h-[100dvh] lg:w-[680px] xl:w-[760px] bg-[#08090C]/95 backdrop-blur-xl lg:border-l lg:border-white/[0.1] shadow-2xl flex flex-col overflow-hidden text-white">
                {/* ========================================================= */}
                {/* STICKY TOP HEADER                                         */}
                {/* ========================================================= */}
                <header className="shrink-0 px-4 pt-[max(env(safe-area-inset-top,14px),14px)] pb-3 border-b border-white/[0.08] bg-[#08090C]/95 backdrop-blur-xl space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-bold text-slate-100 transition active:scale-95 cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4 text-[#10B981]" />
                            <span>Torna alla Mappa</span>
                        </button>

                        <div className="flex items-center gap-2">
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
                                    BORSA {exchangeStatus.label} • {exchangeStatus.localTimeStr}
                                </span>
                            </span>
                        </div>
                    </div>

                    {/* Country Flag, Hub Name & Primary Index Snapshot */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-2xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-2xl shrink-0">
                                {hub.flag}
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
                                    {hub.countryName}
                                </h2>
                                <p className="text-[11px] font-mono text-slate-400 truncate">
                                    {hub.city} • {hub.exchangeName} ({hub.currencyCode})
                                </p>
                            </div>
                        </div>

                        <div className="text-right shrink-0">
                            <span className="text-[10px] font-mono text-[#FACC15] font-bold block">
                                {hub.primaryIndex.symbol}
                            </span>
                            <span className="text-sm font-black font-mono tabular-nums text-white">
                                {(localAssets[0]?.price ?? hub.primaryIndex.basePrice).toLocaleString(
                                    'it-IT',
                                    { maximumFractionDigits: 2 }
                                )}
                            </span>
                        </div>
                    </div>

                    {/* 3 Main Navigation Tabs */}
                    <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                        <button
                            type="button"
                            onClick={() => setActiveTab('MARKETS')}
                            className={`py-2 px-2 rounded-xl text-[10px] sm:text-[11px] font-mono font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                activeTab === 'MARKETS'
                                    ? 'bg-[#10B981] text-[#050A08] shadow-md shadow-emerald-500/20'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Activity className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">MERCATI LIVE</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('NEWS')}
                            className={`py-2 px-2 rounded-xl text-[10px] sm:text-[11px] font-mono font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                activeTab === 'NEWS'
                                    ? 'bg-[#10B981] text-[#050A08] shadow-md shadow-emerald-500/20'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Newspaper className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">NEWS & AI</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('MACRO')}
                            className={`py-2 px-2 rounded-xl text-[10px] sm:text-[11px] font-mono font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                activeTab === 'MACRO'
                                    ? 'bg-[#10B981] text-[#050A08] shadow-md shadow-emerald-500/20'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">MACRO & FDI</span>
                        </button>
                    </div>
                </header>

                {/* ========================================================= */}
                {/* SCROLLABLE TAB BODY                                       */}
                {/* ========================================================= */}
                <div className="flex-1 overflow-y-auto px-4 py-4 pb-[max(env(safe-area-inset-bottom,24px),28px)] space-y-4">
                    {/* ------------------------------------------------------- */}
                    {/* TAB A: MERCATI LIVE (1s)                                */}
                    {/* ------------------------------------------------------- */}
                    {activeTab === 'MARKETS' && (
                        <div className="space-y-3.5">
                            {/* LIVE 1s Engine Status Bar + Play/Pause */}
                            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                                <div className="flex items-center gap-2">
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
                                        Tick: {lastTickTime}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={onToggleLive}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-[11px] font-mono font-bold text-slate-200 transition cursor-pointer active:scale-95"
                                >
                                    {isLiveRunning ? (
                                        <>
                                            <Pause className="w-3.5 h-3.5 text-amber-400" />
                                            <span>Pausa</span>
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-3.5 h-3.5 text-[#10B981]" />
                                            <span>Riprendi</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Quick Asset Filter Pills (Mercati del Paese + All 7 Global Categories) */}
                            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                                {CATEGORY_TABS.map((cat) => (
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

                            {/* Quick Filter Input */}
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={assetSearch}
                                    onChange={(e) => setAssetSearch(e.target.value)}
                                    placeholder="Filtra ticker o nome strumento..."
                                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs font-mono text-white placeholder-slate-500 focus:border-[#10B981] outline-none"
                                />
                            </div>

                            {/* Live Asset Table Rows */}
                            <div className="space-y-2">
                                {displayedAssets.map((asset) => {
                                    const isPos = asset.changePct >= 0;
                                    const flashBg =
                                        asset.flash === 'up'
                                            ? 'bg-emerald-500/15 border-emerald-500/50'
                                            : asset.flash === 'down'
                                            ? 'bg-rose-500/15 border-rose-500/50'
                                            : 'bg-white/[0.03] border-white/[0.07] hover:border-emerald-500/40';

                                    return (
                                        <div
                                            key={asset.id}
                                            onClick={() => onOpenAssetChart(asset)}
                                            className={`p-3 rounded-2xl border transition-colors duration-300 cursor-pointer flex items-center justify-between gap-2.5 group ${flashBg}`}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs sm:text-sm font-black font-mono text-white truncate">
                                                        {asset.symbol}
                                                    </span>
                                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase bg-white/[0.06] text-slate-400">
                                                        {asset.category}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                                    {asset.name}
                                                </p>
                                            </div>

                                            <div className="hidden xs:block sm:block">
                                                <MiniSparkline
                                                    data={asset.sparkline}
                                                    isPositive={isPos}
                                                />
                                            </div>

                                            <div className="text-right shrink-0 font-mono">
                                                <div
                                                    className={`text-xs sm:text-sm font-black tabular-nums transition-colors ${
                                                        asset.flash === 'up'
                                                            ? 'text-[#10B981]'
                                                            : asset.flash === 'down'
                                                            ? 'text-[#DC2626]'
                                                            : 'text-white'
                                                    }`}
                                                >
                                                    {formatAssetPrice(asset)}
                                                </div>
                                                <div
                                                    className={`text-[10px] font-bold tabular-nums inline-flex items-center gap-0.5 ${
                                                        isPos ? 'text-[#10B981]' : 'text-[#DC2626]'
                                                    }`}
                                                >
                                                    {isPos ? (
                                                        <TrendingUp className="w-3 h-3" />
                                                    ) : (
                                                        <TrendingDown className="w-3 h-3" />
                                                    )}
                                                    <span>
                                                        {isPos ? '+' : ''}
                                                        {asset.changePct.toFixed(2)}%
                                                    </span>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onOpenAssetChart(asset);
                                                }}
                                                className="shrink-0 px-2.5 py-1.5 rounded-xl bg-[#10B981]/15 hover:bg-[#10B981] text-[#10B981] hover:text-[#050A08] border border-[#10B981]/35 text-[10px] font-mono font-black transition flex items-center gap-1 cursor-pointer"
                                                title="Apri Grafico e Opera"
                                            >
                                                <CandlestickChart className="w-3.5 h-3.5" />
                                                <span className="hidden sm:inline">Grafico / Opera</span>
                                            </button>
                                        </div>
                                    );
                                })}

                                {displayedAssets.length === 0 && (
                                    <div className="p-6 text-center rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs font-mono text-slate-400">
                                        Nessuno strumento trovato per &quot;{assetSearch}&quot;.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ------------------------------------------------------- */}
                    {/* TAB B: NEWS & AI IMPACT (20+ LOCAL & GLOBAL NEWS)       */}
                    {/* ------------------------------------------------------- */}
                    {activeTab === 'NEWS' && (
                        <div className="space-y-3.5">
                            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-[#10B981]" />
                                    <span className="text-xs font-mono font-bold text-white">
                                        {newsItems.length} Notizie • AI Market Impact
                                    </span>
                                </div>

                                <div className="flex items-center gap-1">
                                    {(['ALL', 'BULLISH', 'BEARISH', 'VOLATILITÀ'] as const).map(
                                        (sent) => (
                                            <button
                                                key={sent}
                                                type="button"
                                                onClick={() => setNewsSentimentFilter(sent)}
                                                className={`px-2 py-1 rounded-lg text-[9px] font-mono font-black border transition cursor-pointer ${
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

                            {isLoadingNews ? (
                                <div className="py-12 flex flex-col items-center justify-center gap-3 text-xs font-mono text-slate-400">
                                    <RefreshCw className="w-5 h-5 text-[#10B981] animate-spin" />
                                    <span>Aggregazione news locali e analisi AI per {hub.countryName}...</span>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredNews.map((news) => {
                                        const sentClasses =
                                            news.aiImpact.sentiment === 'BULLISH'
                                                ? 'bg-emerald-500/15 text-[#10B981] border-emerald-500/40'
                                                : news.aiImpact.sentiment === 'BEARISH'
                                                ? 'bg-rose-500/15 text-rose-400 border-rose-500/40'
                                                : 'bg-amber-500/15 text-amber-300 border-amber-500/40';

                                        return (
                                            <article
                                                key={news.id}
                                                className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3"
                                            >
                                                {/* Meta Row */}
                                                <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="px-2 py-0.5 rounded bg-white/[0.06] text-slate-200 font-bold uppercase">
                                                            {news.category}
                                                        </span>
                                                        <span className="text-slate-300 font-semibold">
                                                            {news.source}
                                                        </span>
                                                        {news.isLiveFeed && (
                                                            <span className="text-[#10B981] font-bold">
                                                                • RSS LIVE
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="shrink-0">{news.timeAgo}</span>
                                                </div>

                                                {/* Headline */}
                                                <a
                                                    href={news.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group flex items-start justify-between gap-2 text-xs sm:text-sm font-extrabold text-white hover:text-[#10B981] leading-snug transition"
                                                >
                                                    <span>{news.title}</span>
                                                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#10B981] shrink-0 mt-0.5" />
                                                </a>

                                                {/* Dedicated AI Market Impact Box */}
                                                <div className="p-3 rounded-xl bg-[#05080F]/90 border border-white/[0.07] space-y-2">
                                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-black text-cyan-300 uppercase">
                                                            <Zap className="w-3 h-3 text-[#10B981]" />
                                                            <span>AI Market Impact</span>
                                                        </span>
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-black border ${sentClasses}`}
                                                        >
                                                            {news.aiImpact.sentiment}
                                                        </span>
                                                    </div>

                                                    <p className="text-[11px] text-slate-300 leading-relaxed">
                                                        <strong className="text-white">
                                                            Impatto Operativo:{' '}
                                                        </strong>
                                                        {news.aiImpact.operationalImpact}
                                                    </p>

                                                    {/* Clickable Impacted Tickers */}
                                                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                                        <span className="text-[9px] font-mono uppercase text-slate-500">
                                                            Ticker:
                                                        </span>
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

                    {/* ------------------------------------------------------- */}
                    {/* TAB C: MACRO, FDI & EQUITY MARKET CAP (3 SUB-VIEWS)     */}
                    {/* ------------------------------------------------------- */}
                    {activeTab === 'MACRO' && (
                        <div className="space-y-4">
                            {/* Working 3-Way Sub-View Switch */}
                            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                                <button
                                    type="button"
                                    onClick={() => setMacroSubTab('INDICATORS')}
                                    className={`py-2 px-2 rounded-xl text-[10px] font-mono font-extrabold transition cursor-pointer ${
                                        macroSubTab === 'INDICATORS'
                                            ? 'bg-white text-[#08090C] shadow'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Indicatori Macro
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMacroSubTab('FDI')}
                                    className={`py-2 px-2 rounded-xl text-[10px] font-mono font-extrabold transition cursor-pointer ${
                                        macroSubTab === 'FDI'
                                            ? 'bg-white text-[#08090C] shadow'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Flussi FDI & Settori
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMacroSubTab('EQUITY_CAP')}
                                    className={`py-2 px-2 rounded-xl text-[10px] font-mono font-extrabold transition cursor-pointer ${
                                        macroSubTab === 'EQUITY_CAP'
                                            ? 'bg-white text-[#08090C] shadow'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Equity Market Cap
                                </button>
                            </div>

                            {/* SUB-VIEW 1: INDICATORI MACRO */}
                            {macroSubTab === 'INDICATORS' && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
                                        <span className="flex items-center gap-1.5">
                                            <Landmark className="w-3.5 h-3.5 text-[#10B981]" />
                                            <span>{macroData.macro.centralBank}</span>
                                        </span>
                                        <span className="text-[#10B981] font-bold">
                                            {isLoadingMacro
                                                ? 'Sync World Bank...'
                                                : macroData.isWorldBankLive
                                                ? 'World Bank API Live'
                                                : 'Institutional Baseline'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono">
                                        {[
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
                                                        : 'text-emerald-400'
                                            },
                                            {
                                                label: 'Crescita PIL YoY',
                                                value: `${macroData.macro.gdpGrowth >= 0 ? '+' : ''}${macroData.macro.gdpGrowth.toFixed(1)}%`,
                                                accent:
                                                    macroData.macro.gdpGrowth >= 0
                                                        ? 'text-[#10B981]'
                                                        : 'text-rose-400'
                                            },
                                            {
                                                label: 'PIL Nominale',
                                                value: `$${macroData.macro.gdpNominalBn.toLocaleString('it-IT')}B`,
                                                accent: 'text-white'
                                            },
                                            {
                                                label: 'Disoccupazione',
                                                value: `${macroData.macro.unemployment.toFixed(1)}%`,
                                                accent: 'text-slate-100'
                                            },
                                            {
                                                label: 'Debito / PIL',
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
                                                label: 'Riserve Valutarie',
                                                value: `$${macroData.macro.fxReservesBn.toLocaleString('it-IT')}B`,
                                                accent: 'text-cyan-400'
                                            },
                                            {
                                                label: 'Rating Sovrano',
                                                value: macroData.macro.sovereignRating,
                                                accent: 'text-[#10B981]'
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
                                                    className={`text-base font-black tabular-nums block ${kpi.accent}`}
                                                >
                                                    {kpi.value}
                                                </strong>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Sovereign Yield Curve Card */}
                                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2.5 font-mono">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase text-slate-300">
                                                Curva Rendimenti Sovrani ({hub.countryName})
                                            </span>
                                            <span className="text-[10px] text-slate-500">
                                                Spread 10Y-2Y:{' '}
                                                {(hub.bondYields.y10 - hub.bondYields.y2).toFixed(2)}%
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { tenor: '2Y Yield', val: hub.bondYields.y2 },
                                                { tenor: '5Y Yield', val: hub.bondYields.y5 },
                                                { tenor: '10Y Yield', val: hub.bondYields.y10 }
                                            ].map((y) => (
                                                <div
                                                    key={y.tenor}
                                                    className="p-2.5 rounded-xl bg-[#08090C]/80 border border-white/[0.06] text-center"
                                                >
                                                    <span className="text-[9px] text-slate-400 block">
                                                        {y.tenor}
                                                    </span>
                                                    <strong className="text-sm font-black text-white">
                                                        {y.val.toFixed(2)}%
                                                    </strong>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SUB-VIEW 2: FLUSSI FDI & SETTORI ("IN COSA INVESTONO") */}
                            {macroSubTab === 'FDI' && (
                                <div className="space-y-4">
                                    {/* Sectoral Allocation Recharts BarChart */}
                                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                                        <div>
                                            <span className="text-[10px] font-mono uppercase font-bold text-[#10B981]">
                                                In cosa investono ({hub.countryName})
                                            </span>
                                            <h3 className="text-sm font-black text-white">
                                                Ripartizione Settoriale FDI & Capitali Domestici (%)
                                            </h3>
                                        </div>

                                        <div className="w-full h-56">
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
                                                        width={96}
                                                        tick={{ fill: '#E2E8F0', fontSize: 10 }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: '#0D111A',
                                                            border: '1px solid rgba(255,255,255,0.12)',
                                                            borderRadius: '12px',
                                                            fontSize: '11px',
                                                            color: '#FFF'
                                                        }}
                                                        formatter={(value: any) => [`${value}%`, 'Quota FDI']}
                                                    />
                                                    <Bar dataKey="share" radius={[0, 8, 8, 0]}>
                                                        {hub.fdiSectors.map((entry, idx) => (
                                                            <Cell
                                                                key={entry.sector}
                                                                fill={
                                                                    SECTOR_BAR_COLORS[
                                                                        idx % SECTOR_BAR_COLORS.length
                                                                    ]
                                                                }
                                                            />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* 5-Year Historical FDI Trend Recharts AreaChart */}
                                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-[10px] font-mono uppercase font-bold text-cyan-400">
                                                    Trend Storico 5 Anni
                                                </span>
                                                <h3 className="text-sm font-black text-white">
                                                    Afflussi FDI Netti (Miliardi USD)
                                                </h3>
                                            </div>
                                            <span className="text-xs font-mono font-black text-[#10B981]">
                                                $
                                                {macroData.fdiHistory5Y[
                                                    macroData.fdiHistory5Y.length - 1
                                                ]?.inflowBn.toLocaleString('it-IT')}
                                                B
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
                                                            id="fdiAreaGrad"
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
                                                        formatter={(value: any) => [
                                                            `$${value}B`,
                                                            'Afflusso FDI'
                                                        ]}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="inflowBn"
                                                        stroke="#10B981"
                                                        strokeWidth={2.4}
                                                        fill="url(#fdiAreaGrad)"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SUB-VIEW 3: EQUITY MARKET CAP */}
                            {macroSubTab === 'EQUITY_CAP' && (
                                <div className="space-y-4">
                                    {/* Top 2 Market Cap KPIs */}
                                    <div className="grid grid-cols-2 gap-2.5 font-mono">
                                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-emerald-500/25 space-y-1">
                                            <span className="text-[10px] uppercase text-slate-400 block">
                                                Equity Market Cap Totale
                                            </span>
                                            <strong className="text-xl font-black text-[#10B981] tabular-nums block">
                                                $
                                                {macroData.totalMarketCapBn.toLocaleString('it-IT')}B
                                            </strong>
                                            <span className="text-[9px] text-slate-500 block">
                                                {hub.exchangeName}
                                            </span>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                                            <span className="text-[10px] uppercase text-slate-400 block">
                                                Market Cap / PIL (Buffett)
                                            </span>
                                            <strong className="text-xl font-black text-[#FACC15] tabular-nums block">
                                                {macroData.marketCapToGdpPct.toFixed(1)}%
                                            </strong>
                                            <span className="text-[9px] text-slate-500 block">
                                                PIL: ${macroData.macro.gdpNominalBn.toLocaleString('it-IT')}B
                                            </span>
                                        </div>
                                    </div>

                                    {/* Listed Equity Sector Weights Recharts Chart */}
                                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Globe className="w-4 h-4 text-[#10B981]" />
                                            <h3 className="text-xs sm:text-sm font-black text-white">
                                                Peso dei Principali Settori Quotati (%)
                                            </h3>
                                        </div>

                                        <div className="w-full h-52">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart
                                                    data={hub.equityMarket.topSectors}
                                                    margin={{ top: 8, right: 12, left: -10, bottom: 0 }}
                                                >
                                                    <CartesianGrid
                                                        strokeDasharray="3 3"
                                                        stroke="rgba(255,255,255,0.06)"
                                                        vertical={false}
                                                    />
                                                    <XAxis
                                                        dataKey="name"
                                                        tick={{ fill: '#CBD5E1', fontSize: 10 }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    <YAxis
                                                        unit="%"
                                                        tick={{ fill: '#94A3B8', fontSize: 10 }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: '#0D111A',
                                                            border: '1px solid rgba(255,255,255,0.12)',
                                                            borderRadius: '12px',
                                                            fontSize: '11px',
                                                            color: '#FFF'
                                                        }}
                                                        formatter={(value: any) => [`${value}%`, 'Peso Indice']}
                                                    />
                                                    <Bar dataKey="weight" radius={[8, 8, 0, 0]}>
                                                        {hub.equityMarket.topSectors.map((s, idx) => (
                                                            <Cell
                                                                key={s.name}
                                                                fill={
                                                                    SECTOR_BAR_COLORS[
                                                                        idx % SECTOR_BAR_COLORS.length
                                                                    ]
                                                                }
                                                            />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Top National Listed Corporations */}
                                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                                                <Building2 className="w-4 h-4 text-[#10B981]" />
                                                <span>Top Società Nazionali Quotate</span>
                                            </span>
                                            <span className="text-[10px] font-mono text-slate-500">
                                                Tocca per Grafico
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            {hub.topStocks.map((company) => (
                                                <button
                                                    key={company.symbol}
                                                    type="button"
                                                    onClick={() => onTickerClick(company.symbol)}
                                                    className="w-full p-3 rounded-xl bg-[#08090C]/80 hover:bg-white/[0.06] border border-white/[0.06] hover:border-[#10B981]/40 transition flex items-center justify-between gap-2 text-left cursor-pointer"
                                                >
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
                                                            {company.sector}
                                                        </span>
                                                    </div>
                                                    <div className="text-right font-mono shrink-0">
                                                        <span className="text-xs font-black text-white block">
                                                            ${company.marketCapBn.toLocaleString('it-IT')}B
                                                        </span>
                                                        <span className="text-[9px] text-slate-400">
                                                            Market Cap
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5 px-1">
                                        <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                                        <span>
                                            Dati macro e capitalizzazione integrati con World Bank Open Data API.
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
