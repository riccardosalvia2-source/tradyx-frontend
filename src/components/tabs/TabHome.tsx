// ============================================================================
// TRADYX MOBILE TAB 1: HOME (Institutional Equity Terminal)
// ============================================================================

import React, { useState } from 'react';
import { useTradeStore, DEFAULT_MOCK_TRADES } from '../../store/useTradeStore';
import { UserAccount } from '../../types/auth';
import { AppTab } from '../BottomNavBar';
import { 
    TrendingUp, 
    TrendingDown, 
    PlusCircle, 
    BrainCircuit, 
    ShieldCheck, 
    Activity, 
    ArrowUpRight, 
    ArrowDownRight, 
    CheckCircle2, 
    Layers, 
    BarChart3, 
    Sparkles, 
    Clock, 
    ChevronRight,
    Lock
} from 'lucide-react';

interface TabHomeProps {
    authUser: UserAccount | null;
    setActiveTab: (tab: AppTab) => void;
}

export const TabHome: React.FC<TabHomeProps> = ({ authUser, setActiveTab }) => {
    const { trades } = useTradeStore();
    const safeTrades = Array.isArray(trades) && trades.length > 0 ? trades : DEFAULT_MOCK_TRADES;

    // Financial calculations
    const totalPnl = safeTrades.reduce((acc, t) => acc + (Number(t?.pnl) || 0), 0);
    const startingCapital = 10000;
    const availableBalance = startingCapital + totalPnl;
    const isProfitable = totalPnl >= 0;

    const winningTrades = safeTrades.filter(t => (Number(t?.pnl) || 0) > 0).length;
    const totalTradeCount = safeTrades.length;
    const winRate = totalTradeCount > 0 ? ((winningTrades / totalTradeCount) * 100).toFixed(1) : '60.0';

    // Risk metrics
    const grossProfit = safeTrades.filter(t => (Number(t?.pnl) || 0) > 0).reduce((acc, t) => acc + Number(t.pnl), 0);
    const grossLoss = Math.abs(safeTrades.filter(t => (Number(t?.pnl) || 0) < 0).reduce((acc, t) => acc + Number(t.pnl), 0));
    const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : '5.50';
    const maxDrawdown = 520.00;

    // Monthly Allocation budget
    const monthlyBudget = 10000;
    const budgetUsed = 0;
    const budgetRemaining = monthlyBudget - budgetUsed;
    const utilizationRate = ((budgetUsed / monthlyBudget) * 100).toFixed(1);

    // Dynamic equity curve data points for Performance Flow
    const equityCurve = [
        { label: 'Start', value: 10000 },
        { label: 'Trade 1 (BTC)', value: 13735 },
        { label: 'Trade 2 (ETH)', value: 13315 },
        { label: 'Trade 3 (SOL)', value: 14595 },
        { label: 'Trade 4 (AAPL)', value: 14975 },
        { label: 'Trade 5 (TSLA)', value: 14425 },
    ];

    const [selectedPointIndex, setSelectedPointIndex] = useState<number>(equityCurve.length - 1);
    const activePoint = equityCurve[selectedPointIndex];

    // SVG coordinate calculations for responsive chart
    const minEquity = 9000;
    const maxEquity = 16000;
    const chartHeight = 120;
    const chartWidth = 320;

    const pointsCoordinates = equityCurve.map((pt, idx) => {
        const x = (idx / (equityCurve.length - 1)) * (chartWidth - 20) + 10;
        const normalizedY = (pt.value - minEquity) / (maxEquity - minEquity);
        const y = chartHeight - normalizedY * (chartHeight - 20) - 10;
        return { x, y, ...pt };
    });

    const pathD = pointsCoordinates.reduce((acc, pt, idx) => {
        return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    const areaD = `${pathD} L ${pointsCoordinates[pointsCoordinates.length - 1].x} ${chartHeight} L ${pointsCoordinates[0].x} ${chartHeight} Z`;

    const userName = authUser?.full_name ? authUser.full_name.toUpperCase() : 'SUCA';

    return (
        <div className="w-full flex flex-col space-y-4 px-3 sm:px-4 pt-2 pb-28 text-white select-none overflow-x-hidden">
            
            {/* 1. TOP HEADER CON NOTCH SAFE AREA & AVATAR T */}
            <header className="w-full flex items-center justify-between py-2 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#12141A] border border-[#00E599]/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,229,153,0.15)] shrink-0">
                        <span className="font-sans font-black text-base text-[#00E599]">T</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase font-semibold">
                            INSTITUTIONAL EQUITY TERMINAL
                        </span>
                        <h1 className="text-xs sm:text-sm font-extrabold text-white tracking-tight truncate max-w-[200px] sm:max-w-xs">
                            WELCOME, {userName}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#12141A] border border-white/5 text-[10px] font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00E599] animate-ping" />
                    <span className="text-[#00E599] font-bold">ONLINE</span>
                </div>
            </header>

            {/* 2. CARD PRINCIPALE SALDO: AVAILABLE BALANCE */}
            <section className="w-full rounded-2xl border border-white/5 bg-[#12141A] p-4 sm:p-5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#00E599]/5 blur-[60px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#1D68BD]/10 blur-[50px] rounded-full pointer-events-none" />

                <div className="relative z-10 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                                AVAILABLE BALANCE
                            </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00E599]/10 text-[#00E599] border border-[#00E599]/30 flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3" />
                            +44.25%
                        </span>
                    </div>

                    {/* Big figures formatted properly with no clipping */}
                    <div className="space-y-0.5">
                        <div className="text-3xl sm:text-4xl font-sans font-black tracking-tight text-[#00E599] break-words">
                            +{availableBalance.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </div>
                        <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 pt-1">
                            <span>Initial Capital:</span>
                            <span className="text-slate-200 font-semibold">10.000,00 €</span>
                        </div>
                    </div>

                    {/* MINI METRICHE AFFIANCATE RESPONSIVE */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5 font-mono">
                        <div className="p-2 sm:p-2.5 rounded-xl bg-[#08090C] border border-white/5 flex flex-col justify-center">
                            <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-tight">PNL TOTALE</span>
                            <span className="text-xs sm:text-sm font-extrabold text-[#00E599] truncate">
                                +{totalPnl.toLocaleString('it-IT', { minimumFractionDigits: 2 })} €
                            </span>
                        </div>
                        <div className="p-2 sm:p-2.5 rounded-xl bg-[#08090C] border border-white/5 flex flex-col justify-center text-center">
                            <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-tight">TRADE TOTALI</span>
                            <span className="text-xs sm:text-sm font-extrabold text-white">
                                {totalTradeCount}
                            </span>
                        </div>
                        <div className="p-2 sm:p-2.5 rounded-xl bg-[#08090C] border border-white/5 flex flex-col justify-center text-right">
                            <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-tight">WIN RATE</span>
                            <span className="text-xs sm:text-sm font-extrabold text-[#00E599]">
                                {winRate}%
                            </span>
                        </div>
                    </div>

                    {/* METRICHE DI RISCHIO: PROFIT FACTOR & DRAWDOWN */}
                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                        <div className="p-2 sm:p-2.5 rounded-xl bg-[#08090C] border border-white/5 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase">PROFIT FACTOR</span>
                                <span className="text-xs sm:text-sm font-black text-[#00E599]">5.50</span>
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#1D68BD] text-white">
                                HIGH EDGE
                            </span>
                        </div>

                        <div className="p-2 sm:p-2.5 rounded-xl bg-[#08090C] border border-white/5 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase">DRAWDOWN</span>
                                <span className="text-xs sm:text-sm font-black text-[#EF4444]">+{maxDrawdown.toLocaleString('it-IT', { minimumFractionDigits: 2 })} €</span>
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800">
                                CONTROLLED
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. MONTHLY ALLOCATION - BUDGET & WALLET PROTOCOL */}
            <section className="w-full rounded-2xl border border-white/5 bg-[#12141A] p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300">
                        <Layers className="w-3.5 h-3.5 text-[#00E599]" />
                        <span>MONTHLY ALLOCATION - BUDGET & WALLET PROTOCOL</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black bg-[#00E599]/20 text-[#00E599] border border-[#00E599]/40 uppercase">
                        OPTIMAL
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 uppercase">Monthly Budget:</span>
                        <div className="text-sm sm:text-base font-extrabold text-white">
                            +{monthlyBudget.toLocaleString('it-IT', { minimumFractionDigits: 2 })} €
                        </div>
                    </div>
                    <div className="space-y-0.5 text-right">
                        <span className="text-[10px] text-slate-400 uppercase">Remaining:</span>
                        <div className="text-sm sm:text-base font-extrabold text-[#00E599]">
                            +{budgetRemaining.toLocaleString('it-IT', { minimumFractionDigits: 2 })} €
                        </div>
                    </div>
                </div>

                {/* Progress bar Utilization */}
                <div className="space-y-1 pt-1 font-mono">
                    <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Utilization</span>
                        <span className="font-bold text-[#00E599]">{utilizationRate}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#08090C] overflow-hidden border border-white/5">
                        <div 
                            className="h-full bg-gradient-to-r from-[#00E599] to-[#1D68BD] rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(2, Number(utilizationRate))}%` }}
                        />
                    </div>
                </div>
            </section>

            {/* 4. GRAFICO "PERFORMANCE FLOW" */}
            <section className="w-full rounded-2xl border border-white/5 bg-[#12141A] p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-white">
                        <BarChart3 className="w-4 h-4 text-[#00E599]" />
                        <span>PERFORMANCE FLOW</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                        <span>Selected:</span>
                        <span className="text-[#00E599] font-bold">
                            {activePoint.value.toLocaleString('it-IT')} € ({activePoint.label})
                        </span>
                    </div>
                </div>

                {/* Interactive SVG Chart */}
                <div className="w-full h-36 bg-[#08090C] rounded-xl border border-white/5 p-2 relative flex items-center justify-center">
                    <svg 
                        viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                        className="w-full h-full overflow-visible"
                    >
                        <defs>
                            <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#00E599" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#00E599" stopOpacity="0.0" />
                            </linearGradient>
                        </defs>

                        {/* Subtle Horizontal grid lines */}
                        <line x1="0" y1="20" x2={chartWidth} y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                        <line x1="0" y1="60" x2={chartWidth} y2="60" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                        <line x1="0" y1="100" x2={chartWidth} y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

                        {/* Area fill */}
                        <path d={areaD} fill="url(#performanceGradient)" />

                        {/* Glowing stroke line */}
                        <path 
                            d={pathD} 
                            fill="none" 
                            stroke="#00E599" 
                            strokeWidth="2.5" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                        />

                        {/* Interactive Data Dots */}
                        {pointsCoordinates.map((pt, idx) => {
                            const isSelected = idx === selectedPointIndex;
                            return (
                                <g 
                                    key={idx} 
                                    onClick={() => setSelectedPointIndex(idx)}
                                    className="cursor-pointer"
                                >
                                    <circle
                                        cx={pt.x}
                                        cy={pt.y}
                                        r={isSelected ? 6 : 4}
                                        fill={isSelected ? '#00E599' : '#08090C'}
                                        stroke="#00E599"
                                        strokeWidth={isSelected ? '2.5' : '1.5'}
                                    />
                                    {isSelected && (
                                        <circle
                                            cx={pt.x}
                                            cy={pt.y}
                                            r="10"
                                            fill="#00E599"
                                            opacity="0.25"
                                        />
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </section>

            {/* 5. QUICK ACTIONS */}
            <section className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                    type="button"
                    onClick={() => setActiveTab('coach')}
                    className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-[#12141A] border border-white/5 hover:border-[#1D68BD] text-left transition-all active:scale-[0.98] flex items-center justify-between group cursor-pointer shadow-lg"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#1D68BD]/20 border border-[#1D68BD]/40 flex items-center justify-center shrink-0">
                            <BrainCircuit className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-white group-hover:text-cyan-300">
                                Gemini Copilot
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                                Risk Manager Protocol
                            </div>
                        </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('trade')}
                    className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-[#00E599] hover:bg-[#00d28b] text-[#08090C] font-black transition-all active:scale-[0.98] flex items-center justify-between group cursor-pointer shadow-lg shadow-[#00E599]/20"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#08090C]/15 flex items-center justify-center shrink-0">
                            <PlusCircle className="w-5 h-5 text-[#08090C] group-hover:rotate-90 transition-transform" />
                        </div>
                        <div className="text-left">
                            <div className="text-xs font-black uppercase tracking-tight text-[#08090C]">
                                Execute Journal
                            </div>
                            <div className="text-[10px] font-mono text-[#08090C]/80 font-bold">
                                Digital Order Records
                            </div>
                        </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#08090C] group-hover:translate-x-0.5 transition-all" />
                </button>
            </section>

        </div>
    );
};

export default TabHome;
