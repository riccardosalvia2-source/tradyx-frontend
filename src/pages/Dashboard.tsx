// ============================================================================
// TRADYX MAIN DASHBOARD PAGE (src/pages/Dashboard.tsx)
// Author: Senior Front-End Developer & WebGL Performance Specialist
// Description: Integrated Dashboard layout with React.lazy Code Splitting,
//              Quasar 3D WebGL Canvas, Supabase Auth & Behavioral Finance Analytics.
// ============================================================================

import React, { useEffect, useState, useRef, Suspense, lazy } from 'react';
import { useTradeStore } from '../store/useTradeStore';
import { QuasarBubble } from '../components/QuasarBubble';
import { CryptoWidget } from '../components/CryptoWidget';
import { MacroCalendar } from '../components/MacroCalendar';
import { TradeForm } from '../components/TradeForm';
import { TradeList } from '../components/TradeList';
import { CostOfEmotionWidget } from '../components/CostOfEmotionWidget';
import { ExpectancyMatrixWidget } from '../components/ExpectancyMatrixWidget';
import { HeatmapCalendarWidget } from '../components/HeatmapCalendarWidget';
import { BottomNavBar } from '../components/BottomNavBar';
import { AuthModal } from '../components/AuthModal';
import { UserAccount, SystemBroadcast } from '../types/auth';
import { subscribeBroadcast } from '../services/broadcastService';
import { FINANCIAL_DISCLAIMER_IT } from '../../security/disclaimer';
import { 
    BrainCircuit, 
    ShieldCheck, 
    Sparkles, 
    Activity, 
    Sliders, 
    LayoutDashboard, 
    LogIn, 
    Clock, 
    Loader2,
    ShieldAlert,
    X,
    LogOut,
    Lock,
    Megaphone,
    Info,
    AlertTriangle
} from 'lucide-react';

// Code Splitting & Lazy Loading for Heavy Components
const BacktestStudio = lazy(() => import('../components/BacktestEngine').then(m => ({ default: m.BacktestStudio })));
const AICoachDrawer = lazy(() => import('../components/AICoachDrawer').then(m => ({ default: m.AICoachDrawer })));

