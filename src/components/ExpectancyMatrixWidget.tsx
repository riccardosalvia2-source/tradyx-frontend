// ============================================================================
// TRADYX EXPECTANCY & R:R MATRIX WIDGET (src/components/ExpectancyMatrixWidget.tsx)
// ============================================================================

import React from 'react';
import { Trade } from '../types/trade';
import { DEFAULT_MOCK_TRADES } from '../store/useTradeStore';
import { Calculator, Target, Percent, Scale, Award, AlertCircle, ShieldCheck } from 'lucide-react';

interface ExpectancyMatrixWidgetProps {
    trades?: Trade[];
}

export const ExpectancyMatrixWidget: React.FC<ExpectancyMatrixWidgetProps> = ({ trades }) => {
    const safeTrades = Array.isArray(trades) && trades.length > 0 ? trades : DEFAULT_MOCK_TRADES;
    const totalTrades = safeTrades.length;

    let winningTrades = 0;
    let losingTrades = 0;
    let totalWinPnl = 0;
    let totalLossPnl = 0;

    (safeTrades || []).forEach(t => {
        if (!t) return;
        const pnl = Number(t.pnl) || 0;
        if (pnl > 0) {
            winningTrades += 1;
            totalWinPnl += pnl;
        } else if (pnl < 0) {
            losingTrades += 1;
            totalLossPnl += Math.abs(pnl);
        }
    });

    const winRatePercent = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const lossRatePercent = totalTrades > 0 ? (losingTrades / totalTrades) * 100 : 0;

    const avgWin = winningTrades > 0 ? totalWinPnl / winningTrades : 0;
    const avgLoss = losingTrades > 0 ? totalLossPnl / losingTrades : 0;

    const realizedRR = avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? 3.0 : 0);

    const profitFactor = totalLossPnl > 0 ? totalWinPnl / totalLossPnl : (totalWinPnl > 0 ? 99 : 0);

    // Mathematical Expectancy per Trade ($ / E(R))
    // E(R) = (WinRate * AvgWin) - (LossRate * AvgLoss)
    const expectancyUSD = ((winRatePercent / 100) * avgWin) - ((lossRatePercent / 100) * avgLoss);

    const isPositiveEV = expectancyUSD > 0;

    return (
        <div className="bg-slate-950/75 border border-slate-800/80 rounded-3xl p-4 sm:p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(0,240,255,0.06)] hover:border-cyan-500/40 transition-all duration-300 space-y-5 font-sans w-full">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-cyan-950 to-blue-950 border border-cyan-500/40 rounded-2xl text-cyan-400 shrink-0">
                        <Calculator className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                            Expectancy & R:R Matrix
                        </h3>
                        <p className="text-xs text-slate-400 font-mono">
                            Statistica quantitativa, Valore Atteso ($EV) e Risk/Reward realizzato
                        </p>
                    </div>
                </div>

                <div className={`px-3 py-1 rounded-full text-xs font-mono font-bold border flex items-center gap-1.5 shrink-0 ${
                    isPositiveEV 
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/80' 
                        : 'bg-amber-950 text-amber-300 border-amber-500/80'
                }`}>
                    {isPositiveEV ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    <span>{isPositiveEV ? 'SISTEMA +$EV POSITIVO' : 'DRAWDOWN RISK'}</span>
                </div>
            </div>

            {/* Main Expectancy Badge Card */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 min-w-0 break-words">
                <div className="space-y-1 min-w-0 flex-1">
                    <div className="text-xs font-bold uppercase text-slate-400 font-mono flex items-center gap-2">
                        <Target className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>Expectancy Matematica ($ EV / Trade):</span>
                    </div>
                    <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight break-words min-w-0 ${isPositiveEV ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {expectancyUSD >= 0 ? '+' : ''}${expectancyUSD.toFixed(2)}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                        Media attesa di guadagno/perdita teorico per ogni singola operazione aperta a mercato.
                    </p>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-0.5 w-full sm:w-auto text-left sm:text-right font-mono shrink-0">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Profit Factor</div>
                    <div className="text-lg sm:text-xl font-extrabold text-cyan-300 tracking-tight">
                        {profitFactor.toFixed(2)}
                    </div>
                    <div className="text-[9px] text-slate-500">Gross Win / Gross Loss</div>
                </div>
            </div>

            {/* Quantitative Matrix Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-1 min-w-0 break-words">
                    <div className="text-[10px] font-bold text-slate-400 uppercase font-mono flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Win Rate Effettivo</span>
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-white font-mono tracking-tight">
                        {winRatePercent.toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                        {winningTrades} W / {losingTrades} L
                    </div>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-1 min-w-0 break-words">
                    <div className="text-[10px] font-bold text-slate-400 uppercase font-mono flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>Risk/Reward Realizzato</span>
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-purple-300 font-mono tracking-tight">
                        1 : {realizedRR.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">R:R Effettivo sul Campo</div>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-1 min-w-0 break-words">
                    <div className="text-[10px] font-bold text-slate-400 uppercase font-mono flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Vincita Media ($)</span>
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-emerald-400 font-mono tracking-tight">
                        +${Math.round(avgWin).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">Media trade vincenti</div>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-1 min-w-0 break-words">
                    <div className="text-[10px] font-bold text-slate-400 uppercase font-mono flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>Perdita Media ($)</span>
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-rose-400 font-mono tracking-tight">
                        -${Math.round(avgLoss).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">Media trade perdenti</div>
                </div>
            </div>

        </div>
    );
};
