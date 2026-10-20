// ============================================================================
// TRADYX MOBILE TAB 4: STATS (Performance Analytics)
// ============================================================================

import React, { useState } from 'react';
import { useTradeStore, DEFAULT_MOCK_TRADES } from '../../store/useTradeStore';
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
    Sliders
} from 'lucide-react';

export const TabStats: React.FC = () => {
    const { trades } = useTradeStore();
    const safeTrades = Array.isArray(trades) && trades.length > 0 ? trades : DEFAULT_MOCK_TRADES;

    const [chartMode, setChartMode] = useState<'LINE' | 'CANDLE'>('LINE');

    // Aggregate statistics
    const totalPnl = safeTrades.reduce((acc, t) => acc + (Number(t?.pnl) || 0), 0);
    const winTrades = safeTrades.filter(t => (Number(t?.pnl) || 0) > 0);
    const lossTrades = safeTrades.filter(t => (Number(t?.pnl) || 0) < 0);
    const winCount = winTrades.length;
    const lossCount = lossTrades.length;
    const totalCount = safeTrades.length;
    const winRate = totalCount > 0 ? ((winCount / totalCount) * 100).toFixed(1) : '60.0';

    // Mock Equity Curve Progression
    const equityData = [
        { session: 'Start', equity: 10000, open: 10000, high: 10000, low: 10000, close: 10000 },
        { session: 'S1 (BTC)', equity: 13735, open: 10000, high: 13900, low: 9900, close: 13735 },
        { session: 'S2 (ETH)', equity: 13315, open: 13735, high: 13800, low: 13200, close: 13315 },
        { session: 'S3 (SOL)', equity: 14595, open: 13315, high: 14700, low: 13300, close: 14595 },
        { session: 'S4 (AAPL)', equity: 14975, open: 14595, high: 15100, low: 14500, close: 14975 },
        { session: 'S5 (TSLA)', equity: 14425, open: 14975, high: 15000, low: 14350, close: 14425 },
    ];

    // Donut chart math
    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    const winRatio = winCount / totalCount;
    const winDash = winRatio * circumference;
    const lossDash = circumference - winDash;

    // Monthly Heatmap Days (1 to 31)
    const heatmapDays = Array.from({ length: 31 }, (_, i) => {
        const day = i + 1;
        // Map our mock trades to specific calendar days
        if (day === 4) return { day, status: 'WIN', pnl: '+3.735 €' };
        if (day === 8) return { day, status: 'LOSS', pnl: '-420 €' };
        if (day === 12) return { day, status: 'WIN', pnl: '+1.280 €' };
        if (day === 17) return { day, status: 'WIN', pnl: '+380 €' };
        if (day === 22) return { day, status: 'LOSS', pnl: '-550 €' };
        return { day, status: 'EMPTY', pnl: null };
    });

    // Hourly distribution data
    const hourlyDistribution = [
        { hour: '08:00', count: 0, pnl: 0 },
        { hour: '10:00', count: 1, pnl: 3735, isWin: true },
        { hour: '12:00', count: 0, pnl: 0 },
        { hour: '14:00', count: 2, pnl: 860, isWin: true },
        { hour: '16:00', count: 1, pnl: -420, isWin: false },
        { hour: '18:00', count: 0, pnl: 0 },
        { hour: '20:00', count: 1, pnl: -550, isWin: false },
    ];

    // Impact of errors data
    const errorImpacts = [
        { error: 'FOMO', avgLoss: '-420,00 €', count: 1, barWidth: '45%' },
        { error: 'OVERTRADING', avgLoss: '-550,00 €', count: 1, barWidth: '60%' },
        { error: 'EARLY EXIT', avgLoss: '-550,00 €', count: 1, barWidth: '60%' },
        { error: 'NO STOP LOSS', avgLoss: '0,00 €', count: 0, barWidth: '0%' },
        { error: 'REVENGE TRADING', avgLoss: '0,00 €', count: 0, barWidth: '0%' },
    ];

    return (
        <div className="w-full flex flex-col space-y-4 px-3 sm:px-4 pt-2 pb-28 text-white select-none overflow-x-hidden">
            
            {/* Top Compact Section Header */}
            <header className="w-full flex items-center justify-between py-2 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#12141A] border border-[#00E599]/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,229,153,0.15)] shrink-0">
                        <span className="font-sans font-black text-base text-[#00E599]">T</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase font-semibold">
                            QUANT ENGINE
                        </span>
                        <h1 className="text-sm font-extrabold text-white tracking-tight">
                            PERFORMANCE ANALYTICS
                        </h1>
                    </div>
                </div>

                {/* SWITCH "LINE / CANDLE" */}
                <div className="flex items-center bg-[#12141A] p-0.5 rounded-xl border border-white/10 font-mono text-[10px]">
                    <button
                        type="button"
                        onClick={() => setChartMode('LINE')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                            chartMode === 'LINE'
                                ? 'bg-[#00E599] text-[#08090C]'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        LINE
                    </button>
                    <button
                        type="button"
                        onClick={() => setChartMode('CANDLE')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                            chartMode === 'CANDLE'
                                ? 'bg-[#00E599] text-[#08090C]'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        CANDLE
                    </button>
                </div>
            </header>

            {/* 1. CARD "NET PROFIT (+4.425,00 €)" */}
            <section className="w-full rounded-2xl border border-white/5 bg-[#12141A] p-4 sm:p-5 shadow-2xl relative overflow-hidden space-y-3">
                <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                        NET PROFIT
                    </span>
                    <div className="text-3xl sm:text-4xl font-sans font-black tracking-tight text-[#00E599]">
                        +{totalPnl.toLocaleString('it-IT', { minimumFractionDigits: 2 })} €
                    </div>
                </div>

                {/* Badges: Consistency 60%, Profit Factor 5.50, Max Drawdown +520,00 € */}
                <div className="flex flex-wrap gap-2 pt-1 font-mono text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-[#1D68BD] text-white font-bold text-[11px] flex items-center gap-1 shadow-md">
                        <span>Consistency</span>
                        <strong>60%</strong>
                    </span>

                    <span className="px-2.5 py-1 rounded-lg bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30 font-bold text-[11px] flex items-center gap-1">
                        <span>Profit Factor</span>
                        <strong>5.50</strong>
                    </span>

                    <span className="px-2.5 py-1 rounded-lg bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 font-bold text-[11px] flex items-center gap-1">
                        <span>Max Drawdown</span>
                        <strong>+520,00 €</strong>
                    </span>
                </div>
            </section>

            {/* 2. CIAMBELLA GRAFICA "WIN/LOSS RATIO" */}
            <section className="w-full rounded-2xl border border-white/5 bg-[#12141A] p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-mono font-bold text-white uppercase">
                        WIN / LOSS RATIO
                    </span>
                    <span className="text-[10px] font-mono text-[#00E599] font-bold">
                        60.0% EXPECTANCY
                    </span>
                </div>

                <div className="flex items-center justify-around py-2">
                    {/* SVG Donut */}
                    <div className="relative w-28 h-28 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            {/* Background circle */}
                            <circle
                                cx="50"
                                cy="50"
                                r={radius}
                                fill="transparent"
                                stroke="#1a1e27"
                                strokeWidth="12"
                            />
                            {/* Win segment (Green) */}
                            <circle
                                cx="50"
                                cy="50"
                                r={radius}
                                fill="transparent"
                                stroke="#00E599"
                                strokeWidth="12"
                                strokeDasharray={`${winDash} ${circumference}`}
                                strokeDashoffset="0"
                            />
                            {/* Loss segment (Red) */}
                            <circle
                                cx="50"
                                cy="50"
                                r={radius}
                                fill="transparent"
                                stroke="#EF4444"
                                strokeWidth="12"
                                strokeDasharray={`${lossDash} ${circumference}`}
                                strokeDashoffset={`-${winDash}`}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-xs font-black text-white font-mono">{winRate}%</span>
                            <span className="text-[8px] text-slate-400 font-mono uppercase">WIN RATE</span>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="space-y-2 font-mono text-xs">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-md bg-[#00E599] shrink-0" />
                            <div>
                                <span className="text-white font-bold">Wins: {winCount}</span>
                                <span className="text-[10px] text-slate-400 block">+5.395,00 €</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-md bg-[#EF4444] shrink-0" />
                            <div>
                                <span className="text-white font-bold">Losses: {lossCount}</span>
                                <span className="text-[10px] text-slate-400 block">-970,00 €</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. GRAFICO "EQUITY PERFORMANCE" A TUTTA LARGHEZZA */}
            <section className="w-full rounded-2xl border border-white/5 bg-[#12141A] p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-white uppercase">
                        EQUITY PERFORMANCE ({chartMode} MODE)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                        Peak: 14.975,00 €
                    </span>
                </div>

                <div className="w-full h-44 bg-[#08090C] rounded-xl border border-white/5 p-2 relative flex items-center justify-center">
                    {chartMode === 'LINE' ? (
                        <svg viewBox="0 0 320 120" className="w-full h-full overflow-visible">
                            <defs>
                                <linearGradient id="statsLineGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#00E599" stopOpacity="0.35" />
                                    <stop offset="100%" stopColor="#00E599" stopOpacity="0.0" />
                                </linearGradient>
                            </defs>
                            <line x1="0" y1="20" x2="320" y2="20" stroke="rgba(255,255,255,0.05)" />
                            <line x1="0" y1="60" x2="320" y2="60" stroke="rgba(255,255,255,0.05)" />
                            <line x1="0" y1="100" x2="320" y2="100" stroke="rgba(255,255,255,0.05)" />
                            <path 
                                d="M 10 110 L 70 30 L 130 45 L 190 15 L 250 8 L 310 25 L 310 120 L 10 120 Z" 
                                fill="url(#statsLineGrad)" 
                            />
                            <path 
                                d="M 10 110 L 70 30 L 130 45 L 190 15 L 250 8 L 310 25" 
                                fill="none" 
                                stroke="#00E599" 
                                strokeWidth="2.5" 
                                strokeLinecap="round" 
                            />
                            {[
                                { x: 10, y: 110 },
                                { x: 70, y: 30 },
                                { x: 130, y: 45 },
                                { x: 190, y: 15 },
                                { x: 250, y: 8 },
                                { x: 310, y: 25 }
                            ].map((pt, i) => (
                                <circle key={i} cx={pt.x} cy={pt.y} r="3.5" fill="#00E599" />
                            ))}
                        </svg>
                    ) : (
                        /* Candle simulation */
                        <div className="w-full h-full flex items-center justify-around px-2 pt-2">
                            {equityData.slice(1).map((candle, idx) => {
                                const isGreen = candle.close >= candle.open;
                                return (
                                    <div key={idx} className="flex flex-col items-center h-full justify-center w-8">
                                        {/* Wick top */}
                                        <div className={`w-[1.5px] h-3 ${isGreen ? 'bg-[#00E599]' : 'bg-[#EF4444]'}`} />
                                        {/* Body */}
                                        <div className={`w-4 h-12 rounded-sm ${isGreen ? 'bg-[#00E599]' : 'bg-[#EF4444]'}`} />
                                        {/* Wick bottom */}
                                        <div className={`w-[1.5px] h-3 ${isGreen ? 'bg-[#00E599]' : 'bg-[#EF4444]'}`} />
                                        <span className="text-[8px] font-mono text-slate-500 mt-1">{candle.session.split(' ')[0]}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* 4. GRIGLIA CALENDARIO "PERFORMANCE HEATMAP" */}
            <section className="w-full rounded-2xl border border-white/5 bg-[#12141A] p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-cyan-400" />
                        PERFORMANCE HEATMAP (CURRENT MONTH)
                    </span>
                    <div className="flex items-center gap-2 text-[9px] font-mono">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded bg-[#00E599]" /> Win
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded bg-[#EF4444]" /> Loss
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1.5 font-mono text-center">
                    {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((d, i) => (
                        <span key={i} className="text-[9px] text-slate-500 font-bold mb-1">
                            {d}
                        </span>
                    ))}
                    {heatmapDays.map((d) => {
                        let bg = 'bg-[#08090C] text-slate-600 border-white/5';
                        if (d.status === 'WIN') bg = 'bg-[#00E599] text-[#08090C] font-black border-[#00E599] shadow-[0_0_8px_#00E599]';
                        if (d.status === 'LOSS') bg = 'bg-[#EF4444] text-white font-black border-[#EF4444] shadow-[0_0_8px_#EF4444]';

                        return (
                            <div
                                key={d.day}
                                title={d.pnl || `Giorno ${d.day}: No trades`}
                                className={`h-8 rounded-lg flex items-center justify-center text-[10px] border transition-transform duration-150 hover:scale-110 cursor-pointer ${bg}`}
                            >
                                {d.day}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* 5. ISTOGRAMMA "HOURLY DISTRIBUTION" */}
            <section className="w-full rounded-2xl border border-white/5 bg-[#12141A] p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-purple-400" />
                        HOURLY DISTRIBUTION
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">EXECUTION TIME</span>
                </div>

                <div className="flex items-end justify-between h-28 pt-2 px-1 font-mono">
                    {hourlyDistribution.map((h, i) => {
                        const height = h.count === 0 ? 6 : h.count === 1 ? 48 : 80;
                        const color = h.count === 0 ? 'bg-[#08090C]' : h.isWin ? 'bg-[#00E599]' : 'bg-[#EF4444]';
                        return (
                            <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                                <span className="text-[9px] text-slate-400 font-bold">
                                    {h.count > 0 ? h.count : ''}
                                </span>
                                <div 
                                    className={`w-5 rounded-t-md transition-all ${color}`}
                                    style={{ height: `${height}px` }}
                                />
                                <span className="text-[8px] text-slate-500">{h.hour}</span>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* 6. GRAFICO A GRADINI "DRAWDOWN ANALYSIS" */}
            <section className="w-full rounded-2xl border border-white/5 bg-[#12141A] p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-mono font-bold text-white uppercase">
                        DRAWDOWN ANALYSIS (STEPPED CURVE)
                    </span>
                    <span className="text-[10px] font-mono text-[#EF4444] font-bold">
                        MAX: +520,00 €
                    </span>
                </div>

                <div className="w-full h-28 bg-[#08090C] rounded-xl border border-white/5 p-2 flex items-center justify-center">
                    <svg viewBox="0 0 320 80" className="w-full h-full overflow-visible">
                        <line x1="0" y1="20" x2="320" y2="20" stroke="rgba(255,255,255,0.05)" />
                        <line x1="0" y1="60" x2="320" y2="60" stroke="rgba(255,255,255,0.05)" />
                        {/* Stepped line path */}
                        <path
                            d="M 10 15 L 70 15 L 70 45 L 130 45 L 130 20 L 190 20 L 190 10 L 250 10 L 250 65 L 310 65"
                            fill="none"
                            stroke="#EF4444"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        />
                    </svg>
                </div>
            </section>

            {/* 7. GRAFICO A BARRE "IMPACT OF ERRORS (AVG P&L)" */}
            <section className="w-full rounded-2xl border border-white/5 bg-[#12141A] p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-[#EF4444]" />
                        IMPACT OF ERRORS (AVG P&L)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">LEAKAGE AUDIT</span>
                </div>

                <div className="space-y-2.5 font-mono">
                    {errorImpacts.map((item, idx) => (
                        <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-[10px]">
                                <span className="font-bold text-slate-300">{item.error} ({item.count})</span>
                                <span className="font-extrabold text-[#EF4444]">{item.avgLoss}</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-[#08090C] overflow-hidden border border-white/5">
                                <div
                                    className="h-full bg-[#EF4444] rounded-full"
                                    style={{ width: item.barWidth }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 8. CARD BLU RISALTO "CONSISTENCY FACTOR" */}
            <section className="w-full rounded-2xl bg-[#1D68BD] p-4 sm:p-5 shadow-2xl text-white space-y-2.5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                        <span className="text-xs font-black uppercase tracking-wider font-mono">
                            CONSISTENCY FACTOR
                        </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-white text-[#1D68BD] font-mono font-black text-xs">
                        82 / 100 EXCELLENT
                    </span>
                </div>

                <p className="text-xs leading-relaxed font-sans text-blue-100">
                    Your disciplined execution on trend-following setups continues to drive institutional edge. Eliminating early exits on winning runners will elevate your profit factor above 6.0.
                </p>
            </section>

        </div>
    );
};

export default TabStats;
