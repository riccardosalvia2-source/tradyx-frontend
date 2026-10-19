// ============================================================================
// TRADYX MOBILE-FIRST BOTTOM NAVIGATION BAR (src/components/BottomNavBar.tsx)
// Tailored for iPhone / Safari PWA with iOS Home Indicator Safe Area
// ============================================================================

import React from 'react';
import { 
    Home, 
    TrendingUp, 
    BrainCircuit, 
    History, 
    Wallet
} from 'lucide-react';

export type AppTab = 'home' | 'trade' | 'coach' | 'history' | 'wallet';

interface BottomNavBarProps {
    activeTab: AppTab;
    setActiveTab: (tab: AppTab) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
    activeTab,
    setActiveTab
}) => {
    const navItems: { id: AppTab; label: string; icon: React.FC<{ className?: string }> }[] = [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'trade', label: 'Trade', icon: TrendingUp },
        { id: 'coach', label: 'AI Coach', icon: BrainCircuit },
        { id: 'history', label: 'History', icon: History },
        { id: 'wallet', label: 'Wallet', icon: Wallet },
    ];

    return (
        <nav 
            className="fixed bottom-0 left-0 right-0 z-50 w-full max-w-md mx-auto bg-[#05070B]/95 backdrop-blur-xl border-t border-white/10 flex justify-around items-center px-1 h-20 pb-[env(safe-area-inset-bottom,16px)] shadow-[0_-10px_30px_rgba(0,0,0,0.8)]"
            role="navigation"
            aria-label="Navigazione Mobile"
        >
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
                        className={`flex flex-col items-center justify-center flex-1 h-14 relative transition-all duration-200 active:scale-95 cursor-pointer select-none ${
                            isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                        }`}
                        aria-selected={isActive}
                    >
                        {/* Glowing pill behind active icon */}
                        {isActive && (
                            <span className="absolute -top-1 w-8 h-1 bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full shadow-[0_0_12px_rgba(0,240,255,0.8)] animate-pulse" />
                        )}

                        <div className={`p-1.5 rounded-xl transition-all ${
                            isActive 
                                ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]' 
                                : 'text-slate-400'
                        }`}>
                            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                        </div>

                        <span className={`text-[10px] tracking-tight font-medium mt-0.5 ${
                            isActive ? 'font-bold text-cyan-300' : 'text-slate-400'
                        }`}>
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
};

export default BottomNavBar;
