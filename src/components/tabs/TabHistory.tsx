// ============================================================================
// TRADYX MOBILE TAB 4: HISTORY & TRADE JOURNAL (src/components/tabs/TabHistory.tsx)
// Full-width vertical cards (NO overflowing multi-column tables)
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useTradeStore, DEFAULT_MOCK_TRADES } from '../../store/useTradeStore';
import { 
    History, 
    TrendingUp, 
    TrendingDown, 
    Tag, 
    Calendar, 
    Filter, 
    Search,
    Flame,
    ShieldCheck,
    Coins,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';

export const TabHistory: React.FC = () => {
    const { trades } = useTradeStore();
    const safeTrades = Array.isArray(trades) && trades.length > 0 ? trades : DEFAULT_MOCK_TRADES;

    const [activeFilter, setActiveFilter] = useState<'ALL' | 'WIN' | 'LOSS' | 'BIAS'>('ALL');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Summary calculations
    const totalPnl = safeTrades.reduce((acc, t) => acc + (Number(t?.pnl) || 0), 0);
    const winTrades = safeTrades.filter(t => (Number(t?.pnl) || 0) > 0);
    const lossTrades = safeTrades.filter(t => (Number(t?.pnl) || 0) <= 0);
    const biasTrades = safeTrades.filter(t => t.emotional_state === 'FOMO' || t.emotional_state === 'Frustrated' || t.emotional_state === 'Greedy');
    const winRate = safeTrades.length > 0 ? Math.round((winTrades.length / safeTrades.length) * 100) : 0;
    const isTotalProfitable = totalPnl >= 0;

    // Filtered trades list
    const filteredTrades = useMemo(() => {
        return safeTrades.filter(trade => {
            const pnl = Number(trade?.pnl) || 0;
            const matchesFilter = 
                activeFilter === 'ALL' ||
                (activeFilter === 'WIN' && pnl > 0) ||
                (activeFilter === 'LOSS' && pnl <= 0) ||
                (activeFilter === 'BIAS' && (trade.emotional_state === 'FOMO' || trade.emotional_state === 'Frustrated' || trade.emotional_state === 'Greedy'));

            const matchesSearch = !searchQuery || 
                trade.asset_pair.toLowerCase().includes(searchQuery.toLowerCase()) ||
                trade.emotional_state.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (trade.notes && trade.notes.toLowerCase().includes(searchQuery.toLowerCase()));

            return matchesFilter && matchesSearch;
        });
    }, [safeTrades, activeFilter, searchQuery]);

    const formatTradeDate = (dateStr?: string) => {
        if (!dateStr) return 'Recente';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return 'Recente';
        }
    };

    const getEmotionBadge = (emotion: string) => {
        switch (emotion) {
            case 'FOMO':
                return {
                    label: 'FOMO',
                    icon: Flame,
                    badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-600/60'
                };
            case 'Greedy':
                return {
                    label: 'Greed',
                    icon: Coins,
                    badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-600/60'
                };
            case 'Frustrated':
                return {
                    label: 'Revenge',
                    icon: AlertTriangle,
                    badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-600/60'
                };
            case 'Disciplined':
            default:
                return {
                    label: emotion || 'Calm',
                    icon: ShieldCheck,
                    badgeClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-600/60'
                };
        }
    };

    return (
        <div className="w-full flex flex-col space-y-4 px-3.5 sm:px-4 pt-2 pb-28">
            
            {/* 1. HEADER & SEARCH */}
            <header className="w-full flex flex-col space-y-2 border-b border-white/10 pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
                            <History className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-white">STORICO JOURNAL</h2>
                            <p className="text-[10px] text-slate-400 font-mono">
                                {safeTrades.length} Operazioni Registrate
                            </p>
                        </div>
                    </div>

                    <div className="text-right font-mono">
                        <span className="text-[10px] text-slate-400 block">P&L Cumulativo</span>
                        <span className={`text-sm font-black ${isTotalProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isTotalProfitable ? `+$${totalPnl.toLocaleString()}` : `-$${Math.abs(totalPnl).toLocaleString()}`}
                        </span>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="w-full relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cerca per asset, bias o nota..."
                        className="w-full h-10 pl-9 pr-3 bg-[#05070B] border border-white/10 focus:border-cyan-400 rounded-xl text-xs text-white placeholder-slate-500 outline-none"
                    />
                </div>
            </header>

            {/* 2. SUMMARY METRIC CARDS */}
            <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="p-2.5 rounded-xl border border-white/10 bg-white/[0.03]">
                    <div className="text-[10px] text-slate-400">WIN RATE</div>
                    <div className="text-sm font-extrabold text-cyan-400 mt-0.5">{winRate}%</div>
                </div>
                <div className="p-2.5 rounded-xl border border-white/10 bg-white/[0.03]">
                    <div className="text-[10px] text-slate-400">WIN / LOSS</div>
                    <div className="text-sm font-extrabold text-white mt-0.5">
                        <span className="text-emerald-400">{winTrades.length}W</span> - <span className="text-rose-400">{lossTrades.length}L</span>
                    </div>
                </div>
                <div className="p-2.5 rounded-xl border border-white/10 bg-white/[0.03]">
                    <div className="text-[10px] text-slate-400">BIAS TRADES</div>
                    <div className="text-sm font-extrabold text-purple-400 mt-0.5">{biasTrades.length}</div>
                </div>
            </div>

            {/* 3. FILTER PILLS (overflow-x-auto no-scrollbar) */}
            <div className="w-full overflow-x-auto no-scrollbar flex items-center gap-1.5 select-none py-0.5">
                <button
                    type="button"
                    onClick={() => setActiveFilter('ALL')}
                    className={`h-8 px-3 rounded-xl text-xs font-mono font-bold transition shrink-0 cursor-pointer ${
                        activeFilter === 'ALL'
                            ? 'bg-cyan-500 text-slate-950 font-black'
                            : 'bg-white/[0.03] text-slate-400 border border-white/5'
                    }`}
                >
                    Tutti ({safeTrades.length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveFilter('WIN')}
                    className={`h-8 px-3 rounded-xl text-xs font-mono font-bold transition shrink-0 cursor-pointer ${
                        activeFilter === 'WIN'
                            ? 'bg-emerald-500 text-slate-950 font-black'
                            : 'bg-white/[0.03] text-slate-400 border border-white/5'
                    }`}
                >
                    Win ({winTrades.length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveFilter('LOSS')}
                    className={`h-8 px-3 rounded-xl text-xs font-mono font-bold transition shrink-0 cursor-pointer ${
                        activeFilter === 'LOSS'
                            ? 'bg-rose-500 text-white font-black'
                            : 'bg-white/[0.03] text-slate-400 border border-white/5'
                    }`}
                >
                    Loss ({lossTrades.length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveFilter('BIAS')}
                    className={`h-8 px-3 rounded-xl text-xs font-mono font-bold transition shrink-0 cursor-pointer ${
                        activeFilter === 'BIAS'
                            ? 'bg-purple-500 text-white font-black'
                            : 'bg-white/[0.03] text-slate-400 border border-white/5'
                    }`}
                >
                    Bias & FOMO ({biasTrades.length})
                </button>
            </div>

            {/* 4. ELENCO TRANSAZIONI STRUTTURATO A CARD VERTICALI A TUTTA LARGHEZZA */}
            <div className="w-full space-y-3">
                {filteredTrades.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-white/10 bg-white/[0.02] text-slate-400 text-xs">
                        Nessun trade trovato con i filtri attuali.
                    </div>
                ) : (
                    filteredTrades.map((trade) => {
                        const isWin = (Number(trade?.pnl) || 0) >= 0;
                        const emotionInfo = getEmotionBadge(trade.emotional_state);
                        const EmotionIcon = emotionInfo.icon;

                        return (
                            <div
                                key={trade.id}
                                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-3.5 space-y-2.5 transition active:scale-[0.99] shadow-lg relative overflow-hidden"
                            >
                                {/* Left Glow Indicator Bar */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                    isWin ? 'bg-emerald-400' : 'bg-rose-500'
                                }`} />

                                {/* Row 1: Asset, Direction Badge & Date */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg shrink-0 ${
                                            isWin ? 'bg-emerald-950/80 text-emerald-400' : 'bg-rose-950/80 text-rose-400'
                                        }`}>
                                            {trade.direction === 'LONG' ? (
                                                <TrendingUp className="w-4 h-4" />
                                            ) : (
                                                <TrendingDown className="w-4 h-4" />
                                            )}
                                        </div>
                                        <span className="font-extrabold text-sm text-white font-mono">
                                            {trade.asset_pair}
                                        </span>
                                        <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-md uppercase border ${
                                            trade.direction === 'LONG'
                                                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-600/40'
                                                : 'bg-rose-950/60 text-rose-400 border-rose-600/40'
                                        }`}>
                                            {trade.direction}
                                        </span>
                                    </div>

                                    <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-slate-500" />
                                        <span>{formatTradeDate(trade.created_at)}</span>
                                    </div>
                                </div>

                                {/* Row 2: Entry, Exit, Size */}
                                <div className="grid grid-cols-3 gap-2 py-1 border-y border-white/5 text-center font-mono">
                                    <div>
                                        <span className="text-[9px] text-slate-400 block">ENTRY</span>
                                        <span className="text-xs font-bold text-slate-200">
                                            ${trade.entry_price?.toLocaleString()}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] text-slate-400 block">EXIT</span>
                                        <span className="text-xs font-bold text-slate-200">
                                            ${trade.exit_price?.toLocaleString()}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] text-slate-400 block">SIZE</span>
                                        <span className="text-xs font-bold text-cyan-400">
                                            {trade.position_size}
                                        </span>
                                    </div>
                                </div>

                                {/* Row 3: P&L Colorato & Emotional State Badge */}
                                <div className="flex items-center justify-between pt-0.5">
                                    <div className="space-y-0.5">
                                        <span className="text-[9px] text-slate-400 font-mono block">P&L REALIZZATO</span>
                                        <div className={`text-base font-black font-mono tracking-tight ${
                                            isWin ? 'text-emerald-400' : 'text-rose-400'
                                        }`}>
                                            {isWin 
                                                ? `+$${(trade.pnl || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}` 
                                                : `-$${Math.abs(trade.pnl || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                                            }
                                        </div>
                                    </div>

                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${emotionInfo.badgeClass}`}>
                                        <EmotionIcon className="w-3.5 h-3.5 shrink-0" />
                                        <span>{emotionInfo.label}</span>
                                    </div>
                                </div>

                                {/* Row 4: Notes (if present) */}
                                {trade.notes && (
                                    <div className="p-2 rounded-xl bg-black/40 border border-white/5 text-[11px] text-slate-300 italic">
                                        "{trade.notes}"
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

        </div>
    );
};

export default TabHistory;
