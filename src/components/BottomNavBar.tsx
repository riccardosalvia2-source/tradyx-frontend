// ============================================================================
// TRADYX MOBILE BOTTOM NAVIGATION BAR (src/components/BottomNavBar.tsx)
// ============================================================================

import React from 'react';
import { 
    Home, 
    PlusCircle, 
    History, 
    BarChart3, 
    Wallet, 
    BrainCircuit, 
    Sparkles 
} from 'lucide-react';

interface BottomNavBarProps {
    activeTab: 'JOURNAL' | 'BACKTEST';
    setActiveTab: (tab: 'JOURNAL' | 'BACKTEST') => void;
    onOpenAICoach: () => void;
    onFocusQuasar: () => void;
    onFocusTradeForm: () => void;
    onFocusHistory?: () => void;
    onFocusStats?: () => void;
    onFocusWallet?: () => void;
    onFocusHome?: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
    activeTab,
    setActiveTab,
    onOpenAICoach,
    onFocusQuasar,
    onFocusTradeForm,
    onFocusHistory,
    onFocusStats,
    onFocusWallet,
    onFocusHome
}) => {
    const handleNavigation = (action?: () => void) => {
        if (activeTab !== 'JOURNAL') {
            setActiveTab('JOURNAL');
        }
        if (action) {
            setTimeout(() => action(), 50);
        }
    };

    return (
        <nav className="fixed bottom-0 left-0 w-full z-50 bg-[#0f1115]/95 backdrop-blur border-t border-white/10 flex justify-around items-center py-2 pb-[env(safe-area-inset-bottom)] md:hidden shadow-2xl">
            
            {/* 1. Home */}
            <button
                type="button"
                onClick={() => handleNavigation(onFocusHome)}
                className="flex flex-col items-center justify-center min-w-[42px] min-h-[44px] text-slate-400 hover:text-cyan-300 transition active:scale-95 cursor-pointer"
                title="Home"
            >
                <Home className="w-5 h-5 mb-0.5 text-slate-300" />
                <span className="text-[9px] font-mono tracking-tight font-medium">Home</span>
            </button>

            {/* 2. Trade */}
            <button
                type="button"
                onClick={() => handleNavigation(onFocusTradeForm)}
                className="flex flex-col items-center justify-center min-w-[42px] min-h-[44px] text-slate-400 hover:text-emerald-400 transition active:scale-95 cursor-pointer"
                title="Nuovo Trade"
            >
                <PlusCircle className="w-5 h-5 mb-0.5 text-emerald-400" />
                <span className="text-[9px] font-mono tracking-tight font-medium">Trade</span>
            </button>

            {/* 3. History */}
            <button
                type="button"
                onClick={() => handleNavigation(onFocusHistory)}
                className="flex flex-col items-center justify-center min-w-[42px] min-h-[44px] text-slate-400 hover:text-cyan-300 transition active:scale-95 cursor-pointer"
                title="Storico Trade"
            >
                <History className="w-5 h-5 mb-0.5 text-cyan-400" />
                <span className="text-[9px] font-mono tracking-tight font-medium">History</span>
            </button>

            {/* 4. Stats */}
            <button
                type="button"
                onClick={() => handleNavigation(onFocusStats)}
                className="flex flex-col items-center justify-center min-w-[42px] min-h-[44px] text-slate-400 hover:text-purple-300 transition active:scale-95 cursor-pointer"
                title="Statistiche Analytics"
            >
                <BarChart3 className="w-5 h-5 mb-0.5 text-purple-400" />
                <span className="text-[9px] font-mono tracking-tight font-medium">Stats</span>
            </button>

            {/* 5. Wallet */}
            <button
                type="button"
                onClick={() => handleNavigation(onFocusWallet)}
                className="flex flex-col items-center justify-center min-w-[42px] min-h-[44px] text-slate-400 hover:text-amber-300 transition active:scale-95 cursor-pointer"
                title="Mercato & Wallet"
            >
                <Wallet className="w-5 h-5 mb-0.5 text-amber-400" />
                <span className="text-[9px] font-mono tracking-tight font-medium">Wallet</span>
            </button>

            {/* 6. Coach */}
            <button
                type="button"
                onClick={onOpenAICoach}
                className="flex flex-col items-center justify-center min-w-[42px] min-h-[44px] text-slate-400 hover:text-cyan-300 transition active:scale-95 cursor-pointer"
                title="Tradyx AI Coach"
            >
                <BrainCircuit className="w-5 h-5 mb-0.5 text-cyan-400 animate-pulse" />
                <span className="text-[9px] font-mono tracking-tight font-medium">Coach</span>
            </button>

            {/* 7. Bolla (Quasar 3D) */}
            <button
                type="button"
                onClick={() => handleNavigation(onFocusQuasar)}
                className="flex flex-col items-center justify-center min-w-[42px] min-h-[44px] text-slate-400 hover:text-cyan-300 transition active:scale-95 cursor-pointer"
                title="Quasar 3D Bolla"
            >
                <Sparkles className="w-5 h-5 mb-0.5 text-cyan-400 animate-pulse" />
                <span className="text-[9px] font-mono tracking-tight font-medium">Bolla</span>
            </button>

        </nav>
    );
};
