// ============================================================================
// TRADYX MOBILE-FIRST BOTTOM NAVIGATION BAR (src/components/BottomNavBar.tsx)
// 7 Original Sections: HOME, TRADE, HISTORY, STATS, WALLET, COACH, BOLLA
// Optimized for iPhone / Safari PWA with iOS Home Indicator Safe Area
// ============================================================================

import React from 'react';
import { 
    Home, 
    TrendingUp, 
    History, 
    BarChart2, 
    Wallet, 
    BrainCircuit, 
    Sparkles 
} from 'lucide-react';

export type AppTab = 'home' | 'trade' | 'history' | 'stats' | 'wallet' | 'coach' | 'bubble';

interface BottomNavBarProps {
    activeTab: AppTab;
    setActiveTab: (tab: AppTab) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
    activeTab,
    setActiveTab
}) => {
    const navItems: { id: AppTab; label: string; icon: React.FC<{ className?: string }> }[] = [
        { id: 'home', label: 'HOME', icon: Home },
        { id: 'trade', label: 'TRADE', icon: TrendingUp },
        { id: 'history', label: 'HISTORY', icon: History },
        { id: 'stats', label: 'STATS', icon: BarChart2 },
        { id: 'wallet', label: 'WALLET', icon: Wallet },
        { id: 'coach', label: 'COACH', icon: BrainCircuit },
        { id: 'bubble', label: 'BOLLA', icon: Sparkles },
    ];

    return (
        <nav 
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#0D0E12]/95 backdrop-blur-lg border-t border-white/10 pb-[env(safe-area-inset-bottom,16px)] h-16 sm:h-20 flex justify-around items-center px-1"
            role="navigation"
            aria-label="Mobile Bottom Navigation"
        >
            <div className="w-full max-w-lg mx-auto flex justify-between items-center h-full">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                                setActiveTab(item.id);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 select-none cursor-pointer active:scale-95 group ${
                                isActive ? 'text-[#00E599]' : 'text-slate-400 hover:text-slate-200'
                            }`}
                            aria-selected={isActive}
                        >
                            {/* Glowing indicator pill on top of active item */}
                            {isActive && (
                                <span className="absolute top-0 w-6 sm:w-8 h-[2.5px] bg-[#00E599] rounded-full shadow-[0_0_12px_#00E599]" />
                            )}

                            <div className={`p-1 rounded-xl transition-all ${
                                isActive 
                                    ? 'bg-[#00E599]/10 text-[#00E599]' 
                                    : 'text-slate-400 group-hover:text-slate-300'
                            }`}>
                                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                            </div>

                            <span className={`text-[9px] sm:text-[10px] tracking-tight uppercase font-sans mt-0.5 leading-none ${
                                isActive ? 'font-black text-[#00E599]' : 'font-medium text-slate-400'
                            }`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNavBar;
