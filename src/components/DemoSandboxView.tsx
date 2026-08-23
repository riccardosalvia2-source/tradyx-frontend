// ============================================================================
// TRADYX FULL INTERACTIVE DEMO SANDBOX VIEW (src/components/DemoSandboxView.tsx)
// Author: Senior React & WebGL Frontend Engineer
// Description: Full-screen interactive demo sandbox environment allowing users to test
//              the Quasar 3D Emotional Bubble, interactive AI Coach, simulated trading journal,
//              and real-time reacting analytics widgets.
// ============================================================================

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useTradeStore, DEFAULT_MOCK_TRADES } from '../store/useTradeStore';
import { QuasarBubble } from './QuasarBubble';
import { TradeForm } from './TradeForm';
import { TradeList } from './TradeList';
import { CostOfEmotionWidget } from './CostOfEmotionWidget';
import { ExpectancyMatrixWidget } from './ExpectancyMatrixWidget';
import { HeatmapCalendarWidget } from './HeatmapCalendarWidget';
import { BubbleConfig } from '../types/bubble';
import { UserAccount } from '../types/auth';
import { 
    BrainCircuit, 
    Sparkles, 
    ArrowLeft, 
    ExternalLink, 
    Flame, 
    AlertTriangle, 
    ShieldCheck, 
    Coins, 
    Bot, 
    BarChart3, 
    PlusCircle,
    LogOut,
    LogIn
} from 'lucide-react';

const BacktestStudio = lazy(() => import('./BacktestEngine').then(m => ({ default: m.BacktestStudio })));
const AICoachDrawer = lazy(() => import('./AICoachDrawer').then(m => ({ default: m.AICoachDrawer })));

interface DemoSandboxViewProps {
    onBackToSite: () => void;
    authUser?: UserAccount | null;
    onOpenAuthModal?: () => void;
    onLogout?: () => void;
}

