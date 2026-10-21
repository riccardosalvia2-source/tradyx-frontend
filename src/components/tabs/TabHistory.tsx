// ============================================================================
// TRADYX MOBILE TAB 3: HISTORY (History Logs & Detailed Inspection Drawer)
// Calibrated Dark Fintech Aesthetic (#10B981 Emerald, #DC2626 Crimson, #2563EB Navy)
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useTradeStore, DEFAULT_MOCK_TRADES } from '../../store/useTradeStore';
import { useSettingsStore } from '../../store/useSettingsStore';
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
    CheckCircle2,
    FileText,
    Percent
} from 'lucide-react';

export const TabHistory: React.FC = () => {
    const { trades } = useTradeStore();
    const { baseCurrency, formatMoney } = useSettingsStore();
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
            (t.reasoning && t.reasoning.toLowerCase().includes(q)) ||
            (t.direction && t.direction.toLowerCase().includes(q))
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
                    <div className="w-9 h-9 rounded-xl bg-[#111318] border border-[#10B981]/40 flex items-center justify-center shadow-md shrink-0">
                        <span className="font-sans font-black text-base text-[#10B981]">T</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-[#9CA3AF] tracking-wider uppercase font-semibold">
                            AUDIT RECORDS
                        </span>
                        <h1 className="text-sm font-extrabold text-white tracking-tight font-mono">
                            TRADE HISTORY LOGS
                        </h1>
                    </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-[#111318] border border-white/5 text-[10px] font-mono text-[#10B981] font-bold">
                    {safeTrades.length} RECORDED
                </span>
            </header>

            {/* BARRA DI RICERCA */}
            <div className="w-full relative">
                <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search assets, strategies or notes..."
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#111318] border border-white/5 text-white text-xs font-mono placeholder:text-slate-500 focus:border-[#10B981] focus:outline-none transition-colors"
                />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-white"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* LISTA VERTICALE A CARD PER OGNI TRADE REGISTRATO */}
            <div className="space-y-2.5">
                {filteredTrades.map((trade) => {
                    const pnlVal = Number(trade.pnl) || 0;
                    const isProfit = pnlVal >= 0;
                    const roiFormatted = trade.roi !== undefined ? `${trade.roi > 0 ? '+' : ''}${trade.roi}%` : '+0.0%';

                    return (
                        <div
                            key={trade.id}
                            onClick={() => setSelectedTrade(trade)}
                            className="w-full rounded-2xl border border-white/5 bg-[#111318] p-3.5 sm:p-4 hover:border-white/20 transition-all duration-200 cursor-pointer active:scale-[0.99] shadow-lg flex flex-col space-y-2.5 group"
                        >
                            {/* Card Top Row: Asset Pair, Direction Badge, PnL */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className={`p-1.5 rounded-lg border ${
                                        trade.direction === 'LONG'
                                            ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                                            : 'bg-[#DC2626]/15 text-[#DC2626] border-[#DC2626]/30'
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
                                                    ? 'bg-[#10B981]/20 text-[#10B981]'
                                                    : 'bg-[#DC2626]/20 text-[#DC2626]'
                                            }`}>
                                                {trade.direction}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-[#9CA3AF] font-mono">
                                            {formatTimestamp(trade.created_at)}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-right font-mono">
                                    <div className={`text-sm sm:text-base font-black tabular-nums ${
                                        isProfit ? 'text-[#10B981]' : 'text-[#DC2626]'
                                    }`}>
                                        {formatMoney(pnlVal, true)}
                                    </div>
                                    <div className={`text-[10px] font-bold tabular-nums ${
                                        isProfit ? 'text-[#10B981]/80' : 'text-[#DC2626]/80'
                                    }`}>
                                        ROI {roiFormatted}
                                    </div>
                                </div>
                            </div>

                            {/* Card Bottom Row: Strategy & Trigger preview */}
                            <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px] font-mono text-[#9CA3AF]">
                                <span className="text-slate-300 truncate max-w-[200px] sm:max-w-xs">
                                    {trade.strategy || 'Tactical Trend Setup'}
                                </span>
                                <div className="flex items-center gap-1 text-[10px] text-[#9CA3AF] group-hover:text-white transition-colors">
                                    <span>Inspect</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </div>
                            </div>
                        </div>
                    );
                })}

                {filteredTrades.length === 0 && (
                    <div className="w-full p-8 text-center rounded-2xl bg-[#111318] border border-white/5 text-[#9CA3AF] font-mono text-xs">
                        No trade logs found matching "{searchQuery}"
                    </div>
                )}
            </div>

            {/* ============================================================================ */}
            {/* RESOLUTION OF TRADE HISTORY DETAIL DRAWER / MODAL (MOBILE ZERO-OVERFLOW)    */}
            {/* Features: max-h-[90dvh] overflow-y-auto pb-12 w-full flex flex-col gap-3     */}
            {/* ============================================================================ */}
            {selectedTrade && (
                <div 
                    className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedTrade(null)}
                >
                    <div 
                        className="w-full max-w-lg bg-[#08090C] border-t sm:border border-white/5 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl max-h-[90dvh] overflow-y-auto pb-12 w-full flex flex-col gap-3 scroll-smooth text-slate-100 overscroll-contain"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between border-b border-white/5 pb-3 shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="text-base sm:text-lg font-black text-white font-mono">
                                    {selectedTrade.asset_pair}
                                </span>
                                <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded ${
                                    selectedTrade.direction === 'LONG' 
                                        ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30' 
                                        : 'bg-[#DC2626]/20 text-[#DC2626] border border-[#DC2626]/30'
                                }`}>
                                    {selectedTrade.direction}
                                </span>
                                <span className="text-[10px] text-[#9CA3AF] font-mono">
                                    • {formatTimestamp(selectedTrade.created_at)}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedTrade(null)}
                                className="w-8 h-8 rounded-full bg-[#111318] border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer active:scale-95 shrink-0"
                                title="Chiudi Scheda Trade"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* COMPACT SINGLE-COLUMN LAYOUT: Every row visible with zero clipping */}

                        {/* ROW 1: Net Performance Big Banner */}
                        <div className="w-full p-4 rounded-xl bg-[#111318] border border-white/5 text-center space-y-1">
                            <span className="text-[10px] font-mono text-[#9CA3AF] uppercase tracking-widest block font-bold">
                                NET PERFORMANCE
                            </span>
                            <div className={`text-2xl sm:text-3xl font-black font-mono tabular-nums ${
                                (Number(selectedTrade.pnl) || 0) >= 0 ? 'text-[#10B981]' : 'text-[#DC2626]'
                            }`}>
                                {formatMoney(Number(selectedTrade.pnl) || 0, true)}
                            </div>
                            <div className="flex items-center justify-center gap-2 pt-0.5">
                                <span className="text-xs font-mono text-slate-300">
                                    ROI: <strong className={Number(selectedTrade.roi || 0) >= 0 ? 'text-[#10B981]' : 'text-[#DC2626]'}>
                                        {selectedTrade.roi !== undefined ? `${selectedTrade.roi > 0 ? '+' : ''}${selectedTrade.roi}%` : '+0.0%'}
                                    </strong>
                                </span>
                                <span className="text-slate-600">•</span>
                                <span className="text-xs font-mono text-slate-300">
                                    Strategy: <strong className="text-white">{selectedTrade.strategy || 'Trend Following'}</strong>
                                </span>
                            </div>
                        </div>

                        {/* ROW 2: Entry Price */}
                        <div className="w-full p-3 rounded-xl bg-[#111318] border border-white/5 flex items-center justify-between font-mono text-xs">
                            <span className="text-[#9CA3AF]">Entry Price:</span>
                            <span className="font-extrabold text-white tabular-nums text-sm">
                                {formatMoney(selectedTrade.entry_price, false)}
                            </span>
                        </div>

                        {/* ROW 3: Exit Price */}
                        <div className="w-full p-3 rounded-xl bg-[#111318] border border-white/5 flex items-center justify-between font-mono text-xs">
                            <span className="text-[#9CA3AF]">Exit Price:</span>
                            <span className="font-extrabold text-white tabular-nums text-sm">
                                {selectedTrade.exit_price ? formatMoney(selectedTrade.exit_price, false) : 'In Execution / Active'}
                            </span>
                        </div>

                        {/* ROW 4: Position Size & Risk/Reward */}
                        <div className="w-full p-3 rounded-xl bg-[#111318] border border-white/5 flex items-center justify-between font-mono text-xs">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[#9CA3AF]">Position Size:</span>
                                <strong className="text-white">{selectedTrade.position_size}</strong>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[#9CA3AF]">R:R:</span>
                                <strong className="text-white">{selectedTrade.risk_reward || '1:3.0'}</strong>
                            </div>
                        </div>

                        {/* ROW 5: Emotion State */}
                        <div className="w-full p-3 rounded-xl bg-[#111318] border border-white/5 flex items-center justify-between font-mono text-xs">
                            <span className="text-[#9CA3AF]">Emotional State:</span>
                            <span className="px-2.5 py-1 rounded-lg font-bold bg-[#2563EB]/20 text-cyan-300 border border-[#2563EB]/40 uppercase text-[11px]">
                                {selectedTrade.psychology || selectedTrade.emotional_state || 'CONFIDENCE'}
                            </span>
                        </div>

                        {/* ROW 6: Discipline Error */}
                        <div className="w-full p-3 rounded-xl bg-[#111318] border border-white/5 flex items-center justify-between font-mono text-xs">
                            <span className="text-[#9CA3AF]">Discipline Error:</span>
                            <div className="flex items-center gap-1.5">
                                {selectedTrade.errors && selectedTrade.errors.length > 0 ? (
                                    selectedTrade.errors.map(err => (
                                        <span key={err} className="px-2 py-0.5 rounded text-[9px] font-black bg-[#DC2626]/20 text-[#DC2626] border border-[#DC2626]/40 uppercase">
                                            {err}
                                        </span>
                                    ))
                                ) : (
                                    <span className="px-2 py-0.5 rounded text-[9px] font-black bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 uppercase flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        CLEAN EXECUTION
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* ROW 7: Strategic Reason & Notes */}
                        <div className="w-full p-3.5 rounded-xl bg-[#111318] border border-white/5 space-y-1.5 font-mono">
                            <div className="flex items-center gap-1.5 text-[10px] text-[#9CA3AF] uppercase font-bold">
                                <FileText className="w-3.5 h-3.5 text-[#10B981]" />
                                <span>Strategic Reason & Notes</span>
                            </div>
                            <p className="text-xs text-slate-200 leading-relaxed">
                                {selectedTrade.reasoning || selectedTrade.notes || 'Institutional entry executed strictly adhering to pre-defined algorithmic risk and volatility boundaries.'}
                            </p>
                        </div>

                        {/* ROW 8: Prominent Close Button */}
                        <button
                            type="button"
                            onClick={() => setSelectedTrade(null)}
                            className="w-full h-12 rounded-xl bg-[#111318] hover:bg-white/10 border border-white/10 text-white font-mono text-xs font-bold uppercase transition cursor-pointer active:scale-[0.99] mt-1 shrink-0"
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
