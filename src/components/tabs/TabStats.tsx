// ============================================================================
// TRADYX MOBILE TAB 4: STATS (Performance Analytics)
// Institutional Standard / Dark Fintech Terminal
// Linear, Raycast & Bloomberg Terminal Aesthetics
// ============================================================================

import React, { useState } from 'react';
import { useTradeStore, DEFAULT_MOCK_TRADES } from '../../store/useTradeStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { 
    BarChart2, 
    TrendingUp, 
    TrendingDown, 
    Calendar, 
    Clock, 
    ShieldAlert, 
    Zap, 
    CheckCircle2, 
    AlertTriangle,
    Layers,
    Sparkles,
    Sliders,
    ArrowUpRight,
    ArrowDownRight,
    Target
} from 'lucide-react';

export const TabStats: React.FC = () => {
    const { trades } = useTradeStore();
    const { baseCurrency, formatMoney } = useSettingsStore();
    const safeTrades = Array.isArray(trades) && trades.length > 0 ? trades : DEFAULT_MOCK_TRADES;

    const [chartMode, setChartMode] = useState<'LINE' | 'CANDLE'>('LINE');

    // Financial aggregation
    const totalPnl = safeTrades.reduce((acc, t) => acc + (Number(t?.pnl) || 0), 0);
    const winTrades = safeTrades.filter(t => (Number(t?.pnl) || 0) > 0);
    const lossTrades = safeTrades.filter(t => (Number(t?.pnl) || 0) < 0);
    const winCount = winTrades.length;
    const lossCount = lossTrades.length;
    const totalCount = safeTrades.length;
    const winRate = totalCount > 0 ? ((winCount / totalCount) * 100).toFixed(1) : '60.0';
    const grossProfit = winTrades.reduce((acc, t) => acc + Number(t.pnl), 0);
    const grossLoss = Math.abs(lossTrades.reduce((acc, t) => acc + Number(t.pnl), 0));

    // Equity progression curve
    const equityData = [
        { session: 'Start', equity: 10000, open: 10000, high: 10000, low: 10000, close: 10000 },
        { session: 'S1 (BTC)', equity: 13735, open: 10000, high: 13900, low: 9900, close: 13735 },
        { session: 'S2 (ETH)', equity: 13315, open: 13735, high: 13800, low: 13200, close: 13315 },
        { session: 'S3 (SOL)', equity: 14595, open: 13315, high: 14700, low: 13300, close: 14595 },
        { session: 'S4 (AAPL)', equity: 14975, open: 14595, high: 15100, low: 14500, close: 14975 },
        { session: 'S5 (TSLA)', equity: 14425, open: 14975, high: 15000, low: 14350, close: 14425 },
    ];

    const [selectedEquityPoint, setSelectedEquityPoint] = useState<number>(equityData.length - 1);
    const activePoint = equityData[selectedEquityPoint];

    // Donut chart math
    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    const winRatio = totalCount > 0 ? (winCount / totalCount) : 0.6;
    const winDash = winRatio * circumference;
    const lossDash = circumference - winDash;

    // Monthly Heatmap Days (Intensity Scale based on daily P&L)
    const heatmapDays = [
        { day: 1, pnl: 0, intensity: 'EMPTY' },
        { day: 2, pnl: 0, intensity: 'EMPTY' },
        { day: 3, pnl: 0, intensity: 'EMPTY' },
        { day: 4, pnl: 3735, intensity: 'HIGH_WIN' },
        { day: 5, pnl: 0, intensity: 'EMPTY' },
        { day: 6, pnl: 0, intensity: 'EMPTY' },
        { day: 7, pnl: 0, intensity: 'EMPTY' },
        { day: 8, pnl: -420, intensity: 'MED_LOSS' },
        { day: 9, pnl: 0, intensity: 'EMPTY' },
        { day: 10, pnl: 0, intensity: 'EMPTY' },
        { day: 11, pnl: 0, intensity: 'EMPTY' },
        { day: 12, pnl: 1280, intensity: 'MED_WIN' },
        { day: 13, pnl: 0, intensity: 'EMPTY' },
        { day: 14, pnl: 0, intensity: 'EMPTY' },
        { day: 15, pnl: 0, intensity: 'EMPTY' },
        { day: 16, pnl: 0, intensity: 'EMPTY' },
        { day: 17, pnl: 380, intensity: 'LOW_WIN' },
        { day: 18, pnl: 0, intensity: 'EMPTY' },
        { day: 19, pnl: 0, intensity: 'EMPTY' },
        { day: 20, pnl: 0, intensity: 'EMPTY' },
        { day: 21, pnl: 0, intensity: 'EMPTY' },
        { day: 22, pnl: -550, intensity: 'HIGH_LOSS' },
        { day: 23, pnl: 0, intensity: 'EMPTY' },
        { day: 24, pnl: 0, intensity: 'EMPTY' },
        { day: 25, pnl: 0, intensity: 'EMPTY' },
        { day: 26, pnl: 0, intensity: 'EMPTY' },
        { day: 27, pnl: 0, intensity: 'EMPTY' },
        { day: 28, pnl: 0, intensity: 'EMPTY' },
        { day: 29, pnl: 0, intensity: 'EMPTY' },
        { day: 30, pnl: 0, intensity: 'EMPTY' },
        { day: 31, pnl: 0, intensity: 'EMPTY' },
    ];

    const [selectedHeatmapDay, setSelectedHeatmapDay] = useState<number | null>(4);
    const activeDayInfo = heatmapDays.find(d => d.day === selectedHeatmapDay);

    // Hourly distribution data
    const hourlyDistribution = [
        { hour: '08:00', count: 0, pnl: 0, isWin: null },
        { hour: '10:00', count: 1, pnl: 3735, isWin: true },
        { hour: '12:00', count: 0, pnl: 0, isWin: null },
        { hour: '14:00', count: 2, pnl: 860, isWin: true },
        { hour: '16:00', count: 1, pnl: -420, isWin: false },
        { hour: '18:00', count: 0, pnl: 0, isWin: null },
        { hour: '20:00', count: 1, pnl: -550, isWin: false },
    ];

    // Impact of errors data
    const errorImpacts = [
        { error: 'FOMO', avgLoss: -420, count: 1, barWidth: '45%' },
        { error: 'OVERTRADING', avgLoss: -550, count: 1, barWidth: '60%' },
        { error: 'EARLY EXIT', avgLoss: -550, count: 1, barWidth: '60%' },
        { error: 'NO STOP LOSS', avgLoss: 0, count: 0, barWidth: '0%' },
        { error: 'REVENGE TRADING', avgLoss: 0, count: 0, barWidth: '0%' },
    ];

    // SVG coordinates calculation for Equity Curve
    const minVal = 9000;
    const maxVal = 16000;
    const chartW = 320;
    const chartH = 130;

    const points = equityData.map((pt, idx) => {
        const x = (idx / (equityData.length - 1)) * (chartW - 24) + 12;
        const normalizedY = (pt.equity - minVal) / (maxVal - minVal);
        const y = chartH - normalizedY * (chartH - 24) - 12;
        return { x, y, ...pt };
    });

    const pathLine = points.reduce((acc, pt, idx) => {
        return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    const areaFill = `${pathLine} L ${points[points.length - 1].x} ${chartH} L ${points[0].x} ${chartH} Z`;

    return (
        <div className="w-full flex flex-col space-y-4 px-3 sm:px-4 pt-2 pb-28 text-white select-none overflow-x-hidden">
            
            {/* Top Compact Section Header */}
            <header className="w-full flex items-center justify-between py-2 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#111318] border border-[#00E599]/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,229,153,0.2)] shrink-0">
                        <span className="font-sans font-black text-base text-[#00E599]">T</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase font-semibold">
                            QUANT ANALYTICS TERMINAL
                        </span>
                        <h1 className="text-sm font-extrabold text-white tracking-tight font-mono">
                            PERFORMANCE STATS
                        </h1>
                    </div>
                </div>

                {/* SWITCH "LINE / CANDLE" */}
                <div className="flex items-center bg-[#111318] p-0.5 rounded-xl border border-white/[0.08] font-mono text-[10px]">
                    <button
                        type="button"
                        onClick={() => setChartMode('LINE')}
                        className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                            chartMode === 'LINE'
                                ? 'bg-[#00E599] text-[#08090C] shadow-md shadow-[#00E599]/20'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        LINE
                    </button>
                    <button
                        type="button"
                        onClick={() => setChartMode('CANDLE')}
                        className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                            chartMode === 'CANDLE'
                                ? 'bg-[#00E599] text-[#08090C] shadow-md shadow-[#00E599]/20'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        CANDLE
                    </button>
                </div>
            </header>

            {/* 1. CARD "NET PROFIT" CON METRICHE ISTITUZIONALI */}
            <section className="w-full rounded-2xl border border-white/[0.08] bg-[#111318] p-4 sm:p-5 shadow-2xl relative overflow-hidden space-y-3">
                <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                        NET PROFIT
                    </span>
                    <div className="text-3xl sm:text-4xl font-sans font-black tracking-tight text-[#00E599] tabular-nums">
                        {formatMoney(totalPnl, true)}
                    </div>
                </div>

                {/* Badges: Consistency 60%, Profit Factor 5.50, Max Drawdown */}
                <div className="flex flex-wrap gap-2 pt-1 font-mono text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-[#1D68BD] text-white font-bold text-[11px] flex items-center gap-1 shadow-md">
                        <span>Consistency</span>
                        <strong className="tabular-nums">60%</strong>
                    </span>

                    <span className="px-2.5 py-1 rounded-lg bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30 font-bold text-[11px] flex items-center gap-1">
                        <span>Profit Factor</span>
                        <strong className="tabular-nums">5.50</strong>
                    </span>

                    <span className="px-2.5 py-1 rounded-lg bg-[#FF4D4D]/15 text-[#FF4D4D] border border-[#FF4D4D]/30 font-bold text-[11px] flex items-center gap-1">
                        <span>Max Drawdown</span>
                        <strong className="tabular-nums">{formatMoney(520, true)}</strong>
                    </span>
                </div>
            </section>

            {/* 2. CIAMBELLA GRAFICA "WIN / LOSS RATIO" */}
            <section className="w-full rounded-2xl border border-white/[0.08] bg-[#111318] p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <span className="text-xs font-mono font-bold text-white uppercase">
                        WIN / LOSS RATIO
                    </span>
                    <span className="text-[10px] font-mono text-[#00E599] font-bold tabular-nums">
                        {winRate}% EXPECTANCY
                    </span>
                </div>

                <div className="flex items-center justify-around py-2">
                    {/* SVG Radial Donut Chart */}
                    <div className="relative w-28 h-28 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            {/* Track circle */}
                            <circle
                                cx="50"
                                cy="50"
                                r={radius}
                                fill="transparent"
                                stroke="#08090C"
                                strokeWidth="12"
                            />
                            {/* Win segment (Neon Green) */}
                            <circle
                                cx="50"
                                cy="50"
                                r={radius}
                                fill="transparent"
                                stroke="#00E599"
                                strokeWidth="12"
                                strokeDasharray={`${winDash} ${circumference}`}
                                strokeDashoffset="0"
                                strokeLinecap="round"
                            />
                            {/* Loss segment (Crimson Red) */}
                            <circle
                                cx="50"
                                cy="50"
                                r={radius}
                                fill="transparent"
                                stroke="#FF4D4D"
                                strokeWidth="12"
                                strokeDasharray={`${lossDash} ${circumference}`}
                                strokeDashoffset={`-${winDash}`}
                                strokeLinecap="round"
                            />
                        </svg>

                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-xs font-black text-white font-mono tabular-nums">{winRate}%</span>
                            <span className="text-[8px] text-slate-400 font-mono uppercase">WIN RATE</span>
                        </div>
                    </div>

                    {/* Legend Details */}
                    <div className="space-y-2 font-mono text-xs">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-md bg-[#00E599] shrink-0" />
                            <div>
                                <span className="text-white font-bold tabular-nums">Wins: {winCount}</span>
                                <span className="text-[10px] text-slate-400 block tabular-nums">
                                    {formatMoney(grossProfit, true)}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-md bg-[#FF4D4D] shrink-0" />
                            <div>
                                <span className="text-white font-bold tabular-nums">Losses: {lossCount}</span>
                                <span className="text-[10px] text-slate-400 block tabular-nums">
                                    -{formatMoney(grossLoss, false)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. GRAFICO "EQUITY PERFORMANCE" (VETTORIALE FLUIDO CON GRADIENTE SFUMATO VERSO IL NERO) */}
            <section className="w-full rounded-2xl border border-white/[0.08] bg-[#111318] p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-white uppercase">
                        EQUITY PERFORMANCE ({chartMode} MODE)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                        Peak: {formatMoney(14975, false)}
                    </span>
                </div>

                {/* Interactive Tooltip bar */}
                <div className="px-3 py-1.5 rounded-lg bg-[#08090C] border border-white/[0.06] flex items-center justify-between font-mono text-[11px]">
                    <span className="text-slate-400">Punto Attivo:</span>
                    <span className="text-[#00E599] font-bold tabular-nums">
                        {activePoint.session} • {formatMoney(activePoint.equity, false)}
                    </span>
                </div>

                <div className="w-full h-44 bg-[#08090C] rounded-xl border border-white/[0.06] p-2 relative flex items-center justify-center overflow-hidden">
                    {chartMode === 'LINE' ? (
                        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-full overflow-visible">
                            <defs>
                                <linearGradient id="equityUnderfillGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#00E599" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#08090C" stopOpacity="0.0" />
                                </linearGradient>
                            </defs>

                            {/* Crisp grid lines */}
                            <line x1="0" y1="25" x2={chartW} y2="25" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                            <line x1="0" y1="65" x2={chartW} y2="65" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                            <line x1="0" y1="105" x2={chartW} y2="105" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

                            {/* Underfill Gradient */}
                            <path d={areaFill} fill="url(#equityUnderfillGrad)" />

                            {/* 2px Crisp Line */}
                            <path 
                                d={pathLine} 
                                fill="none" 
                                stroke="#00E599" 
                                strokeWidth="2.5" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                            />

                            {/* Interactive Data Nodes */}
                            {points.map((pt, idx) => {
                                const isSel = idx === selectedEquityPoint;
                                return (
                                    <g
                                        key={idx}
                                        onClick={() => setSelectedEquityPoint(idx)}
                                        className="cursor-pointer"
                                    >
                                        <circle
                                            cx={pt.x}
                                            cy={pt.y}
                                            r={isSel ? 6 : 3.5}
                                            fill={isSel ? '#00E599' : '#08090C'}
                                            stroke="#00E599"
                                            strokeWidth={isSel ? '2.5' : '1.5'}
                                        />
                                        {isSel && (
                                            <circle
                                                cx={pt.x}
                                                cy={pt.y}
                                                r="12"
                                                fill="#00E599"
                                                opacity="0.25"
                                            />
                                        )}
                                    </g>
                                );
                            })}
                        </svg>
                    ) : (
                        /* Candle Simulation with Institutional Wicks & Bodies */
                        <div className="w-full h-full flex items-center justify-around px-2 pt-2">
                            {equityData.slice(1).map((candle, idx) => {
                                const isGreen = candle.close >= candle.open;
                                return (
                                    <div key={idx} className="flex flex-col items-center h-full justify-center w-8">
                                        <div className={`w-[1.5px] h-3 ${isGreen ? 'bg-[#00E599]' : 'bg-[#FF4D4D]'}`} />
                                        <div className={`w-4 h-14 rounded-sm ${isGreen ? 'bg-[#00E599]' : 'bg-[#FF4D4D]'}`} />
                                        <div className={`w-[1.5px] h-3 ${isGreen ? 'bg-[#00E599]' : 'bg-[#FF4D4D]'}`} />
                                        <span className="text-[8px] font-mono text-slate-500 mt-1">{candle.session.split(' ')[0]}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* 4. PERFORMANCE HEATMAP (GRIGLIA MENSILE A INTENSITÀ GRADIENTE) */}
            <section className="w-full rounded-2xl border border-white/[0.08] bg-[#111318] p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-cyan-400" />
                        PERFORMANCE HEATMAP (MONTHLY INTENSITY)
                    </span>
                    <div className="flex items-center gap-2 text-[9px] font-mono">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded bg-[#00E599]" /> Win
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded bg-[#FF4D4D]" /> Loss
                        </span>
                    </div>
                </div>

                {/* Day preview box when clicked */}
                {activeDayInfo && activeDayInfo.pnl !== 0 && (
                    <div className="p-2.5 rounded-xl bg-[#08090C] border border-white/[0.06] flex items-center justify-between font-mono text-xs animate-in fade-in">
                        <span className="text-slate-400">Giorno {activeDayInfo.day} Ottobre:</span>
                        <strong className={activeDayInfo.pnl > 0 ? 'text-[#00E599]' : 'text-[#FF4D4D]'}>
                            {formatMoney(activeDayInfo.pnl, true)}
                        </strong>
                    </div>
                )}

                <div className="grid grid-cols-7 gap-1.5 font-mono text-center">
                    {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((d, i) => (
                        <span key={i} className="text-[9px] text-slate-500 font-bold mb-1">
                            {d}
                        </span>
                    ))}
                    {heatmapDays.map((d) => {
                        let bgStyle = 'bg-[#08090C] text-slate-600 border-white/[0.04]';
                        
                        if (d.intensity === 'HIGH_WIN') {
                            bgStyle = 'bg-[#00E599] text-[#08090C] font-black border-[#00E599] shadow-[0_0_10px_rgba(0,229,153,0.5)]';
                        } else if (d.intensity === 'MED_WIN') {
                            bgStyle = 'bg-[#00B377] text-[#08090C] font-bold border-[#00B377]';
                        } else if (d.intensity === 'LOW_WIN') {
                            bgStyle = 'bg-[#00E599]/30 text-[#00E599] font-bold border-[#00E599]/40';
                        } else if (d.intensity === 'HIGH_LOSS') {
                            bgStyle = 'bg-[#FF4D4D] text-white font-black border-[#FF4D4D] shadow-[0_0_10px_rgba(255,77,77,0.5)]';
                        } else if (d.intensity === 'MED_LOSS') {
                            bgStyle = 'bg-[#FF4D4D]/60 text-white font-bold border-[#FF4D4D]/70';
                        }

                        const isSelected = selectedHeatmapDay === d.day;

                        return (
                            <div
                                key={d.day}
                                onClick={() => setSelectedHeatmapDay(d.day)}
                                title={d.pnl !== 0 ? `Day ${d.day}: ${d.pnl}` : `Day ${d.day}: No trades`}
                                className={`h-8 rounded-lg flex items-center justify-center text-[10px] border transition-transform duration-150 hover:scale-110 cursor-pointer ${bgStyle} ${
                                    isSelected ? 'ring-2 ring-white/80' : ''
                                }`}
                            >
                                {d.day}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* 5. ISTOGRAMMA "HOURLY DISTRIBUTION" CON BARRE ARROTONDATE E COLORE DINAMICO */}
            <section className="w-full rounded-2xl border border-white/[0.08] bg-[#111318] p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-purple-400" />
                        HOURLY DISTRIBUTION (EXECUTION EFFICIENCY)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">SESSION AUDIT</span>
                </div>

                <div className="flex items-end justify-between h-32 pt-2 px-1 font-mono">
                    {hourlyDistribution.map((h, i) => {
                        const height = h.count === 0 ? 8 : h.count === 1 ? 52 : 88;
                        const barColor = h.count === 0 
                            ? 'bg-[#08090C] border border-white/[0.06]' 
                            : h.isWin 
                            ? 'bg-[#00E599] shadow-[0_0_10px_rgba(0,229,153,0.3)]' 
                            : 'bg-[#FF4D4D] shadow-[0_0_10px_rgba(255,77,77,0.3)]';

                        return (
                            <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                                <span className={`text-[9px] font-bold tabular-nums ${
                                    h.count > 0 ? (h.isWin ? 'text-[#00E599]' : 'text-[#FF4D4D]') : 'text-slate-600'
                                }`}>
                                    {h.count > 0 ? `${h.count}t` : ''}
                                </span>
                                
                                <div 
                                    className={`w-6 rounded-t-md transition-all duration-300 ${barColor}`}
                                    style={{ height: `${height}px` }}
                                    title={h.count > 0 ? `${h.hour} - PnL: ${h.pnl} (${h.count} trades)` : `${h.hour} - No activity`}
                                />

                                <span className="text-[8px] text-slate-400 font-semibold">{h.hour}</span>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* 6. GRAFICO A GRADINI "DRAWDOWN ANALYSIS" (STEP LINE IN TONALITÀ ROSSO/ARANCIO) */}
            <section className="w-full rounded-2xl border border-white/[0.08] bg-[#111318] p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                        <TrendingDown className="w-4 h-4 text-[#FF4D4D]" />
                        DRAWDOWN ANALYSIS (STEPPED GEOMETRIC CURVE)
                    </span>
                    <span className="text-[10px] font-mono text-[#FF4D4D] font-bold tabular-nums">
                        PEAK DD: {formatMoney(520, true)}
                    </span>
                </div>

                <div className="w-full h-32 bg-[#08090C] rounded-xl border border-white/[0.06] p-2 flex items-center justify-center relative overflow-hidden">
                    <svg viewBox="0 0 320 80" className="w-full h-full overflow-visible">
                        <defs>
                            <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#FF4D4D" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#08090C" stopOpacity="0.0" />
                            </linearGradient>
                        </defs>

                        {/* Subtle Gridlines */}
                        <line x1="0" y1="20" x2="320" y2="20" stroke="rgba(255,255,255,0.06)" />
                        <line x1="0" y1="50" x2="320" y2="50" stroke="rgba(255,255,255,0.06)" />

                        {/* Underfill polygon for stepped path */}
                        <path
                            d="M 10 15 L 70 15 L 70 45 L 130 45 L 130 20 L 190 20 L 190 10 L 250 10 L 250 65 L 310 65 L 310 80 L 10 80 Z"
                            fill="url(#drawdownGradient)"
                        />

                        {/* Stepped line path in crisp red/orange */}
                        <path
                            d="M 10 15 L 70 15 L 70 45 L 130 45 L 130 20 L 190 20 L 190 10 L 250 10 L 250 65 L 310 65"
                            fill="none"
                            stroke="#FF4D4D"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="miter"
                        />
                    </svg>
                </div>
            </section>

            {/* 7. GRAFICO A BARRE "IMPACT OF ERRORS (AVG P&L)" */}
            <section className="w-full rounded-2xl border border-white/[0.08] bg-[#111318] p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-[#FF4D4D]" />
                        IMPACT OF ERRORS (LEAKAGE AUDIT)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">DISCIPLINE PENALTY</span>
                </div>

                <div className="space-y-2.5 font-mono">
                    {errorImpacts.map((item, idx) => (
                        <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-[10px]">
                                <span className="font-bold text-slate-300">{item.error} ({item.count})</span>
                                <span className="font-extrabold text-[#FF4D4D] tabular-nums">
                                    {formatMoney(item.avgLoss, true)}
                                </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-[#08090C] overflow-hidden border border-white/[0.06]">
                                <div
                                    className="h-full bg-[#FF4D4D] rounded-full transition-all duration-500"
                                    style={{ width: item.barWidth }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 8. CARD BLU RISALTO "CONSISTENCY FACTOR" (#1D68BD) */}
            <section className="w-full rounded-2xl bg-[#1D68BD] p-4 sm:p-5 shadow-2xl text-white space-y-2.5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-2xl rounded-full pointer-events-none" />

                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                        <span className="text-xs font-black uppercase tracking-wider font-mono">
                            CONSISTENCY FACTOR
                        </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-white text-[#1D68BD] font-mono font-black text-xs shadow-md">
                        82 / 100 EXCELLENT
                    </span>
                </div>

                <p className="text-xs leading-relaxed font-sans text-blue-100 relative z-10">
                    La tua disciplina di esecuzione sui setup trend-following continua a generare edge istituzionale. Eliminare le uscite premature (early exits) sui trade vincenti porterà il tuo profit factor sopra 6.0.
                </p>
            </section>

        </div>
    );
};

export default TabStats;
