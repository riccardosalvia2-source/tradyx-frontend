// ============================================================================
// TRADYX TRADING HEATMAP CALENDAR WIDGET (src/components/HeatmapCalendarWidget.tsx)
// ============================================================================

import React, { useState } from 'react';
import { Trade, EmotionalState } from '../types/trade';
import { DEFAULT_MOCK_TRADES } from '../store/useTradeStore';
import { Calendar, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Info } from 'lucide-react';

interface HeatmapCalendarWidgetProps {
    trades?: Trade[];
}

interface DaySummary {
    dateStr: string;
    dayNum: number;
    totalPnl: number;
    tradeCount: number;
    emotions: EmotionalState[];
}

export const HeatmapCalendarWidget: React.FC<HeatmapCalendarWidgetProps> = ({ trades }) => {
    const safeTrades = Array.isArray(trades) && trades.length > 0 ? trades : DEFAULT_MOCK_TRADES;
    const [activeDate, setActiveDate] = useState<Date>(new Date());
    const [selectedDay, setSelectedDay] = useState<DaySummary | null>(null);

    const year = activeDate.getFullYear();
    const month = activeDate.getMonth();

    // Map trades by YYYY-MM-DD
    const tradesByDay: Record<string, { pnl: number; count: number; emotions: EmotionalState[] }> = {};

    (safeTrades || []).forEach(t => {
        if (!t || !t.created_at) return;
        const d = new Date(t.created_at);
        const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        if (!tradesByDay[dayKey]) {
            tradesByDay[dayKey] = { pnl: 0, count: 0, emotions: [] };
        }

        tradesByDay[dayKey].pnl += Number(t.pnl) || 0;
        tradesByDay[dayKey].count += 1;
        if (t.emotional_state) {
            tradesByDay[dayKey].emotions.push(t.emotional_state);
        }
    });

    // Calendar Grid Days Generation
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon ...
    const offset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Mon = 0, Sun = 6

    const calendarCells: (DaySummary | null)[] = [];

    // Empty offset cells
    for (let i = 0; i < offset; i++) {
        calendarCells.push(null);
    }

    // Real days
    let winningDaysCount = 0;
    let losingDaysCount = 0;
    let bestDayPnl = -Infinity;
    let worstDayPnl = Infinity;

    for (let day = 1; day <= daysInMonth; day++) {
        const dayKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayData = tradesByDay[dayKey] || { pnl: 0, count: 0, emotions: [] };

        if (dayData.count > 0) {
            if (dayData.pnl > 0) winningDaysCount += 1;
            if (dayData.pnl < 0) losingDaysCount += 1;
            if (dayData.pnl > bestDayPnl) bestDayPnl = dayData.pnl;
            if (dayData.pnl < worstDayPnl) worstDayPnl = dayData.pnl;
        }

        calendarCells.push({
            dateStr: dayKey,
            dayNum: day,
            totalPnl: dayData.pnl,
            tradeCount: dayData.count,
            emotions: dayData.emotions
        });
    }

    const monthNames = [
        'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];

    const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

    const handlePrevMonth = () => {
        setActiveDate(new Date(year, month - 1, 1));
        setSelectedDay(null);
    };

    const handleNextMonth = () => {
        setActiveDate(new Date(year, month + 1, 1));
        setSelectedDay(null);
    };

    return (
        <div className="bg-slate-950/75 border border-slate-800/80 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(0,240,255,0.06)] hover:border-cyan-500/40 transition-all duration-300 space-y-5 font-sans">
            
            {/* Header with Navigation */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-emerald-950 to-teal-950 border border-emerald-500/40 rounded-2xl text-emerald-400">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                            Trading Heatmap Calendar
                        </h3>
                        <p className="text-xs text-slate-400 font-mono">
                            Griglia mensile stile GitHub con rilevamento PnL giorno per giorno
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-950 p-1 border border-slate-800 rounded-xl">
                    <button
                        onClick={handlePrevMonth}
                        className="p-1 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-extrabold font-mono text-white px-3">
                        {monthNames[month]} {year}
                    </span>
                    <button
                        onClick={handleNextMonth}
                        className="p-1 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* GitHub-style Heatmap Grid */}
            <div className="space-y-2">
                {/* Weekday Labels */}
                <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] font-bold text-slate-400 uppercase">
                    {weekDays.map(w => (
                        <div key={w} className="py-1">{w}</div>
                    ))}
                </div>

                {/* Calendar Grid Cells */}
                <div className="grid grid-cols-7 gap-1.5">
                    {calendarCells.map((cell, idx) => {
                        if (!cell) {
                            return <div key={`empty-${idx}`} className="h-10 sm:h-12 bg-slate-950/40 border border-transparent rounded-xl"></div>;
                        }

                        const { dayNum, totalPnl, tradeCount } = cell;
                        let cellBg = 'bg-slate-950 border-slate-800/80 text-slate-400';

                        if (tradeCount > 0) {
                            if (totalPnl > 2000) {
                                cellBg = 'bg-emerald-600 border-emerald-400 text-white font-extrabold shadow-lg shadow-emerald-900/40';
                            } else if (totalPnl > 0) {
                                cellBg = 'bg-emerald-950 border-emerald-700 text-emerald-300 font-bold';
                            } else if (totalPnl < -2000) {
                                cellBg = 'bg-rose-600 border-rose-400 text-white font-extrabold shadow-lg shadow-rose-900/40';
                            } else {
                                cellBg = 'bg-rose-950 border-rose-800 text-rose-300 font-bold';
                            }
                        }

                        const isSelected = selectedDay?.dateStr === cell.dateStr;

                        return (
                            <button
                                key={cell.dateStr}
                                onClick={() => setSelectedDay(cell)}
                                className={`h-10 sm:h-12 rounded-xl p-1.5 border flex flex-col items-center justify-between transition active:scale-95 text-xs font-mono relative overflow-hidden group ${cellBg} ${isSelected ? 'ring-2 ring-cyan-400 scale-105 z-10' : ''}`}
                            >
                                <span className="text-[10px] font-bold self-start opacity-80">{dayNum}</span>
                                {tradeCount > 0 && (
                                    <span className="text-[10px] font-black truncate max-w-full">
                                        {totalPnl >= 0 ? '+' : ''}${Math.round(totalPnl)}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Selected Day Details Panel */}
            {selectedDay && (
                <div className="p-4 bg-slate-950 border border-cyan-500/50 rounded-2xl space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-extrabold text-cyan-300 font-mono flex items-center gap-2">
                            <Info className="w-4 h-4 text-cyan-400" />
                            Dettaglio Operativo del {new Date(selectedDay.dateStr).toLocaleDateString('it-IT')}:
                        </div>
                        <button
                            onClick={() => setSelectedDay(null)}
                            className="text-[10px] text-slate-400 hover:text-white font-mono underline"
                        >
                            Chiudi
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs font-mono">
                        <div>
                            <span className="text-slate-400">PnL Totale Giornaliero: </span>
                            <strong className={selectedDay.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                {selectedDay.totalPnl >= 0 ? '+' : ''}${selectedDay.totalPnl.toLocaleString()}
                            </strong>
                        </div>
                        <div>
                            <span className="text-slate-400">Operazioni Eseguite: </span>
                            <strong className="text-white">{selectedDay.tradeCount} trade</strong>
                        </div>
                        <div>
                            <span className="text-slate-400">Emozioni Registrate: </span>
                            <strong className="text-purple-300">{Array.from(new Set(selectedDay.emotions)).join(', ') || 'Nessuna'}</strong>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Footer Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800 font-mono text-xs">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Giorni Vincenti</div>
                    <div className="text-lg font-bold text-emerald-400">{winningDaysCount} giorni</div>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Giorni Perdenti</div>
                    <div className="text-lg font-bold text-rose-400">{losingDaysCount} giorni</div>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Best Day PnL</div>
                    <div className="text-lg font-bold text-emerald-300">
                        {bestDayPnl !== -Infinity ? `+$${bestDayPnl.toLocaleString()}` : '$0'}
                    </div>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Worst Day PnL</div>
                    <div className="text-lg font-bold text-rose-300">
                        {worstDayPnl !== Infinity ? `-$${Math.abs(worstDayPnl).toLocaleString()}` : '$0'}
                    </div>
                </div>
            </div>

        </div>
    );
};
