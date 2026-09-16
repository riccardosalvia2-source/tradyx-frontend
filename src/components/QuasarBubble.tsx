// ============================================================================
// TRADYX QUASAR BUBBLE - SENTIMENT GALAXY EXPLORER (src/components/QuasarBubble.tsx)
// Description: Organic morphing liquid blob centered in its container with a
//              screen-wide overlay modal (via React createPortal) featuring
//              Global Sentiment, 50+ Live Market News, search/filters, and
//              predictive Quasar AI algorithm commentary.
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { BubbleConfig } from '../types/bubble';
import { Trade } from '../types/trade';
import { useTradeStore, DEFAULT_MOCK_TRADES } from '../store/useTradeStore';
import { 
    BrainCircuit, 
    Sparkles, 
    X, 
    ChevronLeft, 
    Activity, 
    TrendingUp, 
    TrendingDown, 
    Flame, 
    ShieldCheck, 
    Zap, 
    Newspaper, 
    ExternalLink, 
    Clock, 
    Tag, 
    Bot,
    Radio,
    Globe,
    RefreshCw,
    Search,
    Filter
} from 'lucide-react';

import { fetchMultiSourceRealTimeNews, RealNewsItem } from '../services/multiSourceNewsService';
import { CosmicFluid3D } from './CosmicFluid3D';

interface QuasarBubbleProps {
    config?: BubbleConfig;
    trades?: Trade[];
}

