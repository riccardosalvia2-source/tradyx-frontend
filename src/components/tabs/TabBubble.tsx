// ============================================================================
// TRADYX MOBILE TAB 7: BOLLA (Quasar Bubble - Sentiment Galaxy Explorer)
// Ultra-Clean Dark Fintech / Institutional Terminal Design
// Background: #08090C solid, zero magenta canvas, pure jade organic bubble
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { 
    fetchMultiSourceRealTimeNews, 
    RealNewsItem, 
    NewsCategory 
} from '../../services/multiSourceNewsService';
import { 
    Sparkles, 
    BrainCircuit, 
    Activity, 
    Radio, 
    RefreshCw, 
    Search, 
    Clock, 
    ExternalLink, 
    Bot, 
    Globe, 
    ArrowLeft,
    Compass,
    TrendingDown,
    ShieldAlert
} from 'lucide-react';

export const TabBubble: React.FC = () => {
    // 2-View State Flow: 'BUBBLE' (Initial Zen View) or 'EXPLORER' (Sentiment & News Feed)
    const [viewMode, setViewMode] = useState<'BUBBLE' | 'EXPLORER'>('BUBBLE');

    // News aggregator state
    const [liveNews, setLiveNews] = useState<RealNewsItem[]>([]);
    const [newsCategory, setNewsCategory] = useState<'ALL' | NewsCategory>('ALL');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isLoadingNews, setIsLoadingNews] = useState<boolean>(false);
    const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
    const [activeSourcesCount, setActiveSourcesCount] = useState<number>(4);
    const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('Poco fa');

    // 5-minute Auto-Refresh Countdown (300 seconds = 5 minutes)
    const AUTO_REFRESH_INTERVAL_SEC = 300;
    const [secondsRemaining, setSecondsRemaining] = useState<number>(AUTO_REFRESH_INTERVAL_SEC);

    // Global Market Sentiment Specification
    const globalSentiment = {
        title: 'Global Sentiment: • 70% Loss / Fear (Institutional Deleveraging)',
        badge: '• 70% Loss / Fear',
        summary: 'Aggressive liquidity sweep across major digital assets and high-beta tech equities. Market participants are heavily de-risking as funding rates drop into neutral territory, creating asymmetric dip-buying opportunities for disciplined traders.',
        positioning: 'Extreme Fear & High Edge Reversal Zone. Dealer gamma is negative; attendere candele di assorbimento volumetrico su time-frame 1H prima di eseguire ordini di breakout.',
        coachTip: 'Esegui trade esclusivamente sui livelli chiave di supporto con Risk:Reward minimo di 1:2.5. Non forzare ingressi in contro-trend impulsivo (Revenge Trading).'
    };

    const loadNewsData = async () => {
        setIsLoadingNews(true);
        try {
            const data = await fetchMultiSourceRealTimeNews();
            setLiveNews(data.news);
            setActiveSourcesCount(data.activeSourcesCount);
            if (data.news.length > 0 && !selectedNewsId) {
                setSelectedNewsId(data.news[0].id);
            }
            const now = new Date();
            setLastUpdatedTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
        } catch (e) {
            console.warn('Failed to load market news feed:', e);
        } finally {
            setIsLoadingNews(false);
        }
    };

    // Initial load
    useEffect(() => {
        loadNewsData();
    }, []);

    // 5-minute automatic background refresh interval (300,000 ms)
    useEffect(() => {
        const timer = setInterval(() => {
            setSecondsRemaining(prev => {
                if (prev <= 1) {
                    loadNewsData();
                    return AUTO_REFRESH_INTERVAL_SEC;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatCountdown = (totalSec: number) => {
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    };

    const handleBubbleClick = () => {
        setViewMode('EXPLORER');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBackToBubble = () => {
        setViewMode('BUBBLE');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const filteredNews = liveNews.filter(n => {
        const matchesCat = newsCategory === 'ALL' || n.sourceType === newsCategory;
        const matchesQuery = !searchQuery.trim() || 
            n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.source.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesQuery;
    });

    return (
        <div className="w-full min-h-[calc(100dvh-5rem)] bg-[#08090C] text-slate-100 flex flex-col select-none overflow-x-hidden">
            
            {/* ============================================================================ */}
            {/* VISTA 1: INITIAL CLEAN VIEW (ESCLUSIVAMENTE LA BOLLA AL CENTRO)               */}
            {/* ============================================================================ */}
            {viewMode === 'BUBBLE' && (
                <div className="w-full flex-1 flex flex-col items-center justify-center px-4 py-8 relative animate-in fade-in duration-300">
                    
                    {/* Top Minimal Brand Indicator */}
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#111318] border border-white/5 flex items-center justify-center">
                            <span className="font-sans font-black text-xs text-[#2ECC71]">T</span>
                        </div>
                        <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-bold">
                            QUASAR BUBBLE
                        </span>
                    </div>

                    {/* Central Organic Jade Fluid Bubble Orb */}
                    <div 
                        onClick={handleBubbleClick}
                        className="relative flex flex-col items-center justify-center cursor-pointer transition-transform duration-300 active:scale-95 group my-auto"
                        title="Tocca per accedere al Sentiment Galaxy Explorer"
                    >
                        {/* Soft Natural Jade Ambient Glow (Non-fluorescent, subdued) */}
                        <div 
                            className="absolute w-72 h-72 rounded-full pointer-events-none transition-opacity duration-700 opacity-60 group-hover:opacity-90"
                            style={{
                                background: 'radial-gradient(circle at center, rgba(46, 204, 113, 0.28) 0%, rgba(39, 174, 96, 0.12) 55%, transparent 75%)',
                                filter: 'blur(35px)'
                            }}
                        />

                        {/* Opaque Institutional Jade Organic Blob Container (#2ECC71 / #27AE60) */}
                        <div 
                            className="w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-gradient-to-br from-[#2ECC71] via-[#27AE60] to-[#1E8449] animate-jade-bubble shadow-2xl flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 group-hover:scale-105"
                            style={{
                                border: '1.5px solid rgba(255, 255, 255, 0.25)'
                            }}
                        >
                            {/* Organic Soft Specular Highlight */}
                            <div className="absolute top-4 left-8 w-20 h-10 rounded-full bg-white/20 blur-md pointer-events-none transform -rotate-12" />

                            {/* Center White Quasar Icon */}
                            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-2.5 shadow-lg group-hover:rotate-6 transition-transform duration-300">
                                <BrainCircuit className="w-8 h-8 text-white drop-shadow-md" />
                            </div>

                            {/* Centered White "TAP TO SYNC" Badge */}
                            <div className="px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/30 text-[10px] sm:text-[11px] font-mono font-black text-white uppercase tracking-widest shadow-xl flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-white" />
                                <span>TAP TO SYNC</span>
                            </div>
                        </div>

                        {/* Subtitle / Invitation */}
                        <span className="mt-6 text-[11px] font-mono text-slate-400 group-hover:text-slate-200 transition-colors tracking-wide">
                            Tocca la bolla per sincronizzare il sentiment
                        </span>
                    </div>

                </div>
            )}

            {/* ============================================================================ */}
            {/* VISTA 2: SENTIMENT GALAXY EXPLORER & 50+ NOTIZIE (DOPO IL TAP)               */}
            {/* ============================================================================ */}
            {viewMode === 'EXPLORER' && (
                <div className="w-full flex flex-col space-y-4 px-3 sm:px-4 pt-3 pb-28 animate-in slide-in-from-bottom-3 duration-300">
                    
                    {/* Top Navigation Bar with Back Button */}
                    <div className="w-full flex items-center justify-between py-2.5 px-3 rounded-2xl glass-header">
                        <button
                            type="button"
                            onClick={handleBackToBubble}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer text-xs font-mono font-bold active:scale-95"
                        >
                            <ArrowLeft className="w-4 h-4 text-[#2ECC71]" />
                            <span>Indietro</span>
                        </button>

                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-400">
                                {liveNews.length} NOTIZIE DISPONIBILI
                            </span>
                            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                        </div>
                    </div>

                    {/* Section Header */}
                    <div className="flex items-center gap-2.5 px-1">
                        <div className="w-9 h-9 rounded-xl glass-panel flex items-center justify-center shadow-lg shrink-0">
                            <Globe className="w-5 h-5 text-[#2ECC71]" />
                        </div>
                        <div>
                            <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase font-semibold block">
                                MARKET INTELLIGENCE FEED
                            </span>
                            <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight font-mono">
                                QUASAR BUBBLE - SENTIMENT GALAXY EXPLORER
                            </h1>
                        </div>
                    </div>

                    {/* RIQUADRO DI SINTESI: GLOBAL SENTIMENT • 70% LOSS / FEAR */}
                    <section className="w-full rounded-2xl glass-panel p-4 sm:p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] space-y-3.5">
                        <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                            <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-[#DC2626]" />
                                <span className="text-xs font-mono font-bold text-slate-300 uppercase">
                                    Global Sentiment Status
                                </span>
                            </div>

                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-[#DC2626]/15 text-[#DC2626] border border-[#DC2626]/30 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] animate-ping" />
                                {globalSentiment.badge}
                            </span>
                        </div>

                        <div className="space-y-1">
                            <h2 className="text-xs sm:text-sm font-extrabold text-white leading-snug">
                                {globalSentiment.title}
                            </h2>
                            <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                                {globalSentiment.summary}
                            </p>
                        </div>

                        {/* Box Informativo: Posizionamento Rispetto al Mercato */}
                        <div className="p-3 rounded-xl glass-subcard space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400">
                                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Posizionamento Rispetto al Mercato:</span>
                            </div>
                            <p className="text-[11px] text-slate-300 font-mono leading-relaxed">
                                {globalSentiment.positioning}
                            </p>
                        </div>

                        {/* Box Informativo: Coach Tip */}
                        <div className="p-3 rounded-xl glass-subcard border border-[#10B981]/20 flex items-start gap-2.5 text-[11px] font-mono">
                            <Bot className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                            <span className="text-slate-200">
                                <strong className="text-[#10B981]">Coach Tip: </strong>
                                {globalSentiment.coachTip}
                            </span>
                        </div>
                    </section>

                    {/* ============================================================================ */}
                    {/* AGGREGATORE NEWS (MINIMO 50 NOTIZIE & AUTO-REFRESH OGNI 5 MINUTI)              */}
                    {/* ============================================================================ */}
                    <section className="w-full rounded-2xl glass-panel p-4 sm:p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] space-y-3.5">
                        
                        {/* Feed Bar: Auto-Refresh Timer & Manual Refresh Button */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                            <div className="flex items-center gap-2">
                                <Radio className="w-4 h-4 text-[#10B981] animate-pulse" />
                                <h3 className="text-xs font-mono font-black text-white uppercase">
                                    LIVE MARKET NEWS ({liveNews.length} ITEMS)
                                </h3>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-slate-400 glass-subcard px-2.5 py-1 rounded-lg">
                                    Auto-refresh: {formatCountdown(secondsRemaining)}
                                </span>

                                <button
                                    type="button"
                                    onClick={loadNewsData}
                                    disabled={isLoadingNews}
                                    className="px-3 py-1 rounded-lg glass-subcard hover:bg-white/10 text-[10px] font-mono font-bold text-slate-200 flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
                                    title="Aggiorna Notizie Immediatamente"
                                >
                                    <RefreshCw className={`w-3 h-3 text-[#10B981] ${isLoadingNews ? 'animate-spin' : ''}`} />
                                    <span>Aggiorna</span>
                                </button>
                            </div>
                        </div>

                        {/* Category Filter Chips */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar font-mono text-[10px]">
                            {(['ALL', 'CRYPTO', 'MACRO', 'FED', 'FOREX', 'ETF', 'EQUITIES'] as const).map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setNewsCategory(cat)}
                                    className={`px-2.5 py-1 rounded-lg shrink-0 font-bold transition-all cursor-pointer border ${
                                        newsCategory === cat
                                            ? 'bg-[#10B981] text-[#08090C] border-[#10B981] shadow-sm'
                                            : 'glass-subcard text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Search Input Filter */}
                        <div className="relative w-full">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cerca tra le 50+ notizie per titolo, fonte o asset..."
                                className="w-full h-10 pl-9 pr-3 rounded-xl glass-subcard text-xs text-white font-mono placeholder:text-slate-500 focus:border-[#10B981] focus:outline-none"
                            />
                        </div>

                        {/* 50+ News Items List: EACH ITEM IS A DIRECT LINK TO THE ARTICLE */}
                        <div className="space-y-3">
                            {isLoadingNews && liveNews.length === 0 ? (
                                <div className="p-10 text-center text-xs text-slate-400 font-mono flex items-center justify-center gap-2 glass-subcard rounded-xl">
                                    <RefreshCw className="w-4 h-4 text-[#10B981] animate-spin" />
                                    <span>Caricamento aggregatore 50+ notizie in tempo reale...</span>
                                </div>
                            ) : filteredNews.length === 0 ? (
                                <div className="p-8 text-center text-xs text-slate-500 font-mono glass-subcard rounded-xl">
                                    Nessuna notizia corrisponde ai filtri selezionati.
                                </div>
                            ) : (
                                filteredNews.map((news) => {
                                    return (
                                        <a
                                            key={news.id}
                                            href={news.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block p-4 rounded-2xl glass-panel hover:border-white/20 transition-all cursor-pointer space-y-2.5 group text-left"
                                            title="Tocca per aprire l'articolo reale sul sito della fonte"
                                        >
                                            {/* Card Top: Thematic Badge, Source, Relative Time, External Icon */}
                                            <div className="flex items-center justify-between text-[10px] font-mono">
                                                <div className="flex items-center gap-2">
                                                    {/* Thematic Badge (Macro, Crypto, FED, etc.) */}
                                                    <span className="px-2 py-0.5 rounded-md font-bold bg-[#1D4ED8]/20 text-cyan-300 border border-[#1D4ED8]/30">
                                                        {news.sourceType}
                                                    </span>

                                                    {/* Impact Badge */}
                                                    <span className={`px-2 py-0.5 rounded-md font-black border ${news.tagColor}`}>
                                                        {news.sentiment.toUpperCase()}
                                                    </span>

                                                    {/* Original Source */}
                                                    <span className="text-white font-bold uppercase">{news.source}</span>
                                                </div>

                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3 text-slate-500" />
                                                        {news.timeAgo}
                                                    </span>
                                                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#10B981] transition shrink-0 ml-1" />
                                                </div>
                                            </div>

                                            {/* Prominent Title */}
                                            <h4 className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-[#10B981] transition leading-snug">
                                                {news.title}
                                            </h4>

                                            {/* Article Summary */}
                                            <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                                                {news.summary}
                                            </p>

                                            {/* AI Predictive Insight */}
                                            <div className="p-2.5 rounded-lg glass-subcard text-[10px] font-mono text-cyan-300 flex items-start gap-1.5 border border-white/5">
                                                <Bot className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                                                <span>{news.aiPrediction}</span>
                                            </div>
                                        </a>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer Status */}
                        <div className="p-3 text-center text-[10px] font-mono text-slate-500 border-t border-white/[0.08] flex items-center justify-between">
                            <span>Sorgenti attive: {activeSourcesCount} canali</span>
                            <span>Ultimo sync: {lastUpdatedTime}</span>
                        </div>

                    </section>

                </div>
            )}

        </div>
    );
};

export default TabBubble;
