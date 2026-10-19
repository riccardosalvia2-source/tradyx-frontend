// ============================================================================
// TRADYX MOBILE TAB 1: HOME & QUASAR DASHBOARD (src/components/tabs/TabHome.tsx)
// ============================================================================

import React, { useState } from 'react';
import { useTradeStore, DEFAULT_MOCK_TRADES } from '../../store/useTradeStore';
import { QuasarBubble } from '../QuasarBubble';
import { BubbleConfig } from '../../types/bubble';
import { UserAccount } from '../../types/auth';
import { AppTab } from '../BottomNavBar';
import { 
    BrainCircuit, 
    Sparkles, 
    TrendingUp, 
    TrendingDown, 
    PlusCircle, 
    ShieldCheck, 
    Flame, 
    Coins, 
    AlertTriangle, 
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    Zap,
    Bell
} from 'lucide-react';

interface TabHomeProps {
    authUser: UserAccount | null;
    setActiveTab: (tab: AppTab) => void;
}

export const TabHome: React.FC<TabHomeProps> = ({ authUser, setActiveTab }) => {
    const { trades, bubbleConfig } = useTradeStore();
    const safeTrades = Array.isArray(trades) && trades.length > 0 ? trades : DEFAULT_MOCK_TRADES;

    const [overrideEmotion, setOverrideEmotion] = useState<'FOMO' | 'GREED' | 'DISCIPLINED' | 'REVENGE' | null>(null);

    // Calculate live portfolio metrics from trades
    const totalPnl = safeTrades.reduce((acc, t) => acc + (Number(t?.pnl) || 0), 0);
    const startingCapital = 25000;
    const currentEquity = startingCapital + totalPnl;
    const isProfitable = totalPnl >= 0;
    const pnlPercentage = ((totalPnl / startingCapital) * 100).toFixed(1);

    const winningTrades = safeTrades.filter(t => (Number(t?.pnl) || 0) > 0).length;
    const winRate = safeTrades.length > 0 ? ((winningTrades / safeTrades.length) * 100).toFixed(0) : '0';

    // Emotional preset configurations for 3D Quasar Bubble
    const emotionPresets: Record<'FOMO' | 'GREED' | 'DISCIPLINED' | 'REVENGE', {
        config: BubbleConfig;
        title: string;
        color: string;
        bgClass: string;
        borderClass: string;
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
            title: 'FOMO Trading',
            color: 'text-rose-400',
            bgClass: 'bg-rose-950/40',
            borderClass: 'border-rose-500/60'
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
            title: 'Greed (Avidità)',
            color: 'text-amber-400',
            bgClass: 'bg-amber-950/40',
            borderClass: 'border-amber-500/60'
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
            title: 'Disciplinato',
            color: 'text-cyan-400',
            bgClass: 'bg-cyan-950/40',
            borderClass: 'border-cyan-500/60'
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
            title: 'Revenge Trade',
            color: 'text-purple-400',
            bgClass: 'bg-purple-950/40',
            borderClass: 'border-purple-500/60'
        }
    };

    const activeConfig = overrideEmotion ? emotionPresets[overrideEmotion].config : bubbleConfig;

    return (
        <div className="w-full flex flex-col space-y-4 px-3.5 sm:px-4 pt-2 pb-28">
            
            {/* 1. TOP HEADER CON NOTCH SAFE AREA */}
            <header className="w-full flex items-center justify-between py-2 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center justify-center">
                        <div className="w-full h-full bg-[#05070B] rounded-[10px] flex items-center justify-center">
                            <BrainCircuit className="w-5 h-5 text-cyan-400 animate-pulse" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-base font-black tracking-tight text-white font-sans">TRADYX</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-extrabold bg-cyan-950/80 text-cyan-400 border border-cyan-800 uppercase">
                                PWA
                            </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono tracking-wider">
                            AI BEHAVIORAL FINTECH
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[11px] font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-emerald-300 font-semibold truncate max-w-[110px]">
                            {authUser ? (authUser.full_name?.split(' ')[0] || 'Trader') : 'Demo'}
                        </span>
                    </div>
                </div>
            </header>

            {/* 2. CARD SALDO TOTALE E P&L GIORNALIERO (No tagli, text-xl sm:text-2xl, break-words) */}
            <section className="w-full rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-4 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 blur-[50px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-36 h-36 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none" />

                <div className="relative z-10 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                            Saldo Totale Portafoglio
                        </span>
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${
                            isProfitable 
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' 
                                : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                        }`}>
                            {isProfitable ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            <span>{isProfitable ? `+${pnlPercentage}%` : `${pnlPercentage}%`}</span>
                        </div>
                    </div>

                    {/* Grandi numeri leggibili e anti-overflow */}
                    <div className="flex flex-col">
                        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono break-words">
                            ${currentEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-400 font-mono">P&L Totale:</span>
                            <span className={`text-sm sm:text-base font-bold font-mono ${
                                isProfitable ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                                {isProfitable ? `+$${totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : `-$${Math.abs(totalPnl).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                            </span>
                        </div>
                    </div>

                    {/* Mini metrics bar */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center font-mono">
                        <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="text-[10px] text-slate-400">WIN RATE</div>
                            <div className="text-xs font-bold text-cyan-400">{winRate}%</div>
                        </div>
                        <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="text-[10px] text-slate-400">PROFIT FACTOR</div>
                            <div className="text-xs font-bold text-purple-400">2.41</div>
                        </div>
                        <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="text-[10px] text-slate-400">TRADE TOTALI</div>
                            <div className="text-xs font-bold text-white">{safeTrades.length}</div>
                        </div>
                    </div>

                    {/* Azioni rapide touch-friendly: pulsanti con altezza minima h-11 */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => setActiveTab('trade')}
                            className="h-11 w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <PlusCircle className="w-4 h-4 text-slate-950 shrink-0" />
                            <span>Nuovo Trade</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('coach')}
                            className="h-11 w-full bg-gradient-to-r from-purple-900/60 to-indigo-900/60 hover:from-purple-800/80 hover:to-indigo-800/80 border border-purple-500/40 text-purple-200 font-extrabold text-xs rounded-xl shadow-lg active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <BrainCircuit className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
                            <span>Chiedi al Coach</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* 3. BOLLE QUASAR SENTIMENT (3D WebGL Fluid Canvas, Touch Responsive) */}
            <section className="w-full rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-3.5 shadow-xl relative overflow-hidden flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>Quasar 3D Sentiment Bubble</span>
                    </div>
                    {overrideEmotion && (
                        <button
                            type="button"
                            onClick={() => setOverrideEmotion(null)}
                            className="text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer"
                        >
                            Ripristina Live
                        </button>
                    )}
                </div>

                <div className="w-full min-h-[300px] flex items-center justify-center relative">
                    <QuasarBubble config={activeConfig} />
                </div>

                {/* Micro chips di simulazione psicologica (FOMO, Greed, Disciplined, Revenge) */}
                <div className="w-full mt-3 space-y-1.5">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase font-mono tracking-wide">
                        Simula Reattività Emotiva 3D:
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                        <button
                            type="button"
                            onClick={() => setOverrideEmotion('DISCIPLINED')}
                            className={`h-9 px-2.5 rounded-lg border text-left text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                                overrideEmotion === 'DISCIPLINED'
                                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300'
                                    : 'bg-white/[0.03] border-white/10 text-slate-300'
                            }`}
                        >
                            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span className="truncate">Disciplinato</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setOverrideEmotion('FOMO')}
                            className={`h-9 px-2.5 rounded-lg border text-left text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                                overrideEmotion === 'FOMO'
                                    ? 'bg-rose-950/80 border-rose-400 text-rose-300'
                                    : 'bg-white/[0.03] border-white/10 text-slate-300'
                            }`}
                        >
                            <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span className="truncate">Bias FOMO</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setOverrideEmotion('GREED')}
                            className={`h-9 px-2.5 rounded-lg border text-left text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                                overrideEmotion === 'GREED'
                                    ? 'bg-amber-950/80 border-amber-400 text-amber-300'
                                    : 'bg-white/[0.03] border-white/10 text-slate-300'
                            }`}
                        >
                            <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">Avidità (Greed)</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setOverrideEmotion('REVENGE')}
                            className={`h-9 px-2.5 rounded-lg border text-left text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                                overrideEmotion === 'REVENGE'
                                    ? 'bg-purple-950/80 border-purple-400 text-purple-300'
                                    : 'bg-white/[0.03] border-white/10 text-slate-300'
                            }`}
                        >
                            <AlertTriangle className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span className="truncate">Revenge</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* 4. LIVE MARKET TICKER STRIP */}
            <section className="w-full space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-cyan-400" />
                        Live Market Monitor
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Binance API Live</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <div 
                        onClick={() => setActiveTab('trade')} 
                        className="p-2.5 rounded-xl border border-white/10 bg-white/[0.02] hover:border-cyan-500/40 cursor-pointer active:scale-95 transition"
                    >
                        <div className="text-[10px] text-slate-400 font-mono font-bold">BTC/USDT</div>
                        <div className="text-xs font-black text-white font-mono mt-0.5">$67,420</div>
                        <div className="text-[10px] font-bold text-emerald-400 font-mono flex items-center gap-0.5">
                            <TrendingUp className="w-3 h-3" /> +2.4%
                        </div>
                    </div>

                    <div 
                        onClick={() => setActiveTab('trade')} 
                        className="p-2.5 rounded-xl border border-white/10 bg-white/[0.02] hover:border-cyan-500/40 cursor-pointer active:scale-95 transition"
                    >
                        <div className="text-[10px] text-slate-400 font-mono font-bold">ETH/USDT</div>
                        <div className="text-xs font-black text-white font-mono mt-0.5">$3,510</div>
                        <div className="text-[10px] font-bold text-emerald-400 font-mono flex items-center gap-0.5">
                            <TrendingUp className="w-3 h-3" /> +1.8%
                        </div>
                    </div>

                    <div 
                        onClick={() => setActiveTab('trade')} 
                        className="p-2.5 rounded-xl border border-white/10 bg-white/[0.02] hover:border-cyan-500/40 cursor-pointer active:scale-95 transition"
                    >
                        <div className="text-[10px] text-slate-400 font-mono font-bold">SOL/USDT</div>
                        <div className="text-xs font-black text-white font-mono mt-0.5">$184.5</div>
                        <div className="text-[10px] font-bold text-rose-400 font-mono flex items-center gap-0.5">
                            <TrendingDown className="w-3 h-3" /> -0.6%
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default TabHome;
