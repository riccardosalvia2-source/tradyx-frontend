// ============================================================================
// TRADYX COST OF EMOTION BREAKDOWN WIDGET (src/components/CostOfEmotionWidget.tsx)
// ============================================================================

import React from 'react';
import { Trade, EmotionalState } from '../types/trade';
import { DEFAULT_MOCK_TRADES } from '../store/useTradeStore';
import { Brain, TrendingDown, TrendingUp, AlertTriangle, ShieldCheck, Flame, Zap } from 'lucide-react';

interface CostOfEmotionWidgetProps {
    trades?: Trade[];
}

export const CostOfEmotionWidget: React.FC<CostOfEmotionWidgetProps> = ({ trades }) => {
    const safeTrades = Array.isArray(trades) && trades.length > 0 ? trades : DEFAULT_MOCK_TRADES;

    // 1. Group PnL and counts by emotional state
    const emotionStats: Record<EmotionalState, { count: number; totalPnl: number; winCount: number }> = {
        Calm: { count: 0, totalPnl: 0, winCount: 0 },
        Disciplined: { count: 0, totalPnl: 0, winCount: 0 },
        Greedy: { count: 0, totalPnl: 0, winCount: 0 },
        Anxious: { count: 0, totalPnl: 0, winCount: 0 },
        FOMO: { count: 0, totalPnl: 0, winCount: 0 },
        Frustrated: { count: 0, totalPnl: 0, winCount: 0 }
    };

    let totalEmotionalLoss = 0;
    let totalDisciplinedProfit = 0;

    (safeTrades || []).forEach(t => {
        if (!t) return;
        const pnl = Number(t.pnl) || 0;
        const state = t.emotional_state || 'Calm';

        if (emotionStats[state]) {
            emotionStats[state].count += 1;
            emotionStats[state].totalPnl += pnl;
            if (pnl > 0) emotionStats[state].winCount += 1;
        }

        // Quantify Emotional Drag vs Disciplined Gains
        if (state === 'FOMO' || state === 'Greedy' || state === 'Anxious' || state === 'Frustrated') {
            if (pnl < 0) {
                totalEmotionalLoss += Math.abs(pnl);
            }
        } else if (state === 'Disciplined' || state === 'Calm') {
            if (pnl > 0) {
                totalDisciplinedProfit += pnl;
            }
        }
    });

    const netEmotionalImpact = totalDisciplinedProfit - totalEmotionalLoss;

    const emotionalStatesList: { key: EmotionalState; label: string; color: string; icon: React.ReactNode }[] = [
        { key: 'FOMO', label: 'FOMO (Inseguimento Prezzi)', color: 'from-rose-500 to-red-600', icon: <Flame className="w-3.5 h-3.5 text-rose-400" /> },
        { key: 'Frustrated', label: 'Revenge Trading (Rabbia)', color: 'from-amber-500 to-orange-600', icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> },
        { key: 'Greedy', label: 'Avidità (Target Mancati)', color: 'from-yellow-500 to-amber-600', icon: <Zap className="w-3.5 h-3.5 text-yellow-400" /> },
        { key: 'Anxious', label: 'Ansia & Taglio Anticipato', color: 'from-indigo-500 to-purple-600', icon: <Brain className="w-3.5 h-3.5 text-indigo-400" /> },
        { key: 'Disciplined', label: 'Trading Disciplinato', color: 'from-emerald-500 to-teal-500', icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> },
        { key: 'Calm', label: 'Stato Mentale Calmo', color: 'from-cyan-500 to-blue-500', icon: <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> }
    ];

    const maxPnlAbs = Math.max(
        ...Object.values(emotionStats).map(s => Math.abs(s.totalPnl)),
        100
    );

    return (
        <div className="bg-slate-950/75 border border-slate-800/80 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(0,240,255,0.06)] hover:border-cyan-500/40 transition-all duration-300 space-y-5 font-sans">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-rose-950 to-indigo-950 border border-rose-500/40 rounded-2xl text-rose-400">
                        <Brain className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                            Cost of Emotion Breakdown
                        </h3>
                        <p className="text-xs text-slate-400 font-mono">
                            Quantificazione monetaria delle perdite da bias emotivo vs trade disciplinati
                        </p>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-[11px] font-mono font-bold text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
                    BEHAVIORAL AUDIT
                </div>
            </div>

            {/* High Level Key Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-slate-950 border border-rose-950 rounded-2xl space-y-1">
                    <div className="text-[10px] font-bold uppercase text-slate-400 font-mono flex items-center gap-1.5">
                        <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                        Perdite da Bias Emotivo
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono">
                        -${totalEmotionalLoss.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">FOMO, Revenge & Avidità</div>
                </div>

                <div className="p-4 bg-slate-950 border border-emerald-950 rounded-2xl space-y-1">
                    <div className="text-[10px] font-bold uppercase text-slate-400 font-mono flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        Profitto da Disciplina
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                        +${totalDisciplinedProfit.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">Trade conforme al Plan</div>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                    <div className="text-[10px] font-bold uppercase text-slate-400 font-mono flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-cyan-400" />
                        Impatto Emotivo Netto
                    </div>
                    <div className={`text-xl sm:text-2xl font-black font-mono ${netEmotionalImpact >= 0 ? 'text-cyan-300' : 'text-amber-400'}`}>
                        {netEmotionalImpact >= 0 ? '+' : ''}${netEmotionalImpact.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">Delta PnL Comportamentale</div>
                </div>
            </div>

            {/* Detailed Emotional Breakdown Progress Bars */}
            <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Ripartizione PnL per Stato Emotivo:
                </div>

                <div className="space-y-2.5">
                    {emotionalStatesList.map(({ key, label, color, icon }) => {
                        const stat = emotionStats[key];
                        const pnl = stat.totalPnl;
                        const barPercent = Math.min(Math.round((Math.abs(pnl) / maxPnlAbs) * 100), 100);

                        return (
                            <div key={key} className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-mono">
                                    <span className="flex items-center gap-2 font-bold text-slate-200">
                                        {icon}
                                        {label}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[11px] text-slate-400">({stat.count} trade)</span>
                                        <span className={`font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {pnl >= 0 ? '+' : ''}${pnl.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full bg-gradient-to-r ${color} transition-all duration-500 rounded-full`}
                                        style={{ width: `${barPercent}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
};