export const DemoSandboxView: React.FC<DemoSandboxViewProps> = ({ 
    onBackToSite,
    authUser,
    onOpenAuthModal,
    onLogout
}) => {
    const { trades, fetchTrades, bubbleConfig, recalculateBubbleConfig } = useTradeStore();
    const safeTrades = Array.isArray(trades) && trades.length > 0 ? trades : DEFAULT_MOCK_TRADES;

    // Emotional state selector preset
    const [overrideEmotion, setOverrideEmotion] = useState<'FOMO' | 'GREED' | 'DISCIPLINED' | 'REVENGE' | null>(null);
    const [isAICoachOpen, setIsAICoachOpen] = useState<boolean>(false);

    useEffect(() => {
        if (authUser?.id) {
            fetchTrades(authUser.id);
        } else {
            recalculateBubbleConfig();
        }
    }, [authUser?.id]);

    // Emotional preset configurations for 3D Quasar Bubble
    const emotionPresets: Record<'FOMO' | 'GREED' | 'DISCIPLINED' | 'REVENGE', {
        config: BubbleConfig;
        title: string;
        description: string;
        advice: string;
        tagClass: string;
        activeBorder: string;
    }> = {
        FOMO: {
            config: {
                primaryColor: '#FF0055',
                secondaryColor: '#FF5500',
                speed: 2.8,
                turbulence: 0.9,
                pulseRate: 2.5,
                glowIntensity: 2.0
            },
            title: '🔥 Bias FOMO Rilevato (Fear Of Missing Out)',
            description: 'Inseguimento vertiginoso del prezzo in estensione senza attendere il retest.',
            advice: '⚠️ Il sistema rileva un impulso ansiogeno. Allontanati dalla leva ed attendi una struttura di accumulo confermata sul timeframe 4H.',
            tagClass: 'bg-rose-950 text-rose-300 border-rose-800',
            activeBorder: 'border-rose-500 bg-rose-950/60 text-white shadow-rose-950/50'
        },
        GREED: {
            config: {
                primaryColor: '#00FF88',
                secondaryColor: '#FFD700',
                speed: 1.5,
                turbulence: 0.45,
                pulseRate: 1.6,
                glowIntensity: 1.7
            },
            title: '🤑 Avidità & Spinta Euforica (Greed)',
            description: 'Mancata presa di profitto al target sperando in un continuo rally infinito.',
            advice: '✨ Rispetta il Take Profit stabilito nel trading plan. L’euforia è la prima causa di giveaway di profitto.',
            tagClass: 'bg-emerald-950 text-emerald-300 border-emerald-800',
            activeBorder: 'border-emerald-500 bg-emerald-950/60 text-white shadow-emerald-950/50'
        },
        DISCIPLINED: {
            config: {
                primaryColor: '#00F0FF',
                secondaryColor: '#0047FF',
                speed: 0.6,
                turbulence: 0.15,
                pulseRate: 0.8,
                glowIntensity: 1.3
            },
            title: '✅ Esecuzione Disciplinata & Stato Mentale Calmo',
            description: 'Setup eseguito secondo le linee guida del risk management plan.',
            advice: '✨ Ottimo controllo emotivo. Mantieni la frequenza respiratoria regolare ed evita di sovraesporti.',
            tagClass: 'bg-cyan-950 text-cyan-300 border-cyan-800',
            activeBorder: 'border-cyan-500 bg-cyan-950/60 text-white shadow-cyan-950/50'
        },
        REVENGE: {
            config: {
                primaryColor: '#9333EA',
                secondaryColor: '#FF0077',
                speed: 2.0,
                turbulence: 0.7,
                pulseRate: 1.8,
                glowIntensity: 1.6
            },
            title: '⚡ Revenge Trading Rilevato (Rabbia & Over-leveraging)',
            description: 'Operazione d’impulso aperta immediatamente dopo un trade in perdita.',
            advice: '⛔ STOP OPERATIVO: Livello di cortisolo elevato. Pausa tassativa di 20 minuti prima di analizzare nuovamente i grafici.',
            tagClass: 'bg-purple-950 text-purple-300 border-purple-800',
            activeBorder: 'border-purple-500 bg-purple-950/60 text-white shadow-purple-950/50'
        }
    };

    // Active Bubble Config (Calculated or Overridden)
    const activeConfig = overrideEmotion ? emotionPresets[overrideEmotion].config : bubbleConfig;

    return (
        <div className="min-h-screen bg-transparent text-white selection:bg-cyan-500 selection:text-slate-950 pb-24 overflow-x-hidden font-sans relative">
            
            {/* TOP BAR DEMO SANDBOX HEADER */}
            <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-50 shadow-2xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 py-3 flex items-center justify-between gap-3">
                    
                    {/* Left: Return to Marketing Site */}
                    <button
                        type="button"
                        onClick={onBackToSite}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-extrabold text-slate-200 hover:text-cyan-400 transition active:scale-95 shadow-md"
                    >
                        <ArrowLeft className="w-4 h-4 text-cyan-400" />
                        <span>← Torna al Sito</span>
                    </button>

                    {/* Center: Glowing Sandbox or Active Account Badge */}
                    {authUser ? (
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 border border-emerald-500/50 rounded-full text-xs font-mono font-black text-emerald-300 shadow-xl shadow-emerald-500/10 tracking-wide">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            <span>🟢 Account Attivo: {authUser.full_name || authUser.email}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-cyan-950/90 via-slate-900 to-purple-950/90 border border-cyan-500/50 rounded-full text-xs font-mono font-black text-cyan-300 shadow-xl shadow-cyan-500/10 tracking-wide">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                            <span className="bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent">
                                🎮 Modalità Demo Sandbox
                            </span>
                        </div>
                    )}

                    {/* Right: Auth Modal Trigger / Logout Button */}
                    {authUser ? (
                        <button
                            type="button"
                            onClick={onLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-rose-950/80 border border-slate-800 text-slate-300 hover:text-rose-300 font-extrabold text-xs rounded-xl transition cursor-pointer active:scale-95 shadow-md"
                        >
                            <LogOut className="w-4 h-4 text-rose-400" />
                            <span>Disconnetti</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onOpenAuthModal}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl transition shadow-xl shadow-cyan-500/20 active:scale-95 cursor-pointer"
                        >
                            <Sparkles className="w-4 h-4 text-slate-950" />
                            <span>Accedi / Registrati</span>
                        </button>
                    )}

                </div>
            </header>

            {/* DEMO MAIN CONTAINER */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-10">
                
                {/* INTRO BANNER */}
                <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 rounded-3xl space-y-3 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[90px] rounded-full pointer-events-none"></div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                        <div className="space-y-1 max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950 border border-cyan-800 rounded-full text-cyan-300 text-[11px] font-mono font-bold uppercase">
                                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                                Interactive Demo Sandbox Experience
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                Prova TRADYX Live in Tempo Reale
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-300">
                                Seleziona uno stato emotivo per testare il comportamento del Quasar 3D, interagisci con l'AI Coach e aggiungi trade simulati per osservare i grafici avanzati aggiornarsi all'istante.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsAICoachOpen(true)}
                            className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-purple-600/30 transition active:scale-95 flex items-center gap-2.5 shrink-0"
                        >
                            <BrainCircuit className="w-4 h-4 text-cyan-300 animate-pulse" />
                            <span>Apri AI Coach Chat</span>
                        </button>
                    </div>
                </div>

                {/* 1. EMOTIONAL STATE SELECTOR BAR & QUASAR BUBBLE 3D */}
                <section className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div>
                            <h3 className="text-lg font-black text-white flex items-center gap-2">
                                <BrainCircuit className="w-5 h-5 text-cyan-400" />
                                Quasar 3D Emotional Bubble & State Selector
                            </h3>
                            <p className="text-xs text-slate-400 font-mono">
                                Clicca su uno stato emotivo di test per trasformare la matrice WebGL e sbloccare l'analisi psicologica
                            </p>
                        </div>

                        {overrideEmotion && (
                            <button
                                type="button"
                                onClick={() => setOverrideEmotion(null)}
                                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-cyan-300 border border-slate-700 rounded-lg transition"
                            >
                                🔄 Ripristina Calcolo Dinamico Trades
                            </button>
                        )}
                    </div>

                    {/* 4 EMOTION PRESETS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        
                        <button
                            type="button"
                            onClick={() => setOverrideEmotion('FOMO')}
                            className={`p-4 rounded-2xl border text-left transition space-y-1.5 relative overflow-hidden ${
                                overrideEmotion === 'FOMO' 
                                    ? emotionPresets.FOMO.activeBorder 
                                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-rose-500/50 hover:bg-slate-900'
                            }`}
                        >
                            <div className="flex items-center gap-2 font-black text-sm text-rose-400">
                                <Flame className="w-4 h-4" />
                                FOMO Trading
                            </div>
                            <div className="text-[11px] text-slate-400">Inseguimento dei prezzi</div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setOverrideEmotion('GREED')}
                            className={`p-4 rounded-2xl border text-left transition space-y-1.5 relative overflow-hidden ${
                                overrideEmotion === 'GREED' 
                                    ? emotionPresets.GREED.activeBorder 
                                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-amber-500/50 hover:bg-slate-900'
                            }`}
                        >
                            <div className="flex items-center gap-2 font-black text-sm text-amber-400">
                                <Coins className="w-4 h-4" />
                                Greed (Avidità)
                            </div>
                            <div className="text-[11px] text-slate-400">Target ignorati per euforia</div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setOverrideEmotion('DISCIPLINED')}
                            className={`p-4 rounded-2xl border text-left transition space-y-1.5 relative overflow-hidden ${
                                overrideEmotion === 'DISCIPLINED' 
                                    ? emotionPresets.DISCIPLINED.activeBorder 
                                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-emerald-500/50 hover:bg-slate-900'
                            }`}
                        >
                            <div className="flex items-center gap-2 font-black text-sm text-emerald-400">
                                <ShieldCheck className="w-4 h-4" />
                                Trading Disciplinato
                            </div>
                            <div className="text-[11px] text-slate-400">Rispetto del Plan & Risk Management</div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setOverrideEmotion('REVENGE')}
                            className={`p-4 rounded-2xl border text-left transition space-y-1.5 relative overflow-hidden ${
                                overrideEmotion === 'REVENGE' 
                                    ? emotionPresets.REVENGE.activeBorder 
                                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-purple-500/50 hover:bg-slate-900'
                            }`}
                        >
                            <div className="flex items-center gap-2 font-black text-sm text-purple-400">
                                <AlertTriangle className="w-4 h-4" />
                                Revenge Trading
                            </div>
                            <div className="text-[11px] text-slate-400">Recupero impulsivo delle perdite</div>
                        </button>

                    </div>

                    {/* 3D CANVAS & AI COACH ADVICE PANEL */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl items-center">
                        <div className="lg:col-span-6 w-full max-w-[420px] mx-auto min-h-[380px] flex items-center justify-center relative p-4 overflow-hidden">
                            <QuasarBubble config={activeConfig} />
                        </div>

                        <div className="lg:col-span-6 space-y-4">
                            {overrideEmotion ? (
                                <div className="space-y-3">
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase font-mono border ${emotionPresets[overrideEmotion].tagClass}`}>
                                        STATO EMOTIVO SIMULATO: {overrideEmotion}
                                    </span>
                                    <h4 className="text-xl font-extrabold text-white">{emotionPresets[overrideEmotion].title}</h4>
                                    <p className="text-xs text-slate-300">{emotionPresets[overrideEmotion].description}</p>
                                    
                                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs">
                                        <div className="flex items-center gap-2 font-bold text-cyan-400 font-mono">
                                            <Bot className="w-4 h-4 text-cyan-400" />
                                            Consiglio Psicologico AI Coach:
                                        </div>
                                        <p className="text-slate-200 leading-relaxed font-sans">{emotionPresets[overrideEmotion].advice}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <span className="inline-block px-3 py-1 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-full text-xs font-black uppercase font-mono">
                                        CALCOLO DINAMICO DAI TRADES REALI
                                    </span>
                                    <h4 className="text-xl font-extrabold text-white">Stato Emotivo Calcolato dai Tuoi Trade</h4>
                                    <p className="text-xs text-slate-300">
                                        La sfera 3D Quasar analizza continuamente le tue operazioni registrate nel diario sottostante e calcola l'orbe comportamentale.
                                    </p>
                                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs">
                                        <div className="flex items-center gap-2 font-bold text-cyan-400 font-mono">
                                            <Bot className="w-4 h-4" />
                                            AI Coach System Status:
                                        </div>
                                        <p className="text-slate-300">
                                            Attualmente monitorando {trades.length} operazioni nel diario. Aggiungi un nuovo trade nel modulo qui sotto per simulare l'aggiornamento in diretta!
                                        </p>
                                    </div>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => setIsAICoachOpen(true)}
                                className="w-full py-3 bg-gradient-to-r from-purple-950 to-indigo-950 hover:from-purple-900 hover:to-indigo-900 border border-purple-700 text-purple-200 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-2"
                            >
                                <BrainCircuit className="w-4 h-4 text-cyan-400" />
                                <span>Discuti questo stato con l'AI Coach</span>
                            </button>
                        </div>
                    </div>

                </section>

                {/* 2. INTERACTIVE TRADING JOURNAL & NEW TRADE FORM */}
                <section className="space-y-6">
                    <div className="border-b border-slate-800 pb-3">
                        <h3 className="text-lg font-black text-white flex items-center gap-2">
                            <PlusCircle className="w-5 h-5 text-cyan-400" />
                            Trading Journal Interattivo Sandbox
                        </h3>
                        <p className="text-xs text-slate-400 font-mono">
                            Inserisci un nuovo trade di prova per verificare come l'algoritmo ricalcola istantaneamente i grafici e la matrice Quasar 3D
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        {/* New Trade Input Form */}
                        <div className="lg:col-span-1">
                            <TradeForm />
                        </div>

                        {/* Trade History List Table */}
                        <div className="lg:col-span-2">
                            <TradeList />
                        </div>
                    </div>
                </section>

                {/* 3. ADVANCED REACTIVE ANALYTICS CHARTS */}
                <section className="space-y-6">
                    <div className="border-b border-slate-800 pb-3">
                        <h3 className="text-lg font-black text-white flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-cyan-400" />
                            Grafici Avanzati Attivi (Reagiscono ai dati inseriti)
                        </h3>
                        <p className="text-xs text-slate-400 font-mono">
                            Cost of Emotion, Monte Carlo Equity Curve, Expectancy Matrix e Heatmap Calendar
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Cost of Emotion Widget */}
                        <CostOfEmotionWidget trades={safeTrades} />

                        {/* Expectancy & R:R Matrix Widget */}
                        <ExpectancyMatrixWidget trades={safeTrades} />

                        {/* Heatmap Calendar Grid Widget */}
                        <HeatmapCalendarWidget trades={safeTrades} />

                        {/* Equity & Drawdown Curve Monte Carlo Engine */}
                        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                            <Suspense fallback={
                                <div className="h-64 flex items-center justify-center text-xs font-mono text-cyan-400">
                                    Caricamento Quant Backtest Engine...
                                </div>
                            }>
                                <BacktestStudio />
                            </Suspense>
                        </div>
                    </div>
                </section>

            </main>

            {/* AI COACH DRAWER INTEGRATION */}
            <Suspense fallback={null}>
                <AICoachDrawer 
                    isOpenExternal={isAICoachOpen} 
                    setIsOpenExternal={setIsAICoachOpen} 
                />
            </Suspense>

        </div>
    );
};
