// ============================================================================
// TRADYX ATLAS — FULL-ISOLATION COUNTRY DRILL-DOWN PANEL (ZERO OVERLAP)
// (src/components/atlas/CountryDrilldownDrawer.tsx)
// Rendered in a dedicated fixed inset-0 z-[100] bg-[#08090C] container while
// Mapbox3DGlobe is completely hidden (display: none) -> physically impossible
// for map lights or canvas elements to overlap charts or tables.
// ZERO 1-second setInterval in this component (delegated strictly to LiveMarketsTable).
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
    ArrowLeft,
    Activity,
    Newspaper,
    BarChart3,
    ExternalLink,
    Sparkles,
    Search,
    RefreshCw,
    Zap,
    Clock,
    Cpu,
    ChevronDown,
    ChevronUp,
    GitBranch
} from 'lucide-react';
import { GlobalHub, AtlasLiveAsset, AtlasNewsItem } from '../../types/atlas';
import { getExchangeStatus } from '../../data/globalHubs';
import { fetchCountryNewsWithAIImpact } from '../../services/atlasNewsService';
import { fetchCountryMacroData, EnrichedMacroResult } from '../../services/atlasMacroService';
import { LiveMarketsTable } from './LiveMarketsTable';
import { MacroFdiChartsSection } from './MacroFdiChartsSection';

type DrawerMainTab = 'MARKETS' | 'NEWS' | 'MACRO';

interface CountryDrilldownDrawerProps {
    hub: GlobalHub;
    onClose: () => void;
    onOpenAssetChart: (asset: AtlasLiveAsset) => void;
    onTickerClick: (tickerSymbol: string) => void;
    onAskTradyxAI?: (prompt: string, source: string) => void;
}

