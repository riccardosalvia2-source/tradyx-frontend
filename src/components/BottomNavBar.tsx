// ============================================================================
// TRADYX MOBILE BOTTOM NAVIGATION BAR (src/components/BottomNavBar.tsx)
// Author: Lead Mobile UI/UX Engineer & Senior Front-End Developer
// Description: Fixed mobile bottom bar with glassmorphic styling, iOS safe-area
//              support, and 44px+ touch-friendly target buttons.
// ============================================================================

import React from 'react';
import { 
    LayoutDashboard, 
    Sparkles, 
    PlusCircle, 
    Sliders, 
    BrainCircuit 
} from 'lucide-react';

interface BottomNavBarProps {
    activeTab: 'JOURNAL' | 'BACKTEST' | 'ADMIN';
    setActiveTab: (tab: 'JOURNAL' | 'BACKTEST' | 'ADMIN') => void;
    onOpenAICoach: () => void;
    onFocusQuasar: () => void;
    onFocusTradeForm: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
    activeTab,
    setActiveTab,
    onOpenAICoach,
    onFocusQuasar,
    onFocusTradeForm
}) => {
    return (
        <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur border-t border-slate-800 px-2 py-2 justify-around items-center pb-safe shadow-2xl">
            
            {/* 1. Dashboard / Journal Tab */}
            <button
                type="button"
                onClick={() => setActiveTab('JOURNAL')}
                className={`flex flex-col items-center justify-center min-w-[48px] min-h-[44px] rounded-xl transition active:scale-95 ${
                    activeTab === 'JOURNAL' ? 'text-cyan-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
                }`}
            >
                <LayoutDashboard className={`w-5 h-5 mb-0.5 ${activeTab === 'JOURNAL' ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : ''}`} />
                <span className="text-[9px] font-mono tracking-tight">Journal</span>
            </button>

            {/* 2. Quasar 3D Bubble Focus */}
            <button
                type="button"
                onClick={() => {
                    setActiveTab('JOURNAL');
                    onFocusQuasar();
                }}
                className="flex flex-col items-center justify-center min-w-[48px] min-h-[44px] rounded-xl text-slate-400 hover:text-cyan-300 transition active:scale-95"
            >
                <Sparkles className="w-5 h-5 mb-0.5 text-cyan-400 animate-pulse" />
                <span className="text-[9px] font-mono tracking-tight">Quasar</span>
            </button>

            {/* 3. New Trade Entry Action Button */}
            <button
                type="button"
                onClick={() => {
                    setActiveTab('JOURNAL');
                    onFocusTradeForm();
                }}
                className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] -mt-3 bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 rounded-full shadow-lg shadow-cyan-500/40 active:scale-95 transition"
                title="Nuovo Trade"
            >
                <PlusCircle className="w-6 h-6 font-black" />
            </button>

            {/* 4. Native AI Coach Tab Trigger */}
            <button
                type="button"
                onClick={onOpenAICoach}
                className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:text-cyan-300 transition active:scale-95"
                title="Tradyx AI Coach"
            >
                <BrainCircuit className="w-5 h-5 mb-0.5 text-cyan-400 animate-pulse" />
                <span className="text-[9px] font-mono tracking-tight">AI Coach</span>
            </button>

            {/* 5. Backtesting Studio Tab */}
            <button
                type="button"
                onClick={() => setActiveTab('BACKTEST')}
                className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] rounded-xl transition active:scale-95 ${
                    activeTab === 'BACKTEST' ? 'text-cyan-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
                }`}
            >
                <Sliders className={`w-5 h-5 mb-0.5 ${activeTab === 'BACKTEST' ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : ''}`} />
                <span className="text-[9px] font-mono tracking-tight">Backtest</span>
            </button>

        </nav>
    );
};
