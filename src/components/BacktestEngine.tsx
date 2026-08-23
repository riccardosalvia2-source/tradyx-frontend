// ============================================================================
// TRADYX BACKTESTING STUDIO COMPONENT (src/components/BacktestEngine.tsx)
// Author: Senior Quantitative Developer & Front-End React/TypeScript Expert
// Description: Glassmorphic Quantitative Backtest Studio with parameter forms,
//              risk analytics metrics, equity curve visualization, and Supabase save.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { 
    BacktestStrategyConfig, 
    BacktestResults, 
    Candle 
} from '../types/backtest';
import { 
    generateHistoricalCandles, 
    runBacktest, 
    saveStrategyToSupabase 
} from '../services/backtestEngine';
import { 
    Play, 
    Save, 
    TrendingUp, 
    TrendingDown, 
    PieChart, 
    Activity, 
    ShieldAlert, 
    Sliders, 
    CheckCircle2 
} from 'lucide-react';

export const BacktestStudio: React.FC = () => {
    // Strategy Form Configuration State
    const [config, setConfig] = useState<BacktestStrategyConfig>({
        strategyName: 'Dip Buyer & Profit Scalper',
        initialCapital: 10000,
        asset: 'BTC/USDT',
        timeframe: '1h',
        buyDipPercentage: 1.5,
        takeProfitPercentage: 4.0,
        stopLossPercentage: 2.0
    });

    const [candles, setCandles] = useState<Candle[]>([]);
    const [results, setResults] = useState<BacktestResults | null>(null);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

    // Initial Backtest Run on Mount
    useEffect(() => {
        handleRunBacktest();
    }, []);

    const handleRunBacktest = () => {
        setSaveSuccess(false);
        const generatedCandles = generateHistoricalCandles(config.asset, config.timeframe, 150);
        setCandles(generatedCandles);
        const simResults = runBacktest(generatedCandles, config);
        setResults(simResults);
    };

    const handleSaveStrategy = async () => {
        if (!results) return;
        setIsSaving(true);
        const demoUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
        const res = await saveStrategyToSupabase(config, results, demoUserId);
        setIsSaving(false);
        if (res.success) {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 4000);
        }
    };

    return (
        <div className="space-y-8">
            
            {/* Top Control Panel: Strategy Config Form */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl shadow-2xl space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-cyan-400" />
                        Quantitative Backtest Parameters
                    </h3>
                    <span className="text-xs text-slate-500 font-mono">150 Historical Candles • Vectorized Engine</span>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleRunBacktest(); }} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Strategy Name</label>
                            <input
                                type="text"
                                value={config.strategyName}
                                onChange={(e) => setConfig({ ...config, strategyName: e.target.value })}
                                className="bg-slate-900 border border-slate-700 text-white rounded-lg p-3 w-full text-sm focus:border-cyan-500 outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Initial Capital ($)</label>
                            <input
                                type="number"
                                value={config.initialCapital}
                                onChange={(e) => setConfig({ ...config, initialCapital: Number(e.target.value) })}
                                className="bg-slate-900 border border-slate-700 text-white rounded-lg p-3 w-full text-sm font-mono focus:border-cyan-500 outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Target Asset</label>
                            <select
                                value={config.asset}
                                onChange={(e) => setConfig({ ...config, asset: e.target.value })}
                                className="bg-slate-900 border border-slate-700 text-white rounded-lg p-3 w-full text-sm focus:border-cyan-500 outline-none"
                            >
                                <option value="BTC/USDT">BTC/USDT</option>
                                <option value="ETH/USDT">ETH/USDT</option>
                                <option value="SOL/USDT">SOL/USDT</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Timeframe</label>
                            <select
                                value={config.timeframe}
                                onChange={(e) => setConfig({ ...config, timeframe: e.target.value as any })}
                                className="bg-slate-900 border border-slate-700 text-white rounded-lg p-3 w-full text-sm focus:border-cyan-500 outline-none"
                            >
                                <option value="1h">1 Hour (1h)</option>
                                <option value="4h">4 Hours (4h)</option>
                                <option value="1d">1 Day (1d)</option>
                            </select>
                        </div>
                    </div>

                    {/* Entry/Exit Rule Triggers */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Buy Dip % (Entry Condition)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={config.buyDipPercentage}
                                    onChange={(e) => setConfig({ ...config, buyDipPercentage: Number(e.target.value) })}
                                    className="bg-slate-900 border border-slate-700 text-cyan-400 font-mono rounded-lg p-3 w-full text-sm focus:border-cyan-500 outline-none"
                                    required
                                />
                                <span className="absolute right-3 top-3 text-xs text-slate-500">%</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Take Profit Target %
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={config.takeProfitPercentage}
                                    onChange={(e) => setConfig({ ...config, takeProfitPercentage: Number(e.target.value) })}
                                    className="bg-slate-900 border border-slate-700 text-emerald-400 font-mono rounded-lg p-3 w-full text-sm focus:border-cyan-500 outline-none"
                                    required
                                />
                                <span className="absolute right-3 top-3 text-xs text-slate-500">%</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Stop Loss Target %
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={config.stopLossPercentage}
                                    onChange={(e) => setConfig({ ...config, stopLossPercentage: Number(e.target.value) })}
                                    className="bg-slate-900 border border-slate-700 text-rose-400 font-mono rounded-lg p-3 w-full text-sm focus:border-cyan-500 outline-none"
                                    required
                                />
                                <span className="absolute right-3 top-3 text-xs text-slate-500">%</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4">
                        <button
                            type="submit"
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-2xl transition shadow-lg shadow-cyan-500/20 active:scale-[0.99]"
                        >
                            <Play className="w-4 h-4 fill-slate-950" />
                            Run Quantitative Backtest
                        </button>

                        <button
                            type="button"
                            onClick={handleSaveStrategy}
                            disabled={isSaving || !results}
                            className="flex items-center gap-2 px-5 py-3 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-sm font-semibold rounded-2xl transition active:scale-95 disabled:opacity-50"
                        >
                            {saveSuccess ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span className="text-emerald-400">Strategy Saved to Supabase!</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 text-cyan-400" />
                                    <span>Save Strategy to Supabase</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Results Performance Metrics Grid */}
            {results && (
                <div className="space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        
                        {/* Net Profit & ROI */}
                        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-lg">
                            <div className="text-[10px] font-extrabold uppercase font-mono text-slate-400 tracking-wider">Net Profit</div>
                            <div className={`text-lg font-bold font-mono tracking-tight mt-1 ${results.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {results.netProfit >= 0 ? `+$${results.netProfit.toLocaleString()}` : `-$${Math.abs(results.netProfit).toLocaleString()}`}
                            </div>
                            <div className={`text-xs font-mono font-bold mt-1 ${results.roiPercentage >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {results.roiPercentage >= 0 ? `+${results.roiPercentage}% ROI` : `${results.roiPercentage}% ROI`}
                            </div>
                        </div>

                        {/* Final Capital */}
                        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-lg">
                            <div className="text-[10px] font-extrabold uppercase font-mono text-slate-400 tracking-wider">Final Equity</div>
                            <div className="text-lg font-bold font-mono tracking-tight text-white mt-1">
                                ${results.finalCapital.toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-400 font-mono mt-1">
                                Start: ${results.initialCapital.toLocaleString()}
                            </div>
                        </div>

                        {/* Win Rate */}
                        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-lg">
                            <div className="text-[10px] font-extrabold uppercase font-mono text-slate-400 tracking-wider">Win Rate</div>
                            <div className="text-lg font-bold font-mono tracking-tight text-cyan-400 mt-1">
                                {results.winRate}%
                            </div>
                            <div className="text-xs text-slate-400 font-mono mt-1">
                                {results.winningTrades}W / {results.losingTrades}L ({results.totalTrades} Total)
                            </div>
                        </div>

                        {/* Profit Factor */}
                        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-lg">
                            <div className="text-[10px] font-extrabold uppercase font-mono text-slate-400 tracking-wider">Profit Factor</div>
                            <div className="text-lg font-bold font-mono tracking-tight text-amber-400 mt-1">
                                {results.profitFactor}
                            </div>
                            <div className="text-xs text-slate-400 font-mono mt-1">
                                Gross Profit / Loss
                            </div>
                        </div>

                        {/* Max Drawdown % */}
                        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-lg">
                            <div className="text-[10px] font-extrabold uppercase font-mono text-slate-400 tracking-wider">Max Drawdown</div>
                            <div className="text-lg font-bold font-mono tracking-tight text-rose-400 mt-1 flex items-center gap-1">
                                <ShieldAlert className="w-4 h-4 text-rose-500" />
                                -{results.maxDrawdown}%
                            </div>
                            <div className="text-xs text-slate-400 font-mono mt-1">
                                -${results.maxDrawdownAmount.toLocaleString()} Peak
                            </div>
                        </div>

                        {/* Total Trades */}
                        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-lg">
                            <div className="text-[10px] font-extrabold uppercase font-mono text-slate-400 tracking-wider">Simulated Trades</div>
                            <div className="text-lg font-bold font-mono tracking-tight text-purple-400 mt-1">
                                {results.totalTrades}
                            </div>
                            <div className="text-xs text-slate-400 font-mono mt-1">
                                Trades Executed
                            </div>
                        </div>
                    </div>

                    {/* Active SVG Area Chart Equity Curve */}
                    <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl shadow-2xl space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-cyan-950 border border-cyan-800 rounded-xl text-cyan-400">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm sm:text-base font-extrabold text-white">Backtesting Equity Curve & Peak-to-Trough Drawdown</h4>
                                    <p className="text-xs text-slate-400 font-mono">Curva azionaria dinamica calcolata sui trade simulati</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-mono">
                                <div className="flex items-center gap-1.5 text-cyan-400">
                                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                                    <span>Equity ($)</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-rose-400">
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                                    <span>Drawdown (%)</span>
                                </div>
                            </div>
                        </div>

                        {/* Responsive SVG Chart Container */}
                        <div className="relative h-64 w-full bg-slate-950 border border-slate-800/80 rounded-2xl p-4 overflow-hidden shadow-inner">
                            {(() => {
                                const curve = results?.equityCurve || [];
                                if (curve.length === 0) return null;

                                const width = 600;
                                const height = 180;
                                const equities = curve.map(e => e.equity);
                                const minEq = Math.min(...equities) * 0.98;
                                const maxEq = Math.max(...equities) * 1.02;
                                const rangeEq = (maxEq - minEq) || 1;

                                const points = curve.map((pt, i) => {
                                    const x = (i / (curve.length - 1 || 1)) * width;
                                    const y = height - ((pt.equity - minEq) / rangeEq) * (height - 30) - 15;
                                    return { x, y, equity: pt.equity, drawdown: pt.drawdown, day: i + 1 };
                                });

                                const pathD = points.reduce((acc, pt, i) => 
                                    `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`, ''
                                );

                                const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

                                return (
                                    <div className="w-full h-full relative flex flex-col justify-between">
                                        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                                            <defs>
                                                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.45" />
                                                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.02" />
                                                </linearGradient>
                                            </defs>

                                            {/* Grid lines */}
                                            <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="#334155" strokeDasharray="3 3" opacity="0.3" />
                                            <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke="#334155" strokeDasharray="3 3" opacity="0.3" />
                                            <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="#334155" strokeDasharray="3 3" opacity="0.3" />

                                            {/* Area Fill */}
                                            <path d={areaD} fill="url(#equityGrad)" />

                                            {/* Line Stroke */}
                                            <path d={pathD} fill="none" stroke="#00F0FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                                            {/* Data Points */}
                                            {points.map((pt, i) => (
                                                <g key={i} className="group cursor-pointer">
                                                    <circle
                                                        cx={pt.x}
                                                        cy={pt.y}
                                                        r="4"
                                                        className="fill-cyan-400 stroke-slate-950 group-hover:r-6 transition-all"
                                                    />
                                                </g>
                                            ))}
                                        </svg>

                                        {/* Bottom Drawdown Indicator Bars */}
                                        <div className="absolute bottom-2 left-4 right-4 h-6 flex items-end gap-1 pointer-events-none opacity-50">
                                            {curve.map((pt, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex-1 bg-rose-500/60 rounded-t-sm"
                                                    style={{ height: `${Math.min(pt.drawdown * 3, 100)}%` }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Simulated Trades Table */}
                    <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                <PieChart className="w-4 h-4 text-cyan-400" />
                                Simulated Trades Log ({results?.tradesList?.length || 0})
                            </h4>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs font-mono">
                                <thead>
                                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                                        <th className="py-2.5 px-3">Trade ID</th>
                                        <th className="py-2.5 px-3">Entry Price</th>
                                        <th className="py-2.5 px-3">Exit Price</th>
                                        <th className="py-2.5 px-3">PnL ($)</th>
                                        <th className="py-2.5 px-3">ROI %</th>
                                        <th className="py-2.5 px-3">Exit Reason</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(results?.tradesList || []).map((tr) => {
                                        const isWin = tr.pnl >= 0;
                                        return (
                                            <tr key={tr.id} className="border-b border-slate-800/50 hover:bg-slate-950/60 transition">
                                                <td className="py-2.5 px-3 text-slate-300 font-bold">{tr.id}</td>
                                                <td className="py-2.5 px-3 text-slate-200">${tr.entryPrice.toLocaleString()}</td>
                                                <td className="py-2.5 px-3 text-slate-200">${tr.exitPrice.toLocaleString()}</td>
                                                <td className={`py-2.5 px-3 font-extrabold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {isWin ? `+$${tr.pnl.toLocaleString()}` : `-$${Math.abs(tr.pnl).toLocaleString()}`}
                                                </td>
                                                <td className={`py-2.5 px-3 font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {isWin ? `+${tr.pnlPercentage}%` : `${tr.pnlPercentage}%`}
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                                        tr.reason === 'TAKE_PROFIT' 
                                                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800' 
                                                            : tr.reason === 'STOP_LOSS' 
                                                            ? 'bg-rose-950 text-rose-400 border-rose-800' 
                                                            : 'bg-slate-800 text-slate-300 border-slate-700'
                                                    }`}>
                                                        {tr.reason}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
