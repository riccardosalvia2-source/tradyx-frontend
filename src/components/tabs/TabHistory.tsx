// ============================================================================
// TRADYX MOBILE TAB 3: HISTORY (History Logs & Detailed Inspection Drawer)
// Calibrated Dark Fintech Aesthetic (#10B981 Emerald, #DC2626 Crimson, #2563EB Navy)
// ============================================================================

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    Percent,
    Share2,
    Trash2
} from 'lucide-react';
import { StoryCardModal } from '../StoryCardModal';

export const TabHistory: React.FC = () => {
    const { trades, deleteTrade } = useTradeStore();
    const { baseCurrency, formatMoney } = useSettingsStore();
    const safeTrades = Array.isArray(trades) && trades.length > 0 ? trades : DEFAULT_MOCK_TRADES;

    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
    const [storyTrade, setStoryTrade] = useState<Trade | null>(null);

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
            
            {/* Top Sticky Glass Header */}
            <header className="glass-header sticky top-0 z-30 px-3 py-2.5 rounded-2xl flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl glass-subcard border border-[#10B981]/40 flex items-center justify-center shadow-md shrink-0">
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

                <span className="px-2.5 py-1 rounded-full glass-subcard text-[10px] font-mono text-[#10B981] font-bold">
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
                    className="w-full h-11 pl-10 pr-4 rounded-xl glass-subcard text-white text-xs font-mono placeholder:text-slate-500 focus:border-[#10B981] focus:outline-none transition-colors"
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

            {/* LISTA VERTICALE A CARD PER OGNI TRADE REGISTRATO (CON SWIPE-TO-DELETE) */}
            <div className="space-y-2.5">
                <AnimatePresence mode="popLayout">
                    {filteredTrades.map((trade) => {
                        const pnlVal = Number(trade.pnl) || 0;
                        const isProfit = pnlVal >= 0;
                        const roiFormatted = trade.roi !== undefined ? `${trade.roi > 0 ? '+' : ''}${trade.roi}%` : '+0.0%';

                        return (
                            <motion.div
                                key={trade.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ 
                                    opacity: 0, 
                                    x: 250, 
                                    height: 0, 
                                    marginBottom: 0, 
                                    paddingTop: 0, 
                                    paddingBottom: 0,
                                    overflow: 'hidden',
                                    transition: { duration: 0.25, ease: 'easeInOut' }
                                }}
                                className="relative w-full rounded-2xl overflow-hidden select-none"
                            >
                                {/* Sfondo rosso rivelato durante lo swipe verso destra con icona cestino ed etichetta 'Elimina' */}
                                <div className="absolute inset-0 bg-[#DC2626] rounded-2xl flex items-center justify-start pl-6 text-white font-mono font-bold text-xs gap-2 z-0">
                                    <Trash2 className="w-5 h-5 text-white animate-pulse" />
                                    <span className="uppercase tracking-widest font-black">Elimina</span>
                                </div>

                                {/* Card trascinabile orizzontalmente verso destra */}
                                <motion.div
                                    drag="x"
                                    dragConstraints={{ left: 0, right: 130 }}
                                    dragElastic={{ left: 0, right: 0.6 }}
                                    onDragEnd={(_, info) => {
                                        if (info.offset.x > 80 || info.velocity.x > 300) {
                                            deleteTrade(trade.id);
                                        }
                                    }}
                                    onClick={() => setSelectedTrade(trade)}
                                    className="w-full rounded-2xl glass-panel glass-card-hover p-3.5 sm:p-4 transition-colors duration-200 cursor-grab active:cursor-grabbing flex flex-col space-y-2.5 group relative z-10 bg-[#0D111A]/95"
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
                                    <div className="flex items-center justify-between pt-1 border-t border-white/[0.08] text-[11px] font-mono text-[#9CA3AF]">
                                        <span className="text-slate-300 truncate max-w-[180px] sm:max-w-xs">
                                            {trade.strategy || 'Tactical Trend Setup'}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-[10px] text-[#9CA3AF] group-hover:text-white transition-colors">
                                            <span className="text-[9px] text-slate-500 hidden sm:inline">Swipe destra per eliminare</span>
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {filteredTrades.length === 0 && (
                    <div className="w-full p-8 text-center rounded-2xl glass-panel text-[#9CA3AF] font-mono text-xs">
                        No trade logs found matching "{searchQuery}"
                    </div>
                )}
            </div>

            {/* ============================================================================ */}
            {/* RESOLUTION OF TRADE HISTORY DETAIL DRAWER / MODAL (GLASSMORPHISM FINTECH)   */}
            {/* ============================================================================ */}
            {selectedTrade && (
                <div 
                    className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedTrade(null)}
                >
                    <div 
                        className="w-full max-w-lg bg-[#0D111A]/95 backdrop-blur-2xl border-t sm:border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 max-h-[90dvh] overflow-y-auto pb-12 w-full flex flex-col gap-3 scroll-smooth text-slate-100 overscroll-contain"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 shrink-0">
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
                                className="w-8 h-8 rounded-full glass-subcard flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer active:scale-95 shrink-0"
                                title="Chiudi Scheda Trade"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* COMPACT SINGLE-COLUMN LAYOUT: Every row visible with zero clipping */}

                        {/* ROW 1: Net Performance Big Banner */}
                        <div className="w-full p-4 rounded-xl glass-subcard text-center space-y-1">
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
                        <div className="w-full p-3 rounded-xl glass-subcard flex items-center justify-between font-mono text-xs">
                            <span className="text-[#9CA3AF]">Entry Price:</span>
                            <span className="font-extrabold text-white tabular-nums text-sm">
                                {formatMoney(selectedTrade.entry_price, false)}
                            </span>
                        </div>

                        {/* ROW 3: Exit Price */}
                        <div className="w-full p-3 rounded-xl glass-subcard flex items-center justify-between font-mono text-xs">
                            <span className="text-[#9CA3AF]">Exit Price:</span>
                            <span className="font-extrabold text-white tabular-nums text-sm">
                                {selectedTrade.exit_price ? formatMoney(selectedTrade.exit_price, false) : 'In Execution / Active'}
                            </span>
                        </div>

                        {/* ROW 4: Position Size & Risk/Reward */}
                        <div className="w-full p-3 rounded-xl glass-subcard flex items-center justify-between font-mono text-xs">
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
                        <div className="w-full p-3 rounded-xl glass-subcard flex items-center justify-between font-mono text-xs">
                            <span className="text-[#9CA3AF]">Emotional State:</span>
                            <span className="px-2.5 py-1 rounded-lg font-bold bg-[#2563EB]/20 text-cyan-300 border border-[#2563EB]/40 uppercase text-[11px]">
                                {selectedTrade.psychology || selectedTrade.emotional_state || 'CONFIDENCE'}
                            </span>
                        </div>

                        {/* ROW 6: Discipline Error */}
                        <div className="w-full p-3 rounded-xl glass-subcard flex items-center justify-between font-mono text-xs">
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
                        <div className="w-full p-3.5 rounded-xl glass-subcard space-y-1.5 font-mono">
                            <div className="flex items-center gap-1.5 text-[10px] text-[#9CA3AF] uppercase font-bold">
                                <FileText className="w-3.5 h-3.5 text-[#10B981]" />
                                <span>Strategic Reason & Notes</span>
                            </div>
                            <p className="text-xs text-slate-200 leading-relaxed">
                                {selectedTrade.reasoning || selectedTrade.notes || 'Institutional entry executed strictly adhering to pre-defined algorithmic risk and volatility boundaries.'}
                            </p>
                        </div>

                        {/* ROW 7.5: Delete Trade Button */}
                        <button
                            type="button"
                            onClick={() => {
                                deleteTrade(selectedTrade.id);
                                setSelectedTrade(null);
                            }}
                            className="w-full py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
                        >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            <span>Elimina Trade dal Journal</span>
                        </button>

                        {/* ROW 8: Actions: Condividi Story 9:16 & Chiudi */}
                        <div className="grid grid-cols-2 gap-2 mt-1 shrink-0">
                            <button
                                type="button"
                                onClick={() => setStoryTrade(selectedTrade)}
                                className="h-12 rounded-xl bg-gradient-to-r from-[#10B981] to-[#2563EB] hover:from-[#059669] hover:to-[#1D4ED8] text-white font-mono text-xs font-black uppercase transition cursor-pointer active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-lg shadow-[#10B981]/25"
                            >
                                <Share2 className="w-4 h-4 shrink-0" />
                                <span>Condividi Story</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedTrade(null)}
                                className="h-12 rounded-xl glass-subcard hover:bg-white/10 text-white font-mono text-xs font-bold uppercase transition cursor-pointer active:scale-[0.99]"
                            >
                                Chiudi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* VIRAL LOOP: LUXURY 9:16 STORY CARD MODAL */}
            {storyTrade && (
                <StoryCardModal
                    trade={storyTrade}
                    onClose={() => setStoryTrade(null)}
                />
            )}

        </div>
    );
};

export default TabHistory;
