// ============================================================================
// TRADYX TRADE LIST COMPONENT (src/components/TradeList.tsx)
// ============================================================================

import React from 'react';
import { useTradeStore, DEFAULT_MOCK_TRADES } from '../store/useTradeStore';
import { History, TrendingUp, TrendingDown, Tag } from 'lucide-react';

export const TradeList: React.FC = () => {
    const { trades } = useTradeStore();
    const safeTrades = Array.isArray(trades) && trades.length > 0 ? trades : DEFAULT_MOCK_TRADES;

    if (!safeTrades || safeTrades.length === 0) {
        return (
            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl text-center text-slate-500">
                <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No trades logged yet. Submit a trade above or click a quick preset to see the Quasar Bubble react!
            </div>
        );
    }

    return (
        <div className="bg-slate-950/75 border border-slate-800/80 p-4 sm:p-6 rounded-3xl backdrop-blur-xl shadow-[0_0_30px_rgba(0,240,255,0.06)] hover:border-cyan-500/40 transition-all duration-300 space-y-4 w-full">
            <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                    <History className="w-5 h-5 text-cyan-400 shrink-0" />
                    <span>Trade Journal History ({safeTrades.length})</span>
                </h3>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {(safeTrades || []).map((trade) => {
                    const isProfit = (trade.pnl || 0) >= 0;
                    const isFomoOrLoss = !isProfit || trade.emotional_state === 'FOMO' || trade.emotional_state === 'Anxious';

                    return (
                        <div
                            key={trade.id}
                            className="bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition group shadow-lg min-w-0 break-words"
                        >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className={`p-2.5 rounded-xl shrink-0 ${isProfit ? 'bg-emerald-950/60 text-emerald-400' : 'bg-rose-950/60 text-rose-400'}`}>
                                    {trade.direction === 'LONG' ? (
                                        <TrendingUp className="w-5 h-5" />
                                    ) : (
                                        <TrendingDown className="w-5 h-5" />
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-bold text-slate-100 text-sm truncate">{trade.asset_pair}</span>
                                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${trade.direction === 'LONG' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                                            {trade.direction}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-400 mt-0.5 truncate">
                                        Size: {trade.position_size} | Entry: ${trade.entry_price.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                                <div className={`font-mono font-extrabold text-sm sm:text-base tracking-tight ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {isProfit ? `+$${(trade.pnl || 0).toLocaleString()}` : `-$${Math.abs(trade.pnl || 0).toLocaleString()}`}
                                </div>
                                
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <Tag className="w-3 h-3 text-slate-500 shrink-0" />
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${isFomoOrLoss ? 'bg-rose-950/80 text-rose-300 border-rose-700' : 'bg-cyan-950/80 text-cyan-300 border-cyan-700'}`}>
                                        {trade.emotional_state}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