interface DashboardProps {
    authUser: UserAccount | null;
    setAuthUser: (user: UserAccount | null) => void;
    accessDeniedNotice: string | null;
    onDismissNotice: () => void;
    activeTab?: 'JOURNAL' | 'BACKTEST';
    onTabChange?: (tab: 'JOURNAL' | 'BACKTEST') => void;
    hideTopHeader?: boolean;
    isAICoachOpenExternal?: boolean;
    setIsAICoachOpenExternal?: (open: boolean) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
    authUser,
    setAuthUser,
    accessDeniedNotice,
    onDismissNotice,
    activeTab: externalActiveTab,
    onTabChange: externalOnTabChange,
    hideTopHeader = false,
    isAICoachOpenExternal,
    setIsAICoachOpenExternal
}) => {
    const { trades, fetchTrades, subscribeToRealtimeTrades } = useTradeStore();
    const demoUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    
    // Controlled vs Internal Tab Navigation State
    const [internalActiveTab, setInternalActiveTab] = useState<'JOURNAL' | 'BACKTEST'>('JOURNAL');
    const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;
    const setActiveTab = (tab: 'JOURNAL' | 'BACKTEST') => {
        setInternalActiveTab(tab);
        if (externalOnTabChange) externalOnTabChange(tab);
    };
    
    // Auth & Modal States
    const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
    const [isAICoachOpen, setIsAICoachOpen] = useState<boolean>(false);

    // Global System Broadcast State
    const [broadcast, setBroadcast] = useState<SystemBroadcast | null>(null);
    const [dismissedBroadcastId, setDismissedBroadcastId] = useState<string | null>(null);

    const quasarRef = useRef<HTMLDivElement>(null);
    const tradeFormRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchTrades(demoUserId);
        const unsubscribeTrades = subscribeToRealtimeTrades(demoUserId);
        const unsubscribeBcast = subscribeBroadcast((bcast) => setBroadcast(bcast));
        return () => {
            unsubscribeTrades();
            unsubscribeBcast();
        };
    }, []);

    const scrollToQuasar = () => {
        quasarRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const scrollToTradeForm = () => {
        tradeFormRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const isMasterAdmin = authUser?.email.toLowerCase() === 'riccardosalvia2@gmail.com';

    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-cyan-500 selection:text-slate-950 pb-36 overflow-y-auto [webkit-overflow-scrolling:touch]">
            
            {/* Header / Navbar */}
            {!hideTopHeader && (
                <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/20">
                            <BrainCircuit className="w-6 h-6 text-slate-950 font-bold" />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-cyan-200 to-blue-400 bg-clip-text text-transparent">
                                TRADYX
                            </h1>
                            <div className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase font-semibold">
                                AI Trading Journal & Market Intelligence
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* AI Coach Trigger Button */}
                        <button
                            type="button"
                            onClick={() => setIsAICoachOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-950 to-indigo-950 border border-purple-700/80 text-xs font-bold text-purple-300 hover:text-white transition shadow-lg active:scale-95"
                        >
                            <BrainCircuit className="w-4 h-4 text-cyan-400 animate-pulse" />
                            <span>AI Coach</span>
                        </button>

                        {/* Auth User Status / Login Trigger Button */}
                        {authUser ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs">
                                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                <span className="font-bold text-slate-200">{authUser.full_name || authUser.email}</span>
                                {isMasterAdmin ? (
                                    <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-purple-950 text-purple-300 border border-purple-800 uppercase">
                                        ADMIN
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-cyan-950 text-cyan-400 border border-cyan-800 uppercase">
                                        USER
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setAuthUser(null)}
                                    className="ml-1 text-slate-400 hover:text-rose-400 transition"
                                    title="Disconnetti"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsAuthModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-extrabold rounded-xl transition shadow-lg shadow-cyan-500/20 active:scale-95"
                            >
                                <LogIn className="w-4 h-4" />
                                <span>Accedi / Registrati</span>
                            </button>
                        )}
                    </div>
                </div>
            </header>
            )}

            {/* 📣 GLOBAL SYSTEM BROADCAST BANNER */}
            {broadcast && broadcast.active && dismissedBroadcastId !== broadcast.id && (
                <div className={`border-b py-3 px-6 text-xs flex items-center justify-between shadow-2xl transition animate-in slide-in-from-top duration-300 ${
                    broadcast.style === 'PROMO'
                        ? 'bg-gradient-to-r from-emerald-950 via-teal-950 to-emerald-950 border-emerald-500/80 text-emerald-100'
                        : broadcast.style === 'WARNING'
                        ? 'bg-gradient-to-r from-amber-950 via-rose-950 to-amber-950 border-amber-500/80 text-amber-100'
                        : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-cyan-500/80 text-cyan-100'
                }`}>
                    <div className="flex items-center gap-3 max-w-7xl mx-auto flex-1">
                        <div className={`p-1.5 rounded-lg shrink-0 ${
                            broadcast.style === 'PROMO' ? 'bg-emerald-900/80 text-emerald-300' :
                            broadcast.style === 'WARNING' ? 'bg-amber-900/80 text-amber-300' : 'bg-cyan-900/80 text-cyan-300'
                        }`}>
                            <Megaphone className="w-4 h-4 animate-bounce" />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                            <strong className="font-extrabold tracking-wide uppercase">{broadcast.title}</strong>
                            <span className="opacity-90">{broadcast.message}</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setDismissedBroadcastId(broadcast.id)}
                        className="p-1 rounded-lg hover:bg-slate-800/80 text-slate-400 hover:text-white transition ml-3"
                        title="Chiudi annuncio"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* 🚫 ACCESS DENIED TOAST BANNER (When unauthorized access occurs) */}
            {accessDeniedNotice && (
                <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 border-b border-rose-500/80 py-3.5 px-6 text-rose-100 text-xs flex items-center justify-between shadow-2xl animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-3 max-w-5xl mx-auto">
                        <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
                        <div>
                            <strong className="text-rose-200 uppercase font-extrabold tracking-wide">🚫 Accesso non autorizzato: </strong>
                            <span>{accessDeniedNotice}</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onDismissNotice}
                        className="p-1 rounded-lg hover:bg-rose-900 text-rose-300 hover:text-white transition"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Email Verification Warning Banner */}
            {authUser && !authUser.email_confirmed && (
                <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 border-b border-amber-500/60 py-3 px-6 text-amber-200 text-xs flex items-center justify-between shadow-xl">
                    <div className="flex items-center gap-3 max-w-5xl mx-auto">
                        <Clock className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
                        <div>
                            <strong className="text-amber-300 uppercase font-bold">Email in attesa di conferma: </strong>
                            Ti abbiamo inviato un'email di verifica a <span className="underline font-mono">{authUser.email}</span>. Clicca sul link per confermare l'account.
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Layout */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
                
                {/* Desktop Navigation Toggle */}
                <div className="hidden md:flex items-center justify-between border-b border-slate-800/80 pb-4">
                    <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-md">
                        <button
                            type="button"
                            onClick={() => setActiveTab('JOURNAL')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition ${
                                activeTab === 'JOURNAL'
                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Journal & Market Intelligence
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('BACKTEST')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition ${
                                activeTab === 'BACKTEST'
                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Sliders className="w-4 h-4" />
                            Backtesting Studio (Quant Engine)
                        </button>
                    </div>
                </div>

                {activeTab === 'JOURNAL' ? (
                    <>
                        {/* Hero 3D Quasar Bubble Display */}
                        <section ref={quasarRef} id="quasar-section" className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-300">
                                    <Sparkles className="w-4 h-4 text-cyan-400" />
                                    <span>Interactive 3D Quasar Emotional Bubble</span>
                                </div>
                                <span className="hidden sm:inline text-xs text-slate-500 font-mono">WebGL 30 FPS Cap • Low Power GPU</span>
                            </div>

                            <QuasarBubble />
                        </section>

                        {/* External API Market Section (Crypto Ticker & Macro Calendar) */}
                        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                            <div className="lg:col-span-5">
                                <CryptoWidget />
                            </div>
                            <div className="lg:col-span-7">
                                <MacroCalendar />
                            </div>
                        </section>

                        {/* 📊 ADVANCED TRADING ANALYTICS SECTION */}
                        <section className="space-y-6 sm:space-y-8">
                            {/* Quantitative Expectancy & Cost of Emotion Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                                <div className="lg:col-span-6">
                                    <CostOfEmotionWidget trades={trades} />
                                </div>
                                <div className="lg:col-span-6">
                                    <ExpectancyMatrixWidget trades={trades} />
                                </div>
                            </div>

                            {/* Monthly Trading Heatmap Calendar */}
                            <div>
                                <HeatmapCalendarWidget trades={trades} />
                            </div>
                        </section>

                        {/* Journal & Operations Grid */}
                        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                            <div ref={tradeFormRef} id="trade-form-section" className="lg:col-span-6">
                                <TradeForm />
                            </div>
                            <div className="lg:col-span-6">
                                <TradeList />
                            </div>
                        </section>
                    </>
                ) : (
                    <Suspense fallback={
                        <div className="p-12 text-center bg-slate-900/80 border border-slate-800 rounded-3xl backdrop-blur-xl flex flex-col items-center justify-center space-y-3">
                            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Caricamento Backtesting Studio...</div>
                        </div>
                    }>
                        <BacktestStudio />
                    </Suspense>
                )}
            </main>

            {/* Footer with Legal Disclaimer */}
            <footer className="max-w-7xl mx-auto px-6 mt-12 sm:mt-16 pt-6 border-t border-slate-900 text-center space-y-2">
                <p className="text-xs text-slate-500 max-w-4xl mx-auto leading-relaxed">
                    ⚖️ <strong className="text-slate-400">Disclaimer Legale:</strong> {FINANCIAL_DISCLAIMER_IT}
                </p>
                <div className="text-[11px] text-slate-600 font-mono">
                    © 2026 Tradyx AI Inc. All rights reserved. Mobile Optimized (30 FPS Cap & Code Splitting).
                </div>
            </footer>

            {/* Supabase Auth Modal */}
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onAuthenticated={(user) => setAuthUser(user)}
            />

            {/* Floating AI Psychology Coach Drawer */}
            <Suspense fallback={null}>
                <AICoachDrawer isOpenExternal={isAICoachOpen} setIsOpenExternal={setIsAICoachOpen} />
            </Suspense>

            {/* Mobile Bottom Navigation Bar */}
            <BottomNavBar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onOpenAICoach={() => setIsAICoachOpen(true)}
                onFocusQuasar={scrollToQuasar}
                onFocusTradeForm={scrollToTradeForm}
            />
        </div>
    );
};