export const CountryDrilldownDrawer: React.FC<CountryDrilldownDrawerProps> = ({
    hub,
    onClose,
    onOpenAssetChart,
    onTickerClick,
    onAskTradyxAI
}) => {
    const [activeTab, setActiveTab] = useState<DrawerMainTab>('MARKETS');

    // News state (fetched once per hub)
    const [newsItems, setNewsItems] = useState<AtlasNewsItem[]>([]);
    const [isLoadingNews, setIsLoadingNews] = useState<boolean>(true);
    const [newsSentimentFilter, setNewsSentimentFilter] = useState<
        'ALL' | 'BULLISH' | 'BEARISH' | 'VOLATILITÀ'
    >('ALL');
    const [newsSearch, setNewsSearch] = useState<string>('');
    const [expandedNewsReasoning, setExpandedNewsReasoning] = useState<Record<string, boolean>>({});

    // Macro state (fetched once per hub, NEVER re-rendered by 1s market ticks)
    const [macroData, setMacroData] = useState<EnrichedMacroResult>(() => ({
        macro: hub.macro,
        fdiHistory5Y: hub.fdiHistory5Y,
        marketCapToGdpPct: hub.equityMarket.marketCapToGdpPct,
        totalMarketCapBn: hub.equityMarket.totalMarketCapBn,
        isWorldBankLive: false,
        lastSyncedAt: new Date().toISOString()
    }));
    const [isLoadingMacro, setIsLoadingMacro] = useState<boolean>(false);

    const exchangeStatus = useMemo(() => getExchangeStatus(hub), [hub]);

    useEffect(() => {
        let isMounted = true;
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

    const filteredNews = useMemo(() => {
        const q = newsSearch.trim().toLowerCase();
        return newsItems.filter((n) => {
            const normalizedSent =
                n.aiImpact.sentiment === 'NEUTRAL' ? 'VOLATILITÀ' : n.aiImpact.sentiment;
            const matchesSentiment =
                newsSentimentFilter === 'ALL' || normalizedSent === newsSentimentFilter;
            const matchesText =
                !q ||
                n.title.toLowerCase().includes(q) ||
                n.source.toLowerCase().includes(q) ||
                n.aiImpact.operationalImpact.toLowerCase().includes(q) ||
                (n.aiImpact.transmissionMechanism || '').toLowerCase().includes(q) ||
                n.aiImpact.impactedTickers.some((t) => t.toLowerCase().includes(q));
            return matchesSentiment && matchesText;
        });
    }, [newsItems, newsSentimentFilter, newsSearch]);

    return (
        <div className="fixed inset-0 z-[100] bg-[#08090C] overflow-y-auto pb-24 text-white">
            <div className="w-full max-w-6xl mx-auto min-h-[100dvh] flex flex-col">
                {/* ========================================================= */}
                {/* FIXED INSTITUTIONAL COUNTRY HEADER                        */}
                {/* ========================================================= */}
                <header className="sticky top-0 z-20 px-4 sm:px-6 pt-[max(env(safe-area-inset-top,14px),14px)] pb-3.5 border-b border-white/[0.08] bg-[#08090C]/95 backdrop-blur-xl space-y-3">
                    {/* Row 1: Back to Map + Contextual Ask Tradyx AI + Exchange Status */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={onClose}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-bold text-slate-100 transition active:scale-95 cursor-pointer"
                            >
                                <ArrowLeft className="w-4 h-4 text-[#10B981]" />
                                <span>Torna alla Mappa</span>
                            </button>

                            {onAskTradyxAI && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const prompt = `Valuta opportunità, rischi macro e correlazioni su ${hub.countryName} (${hub.city}, indice ${hub.primaryIndex.symbol}, ${hub.macro.centralBank} al ${hub.macro.policyRate}%, CPI ${hub.macro.inflationCpi}%, rendimento ${hub.iso2}10Y al ${hub.bondYields.y10}%, cambio ${hub.fxPairLabel}) in relazione al mio portafoglio, al mio drawdown attuale e al mio stile di trading.`;
                                        onAskTradyxAI(prompt, `ATLAS (${hub.countryName})`);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#10B981]/15 hover:bg-[#10B981] text-[#10B981] hover:text-[#050A08] border border-[#10B981]/40 text-xs font-mono font-black transition active:scale-95 cursor-pointer shadow-md shadow-[#10B981]/15"
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Chiedi a Tradyx AI</span>
                                </button>
                            )}
                        </div>

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

                            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-black bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/35">
                                RATING {macroData.macro.sovereignRating}
                            </span>
                        </div>
                    </div>

                    {/* Row 2: Flag, PAESE / Città (Borsa) + Central Bank */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-2xl shrink-0">
                            {hub.flag}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-xl font-black text-white tracking-tight truncate">
                                {hub.countryName.toUpperCase()} / {hub.city}{' '}
                                <span className="text-[#10B981] font-mono text-xs sm:text-base">
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

                    {/* Row 3: 3 Highlight KPI Cards (Indice Nazionale, Valuta, Bond 2Y / 10Y) */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 font-mono">
                        <button
                            type="button"
                            onClick={() => onTickerClick(hub.primaryIndex.symbol)}
                            className="p-2.5 sm:p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-left transition cursor-pointer"
                        >
                            <span className="text-[9px] uppercase text-slate-400 block truncate">
                                {hub.primaryIndex.symbol}
                            </span>
                            <div className="flex items-baseline justify-between gap-1 mt-0.5">
                                <strong className="text-xs sm:text-base font-black text-white tabular-nums truncate">
                                    {hub.primaryIndex.basePrice.toLocaleString('it-IT', {
                                        maximumFractionDigits: 1
                                    })}
                                </strong>
                                <span
                                    className={`text-[9px] sm:text-[11px] font-bold tabular-nums ${
                                        hub.primaryIndex.changePct >= 0
                                            ? 'text-[#10B981]'
                                            : 'text-[#DC2626]'
                                    }`}
                                >
                                    {hub.primaryIndex.changePct >= 0 ? '+' : ''}
                                    {hub.primaryIndex.changePct.toFixed(2)}%
                                </span>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => onTickerClick(hub.fxPairLabel)}
                            className="p-2.5 sm:p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-left transition cursor-pointer"
                        >
                            <span className="text-[9px] uppercase text-slate-400 block truncate">
                                VALUTA · {hub.fxPairLabel}
                            </span>
                            <div className="flex items-baseline justify-between gap-1 mt-0.5">
                                <strong className="text-xs sm:text-base font-black text-cyan-300 tabular-nums truncate">
                                    {hub.fxBaseRate.toLocaleString('it-IT', {
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
                            className="p-2.5 sm:p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-left transition cursor-pointer"
                        >
                            <span className="text-[9px] uppercase text-slate-400 block truncate">
                                {hub.iso2} BOND 2Y / 10Y
                            </span>
                            <strong className="text-xs sm:text-base font-black text-[#FACC15] tabular-nums block mt-0.5 truncate">
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
                {/* TAB CONTENT BODY                                          */}
                {/* ========================================================= */}
                <main className="flex-1 px-4 sm:px-6 py-4 space-y-4">
                    {/* TAB 1: ISOLATED 1s LIVE MARKETS & BROKER LEAF */}
                    {activeTab === 'MARKETS' && (
                        <LiveMarketsTable hub={hub} onOpenAssetChart={onOpenAssetChart} />
                    )}

                    {/* TAB 2: NEWS & AI IMPACT (CANONICAL PUBLISHER URLs, ZERO GOOGLE BLOCK) */}
                    {activeTab === 'NEWS' && (
                        <div className="space-y-3.5">
                            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2.5">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-[#10B981]" />
                                        <span className="text-xs font-mono font-bold text-white">
                                            {filteredNews.length} / {newsItems.length} Notizie · AI
                                            Market Impact
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1 flex-wrap">
                                        {(['ALL', 'BULLISH', 'BEARISH', 'VOLATILITÀ'] as const).map(
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
                                        Caricamento notizie e analisi AI per {hub.countryName}...
                                    </span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                    {filteredNews.map((news) => {
                                        const displaySent =
                                            news.aiImpact.sentiment === 'NEUTRAL'
                                                ? 'VOLATILITÀ'
                                                : news.aiImpact.sentiment;
                                        const sentClasses =
                                            displaySent === 'BULLISH'
                                                ? 'bg-emerald-500/15 text-[#10B981] border-emerald-500/40'
                                                : displaySent === 'BEARISH'
                                                ? 'bg-rose-500/15 text-rose-400 border-rose-500/40'
                                                : 'bg-amber-500/15 text-amber-300 border-amber-500/40';
                                        const isReasoningOpen = !!expandedNewsReasoning[news.id];

                                        return (
                                            <article
                                                key={news.id}
                                                className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col justify-between space-y-3"
                                            >
                                                <div className="space-y-2.5">
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
                                                        <span className="shrink-0">
                                                            {news.timeAgo}
                                                        </span>
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
                                                </div>

                                                {/* Dedicated AI MARKET IMPACT Box (Causal Chain + Mechanism + Horizon) */}
                                                <div className="p-3 rounded-xl bg-[#05080F]/90 border border-white/[0.07] space-y-2">
                                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-black text-cyan-300 uppercase">
                                                            <Zap className="w-3 h-3 text-[#10B981]" />
                                                            <span>AI MARKET IMPACT</span>
                                                        </span>
                                                        <div className="flex items-center gap-1.5">
                                                            {news.aiImpact.horizon && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-white/[0.06] text-slate-300 border border-white/[0.1]">
                                                                    <Clock className="w-2.5 h-2.5 text-cyan-400" />
                                                                    {news.aiImpact.horizon}
                                                                </span>
                                                            )}
                                                            <span
                                                                className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-black border ${sentClasses}`}
                                                            >
                                                                {displaySent}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {news.aiImpact.transmissionMechanism && (
                                                        <div className="flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/[0.07] border border-cyan-500/20 text-[10px] font-mono text-cyan-200 leading-snug">
                                                            <GitBranch className="w-3 h-3 text-cyan-400 shrink-0 mt-0.5" />
                                                            <span>{news.aiImpact.transmissionMechanism}</span>
                                                        </div>
                                                    )}

                                                    <p className="text-[11px] text-slate-300 leading-relaxed">
                                                        {news.aiImpact.operationalImpact}
                                                    </p>

                                                    <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
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

                                                        {news.aiImpact.internalReasoning &&
                                                            news.aiImpact.internalReasoning.length > 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setExpandedNewsReasoning((prev) => ({
                                                                            ...prev,
                                                                            [news.id]: !prev[news.id]
                                                                        }))
                                                                    }
                                                                    className="inline-flex items-center gap-1 text-[9px] font-mono text-slate-400 hover:text-cyan-300 transition cursor-pointer"
                                                                >
                                                                    <Cpu className="w-3 h-3 text-cyan-400/80" />
                                                                    <span>
                                                                        {isReasoningOpen
                                                                            ? 'Nascondi Catena AI'
                                                                            : 'Catena Causale AI'}
                                                                    </span>
                                                                    {isReasoningOpen ? (
                                                                        <ChevronUp className="w-3 h-3" />
                                                                    ) : (
                                                                        <ChevronDown className="w-3 h-3" />
                                                                    )}
                                                                </button>
                                                            )}
                                                    </div>

                                                    {isReasoningOpen && news.aiImpact.internalReasoning && (
                                                        <div className="mt-1.5 p-2 rounded-lg bg-black/50 border border-white/[0.08] space-y-1 text-[10px] font-mono text-slate-300 animate-in fade-in">
                                                            {news.aiImpact.internalReasoning.map((step, sIdx) => (
                                                                <div key={sIdx} className="leading-snug">
                                                                    <span className="text-cyan-400 font-bold mr-1">
                                                                        [{sIdx + 1}]
                                                                    </span>
                                                                    {step.replace(/^\d+[.)]\s*/, '')}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 3: STABLE MEMOIZED MACRO, FDI & EQUITY MARKET CAP */}
                    {activeTab === 'MACRO' && (
                        <MacroFdiChartsSection
                            hub={hub}
                            macroData={macroData}
                            isLoadingMacro={isLoadingMacro}
                            exchangeIsOpen={exchangeStatus.isOpen}
                            onTickerClick={onTickerClick}
                        />
                    )}
                </main>
            </div>
        </div>
    );
};

export default CountryDrilldownDrawer;