export const QuasarBubble: React.FC<QuasarBubbleProps> = ({ config, trades: propsTrades }) => {
    const storeTrades = useTradeStore(s => s.trades);
    const safeTrades = Array.isArray(propsTrades) && propsTrades.length > 0 
        ? propsTrades 
        : (Array.isArray(storeTrades) && storeTrades.length > 0 ? storeTrades : DEFAULT_MOCK_TRADES);

    const [isExplorerOpen, setIsExplorerOpen] = useState<boolean>(false);
    const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
    const [newsCategory, setNewsCategory] = useState<'ALL' | 'MACRO' | 'CRYPTO' | 'FED' | 'SENTIMENT' | 'ETF'>('ALL');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Multi-source live news aggregator state
    const [liveNews, setLiveNews] = useState<RealNewsItem[]>([]);
    const [activeSourcesCount, setActiveSourcesCount] = useState<number>(3);
    const [isLoadingNews, setIsLoadingNews] = useState<boolean>(false);

    // Serverless Sentiment API State
    const [serverSentiment, setServerSentiment] = useState<{
        sentimentScore: number;
        status: string;
        label: string;
        isProfitable: boolean;
        headline: string;
        summary: string;
        aiAdvice: string;
    } | null>(null);
    const [isLoadingSentiment, setIsLoadingSentiment] = useState<boolean>(true);

    // Auto-refresh countdown state (60 seconds)
    const [secondsToRefresh, setSecondsToRefresh] = useState<number>(60);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

    const loadNewsData = async () => {
        setIsLoadingNews(true);
        try {
            const data = await fetchMultiSourceRealTimeNews();
            setLiveNews(data.news);
            setActiveSourcesCount(data.activeSourcesCount);
            if (data.news.length > 0 && !selectedNewsId) {
                setSelectedNewsId(data.news[0].id);
            }
        } catch (err) {
            console.warn('Failed to load multi-source news feed:', err);
        } finally {
            setIsLoadingNews(false);
        }
    };

    useEffect(() => {
        loadNewsData();
    }, []);

    // Fetch Sentiment from Serverless Function Endpoint (/api/quasar-sentiment)
    useEffect(() => {
        let isMounted = true;
        const fetchSentiment = async () => {
            setIsLoadingSentiment(true);
            try {
                const res = await fetch('/api/quasar-sentiment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ trades: safeTrades })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted) setServerSentiment(data);
                } else {
                    throw new Error(`Server status ${res.status}`);
                }
            } catch (err) {
                // Fallback for offline dev environment
                const fallbackIsProfitable = (safeTrades || []).reduce((acc, t) => acc + (Number(t?.pnl) || 0), 0) >= 0;
                if (isMounted) {
                    setServerSentiment({
                        sentimentScore: fallbackIsProfitable ? 85 : 70,
                        status: fallbackIsProfitable ? 'BULLISH_DISCIPLINED' : 'LOSS_UNSTABLE',
                        label: fallbackIsProfitable ? '• 85% Bullish & Disciplinato' : '• 70% Loss & Instabile',
                        isProfitable: fallbackIsProfitable,
                        headline: fallbackIsProfitable 
                            ? '✨ La galassia operativa mostra un’eccellente stabilità ed aderenza al trading plan.'
                            : '⚠️ La galassia oggi è fortemente in perdita. Il mercato è instabile ed incerto.',
                        summary: fallbackIsProfitable
                            ? 'Stai battendo il mercato: mantieni il focus e sfrutta le inefficienze senza cedere all\'avidità.'
                            : 'Aumento della volatilità generale. L\'algoritmo raccomanda di non forzare entrate di recupero impulsivo.',
                        aiAdvice: fallbackIsProfitable
                            ? 'Mantenere il piano di Risk Management. In presenza di profitti superiori al 3% giornaliero, valutare la presa di profitto parziale.'
                            : 'Pausa tattica raccomandata. Non tentare il Revenge Trading per recuperare i drawdown della sessione.'
                    });
                }
            } finally {
                if (isMounted) setIsLoadingSentiment(false);
            }
        };

        fetchSentiment();
        return () => { isMounted = false; };
    }, [safeTrades]);

    useEffect(() => {
        const timer = setInterval(() => {
            setSecondsToRefresh(prev => {
                if (prev <= 1) {
                    setIsRefreshing(true);
                    loadNewsData().finally(() => setTimeout(() => setIsRefreshing(false), 800));
                    return 60;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Filtered multi-source news feed
    const filteredNews = useMemo(() => {
        return liveNews.filter(news => {
            const matchesCat = newsCategory === 'ALL' || news.sourceType === newsCategory || (newsCategory === 'SENTIMENT' && news.sentiment === 'VOLATILE');
            const matchesSearch = !searchQuery || 
                news.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                news.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
                news.aiPrediction.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCat && matchesSearch;
        });
    }, [liveNews, newsCategory, searchQuery]);

    // Micro-stars array
    const stars = useMemo(() => {
        return Array.from({ length: 45 }).map((_, i) => ({
            id: i,
            top: `${Math.floor(Math.random() * 100)}%`,
            left: `${Math.floor(Math.random() * 100)}%`,
            size: Math.random() > 0.7 ? 'w-1.5 h-1.5' : 'w-1 h-1',
            color: i % 3 === 0 ? 'bg-emerald-400' : i % 3 === 1 ? 'bg-cyan-400' : 'bg-purple-400',
            duration: `${(2 + Math.random() * 3).toFixed(1)}s`,
            delay: `${(Math.random() * 2).toFixed(1)}s`
        }));
    }, []);

    // Shockwave animation trigger state
    const [isShockwaveActive, setIsShockwaveActive] = useState<boolean>(false);

    const handleBubbleClick = () => {
        setIsShockwaveActive(true);
        setTimeout(() => {
            setIsShockwaveActive(false);
            setIsExplorerOpen(true);
        }, 450);
    };

    const totalPnl = (safeTrades || []).reduce((acc, t) => acc + (Number(t?.pnl) || 0), 0);
    const isProfitable = totalPnl >= 0;

    return (
        <div className="w-full max-w-[400px] min-h-[360px] mx-auto my-auto relative flex flex-col items-center justify-center rounded-3xl bg-slate-950/80 border border-slate-800/80 p-4 overflow-hidden shadow-2xl backdrop-blur-xl group">
            
            {/* 1. FLOATING POINT-PARTICLE STARFIELD BACKGROUND */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {stars.map((star) => (
                    <div
                        key={star.id}
                        className={`absolute rounded-full opacity-60 animate-star-twinkle ${star.size} ${star.color}`}
                        style={{
                            top: star.top,
                            left: star.left,
                            animationDuration: star.duration,
                            animationDelay: star.delay
                        }}
                    />
                ))}

                {/* Ambient Galaxy Aura Glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/25 via-slate-950 to-purple-950/25 pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-emerald-500/10 blur-[90px] rounded-full pointer-events-none" />
            </div>

            {/* FLOATING TOP GLASSMORPHIC BADGE */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-950/80 border border-emerald-500/40 rounded-full text-[11px] font-mono font-extrabold text-emerald-400 shadow-xl backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>SENTIMENT GALAXY</span>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 backdrop-blur-md px-3 py-1 rounded-2xl shadow-xl flex items-center gap-2 font-mono text-[11px] text-white">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-slate-400 text-[10px]">PNL:</span>
                    <strong className={isProfitable ? 'text-emerald-400' : 'text-rose-400'}>
                        {totalPnl >= 0 ? `+$${totalPnl.toLocaleString()}` : `-$${Math.abs(totalPnl).toLocaleString()}`}
                    </strong>
                </div>
            </div>

            {/* 2. CENTRAL ORGANIC 3D FLUID BUBBLE ORB (THREE.JS WEBGL + GLSL SHADER) */}
            <div 
                className="relative w-full h-[280px] sm:h-[300px] flex items-center justify-center z-10 cursor-pointer my-auto select-none group/bubble" 
                onClick={handleBubbleClick}
            >
                {/* Outer Atmosphere Pulsing Emerald Glow */}
                <div 
                    className="absolute w-52 h-52 sm:w-60 sm:h-60 rounded-full animate-pulse transition-all duration-700 opacity-80 pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.35) 0%, rgba(6, 182, 212, 0.2) 60%, transparent 100%)',
                        filter: 'blur(25px)'
                    }}
                />

                {/* 3D WebGL Three.js Canvas Container */}
                <div className="absolute inset-0 flex items-center justify-center transition-transform duration-500 group-hover/bubble:scale-105 active:scale-95">
                    <CosmicFluid3D />
                </div>

                {/* Central Floating Overlay Badges & AI Brain Icon */}
                <div className="relative z-20 flex flex-col items-center justify-center pointer-events-none">
                    <div className="p-2.5 sm:p-3 bg-slate-950/60 rounded-2xl border border-emerald-400/40 shadow-2xl backdrop-blur-sm mb-2 group-hover/bubble:rotate-6 transition-transform">
                        <BrainCircuit className="w-7 h-7 sm:w-9 sm:h-9 text-emerald-400 animate-pulse" />
                    </div>

                    <div className="px-3 py-1 bg-slate-950/85 border border-emerald-400/80 rounded-full text-[10px] sm:text-xs font-mono font-black text-emerald-300 uppercase tracking-widest shadow-xl flex items-center gap-1.5 group-hover/bubble:bg-emerald-400 group-hover/bubble:text-slate-950 transition-colors">
                        <Sparkles className="w-3 h-3 text-emerald-400 group-hover/bubble:text-slate-950" />
                        <span>TAP TO SYNC</span>
                    </div>
                </div>
            </div>

            {/* FLOATING BOTTOM HUD */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-around text-[10px] sm:text-[11px] font-mono text-slate-400 bg-slate-950/80 border border-slate-800 backdrop-blur-md py-1.5 px-3 rounded-2xl pointer-events-none z-20">
                <div>ORB: <span className="text-emerald-400 font-bold">THREE.JS 3D GLSL</span></div>
                <div>STATE: <span className="text-white font-bold">{isProfitable ? 'HARMONIC' : 'RECOVERY'}</span></div>
                <div>SYNC: <span className="text-cyan-400 font-bold">READY</span></div>
            </div>

            {/* 3. FULL SCREEN WIDE OVERLAY MODAL (PORTAL TO DOCUMENT.BODY) */}
            {isExplorerOpen && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
                    
                    {/* Modal Container Card */}
                    <div className="relative w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col overflow-hidden font-sans">
                        
                        {/* Header del Modale */}
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-2xl shadow-lg text-slate-950 font-bold">
                                    <Globe className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                                            QUASAR BUBBLE - SENTIMENT GALAXY EXPLORER
                                        </h3>
                                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono uppercase hidden sm:inline-block">
                                            LIVE ENGINE
                                        </span>
                                    </div>
                                    <p className="text-xs text-cyan-400 font-mono tracking-wider uppercase font-semibold">
                                        Market Intelligence & Behavioral Sentiment Feed
                                    </p>
                                </div>
                            </div>

                            {/* Close Button */}
                            <button
                                type="button"
                                onClick={() => setIsExplorerOpen(false)}
                                className="p-2.5 text-slate-400 hover:text-white rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition cursor-pointer active:scale-95 shadow-md flex items-center gap-1.5"
                                title="Chiudi Esploratore"
                            >
                                <span className="text-xs font-mono font-bold hidden sm:inline">Chiudi</span>
                                <X className="w-5 h-5 text-slate-300" />
                            </button>
                        </div>

                        {/* Corpo del Modale (Scrollabile in verticale) */}
                        <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-4 py-4 scrollbar-thin">
                            
                            {/* 1. Card Global Sentiment (dati dal Serverless API /api/quasar-sentiment) */}
                            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 relative overflow-hidden shadow-xl">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
                                        <Activity className="w-4 h-4 text-emerald-400" />
                                        <span>Stato Globale del Sentiment:</span>
                                    </div>

                                    {isLoadingSentiment ? (
                                        <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-mono bg-slate-900 text-slate-400 border border-slate-800 animate-pulse flex items-center gap-1.5">
                                            <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                                            Analisi Server Quasar AI...
                                        </span>
                                    ) : (
                                        <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-black font-mono border ${serverSentiment?.isProfitable ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-rose-950 text-rose-300 border-rose-700'}`}>
                                            {serverSentiment?.label || '• 85% Bullish & Disciplinato'}
                                        </span>
                                    )}
                                </div>

                                {isLoadingSentiment ? (
                                    <div className="py-3 space-y-2 animate-pulse">
                                        <div className="h-4 bg-slate-900 rounded w-3/4"></div>
                                        <div className="h-3 bg-slate-900 rounded w-1/2"></div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-1">
                                            <h4 className="text-base font-extrabold text-white">
                                                {serverSentiment?.headline}
                                            </h4>
                                            <p className="text-xs text-slate-300 leading-relaxed font-mono">
                                                {serverSentiment?.summary}
                                            </p>
                                        </div>

                                        {/* Box "Consiglio Strategico AI" */}
                                        <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center gap-3 text-xs">
                                            <Bot className="w-4 h-4 text-cyan-400 shrink-0" />
                                            <div className="text-slate-200">
                                                <strong className="text-cyan-300 font-mono">Consiglio Strategico AI: </strong>
                                                {serverSentiment?.aiAdvice}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* 2. Sezione "LIVE FEED & MARKET NEWS" */}
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Radio className={`w-4 h-4 text-emerald-400 ${isRefreshing ? 'animate-spin' : 'animate-pulse'}`} />
                                        <h4 className="text-sm font-extrabold text-white font-mono uppercase">
                                            Live Feed & Market News (50+ Notizie Processate da Quasar AI)
                                        </h4>
                                    </div>

                                    <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800">
                                        <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                                        <span>AUTO-REFRESH: {secondsToRefresh}s</span>
                                    </div>
                                </div>

                                {/* Barra filtri rapida & Barra di ricerca */}
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                                    {/* Search Input Bar */}
                                    <div className="relative w-full sm:w-64">
                                        <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Cerca notizie o fonti..."
                                            className="bg-slate-900 border border-slate-700 text-white text-xs rounded-xl p-2 pl-9 w-full outline-none focus:border-cyan-500 font-mono"
                                        />
                                    </div>

                                    {/* Quick Filter Bar: [ ALL ] [ FED ] [ CRYPTO ] [ MACRO ] [ ETF ] [ SENTIMENT ] */}
                                    <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 font-mono text-[11px]">
                                        {(['ALL', 'FED', 'CRYPTO', 'MACRO', 'ETF', 'SENTIMENT'] as const).map(cat => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setNewsCategory(cat)}
                                                className={`px-3 py-1 rounded-xl transition border shrink-0 font-bold cursor-pointer ${
                                                    newsCategory === cat
                                                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                                                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                                                }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Lista ordinata di news con ampi margini */}
                                <div className="space-y-3">
                                    {filteredNews.length === 0 ? (
                                        <div className="p-8 text-center text-xs text-slate-500 font-mono bg-slate-950 rounded-2xl border border-slate-800">
                                            Nessuna notizia trovata per i criteri selezionati.
                                        </div>
                                    ) : (
                                        filteredNews.map((news) => {
                                            const isSelected = news.id === selectedNewsId;

                                            return (
                                                <div
                                                    key={news.id}
                                                    onClick={() => setSelectedNewsId(news.id)}
                                                    className={`p-4 rounded-2xl border transition cursor-pointer space-y-2.5 ${
                                                        isSelected 
                                                            ? 'bg-slate-950 border-cyan-500 shadow-xl shadow-cyan-950/40' 
                                                            : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-950 hover:border-slate-700'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-2">
                                                            {/* Tag Sentiment Colorato */}
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black font-mono border ${news.tagColor}`}>
                                                                {news.sentiment}
                                                            </span>
                                                            <span className="font-extrabold font-mono text-slate-200 uppercase">{news.source}</span>
                                                            <span className="px-2 py-0.5 rounded text-[9px] font-mono text-slate-400 bg-slate-900 border border-slate-800">
                                                                {news.sourceType}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                                            <Clock className="w-3 h-3 text-slate-500" />
                                                            {news.timeAgo}
                                                        </span>
                                                    </div>

                                                    {/* Titolo Leggibile per Intero con Link alla Fonte */}
                                                    <a 
                                                        href={news.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-xs sm:text-sm font-extrabold text-slate-100 leading-snug hover:text-cyan-400 transition flex items-start justify-between gap-2"
                                                    >
                                                        <span>{news.title}</span>
                                                        <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                                                    </a>

                                                    {/* Box del Commento Predittivo Quasar */}
                                                    {isSelected && (
                                                        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5 text-xs font-sans mt-2 animate-in fade-in">
                                                            <div className="flex items-center gap-1.5 text-cyan-400 font-bold font-mono text-xs">
                                                                <Bot className="w-4 h-4 text-cyan-400" />
                                                                Commento Algoritmo Predittivo Quasar:
                                                            </div>
                                                            <p className="text-slate-300 text-xs leading-relaxed font-sans">
                                                                {news.aiPrediction}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* Footer del Modale */}
                        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-slate-400 shrink-0">
                            <div>
                                <span className="text-emerald-400 font-bold">FONTI ATTIVE: {activeSourcesCount} MULTI-STREAM</span> • {filteredNews.length} Notizie Live
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsExplorerOpen(false)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition cursor-pointer self-end sm:self-auto"
                            >
                                Chiudi Esploratore
                            </button>
                        </div>

                    </div>
                </div>,
                document.body
            )}

        </div>
    );
};
