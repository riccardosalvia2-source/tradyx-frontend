// ============================================================================
// TRADYX MOBILE TAB 7: BOLLA (Quasar Bubble - Sentiment Galaxy Explorer)
// Ultra-Clean Dark Fintech / Institutional Terminal Design
// Background: #08090C solid, zero magenta canvas, pure jade organic bubble
// Integrates: 4-4-4-4 Box Breathing, Cortisol Clearing Window, News Impact Cards
// ============================================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
    ShieldAlert,
    HeartPulse,
    Wind,
    Play,
    Square,
    CheckCircle2
} from 'lucide-react';
import { useTradeStore, DEFAULT_MOCK_TRADES } from '../../store/useTradeStore';
import { isTiltDetected, triggerHaptic } from '../../services/circuitBreakerService';
import { getCortisolClearingStatus } from '../../services/neuroPsychService';
import { NewsMarketImpactCard } from '../NewsMarketImpactCard';
import { GlobalMarketWatchHub } from '../GlobalMarketWatchHub';
import { BarChart2 } from 'lucide-react';

type BreathPhase = 'INHALE' | 'HOLD_FULL' | 'EXHALE' | 'HOLD_EMPTY';

interface TabBubbleProps {
    initialSubView?: 'NEWS' | 'MARKETS';
    initialViewMode?: 'BUBBLE' | 'EXPLORER';
    onNavigateToTrade?: (symbol: string) => void;
}

