// ============================================================================
// TRADYX MOBILE TAB 7: BOLLA (Quasar Bubble - Sentiment Galaxy Explorer)
// Ultra-Modern Dark Fintech / Institutional Terminal Design
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useTradeStore, DEFAULT_MOCK_TRADES } from '../../store/useTradeStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { fetchMultiSourceRealTimeNews, RealNewsItem, NewsImpact } from '../../services/multiSourceNewsService';
import { CosmicFluid3D } from '../CosmicFluid3D';
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
    ArrowUpRight,
    TrendingUp,
    TrendingDown,
    Zap,
    ShieldAlert,
    Compass
} from 'lucide-react';

export const TabBubble: React.FC = () => {
    const { trades } = useTradeStore();
    const { baseCurrency, formatMoney } = useSettingsStore();
    const safeTrades = Array.isArray(trades) && trades.length > 0 ? trades : DEFAULT_MOCK_TRADES;

    const [isShockwaveActive, setIsShockwaveActive] = useState<boolean>(false);
    const [isSynced, setIsSynced] = useState<boolean>(true);
    const [syncCount, setSyncCount] = useState<number>(1);

    // Live news state
    const [liveNews, setLiveNews] = useState<RealNewsItem[]>([]);
    const [newsCategory, setNewsCategory] = useState<'ALL' | 'CRYPTO' | 'MACRO' | 'FED' | 'ETF' | 'FOREX'>('ALL');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isLoadingNews, setIsLoadingNews] = useState<boolean>(false);
    const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
    const [activeSourcesCount, setActiveSourcesCount] = useState<number>(4);

    // Auto-refresh countdown
    const [countdown, setCountdown] = useState<number>(60);

    // Global Market Sentiment State
    const [globalSentiment] = useState({
        score: '70% Loss / Fear',
        badgeColor: 'bg-[#FF4D4D]/15 text-[#FF4D4D] border-[#FF4D4D]/30',
        headline: 'Global Sentiment: • 70% Loss / Fear (Institutional Deleveraging)',
        summary: 'Aggressive liquidity sweep across major digital assets and high-beta tech equities. Market participants are heavily de-risking as funding rates drop into neutral territory, creating asymmetric dip-buying opportunities for disciplined traders.',
        positioningBox: 'Market Positioning: Extreme Fear & High Edge Reversal Zone. Dealer gamma is negative; wait for hourly absorption wicks before entering breakout positions.',
        aiAdvice: 'Esegui trade esclusivamente sui livelli chiave di supporto con Risk:Reward minimo di 1:2.5. Non forzare ingressi in contro-trend impulsivo.'
    });

    const loadNews = async () => {
        setIsLoadingNews(true);
        try {
            const data = await fetchMultiSourceRealTimeNews();
            setLiveNews(data.news);
            setActiveSourcesCount(data.activeSourcesCount);
            if (data.news.length > 0 && !selectedNewsId) {
                setSelectedNewsId(data.news[0].id);
            }
        } catch (e) {
            console.warn('News fetch notice:', e);
        } finally {
            setIsLoadingNews(false);
        }
    };

    useEffect(() => {
        loadNews();
    }, []);

    // Countdown timer for auto-refresh
    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    loadNews();
                    return 60;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleSync = () => {
        setIsShockwaveActive(true);
        setTimeout(() => {
            setIsShockwaveActive(false);
            setIsSynced(true);
            setSyncCount(prev => prev + 1);
            loadNews();
        }, 500);
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
        <div className="w-full flex flex-col space-y-4 px-3 sm:px-4 pt-2 pb-28 text-white select-none overflow-x-hidden">
            
            {/* Top Compact Section Header */}
            <header className="w-full flex items-center justify-between py-2 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#111318] border border-[#00E599]/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,229,153,0.2)] shrink-0">
                        <span className="font-sans font-black text-base text-[#00E599]">T</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase font-semibold">
                            QUANTUM INTELLIGENCE
                        </span>
                        <h1 className="text-sm font-extrabold text-white tracking-tight font-mono">
                            QUASAR BUBBLE
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#111318] border border-white/[0.08] text-[10px] font-mono text-[#00E599] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00E599] animate-ping" />
                    <span>REAL-TIME GLSL</span>
                </div>
            </header>

            {/* 1. CERCHIO ORGANICO FLUTTUANTE CENTRALE CON ANIMAZIONE FLUIDA CONTINUA */}
            <section className="w-full rounded-2xl border border-white/[0.08] bg-[#111318] p-5 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[340px] group">
                
                {/* Floating Top Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#08090C] border border-white/10 text-[9px] font-mono text-[#00E599]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00E599] animate-ping" />
                    <span>SENTIMENT GALAXY</span>
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#08090C] border border-white/10 text-[9px] font-mono text-slate-400">
                    <span>SYNC #{syncCount}</span>
                </div>

                {/* Pulsing Emerald Neon Glow Ambient Aura */}
                <div 
                    className="absolute w-64 h-64 rounded-full pointer-events-none transition-all duration-1000 animate-pulse"
                    style={{
                        background: 'radial-gradient(circle at center, rgba(0, 229, 153, 0.35) 0%, rgba(29, 104, 189, 0.18) 55%, transparent 75%)',
                        filter: 'blur(35px)'
                    }}
                />

                {/* Secondary Ripple Wave Effect */}
                <div className="absolute w-72 h-72 rounded-full border border-[#00E599]/20 animate-ping pointer-events-none opacity-40" />

                {/* 3D WebGL Canvas + Morphing Organic Sphere Container */}
                <div 
                    onClick={handleSync}
                    className="relative w-full h-60 flex items-center justify-center cursor-pointer transition-transform duration-300 active:scale-95 z-10 select-none"
                    title="Tocca per Sincronizzare la Bolla Quasar"
                >
                    <CosmicFluid3D />

                    {/* Central Brain Icon & "TAP TO SYNC" Indicator */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
                        <div className={`p-3 rounded-2xl bg-[#08090C]/80 border border-[#00E599]/50 shadow-[0_0_20px_rgba(0,229,153,0.35)] backdrop-blur-md mb-2.5 transition-transform duration-300 ${
                            isShockwaveActive ? 'scale-125 rotate-12' : 'group-hover:scale-110'
                        }`}>
                            <BrainCircuit className="w-8 h-8 text-[#00E599] animate-pulse" />
                        </div>

                        <div className="px-3.5 py-1.5 rounded-full bg-[#08090C]/90 border border-[#00E599] text-[10px] font-mono font-black text-[#00E599] uppercase tracking-widest shadow-[0_0_15px_rgba(0,229,153,0.4)] flex items-center gap-1.5 group-hover:bg-[#00E599] group-hover:text-[#08090C] transition-colors">
                            <Sparkles className="w-3.5 h-3.5 text-[#00E599] group-hover:text-[#08090C]" />
                            <span>TAP TO SYNC</span>
                        </div>
                    </div>
                </div>

                {/* Sphere Bottom HUD Status */}
                <div className="w-full flex items-center justify-between pt-3 border-t border-white/[0.06] text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00E599]" />
                        <span>ENGINE: THREE.JS GLSL</span>
                    </span>
                    <span className="text-[#00E599] font-bold">
                        {isSynced ? 'SYNCHRONIZED' : 'READY TO SYNC'}
                    </span>
                </div>
            </section>

            {/* 2. VISTA ESPANSA: QUASAR BUBBLE - SENTIMENT GALAXY EXPLORER */}
            <section className="w-full rounded-2xl border border-white/[0.08] bg-[#111318] p-4 sm:p-5 shadow-2xl space-y-4">
                
                {/* Section Title */}
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[#00E599]" />
                        <h2 className="text-xs font-mono font-black text-white uppercase tracking-wider">
                            QUASAR BUBBLE - SENTIMENT GALAXY EXPLORER
                        </h2>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-[#1D68BD] text-white uppercase">
                        INSTITUTIONAL
                    </span>
                </div>

                {/* CARD STATO: "Global Sentiment: • 70% Loss / Fear" */}
                <div className="p-4 rounded-xl bg-[#08090C] border border-white/[0.08] space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
                            <Activity className="w-4 h-4 text-[#FF4D4D]" />
                            <span>Global Sentiment:</span>
                        </div>

                        <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-black bg-[#FF4D4D]/15 text-[#FF4D4D] border border-[#FF4D4D]/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D4D] animate-ping" />
                            • 70% Loss / Fear
                        </span>
                    </div>

                    <div className="space-y-1.5">
                        <h3 className="text-xs sm:text-sm font-extrabold text-white leading-snug">
                            {globalSentiment.headline}
                        </h3>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                            {globalSentiment.summary}
                        </p>
                    </div>

                    {/* Box Informativo di Posizionamento rispetto al Mercato */}
                    <div className="p-3 rounded-lg bg-[#111318] border border-white/[0.08] space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300">
                            <Compass className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Posizionamento Rispetto al Mercato:</span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-mono leading-relaxed">
                            {globalSentiment.positioningBox}
                        </p>
                    </div>

                    {/* AI Guidance Box */}
                    <div className="p-3 rounded-lg bg-[#111318] border border-[#00E599]/20 flex items-start gap-2.5 text-[11px] font-mono">
                        <Bot className="w-4 h-4 text-[#00E599] shrink-0 mt-0.5" />
                        <span className="text-slate-200">
                            <strong className="text-[#00E599]">Coach Tip: </strong>
                            {globalSentiment.aiAdvice}
                        </span>
                    </div>
                </div>

                {/* 3. SEZIONE "MARKET NEWS" (REAL-TIME FEED) */}
                <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Radio className="w-4 h-4 text-[#00E599] animate-pulse" />
                            <span className="text-xs font-mono font-black text-white uppercase">
                                MARKET NEWS (REAL-TIME FEED)
                            </span>
                        </div>
                        <span className="text-[9px] font-mono text-[#00E599] bg-[#00E599]/10 px-2.5 py-0.5 rounded-full border border-[#00E599]/30 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 animate-spin text-[#00E599]" />
                            <span>AUTO-SYNC {countdown}S</span>
                        </span>
                    </div>

                    {/* Category Filter Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar font-mono text-[10px]">
                        {(['ALL', 'CRYPTO', 'MACRO', 'FED', 'ETF', 'FOREX'] as const).map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setNewsCategory(cat)}
                                className={`px-2.5 py-1 rounded-lg shrink-0 font-bold transition-all cursor-pointer border ${
                                    newsCategory === cat
                                        ? 'bg-[#00E599] text-[#08090C] border-[#00E599]'
                                        : 'bg-[#08090C] text-slate-400 border-white/[0.08] hover:text-white'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Search bar inside news */}
                    <div className="relative w-full">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filtra notizie per titolo o fonte..."
                            className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#08090C] border border-white/[0.08] text-xs text-white font-mono placeholder:text-slate-500 focus:border-[#00E599] focus:outline-none"
                        />
                    </div>

                    {/* Live News Items List - WITH EXTERNAL LINK OPENING */}
                    <div className="space-y-2.5">
                        {isLoadingNews ? (
                            <div className="p-8 text-center text-xs text-slate-400 font-mono flex items-center justify-center gap-2 bg-[#08090C] rounded-xl border border-white/5">
                                <RefreshCw className="w-4 h-4 text-[#00E599] animate-spin" />
                                <span>Caricamento feed notizie live...</span>
                            </div>
                        ) : filteredNews.length === 0 ? (
                            <div className="p-6 text-center text-xs text-slate-500 font-mono bg-[#08090C] rounded-xl border border-white/5">
                                Nessuna notizia trovata per i criteri correnti.
                            </div>
                        ) : (
                            filteredNews.slice(0, 15).map((news) => {
                                const isSelected = news.id === selectedNewsId;
                                return (
                                    <div
                                        key={news.id}
                                        onClick={() => setSelectedNewsId(news.id)}
                                        className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                                            isSelected
                                                ? 'bg-[#08090C] border-[#00E599]/60 shadow-lg shadow-[#00E599]/10'
                                                : 'bg-[#08090C]/80 border-white/[0.08] hover:border-white/20'
                                        }`}
                                    >
                                        {/* Card Top: Impact Badge, Source, Time Elapsed */}
                                        <div className="flex items-center justify-between text-[10px] font-mono">
                                            <div className="flex items-center gap-2">
                                                {/* Impact Badge: Bullish / Bearish / Neutral */}
                                                <span className={`px-2 py-0.5 rounded-md font-black border ${news.tagColor}`}>
                                                    {news.sentiment.toUpperCase()}
                                                </span>
                                                <span className="text-white font-bold uppercase">{news.source}</span>
                                                <span className="text-[9px] text-slate-500 uppercase">[{news.sourceType}]</span>
                                            </div>

                                            <span className="text-slate-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-slate-500" />
                                                {news.timeAgo}
                                            </span>
                                        </div>

                                        {/* Title: CLICKABLE LINK IN A NEW TAB */}
                                        <a
                                            href={news.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-xs sm:text-sm font-bold text-slate-100 hover:text-[#00E599] transition flex items-start justify-between gap-2 leading-snug group/link"
                                            title="Apri articolo originale nella fonte"
                                        >
                                            <span>{news.title}</span>
                                            <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover/link:text-[#00E599] shrink-0 mt-0.5" />
                                        </a>

                                        {/* Expandable summary & AI Prediction */}
                                        {isSelected && (
                                            <div className="space-y-2 pt-2 border-t border-white/5 animate-in fade-in">
                                                <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                                                    {news.summary}
                                                </p>
                                                <div className="p-2.5 rounded-lg bg-[#111318] border border-white/5 text-[10px] font-mono text-cyan-300 flex items-start gap-1.5">
                                                    <Bot className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                                                    <span>{news.aiPrediction}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="p-3 text-center text-[10px] font-mono text-slate-500 border-t border-white/5">
                        FONTI ATTIVE: {activeSourcesCount} MULTI-STREAM (CryptoCompare, Yahoo Finance, Cointelegraph, Bloomberg Feeds)
                    </div>
                </div>

            </section>

        </div>
    );
};

export default TabBubble;
