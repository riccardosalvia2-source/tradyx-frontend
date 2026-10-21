// ============================================================================
// TRADYX MOBILE TAB 1: HOME (Institutional Equity Terminal)
// Calibrated Dark Fintech Aesthetic (#10B981 Emerald, #DC2626 Crimson, #2563EB Navy)
// ============================================================================

import React, { useState } from 'react';
import { useTradeStore, DEFAULT_MOCK_TRADES } from '../../store/useTradeStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { UserAccount } from '../../types/auth';
import { AppTab } from '../BottomNavBar';
import { ProfileProtocolModal } from '../ProfileProtocolModal';
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
    Lock,
    Settings,
    Coins
} from 'lucide-react';

interface TabHomeProps {
    authUser: UserAccount | null;
    setActiveTab: (tab: AppTab) => void;
}

export const TabHome: React.FC<TabHomeProps> = ({ authUser, setActiveTab }) => {
    const { trades } = useTradeStore();
    const { 
        baseCurrency, 
        protocolName, 
        monthlyBudget, 
        reinvestProfits, 
        selectedPlan,
        isProfileModalOpen, 
        setIsProfileModalOpen,
        formatMoney 
    } = useSettingsStore();

    const safeTrades = Array.isArray(trades) && trades.length > 0 ? trades : DEFAULT_MOCK_TRADES;

    // Financial calculations
    const totalPnl = safeTrades.reduce((acc, t) => acc + (Number(t?.pnl) || 0), 0);
    const startingCapital = monthlyBudget || 10000;
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
    const budgetUsed = Math.min(startingCapital, 1200);
    const budgetRemaining = Math.max(0, startingCapital - budgetUsed);
    const utilizationRate = ((budgetUsed / startingCapital) * 100).toFixed(1);

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

    const displayName = protocolName || authUser?.full_name || 'RICCARDO SALVIA';
    const displayInitial = displayName ? displayName.charAt(0).toUpperCase() : 'T';

    return (
        <div className="w-full flex flex-col space-y-4 px-3 sm:px-4 pt-2 pb-28 text-white select-none overflow-x-hidden">
            
            {/* 1. TOP HEADER WITH CIRCULAR AVATAR & SUBTLE NEON RING */}
            <header className="w-full flex items-center justify-between py-2.5 px-3 rounded-2xl glass-header">
                <div className="flex items-center gap-3">
                    {/* AVATAR TRIGGER IN TOP-LEFT: Clicking opens PROFILE & PROTOCOL SETTINGS */}
                    <button
                        type="button"
                        onClick={() => setIsProfileModalOpen(true)}
                        className="relative group cursor-pointer focus:outline-none"
                        title="Apri Profile & Protocol Settings"
                    >
                        {/* Subtle Ring Glow */}
                        <div className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-[#10B981] to-[#2563EB] opacity-60 group-hover:opacity-100 blur-[2px] transition duration-300" />
                        
                        <div className="relative w-10 h-10 rounded-full bg-[#111318] border border-[#10B981]/50 flex items-center justify-center shadow-md transition-transform group-hover:scale-105 active:scale-95">
                            <span className="font-sans font-black text-base text-[#10B981]">
                                {displayInitial}
                            </span>
                        </div>

                        {/* Online active micro-pill */}
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#10B981] border-2 border-[#08090C]" />
                    </button>

                    <div className="flex flex-col text-left">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-[#9CA3AF] tracking-wider uppercase font-semibold">
                                INSTITUTIONAL TERMINAL
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-[#10B981]/15 text-[#10B981]">
                                {baseCurrency.code} ({baseCurrency.symbol})
                            </span>
                        </div>
                        <h1 className="text-xs sm:text-sm font-extrabold text-white tracking-tight truncate max-w-[190px] sm:max-w-xs uppercase">
                            WELCOME, {displayName}
                        </h1>
                    </div>
                </div>

                {/* Right Header Status / Profile trigger pill */}
                <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-subcard hover:border-[#10B981]/40 text-[10px] font-mono transition-all cursor-pointer group"
                >
                    <Settings className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#10B981] transition-transform group-hover:rotate-45" />
                    <span className="text-[#10B981] font-bold">{selectedPlan.toUpperCase()}</span>
                </button>
            </header>

            {/* 2. CARD PRINCIPALE SALDO: AVAILABLE BALANCE */}
            <section className="w-full rounded-2xl glass-panel p-4 sm:p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-44 h-44 bg-[#10B981]/5 blur-[60px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#2563EB]/10 blur-[50px] rounded-full pointer-events-none" />

                <div className="relative z-10 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-mono uppercase tracking-wider text-[#9CA3AF] font-bold">
                                AVAILABLE BALANCE
                            </span>
                            {reinvestProfits && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                                    COMPOUND
                                </span>
                            )}
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 flex items-center gap-1 tabular-nums">
                            <ArrowUpRight className="w-3 h-3" />
                            +44.25%
                        </span>
                    </div>

                    {/* Big figures formatted dynamically with baseCurrency */}
                    <div className="space-y-0.5">
                        <div className="text-3xl sm:text-4xl font-sans font-black tracking-tight text-[#10B981] break-words tabular-nums">
                            {formatMoney(availableBalance, true)}
                        </div>
                        <div className="text-xs text-[#9CA3AF] font-mono flex items-center gap-1.5 pt-1">
                            <span>Initial Capital:</span>
                            <span className="text-slate-200 font-semibold tabular-nums">
                                {formatMoney(startingCapital, false)}
                            </span>
                        </div>
                    </div>

                    {/* MINI METRICHE AFFIANCATE RESPONSIVE */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/[0.08] font-mono">
                        <div className="p-2 sm:p-2.5 rounded-xl glass-subcard flex flex-col justify-center">
                            <span className="text-[9px] sm:text-[10px] text-[#9CA3AF] uppercase tracking-tight">PNL TOTALE</span>
                            <span className="text-xs sm:text-sm font-extrabold text-[#10B981] truncate tabular-nums">
                                {formatMoney(totalPnl, true)}
                            </span>
                        </div>
                        <div className="p-2 sm:p-2.5 rounded-xl glass-subcard flex flex-col justify-center text-center">
                            <span className="text-[9px] sm:text-[10px] text-[#9CA3AF] uppercase tracking-tight">TRADE TOTALI</span>
                            <span className="text-xs sm:text-sm font-extrabold text-white tabular-nums">
                                {totalTradeCount}
                            </span>
                        </div>
                        <div className="p-2 sm:p-2.5 rounded-xl glass-subcard flex flex-col justify-center text-right">
                            <span className="text-[9px] sm:text-[10px] text-[#9CA3AF] uppercase tracking-tight">WIN RATE</span>
                            <span className="text-xs sm:text-sm font-extrabold text-[#10B981] tabular-nums">
                                {winRate}%
                            </span>
                        </div>
                    </div>

                    {/* METRICHE DI RISCHIO: PROFIT FACTOR & DRAWDOWN */}
                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                        <div className="p-2 sm:p-2.5 rounded-xl glass-subcard flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[9px] sm:text-[10px] text-[#9CA3AF] uppercase">PROFIT FACTOR</span>
                                <span className="text-xs sm:text-sm font-black text-[#10B981] tabular-nums">5.50</span>
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#2563EB] text-white">
                                HIGH EDGE
                            </span>
                        </div>

                        <div className="p-2 sm:p-2.5 rounded-xl glass-subcard flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[9px] sm:text-[10px] text-[#9CA3AF] uppercase">DRAWDOWN</span>
                                <span className="text-xs sm:text-sm font-black text-[#DC2626] tabular-nums">
                                    {formatMoney(maxDrawdown, true)}
                                </span>
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#DC2626]/20 text-[#DC2626] border border-[#DC2626]/30">
                                CONTROLLED
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. MONTHLY ALLOCATION - BUDGET & WALLET PROTOCOL */}
            <section className="w-full rounded-2xl glass-panel p-4 sm:p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300">
                        <Layers className="w-3.5 h-3.5 text-[#10B981]" />
                        <span>MONTHLY ALLOCATION - BUDGET & WALLET PROTOCOL</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 uppercase">
                        OPTIMAL
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="space-y-0.5">
                        <span className="text-[10px] text-[#9CA3AF] uppercase">Monthly Budget:</span>
                        <div className="text-sm sm:text-base font-extrabold text-white tabular-nums">
                            {formatMoney(startingCapital, true)}
                        </div>
                    </div>
                    <div className="space-y-0.5 text-right">
                        <span className="text-[10px] text-[#9CA3AF] uppercase">Remaining:</span>
                        <div className="text-sm sm:text-base font-extrabold text-[#10B981] tabular-nums">
                            {formatMoney(budgetRemaining, true)}
                        </div>
                    </div>
                </div>

                {/* Progress bar Utilization */}
                <div className="space-y-1 pt-1 font-mono">
                    <div className="flex justify-between text-[10px] text-[#9CA3AF]">
                        <span>Utilization</span>
                        <span className="font-bold text-[#10B981] tabular-nums">{utilizationRate}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#08090C] overflow-hidden border border-white/5">
                        <div 
                            className="h-full bg-gradient-to-r from-[#10B981] to-[#2563EB] rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(4, Number(utilizationRate))}%` }}
                        />
                    </div>
                </div>
            </section>

            {/* 4. GRAFICO "PERFORMANCE FLOW" ISTITUZIONALE */}
            <section className="w-full rounded-2xl glass-panel p-4 sm:p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-white">
                        <BarChart3 className="w-4 h-4 text-[#10B981]" />
                        <span>PERFORMANCE FLOW</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#9CA3AF]">
                        <span>Selected:</span>
                        <span className="text-[#10B981] font-bold tabular-nums">
                            {formatMoney(activePoint.value, false)} ({activePoint.label})
                        </span>
                    </div>
                </div>

                {/* Vector SVG Chart with Smooth Gradient Underfill */}
                <div className="w-full h-36 glass-subcard rounded-xl p-2 relative flex items-center justify-center">
                    <svg 
                        viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                        className="w-full h-full overflow-visible"
                    >
                        <defs>
                            <linearGradient id="performanceFlowGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                                <stop offset="100%" stopColor="#08090C" stopOpacity="0.0" />
                            </linearGradient>
                        </defs>

                        {/* Subtle Horizontal grid lines */}
                        <line x1="0" y1="20" x2={chartWidth} y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                        <line x1="0" y1="60" x2={chartWidth} y2="60" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                        <line x1="0" y1="100" x2={chartWidth} y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

                        {/* Area fill */}
                        <path d={areaD} fill="url(#performanceFlowGradient)" />

                        {/* Crisp Line */}
                        <path 
                            d={pathD} 
                            fill="none" 
                            stroke="#10B981" 
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
                                        fill={isSelected ? '#10B981' : '#08090C'}
                                        stroke="#10B981"
                                        strokeWidth={isSelected ? '2.5' : '1.5'}
                                    />
                                    {isSelected && (
                                        <circle
                                            cx={pt.x}
                                            cy={pt.y}
                                            r="11"
                                            fill="#10B981"
                                            opacity="0.25"
                                        />
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </section>

            {/* 5. FLOATING QUASAR BUBBLE QUICK LAUNCHER (JADE GREEN) */}
            <section 
                onClick={() => setActiveTab('bubble')}
                className="w-full rounded-2xl glass-panel hover:border-[#10B981]/40 p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all group relative overflow-hidden"
            >
                <div className="flex items-center gap-3 relative z-10">
                    <div className="relative w-11 h-11 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2ECC71] to-[#27AE60] flex items-center justify-center shadow-md animate-jade-bubble">
                            <BrainCircuit className="w-5 h-5 text-white" />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono font-black text-white uppercase tracking-tight">
                                QUASAR BUBBLE • SENTIMENT GALAXY
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-[#DC2626]/20 text-[#DC2626] border border-[#DC2626]/30">
                                70% FEAR
                            </span>
                        </div>
                        <span className="text-[10px] text-[#9CA3AF] font-mono block">
                            Tocca per accedere alla bolla e alle 50+ news istituzionali
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-[#10B981] group-hover:translate-x-1 transition-transform relative z-10">
                    <span className="hidden sm:inline">EXPLORE</span>
                    <ChevronRight className="w-4 h-4 text-[#10B981]" />
                </div>
            </section>

            {/* 6. QUICK ACTIONS */}
            <section className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                    type="button"
                    onClick={() => setActiveTab('coach')}
                    className="w-full min-h-[48px] px-4 py-3 rounded-xl glass-panel hover:border-[#2563EB] text-left transition-all active:scale-[0.98] flex items-center justify-between group cursor-pointer shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#2563EB]/20 border border-[#2563EB]/40 flex items-center justify-center shrink-0">
                            <BrainCircuit className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-white group-hover:text-cyan-300">
                                Gemini Copilot
                            </div>
                            <div className="text-[10px] text-[#9CA3AF] font-mono">
                                Risk Manager Protocol
                            </div>
                        </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('trade')}
                    className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-black transition-all active:scale-[0.98] flex items-center justify-between group cursor-pointer shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-black/20 flex items-center justify-center shrink-0">
                            <PlusCircle className="w-5 h-5 text-white group-hover:rotate-90 transition-transform" />
                        </div>
                        <div className="text-left">
                            <div className="text-xs font-black uppercase tracking-tight text-white">
                                Execute Journal
                            </div>
                            <div className="text-[10px] font-mono text-white/80 font-bold">
                                Digital Order Records
                            </div>
                        </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-all" />
                </button>
            </section>

            {/* FULL SCREEN PROFILE & PROTOCOL SETTINGS MODAL */}
            <ProfileProtocolModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />

        </div>
    );
};

export default TabHome;