export const TabBubble: React.FC<TabBubbleProps> = ({
    initialSubView = 'NEWS',
    initialViewMode = 'BUBBLE',
    onNavigateToTrade
}) => {
    const { trades } = useTradeStore();
    const safeTrades = Array.isArray(trades) && trades.length > 0 ? trades : DEFAULT_MOCK_TRADES;
    const tiltCheck = isTiltDetected(safeTrades);
    const isTilt = tiltCheck.isTilt;

    // Cortisol Clearing Window
    const cortisolStatus = useMemo(() => getCortisolClearingStatus(safeTrades), [safeTrades]);

    // 2-View State Flow: 'BUBBLE' (Initial Zen View) or 'EXPLORER' (Sentiment & News Feed)
    const [viewMode, setViewMode] = useState<'BUBBLE' | 'EXPLORER'>(initialViewMode);
    const [activeSubTab, setActiveSubTab] = useState<'NEWS' | 'MARKETS'>(initialSubView);

    useEffect(() => {
        if (initialSubView) setActiveSubTab(initialSubView);
    }, [initialSubView]);

    useEffect(() => {
        if (initialViewMode) setViewMode(initialViewMode);
    }, [initialViewMode]);

    // Box Breathing 4-4-4-4 state
    const [isBreathingMode, setIsBreathingMode] = useState<boolean>(false);
    const [breathPhase, setBreathPhase] = useState<BreathPhase>('INHALE');
    const [breathSeconds, setBreathSeconds] = useState<number>(4);
    const [breathCycles, setBreathCycles] = useState<number>(0);

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

    // ============================================================================
    // 2. BOX BREATHING 4-4-4-4 (RESET DEL SISTEMA AUTONOMO)
    // Precise 4s Inhale, 4s Hold Full, 4s Exhale, 4s Hold Empty
    // With dynamic 4s countdown and light haptic feedback at every phase transition
    // ============================================================================
    useEffect(() => {
        if (!isBreathingMode) return;

        const interval = setInterval(() => {
            setBreathSeconds(prev => {
                if (prev <= 1) {
                    // Haptic feedback at every phase transition
                    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                        try {
                            navigator.vibrate([30]);
                        } catch {
                            // ignore if unsupported
                        }
                    }

                    // Advance to next 4s phase
                    setBreathPhase(curr => {
                        if (curr === 'INHALE') return 'HOLD_FULL';
                        if (curr === 'HOLD_FULL') return 'EXHALE';
                        if (curr === 'EXHALE') return 'HOLD_EMPTY';
                        // Completed full 4-4-4-4 cycle
                        setBreathCycles(c => c + 1);
                        return 'INHALE';
                    });
                    return 4;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isBreathingMode]);

    const formatCountdown = (totalSec: number) => {
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    };

    const handleBubbleClick = () => {
        if (isBreathingMode) return; // In breathing mode, tap interacts with breathing
        setViewMode('EXPLORER');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBackToBubble = () => {
        setViewMode('BUBBLE');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleBreathingMode = () => {
        triggerHaptic('click');
        if (isBreathingMode) {
            setIsBreathingMode(false);
            setBreathPhase('INHALE');
            setBreathSeconds(4);
        } else {
            setIsBreathingMode(true);
            setBreathPhase('INHALE');
            setBreathSeconds(4);
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                try { navigator.vibrate([30]); } catch (e) { /* ignore */ }
            }
        }
    };

    const filteredNews = liveNews.filter(n => {
        const matchesCat = newsCategory === 'ALL' || n.sourceType === newsCategory;
        const matchesQuery = !searchQuery.trim() || 
            n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.source.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesQuery;
    });

    // Bubble dynamic styles based on Box Breathing phase
    const getBreathingBubbleStyle = () => {
        if (!isBreathingMode) {
            return {
                width: '250px',
                height: '250px',
                transform: 'scale(1)',
                transition: 'all 0.5s ease-out'
            };
        }

        if (breathPhase === 'INHALE') {
            return {
                width: '285px',
                height: '285px',
                transform: 'scale(1.14)',
                boxShadow: '0 0 70px rgba(16, 185, 129, 0.75)',
                transition: 'all 3.8s ease-in-out'
            };
        }
        if (breathPhase === 'HOLD_FULL') {
            return {
                width: '285px',
                height: '285px',
                transform: 'scale(1.14)',
                boxShadow: '0 0 80px rgba(16, 185, 129, 0.90)',
                transition: 'all 0.4s ease-out'
            };
        }
        if (breathPhase === 'EXHALE') {
            return {
                width: '225px',
                height: '225px',
                transform: 'scale(0.92)',
                boxShadow: '0 0 35px rgba(16, 185, 129, 0.40)',
                transition: 'all 3.8s ease-in-out'
            };
        }
        // HOLD_EMPTY
        return {
            width: '225px',
            height: '225px',
            transform: 'scale(0.92)',
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.25)',
            transition: 'all 0.4s ease-out'
        };
    };

    return (
        <div className="w-full flex-1 min-h-[calc(100dvh-5.5rem)] bg-[#08090C] text-slate-100 flex flex-col justify-center items-center select-none overflow-x-hidden relative">
            
            {/* ============================================================================ */}
            {/* VISTA 1: INITIAL CLEAN VIEW (ESCLUSIVAMENTE LA BOLLA AL CENTRO)               */}
            {/* ============================================================================ */}
            {viewMode === 'BUBBLE' && (
                <div className="w-full flex-1 flex flex-col items-center justify-between px-4 py-6 relative min-h-[500px]">
                    
                    {/* Top Status Bar: Brand Indicator & Cortisol Window if Active */}
                    <div className="w-full flex items-center justify-between z-20">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[#111318] border border-white/5 flex items-center justify-center">
                                <span className="font-sans font-black text-xs text-[#2ECC71]">T</span>
                            </div>
                            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-bold">
                                QUASAR BUBBLE
                            </span>
                        </div>

                        {/* Cortisol Clearing Window Pill if Active */}
                        {cortisolStatus.isClearingActive ? (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-[10px] font-mono font-bold text-rose-300 animate-pulse">
                                <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                                <span>Cortisol Window: ~{cortisolStatus.remainingMinutes} min</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-subcard text-[10px] font-mono text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                <span>PFC EQUILIBRIUM</span>
                            </div>
                        )}
                    </div>

                    {/* CORTISOL CLEARING WINDOW ADVISORY BANNER (SE IN DRAWDOWN) */}
                    {cortisolStatus.isClearingActive && !isBreathingMode && (
                        <div className="w-full max-w-sm mt-3 p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 space-y-1.5 text-left font-mono animate-in fade-in">
                            <div className="flex items-center justify-between text-[11px] font-black text-rose-300">
                                <div className="flex items-center gap-1.5">
                                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                                    <span>CORTISOL CLEARING WINDOW: ~25 MIN</span>
                                </div>
                                <span className="text-[10px] text-rose-400 font-bold">{cortisolStatus.percentCleared}% CLEAR</span>
                            </div>
                            <p className="text-[10px] text-rose-200 leading-relaxed font-sans">
                                Il picco ormonale acuto altera temporaneamente la corteccia prefrontale. Decisioni oggettive compromesse prima del decadimento plasmatico di 25 min.
                            </p>
                            <button
                                type="button"
                                onClick={toggleBreathingMode}
                                className="w-full py-1.5 px-3 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-[10px] font-black text-white uppercase flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                            >
                                <Wind className="w-3 h-3 text-white" />
                                <span>Avvia Box Breathing 4-4-4-4 per de-escalation</span>
                            </button>
                        </div>
                    )}

                    {/* Central Organic Fluid Bubble Orb (3D & Interactive Box Breathing) */}
                    <div className="relative flex flex-col items-center justify-center my-auto py-4">
                        
                        {/* Soft Ambient Glow (Jade Emerald #10B981 vs Pulsing Red Alarm) */}
                        <div 
                            className="absolute rounded-full pointer-events-none transition-all duration-700"
                            style={{
                                width: isBreathingMode ? '340px' : '280px',
                                height: isBreathingMode ? '340px' : '280px',
                                background: isTilt && !isBreathingMode
                                    ? 'radial-gradient(circle at center, rgba(239, 68, 68, 0.45) 0%, rgba(220, 38, 38, 0.20) 55%, transparent 75%)'
                                    : 'radial-gradient(circle at center, rgba(16, 185, 129, 0.45) 0%, rgba(5, 150, 105, 0.20) 55%, transparent 75%)',
                                filter: 'blur(45px)',
                                opacity: isBreathingMode ? 0.95 : 0.75
                            }}
                        />

                        {/* 3D Organic Fluid Sphere: JADE vs RED ALARM with Box Breathing kinetics */}
                        <div 
                            onClick={handleBubbleClick}
                            className={`flex flex-col items-center justify-center relative overflow-hidden cursor-pointer select-none border ${
                                isBreathingMode
                                    ? 'bg-gradient-to-br from-[#10B981] via-[#059669] to-[#047857] border-emerald-300/60 shadow-2xl rounded-full'
                                    : isTilt
                                    ? 'bg-gradient-to-br from-[#EF4444] via-[#DC2626] to-[#991B1B] animate-pulse border-rose-300/40 shadow-rose-600/50 rounded-full'
                                    : 'quasar-3d-bubble border-white/25 rounded-full hover:scale-105 active:scale-95'
                            }`}
                            style={getBreathingBubbleStyle()}
                            title={isBreathingMode ? "Respirazione Box Breathing in corso" : "Tocca per accedere al Sentiment Galaxy Explorer"}
                        >
                            {/* Organic Soft Specular Highlight */}
                            <div className="absolute top-5 left-9 w-24 h-12 rounded-full bg-white/25 blur-md pointer-events-none transform -rotate-12" />

                            {/* Center Visuals: Breathing HUD vs Quasar Icon */}
                            {isBreathingMode ? (
                                <div className="flex flex-col items-center justify-center text-center space-y-1 animate-in zoom-in-95 duration-200">
                                    <span className="text-3xl sm:text-4xl font-mono font-black text-white tabular-nums drop-shadow-md">
                                        0{breathSeconds}s
                                    </span>
                                    <div className="px-3 py-1 rounded-full bg-black/40 border border-white/30 text-[9px] font-mono font-black uppercase tracking-widest text-white shadow-lg">
                                        {breathPhase === 'INHALE' && '4s INHALE'}
                                        {breathPhase === 'HOLD_FULL' && '4s TRATTIENI (PIENO)'}
                                        {breathPhase === 'EXHALE' && '4s EXHALE'}
                                        {breathPhase === 'HOLD_EMPTY' && '4s TRATTIENI (VUOTO)'}
                                    </div>
                                    <span className="text-[9px] font-mono text-emerald-200 font-bold opacity-80">
                                        CICLO {breathCycles + 1}
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <div className={`p-4 rounded-2xl mb-3 shadow-2xl group-hover:rotate-6 transition-transform duration-300 border ${
                                        isTilt ? 'bg-rose-950/40 border-rose-400/30' : 'bg-black/30 backdrop-blur-md border-white/20'
                                    }`}>
                                        <BrainCircuit className="w-9 h-9 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
                                    </div>

                                    <div className="px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-lg border border-white/40 text-[10px] sm:text-[11px] font-mono font-black text-white uppercase tracking-widest shadow-2xl flex items-center gap-2">
                                        <Sparkles className="w-3.5 h-3.5 text-[#2ECC71] animate-pulse" />
                                        <span>{isTilt ? 'CIRCUIT BREAKER' : 'TAP TO SYNC'}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Phase Description Caption under bubble */}
                        {isBreathingMode && (
                            <div className="mt-4 px-4 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-center font-mono text-xs text-slate-200 shadow-md">
                                {breathPhase === 'INHALE' && 'Inhala con luce smeraldo (#10B981) • Espansione graduale'}
                                {breathPhase === 'HOLD_FULL' && 'Trattieni a polmoni pieni • Glow stabile'}
                                {breathPhase === 'EXHALE' && 'Esala dolcemente tornando al raggio base'}
                                {breathPhase === 'HOLD_EMPTY' && 'Trattieni a polmoni vuoti • Reset del sistema autonomo'}
                            </div>
                        )}
                    </div>

                    {/* Bottom Actions Bar: Box Breathing Mode & Sentiment Explorer */}
                    <div className="w-full max-w-sm space-y-2 z-20">
                        {isBreathingMode ? (
                            <button
                                type="button"
                                onClick={toggleBreathingMode}
                                className="w-full min-h-[46px] rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-white/10 shadow-lg"
                            >
                                <Square className="w-4 h-4 text-rose-400 fill-rose-400" />
                                <span>Ferma Box Breathing ({breathCycles} cicli eseguiti)</span>
                            </button>
                        ) : (
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={toggleBreathingMode}
                                        className="min-h-[46px] rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-mono text-xs font-black uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-500/40 shadow-lg shadow-emerald-950/40"
                                    >
                                        <Wind className="w-4 h-4 text-emerald-400" />
                                        <span>Box 4-4-4-4</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveSubTab('MARKETS');
                                            setViewMode('EXPLORER');
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className="min-h-[46px] rounded-xl bg-[#10B981] hover:bg-[#059669] text-slate-950 font-mono text-xs font-black uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#10B981]/25"
                                    >
                                        <BarChart2 className="w-4 h-4 text-slate-950" />
                                        <span>Live Markets</span>
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveSubTab('NEWS');
                                        setViewMode('EXPLORER');
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="w-full min-h-[38px] rounded-xl bg-[#121620]/80 hover:bg-[#161B28] text-slate-300 hover:text-white font-mono text-[11px] font-bold uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-white/[0.08]"
                                >
                                    <Globe className="w-3.5 h-3.5 text-[#10B981]" />
                                    <span>Market News & Sentiment Feed</span>
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            )}

            {/* ============================================================================ */}
            {/* VISTA 2: SENTIMENT GALAXY EXPLORER & LIVE MARKETS MONITOR                   */}
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
                                {activeSubTab === 'NEWS' ? `${liveNews.length} NOTIZIE LIVE` : 'LIVE MARKET WATCH'}
                            </span>
                            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                        </div>
                    </div>

                    {/* Section Header */}
                    <div className="flex items-center gap-2.5 px-1">
                        <div className="w-9 h-9 rounded-xl glass-panel flex items-center justify-center shadow-lg shrink-0">
                            {activeSubTab === 'NEWS' ? (
                                <Globe className="w-5 h-5 text-[#2ECC71]" />
                            ) : (
                                <BarChart2 className="w-5 h-5 text-[#10B981]" />
                            )}
                        </div>
                        <div>
                            <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase font-semibold block">
                                {activeSubTab === 'NEWS' ? 'MARKET INTELLIGENCE FEED' : 'REAL-TIME ASSET TERMINAL'}
                            </span>
                            <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight font-mono">
                                QUASAR BUBBLE - {activeSubTab === 'NEWS' ? 'SENTIMENT GALAXY EXPLORER' : 'GLOBAL MARKET WATCH'}
                            </h1>
                        </div>
                    </div>

                    {/* IOS SEGMENTED CONTROL: [ 📰 MARKET NEWS ] | [ 📊 LIVE MARKETS ] */}
                    <div className="w-full flex justify-center py-0.5">
                        <div className="flex items-center p-1 bg-[#121620]/90 backdrop-blur-xl rounded-2xl border border-white/[0.08] shadow-inner w-full max-w-sm">
                            <button
                                type="button"
                                onClick={() => {
                                    triggerHaptic('click');
                                    setActiveSubTab('NEWS');
                                }}
                                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                    activeSubTab === 'NEWS'
                                        ? 'bg-[#10B981] text-slate-950 shadow-lg shadow-[#10B981]/25 font-black'
                                        : 'text-[#9CA3AF] hover:text-white'
                                }`}
                            >
                                <span className="text-xs">📰</span>
                                <span className="tracking-tight uppercase">MARKET NEWS</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    triggerHaptic('click');
                                    setActiveSubTab('MARKETS');
                                }}
                                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                    activeSubTab === 'MARKETS'
                                        ? 'bg-[#10B981] text-slate-950 shadow-lg shadow-[#10B981]/25 font-black'
                                        : 'text-[#9CA3AF] hover:text-white'
                                }`}
                            >
                                <span className="text-xs">📊</span>
                                <span className="tracking-tight uppercase">LIVE MARKETS</span>
                            </button>
                        </div>
                    </div>

                    {/* SUB-VIEW 1: LIVE MARKETS MONITORING HUB */}
                    {activeSubTab === 'MARKETS' && (
                        <GlobalMarketWatchHub onNavigateToTrade={onNavigateToTrade} />
                    )}

                    {/* SUB-VIEW 2: MARKET NEWS & SENTIMENT FEED */}
                    {activeSubTab === 'NEWS' && (
                        <>
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
                    {/* AGGREGATORE NEWS (MINIMO 50 NOTIZIE & DIDASCALIE OPERATIVE MARKET INTELLIGENCE)*/}
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

                        {/* 50+ News Items List with Market Impact Container */}
                        <div className="space-y-3.5">
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
                                        <div
                                            key={news.id}
                                            className="p-4 rounded-2xl glass-panel hover:border-white/20 transition-all space-y-2.5 group text-left"
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
                                                    <a 
                                                        href={news.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="hover:text-[#10B981] transition ml-1"
                                                        title="Apri articolo originale"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                </div>
                                            </div>

                                            {/* Prominent Title: Click opens actual article link */}
                                            <a 
                                                href={news.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block text-xs sm:text-sm font-bold text-slate-100 hover:text-[#10B981] transition leading-snug"
                                            >
                                                {news.title}
                                            </a>

                                            {/* Article Summary */}
                                            <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                                                {news.summary}
                                            </p>

                                            {/* 4. NEWS MARKET IMPACT & ASSET INTELLIGENCE (DIDASCALIE OPERATIVE) */}
                                            <NewsMarketImpactCard 
                                                title={news.title}
                                                summary={news.summary}
                                                sourceType={news.sourceType}
                                                sentimentHint={news.sentiment}
                                            />
                                        </div>
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
                    </>
                    )}

                </div>
            )}

        </div>
    );
};

export default TabBubble;
