// ============================================================================
// TRADYX MOBILE TAB 3: HISTORY (History Logs & Detailed Inspection Drawer)
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useTradeStore, DEFAULT_MOCK_TRADES } from '../../store/useTradeStore';
import { Trade } from '../../types/trade';
import { 
    Search, 
    TrendingUp, 
    TrendingDown, 
    X, 
    Calendar, 
    ArrowUpRight, 
    ArrowDownRight, 
    Activity, 
    ShieldCheck, 
    AlertTriangle, 
    ChevronRight,
    Tag,
    Clock,
    DollarSign,
    Smile,
    Meh,
    Frown
} from 'lucide-react';

export const TabHistory: React.FC = () => {
    const { trades } = useTradeStore();
    const safeTrades = Array.isArray(trades) && trades.length > 0 ? trades : DEFAULT_MOCK_TRADES;

    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

    // Filter trades based on search query
    const filteredTrades = useMemo(() => {
        if (!searchQuery.trim()) return safeTrades;
        const q = searchQuery.toLowerCase();
        return safeTrades.filter(t => 
            t.asset_pair.toLowerCase().includes(q) ||
            (t.strategy && t.strategy.toLowerCase().includes(q)) ||
            (t.notes && t.notes.toLowerCase().includes(q)) ||
            (t.reasoning && t.reasoning.toLowerCase().includes(q))
        );
    }, [safeTrades, searchQuery]);

    const formatTimestamp = (isoDate: string) => {
        try {
            const d = new Date(isoDate);
            return d.toLocaleDateString('it-IT', { 
                day: '2-digit', 
                month: 'short', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } catch {
            return 'Recent';
        }
    };

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
                            AUDIT RECORDS
                        </span>
                        <h1 className="text-sm font-extrabold text-white tracking-tight">
                            TRADE HISTORY LOGS
                        </h1>
                    </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-[#12141A] border border-white/5 text-[10px] font-mono text-slate-300">
                    {safeTrades.length} RECORDED
                </span>
            </header>

            {/* BARRA DI RICERCA */}
            <div className="w-full relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search assets, strategies or notes..."
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-[#12141A] border border-white/5 text-white text-xs font-mono placeholder:text-slate-500 focus:border-[#00E599] focus:outline-none transition-colors"
                />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* LISTA VERTICALE A CARD PER OGNI TRADE REGISTRATO */}
            <div className="space-y-2.5">
                {filteredTrades.map((trade) => {
                    const isProfit = (trade.pnl || 0) >= 0;
                    const pnlFormatted = `${isProfit ? '+' : ''}${(trade.pnl || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })} €`;
                    const roiFormatted = trade.roi !== undefined ? `${trade.roi > 0 ? '+' : ''}${trade.roi}%` : '+0.0%';

                    return (
                        <div
                            key={trade.id}
                            onClick={() => setSelectedTrade(trade)}
                            className="w-full rounded-2xl border border-white/5 bg-[#12141A] p-3.5 sm:p-4 hover:border-white/20 transition-all duration-200 cursor-pointer active:scale-[0.99] shadow-lg flex flex-col space-y-2.5 group"
                        >
                            {/* Card Top Row: Asset Pair, Direction Badge, PnL */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg border ${
                                        trade.direction === 'LONG'
                                            ? 'bg-[#00E599]/10 text-[#00E599] border-[#00E599]/30'
                                            : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30'
                                    }`}>
                                        {trade.direction === 'LONG' ? (
                                            <TrendingUp className="w-4 h-4" />
                                        ) : (
                                            <TrendingDown className="w-4 h-4" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm font-extrabold text-white font-mono">
                                                {trade.asset_pair}
                                            </span>
                                            <span className={`text-[9px] font-black font-mono px-1.5 py-0.5 rounded uppercase ${
                                                trade.direction === 'LONG'
                                                    ? 'bg-[#00E599]/20 text-[#00E599]'
                                                    : 'bg-[#EF4444]/20 text-[#EF4444]'
                                            }`}>
                                                {trade.direction}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-mono">
                                            {formatTimestamp(trade.created_at)}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className={`text-sm sm:text-base font-black font-mono ${
                                        isProfit ? 'text-[#00E599]' : 'text-[#EF4444]'
                                    }`}>
                                        {pnlFormatted}
                                    </div>
                                    <div className={`text-[10px] font-mono font-bold ${
                                        isProfit ? 'text-[#00E599]/80' : 'text-[#EF4444]/80'
                                    }`}>
                                        ROI {roiFormatted}
                                    </div>
                                </div>
                            </div>

                            {/* Card Bottom Row: Strategy & Trigger preview */}
                            <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px] font-mono text-slate-400">
                                <span className="text-slate-300 truncate max-w-[200px] sm:max-w-xs">
                                    {trade.strategy || 'Tactical Setup'}
                                </span>
                                <div className="flex items-center gap-1 text-[10px] text-slate-400 group-hover:text-white transition-colors">
                                    <span>Details</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </div>
                            </div>
                        </div>
                    );
                })}

                {filteredTrades.length === 0 && (
                    <div className="w-full p-8 text-center rounded-2xl bg-[#12141A] border border-white/5 text-slate-400 font-mono text-xs">
                        No trade logs found matching "{searchQuery}"
                    </div>
                )}
            </div>

            {/* DETTAGLIO MODALE / BOTTOM DRAWER DEL TRADE */}
            {selectedTrade && (
                <div 
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
                    onClick={() => setSelectedTrade(null)}
                >
                    <div 
                        className="w-full max-w-lg bg-[#0D0E12] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-base font-black text-white font-mono">
                                    {selectedTrade.asset_pair}
                                </span>
                                <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded ${
                                    selectedTrade.direction === 'LONG' 
                                        ? 'bg-[#00E599]/20 text-[#00E599]' 
                                        : 'bg-[#EF4444]/20 text-[#EF4444]'
                                }`}>
                                    {selectedTrade.direction}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedTrade(null)}
                                className="w-8 h-8 rounded-full bg-[#12141A] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Net Performance Big Banner */}
                        <div className="p-4 rounded-2xl bg-[#12141A] border border-white/5 text-center space-y-1">
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                                NET PERFORMANCE
                            </span>
                            <div className={`text-2xl sm:text-3xl font-black font-mono ${
                                (selectedTrade.pnl || 0) >= 0 ? 'text-[#00E599]' : 'text-[#EF4444]'
                            }`}>
                                {(selectedTrade.pnl || 0) >= 0 ? '+' : ''}{(selectedTrade.pnl || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })} €
                            </div>
                            <span className="text-xs font-mono text-slate-300 block">
                                Strategy: <strong className="text-white">{selectedTrade.strategy || 'Trend Following'}</strong>
                            </span>
                        </div>

                        {/* Trade Parameters Grid */}
                        <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                            <div className="p-3 rounded-xl bg-[#12141A] border border-white/5">
                                <span className="text-[10px] text-slate-400 block">Entry Price:</span>
                                <span className="font-bold text-white">
                                    {selectedTrade.entry_price.toLocaleString('it-IT')} €
                                </span>
                            </div>

                            <div className="p-3 rounded-xl bg-[#12141A] border border-white/5">
                                <span className="text-[10px] text-slate-400 block">Exit Price:</span>
                                <span className="font-bold text-white">
                                    {selectedTrade.exit_price ? `${selectedTrade.exit_price.toLocaleString('it-IT')} €` : 'N/A'}
                                </span>
                            </div>

                            <div className="p-3 rounded-xl bg-[#12141A] border border-white/5">
                                <span className="text-[10px] text-slate-400 block">Position Size:</span>
                                <span className="font-bold text-white">
                                    {selectedTrade.position_size}
                                </span>
                            </div>

                            <div className="p-3 rounded-xl bg-[#12141A] border border-white/5">
                                <span className="text-[10px] text-slate-400 block">Risk Reward:</span>
                                <span className="font-bold text-white">
                                    {selectedTrade.risk_reward || '1:3.0'}
                                </span>
                            </div>
                        </div>

                        {/* Emotion State & Psychology */}
                        <div className="p-3 rounded-xl bg-[#12141A] border border-white/5 space-y-1">
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide block">
                                EMOTIONAL STATE / PSYCHOLOGY
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#1D68BD]/20 text-cyan-300 border border-[#1D68BD]/40 uppercase">
                                    {selectedTrade.psychology || selectedTrade.emotional_state || 'CONFIDENCE'}
                                </span>
                                {selectedTrade.errors && selectedTrade.errors.length > 0 && selectedTrade.errors.map(err => (
                                    <span key={err} className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40 uppercase">
                                        {err}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Strategic Reasoning & Notes */}
                        <div className="p-3.5 rounded-xl bg-[#12141A] border border-white/5 space-y-1.5 font-mono">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wide block font-bold">
                                STRATEGIC REASONING
                            </span>
                            <p className="text-xs text-slate-200 leading-relaxed">
                                {selectedTrade.reasoning || selectedTrade.notes || 'Institutional entry executed in accordance with core algorithmic risk rules.'}
                            </p>
                        </div>

                        {/* Close button */}
                        <button
                            type="button"
                            onClick={() => setSelectedTrade(null)}
                            className="w-full h-12 rounded-xl bg-[#12141A] hover:bg-[#1a1e27] border border-white/10 text-white font-mono text-xs font-bold uppercase transition cursor-pointer"
                        >
                            Chiudi Scheda Trade
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default TabHistory;
