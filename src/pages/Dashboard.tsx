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

    // Section Refs for Mobile Navigation Scroll Triggers
    const homeRef = useRef<HTMLDivElement>(null);
    const quasarRef = useRef<HTMLDivElement>(null);
    const walletRef = useRef<HTMLDivElement>(null);
    const statsRef = useRef<HTMLDivElement>(null);
    const tradeFormRef = useRef<HTMLDivElement>(null);
    const historyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchTrades(demoUserId);
        const unsubscribeTrades = subscribeToRealtimeTrades(demoUserId);
        const unsubscribeBcast = subscribeBroadcast((bcast) => setBroadcast(bcast));
        return () => {
            unsubscribeTrades();
            unsubscribeBcast();
        };
    }, []);

    const scrollToHome = () => {
        homeRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const scrollToQuasar = () => {
        quasarRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const scrollToWallet = () => {
        walletRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const scrollToStats = () => {
        statsRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const scrollToTradeForm = () => {
        tradeFormRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const scrollToHistory = () => {
        historyRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const isMasterAdmin = authUser?.email.toLowerCase() === 'riccardosalvia2@gmail.com';

    return (
        <div ref={homeRef} className="min-h-[100dvh] w-full bg-[#090D16] text-white selection:bg-cyan-500 selection:text-slate-950 pb-28 sm:pb-32 overflow-y-auto [webkit-overflow-scrolling:touch]">
            
            {/* Header / Navbar */}
            {!hideTopHeader && (
                <header className="border-b border-slate-800/80 bg-[#090D16]/90 backdrop-blur-xl sticky top-0 z-40 w-full">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/20">
                            <BrainCircuit className="w-6 h-6 text-slate-950 font-bold" />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-cyan-200 to-blue-400 bg-clip-text text-transparent">
                                TRADYX
                            </h1>
                            <div className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase font-semibold hidden sm:block">
                                AI Trading Journal & Market Intelligence
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* AI Coach Trigger Button */}
                        <button
                            type="button"
                            onClick={() => setIsAICoachOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-950 to-indigo-950 border border-purple-700/80 text-xs font-bold text-purple-300 hover:text-white transition shadow-lg active:scale-95 cursor-pointer"
                        >
                            <BrainCircuit className="w-4 h-4 text-cyan-400 animate-pulse" />
                            <span>AI Coach</span>
                        </button>

                        {/* Auth User Status / Login Trigger Button */}
                        {authUser ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs">
                                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                <span className="font-bold text-slate-200 truncate max-w-[120px] sm:max-w-none">{authUser.full_name || authUser.email}</span>
                                {isMasterAdmin ? (
                                    <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[9px] font-extrabold bg-purple-950 text-purple-300 border border-purple-800 uppercase">
                                        ADMIN
                                    </span>
                                ) : (
                                    <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[9px] font-extrabold bg-cyan-950 text-cyan-400 border border-cyan-800 uppercase">
                                        USER
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setAuthUser(null)}
                                    className="ml-1 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                                    title="Disconnetti"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsAuthModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-extrabold rounded-xl transition shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer"
                            >
                                <LogIn className="w-4 h-4" />
                                <span>Accedi</span>
                            </button>
                        )}
                    </div>
                </div>
            </header>
            )}

            {/* 📣 GLOBAL SYSTEM BROADCAST BANNER */}
            {broadcast && broadcast.active && dismissedBroadcastId !== broadcast.id && (
                <div className={`border-b py-3 px-4 sm:px-6 text-xs flex items-center justify-between shadow-2xl transition animate-in slide-in-from-top duration-300 w-full ${
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
                        className="p-1 rounded-lg hover:bg-slate-800/80 text-slate-400 hover:text-white transition ml-3 cursor-pointer"
                        title="Chiudi annuncio"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* 🚫 ACCESS DENIED TOAST BANNER */}
            {accessDeniedNotice && (
                <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 border-b border-rose-500/80 py-3.5 px-4 sm:px-6 text-rose-100 text-xs flex items-center justify-between shadow-2xl animate-in slide-in-from-top duration-300 w-full">
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
                        className="p-1 rounded-lg hover:bg-rose-900 text-rose-300 hover:text-white transition cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Email Verification Warning Banner */}
            {authUser && !authUser.email_confirmed && (
                <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 border-b border-amber-500/60 py-3 px-4 sm:px-6 text-amber-200 text-xs flex items-center justify-between shadow-xl w-full">
                    <div className="flex items-center gap-3 max-w-5xl mx-auto">
                        <Clock className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
                        <div>
                            <strong className="text-amber-300 uppercase font-bold">Email in attesa di conferma: </strong>
                            Ti abbiamo inviato un'email di verifica a <span className="underline font-mono">{authUser.email}</span>. Clicca sul link per confermare l'account.
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Layout - Full Width Responsive Grid */}
            <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
                
                {/* Desktop Navigation Toggle */}
                <div className="hidden md:flex items-center justify-between border-b border-slate-800/80 pb-4 w-full">
                    <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-md">
                        <button
                            type="button"
                            onClick={() => setActiveTab('JOURNAL')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
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
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
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
                        {/* 1. Hero 3D Quasar Bubble Display */}
                        <section ref={quasarRef} id="quasar-section" className="space-y-3 w-full scroll-mt-20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-300">
                                    <Sparkles className="w-4 h-4 text-cyan-400" />
                                    <span>Interactive 3D Quasar Emotional Bubble</span>
                                </div>
                                <span className="hidden sm:inline text-xs text-slate-500 font-mono">WebGL 30 FPS Cap • Low Power GPU</span>
                            </div>

                            <div className="w-full">
                                <QuasarBubble />
                            </div>
                        </section>

                        {/* 2. External API Market Section (Crypto Ticker & Macro Calendar) - Wallet & Market */}
                        <section ref={walletRef} id="wallet-market-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 w-full scroll-mt-20">
                            <div className="lg:col-span-5 w-full">
                                <CryptoWidget />
                            </div>
                            <div className="lg:col-span-7 w-full">
                                <MacroCalendar />
                            </div>
                        </section>

                        {/* 3. 📊 ADVANCED TRADING ANALYTICS SECTION - Stats */}
                        <section ref={statsRef} id="stats-analytics-section" className="space-y-6 sm:space-y-8 w-full scroll-mt-20">
                            {/* Quantitative Expectancy & Cost of Emotion Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 w-full">
                                <div className="lg:col-span-6 w-full">
                                    <CostOfEmotionWidget trades={trades} />
                                </div>
                                <div className="lg:col-span-6 w-full">
                                    <ExpectancyMatrixWidget trades={trades} />
                                </div>
                            </div>

                            {/* Monthly Trading Heatmap Calendar */}
                            <div className="w-full">
                                <HeatmapCalendarWidget trades={trades} />
                            </div>
                        </section>

                        {/* 4. Journal & Operations Grid - Trade Form & History Trade List */}
                        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 w-full">
                            <div ref={tradeFormRef} id="trade-form-section" className="lg:col-span-6 w-full scroll-mt-20">
                                <TradeForm />
                            </div>
                            <div ref={historyRef} id="history-trade-list-section" className="lg:col-span-6 w-full scroll-mt-20">
                                <TradeList />
                            </div>
                        </section>
                    </>
                ) : (
                    <Suspense fallback={
                        <div className="p-12 text-center bg-slate-900/80 border border-slate-800 rounded-3xl backdrop-blur-xl flex flex-col items-center justify-center space-y-3 w-full">
                            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Caricamento Backtesting Studio...</div>
                        </div>
                    }>
                        <div className="w-full">
                            <BacktestStudio />
                        </div>
                    </Suspense>
                )}
            </main>

            {/* Footer with Legal Disclaimer */}
            <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 mt-12 sm:mt-16 pt-6 border-t border-slate-900 text-center space-y-2">
                <div className="text-[11px] text-slate-600 font-mono">
                    © 2026 Tradyx AI Inc. All rights reserved. Mobile Full-Screen Responsive.
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
                onFocusHistory={scrollToHistory}
                onFocusStats={scrollToStats}
                onFocusWallet={scrollToWallet}
                onFocusHome={scrollToHome}
            />
        </div>
    );
};

export default Dashboard;
