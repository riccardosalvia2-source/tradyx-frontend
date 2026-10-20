// ============================================================================
// TRADYX MOBILE TAB 7: BOLLA (Quasar Bubble - Sentiment Galaxy Explorer)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useTradeStore, DEFAULT_MOCK_TRADES } from '../../store/useTradeStore';
import { CosmicFluid3D } from '../CosmicFluid3D';
import { fetchMultiSourceRealTimeNews, RealNewsItem } from '../../services/multiSourceNewsService';
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
    Zap
} from 'lucide-react';

export const TabBubble: React.FC = () => {
    const { trades } = useTradeStore();
    const safeTrades = Array.isArray(trades) && trades.length > 0 ? trades : DEFAULT_MOCK_TRADES;

    const [isShockwaveActive, setIsShockwaveActive] = useState<boolean>(false);
    const [isSynced, setIsSynced] = useState<boolean>(false);

    // Live news state
    const [liveNews, setLiveNews] = useState<RealNewsItem[]>([]);
    const [newsCategory, setNewsCategory] = useState<'ALL' | 'CRYPTO' | 'MACRO' | 'FED' | 'SENTIMENT' | 'ETF'>('ALL');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isLoadingNews, setIsLoadingNews] = useState<boolean>(false);
    const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);

    // Serverless Sentiment API State
    const [serverSentiment, setServerSentiment] = useState<{
        status: string;
        label: string;
        isProfitable: boolean;
        headline: string;
        summary: string;
        aiAdvice: string;
    }>({
        status: 'LOSS_70',
        label: '• 70% Loss / High Market Turbulence',
        isProfitable: false,
        headline: 'Global Risk-Off Rotation & Institutional Liquidity Sweep',
        summary: 'Aggressive derivatives deleveraging across major equity and crypto indexes. Dealer delta remains negative, with heightened sensitivity to macroeconomic headline catalysts.',
        aiAdvice: 'Wait for volume absorption candles and avoid high-leverage continuation setups in choppy conditions.'
    });

    useEffect(() => {
        const loadNews = async () => {
            setIsLoadingNews(true);
            try {
                const data = await fetchMultiSourceRealTimeNews();
                setLiveNews(data.news);
                if (data.news.length > 0) setSelectedNewsId(data.news[0].id);
            } catch (e) {
                console.warn('News fetch fallback:', e);
            } finally {
                setIsLoadingNews(false);
            }
        };
        loadNews();
    }, []);

    const handleSync = () => {
        setIsShockwaveActive(true);
        setTimeout(() => {
            setIsShockwaveActive(false);
            setIsSynced(true);
        }, 500);
    };

    const filteredNews = liveNews.filter(n => {
        const matchesCat = newsCategory === 'ALL' || n.category.toUpperCase() === newsCategory;
        const matchesQuery = !searchQuery || 
            n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.source.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesQuery;
    });

    return (
        <div className="w-full flex flex-col space-y-4 px-3 sm:px-4 pt-2 pb-28 text-white select-none overflow-x-hidden">
            
            {/* Top Compact Section Header */}
            <header className="w-full flex items-center justify-between py-2 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#12141A] border border-[#00E599]/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,229,153,0.15)] shrink-0">
                        <span className="font-sans font-black text-base text-[#00E599]">T</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase font-semibold">
                            QUANTUM SPHERE
                        </span>
                        <h1 className="text-sm font-extrabold text-white tracking-tight">
                            QUASAR BUBBLE
                        </h1>
                    </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-[#12141A] border border-white/5 text-[10px] font-mono text-[#00E599] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00E599] animate-ping" />
                    THREE.JS 3D
                </span>
            </header>

            {/* 1. SFERA 3D VERDE FLUIDA INTERATTIVA CON "TAP TO SYNC" */}
            <section className="w-full rounded-2xl border border-white/5 bg-[#12141A] p-4 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[320px] group">
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#08090C] border border-white/10 text-[9px] font-mono text-[#00E599]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00E599] animate-ping" />
                    <span>SENTIMENT GALAXY</span>
                </div>

                {/* Outer Glow */}
                <div 
                    className="absolute w-56 h-56 rounded-full animate-pulse transition-all duration-700 pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle at center, rgba(0, 229, 153, 0.25) 0%, rgba(29, 104, 189, 0.15) 60%, transparent 100%)',
                        filter: 'blur(30px)'
                    }}
                />

                {/* 3D WebGL Canvas */}
                <div 
                    onClick={handleSync}
                    className="relative w-full h-56 flex items-center justify-center cursor-pointer transition-transform duration-300 active:scale-95 z-10"
                >
                    <CosmicFluid3D />

                    {/* Central Brain and TAP TO SYNC indicator */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
                        <div className={`p-2.5 rounded-2xl bg-[#08090C]/80 border border-[#00E599]/40 shadow-xl backdrop-blur-md mb-2 transition-transform duration-300 ${
                            isShockwaveActive ? 'scale-125' : 'group-hover:scale-105'
                        }`}>
                            <BrainCircuit className="w-7 h-7 text-[#00E599] animate-pulse" />
                        </div>

                        <div className="px-3 py-1 rounded-full bg-[#08090C]/90 border border-[#00E599] text-[10px] font-mono font-black text-[#00E599] uppercase tracking-widest shadow-xl flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-[#00E599]" />
                            <span>TAP TO SYNC</span>
                        </div>
                    </div>
                </div>

                <div className="w-full flex items-center justify-between pt-2 border-t border-white/5 text-[9px] font-mono text-slate-400">
                    <span>ENGINE: THREE.JS GLSL</span>
                    <span className="text-[#00E599] font-bold">STATE: {isSynced ? 'SYNCHRONIZED' : 'ACTIVE LIVE'}</span>
                </div>
            </section>

            {/* 2. VISTA ESPANSA: QUASAR BUBBLE - SENTIMENT GALAXY EXPLORER */}
            <section className="w-full rounded-2xl border border-white/5 bg-[#12141A] p-4 sm:p-5 shadow-2xl space-y-4">
                
                {/* Section Title */}
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[#00E599]" />
                        <h2 className="text-xs font-mono font-black text-white uppercase tracking-wider">
                            QUASAR BUBBLE - SENTIMENT GALAXY EXPLORER
                        </h2>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-[#1D68BD] text-white uppercase">
                        GLOBAL FEED
                    </span>
                </div>

                {/* CARD STATO: "GLOBAL SENTIMENT: • 70% Loss" */}
                <div className="p-4 rounded-xl bg-[#08090C] border border-white/5 space-y-2.5 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
                            <Activity className="w-4 h-4 text-[#EF4444]" />
                            <span>GLOBAL SENTIMENT:</span>
                        </div>

                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/40">
                            • 70% Loss
                        </span>
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-xs sm:text-sm font-extrabold text-white">
                            {serverSentiment.headline}
                        </h3>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                            {serverSentiment.summary}
                        </p>
                    </div>

                    {/* AI Guidance Box */}
                    <div className="p-2.5 rounded-lg bg-[#12141A] border border-white/5 flex items-center gap-2 text-[11px] font-mono">
                        <Bot className="w-4 h-4 text-[#00E599] shrink-0" />
                        <span className="text-slate-300">
                            <strong className="text-[#00E599]">Coach Tip: </strong>
                            {serverSentiment.aiAdvice}
                        </span>
                    </div>
                </div>

                {/* 3. SEZIONE "MARKET NEWS" CON FEED IN TEMPO REALE */}
                <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Radio className="w-4 h-4 text-[#00E599] animate-pulse" />
                            <span className="text-xs font-mono font-black text-white uppercase">
                                MARKET NEWS (REAL-TIME FEED)
                            </span>
                        </div>
                        <span className="text-[9px] font-mono text-[#00E599] bg-[#00E599]/10 px-2 py-0.5 rounded-full border border-[#00E599]/30">
                            AUTO-SYNC 60S
                        </span>
                    </div>

                    {/* Category Filter Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar font-mono text-[10px]">
                        {(['ALL', 'CRYPTO', 'MACRO', 'FED', 'SENTIMENT', 'ETF'] as const).map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setNewsCategory(cat)}
                                className={`px-2.5 py-1 rounded-lg shrink-0 font-bold transition-all cursor-pointer border ${
                                    newsCategory === cat
                                        ? 'bg-[#00E599] text-[#08090C] border-[#00E599]'
                                        : 'bg-[#08090C] text-slate-400 border-white/5 hover:text-white'
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
                            placeholder="Filtra notizie o fonti..."
                            className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#08090C] border border-white/5 text-xs text-white font-mono placeholder:text-slate-500 focus:border-[#00E599] focus:outline-none"
                        />
                    </div>

                    {/* Live News Items List */}
                    <div className="space-y-2">
                        {isLoadingNews ? (
                            <div className="p-6 text-center text-xs text-slate-400 font-mono flex items-center justify-center gap-2">
                                <RefreshCw className="w-4 h-4 text-[#00E599] animate-spin" />
                                <span>Caricamento feed istituzionale...</span>
                            </div>
                        ) : filteredNews.length === 0 ? (
                            <div className="p-6 text-center text-xs text-slate-500 font-mono bg-[#08090C] rounded-xl border border-white/5">
                                Nessuna notizia trovata per i criteri correnti.
                            </div>
                        ) : (
                            filteredNews.slice(0, 10).map((news) => {
                                const isSelected = news.id === selectedNewsId;
                                return (
                                    <div
                                        key={news.id}
                                        onClick={() => setSelectedNewsId(news.id)}
                                        className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                                            isSelected
                                                ? 'bg-[#08090C] border-[#00E599]/60 shadow-lg shadow-[#00E599]/10'
                                                : 'bg-[#08090C]/60 border-white/5 hover:border-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between text-[10px] font-mono">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`px-1.5 py-0.2 rounded font-black border ${news.tagColor}`}>
                                                    {news.sentiment}
                                                </span>
                                                <span className="text-white font-bold uppercase">{news.source}</span>
                                            </div>
                                            <span className="text-slate-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {news.timeAgo}
                                            </span>
                                        </div>

                                        <h4 className="text-xs font-bold text-slate-200 leading-snug">
                                            {news.title}
                                        </h4>

                                        {isSelected && (
                                            <p className="text-[11px] text-slate-400 leading-relaxed font-mono pt-1 border-t border-white/5 animate-in fade-in">
                                                {news.summary}
                                            </p>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

            </section>

        </div>
    );
};

export default TabBubble;
