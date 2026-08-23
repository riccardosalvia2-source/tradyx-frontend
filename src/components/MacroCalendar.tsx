// ============================================================================
// TRADYX MACRO ECONOMIC CALENDAR COMPONENT (src/components/MacroCalendar.tsx)
// Author: Senior Front-End Developer & API Integration Expert
// Description: Glassmorphic economic calendar widget with neon impact badges,
//              impact level filtering, and fallback resilience.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { fetchMacroEvents, filterEventsByImpact } from '../services/macroService';
import { EconomicEvent, MacroImpact } from '../types/market';
import { Calendar, AlertCircle, Clock } from 'lucide-react';

export const MacroCalendar: React.FC = () => {
    const [events, setEvents] = useState<EconomicEvent[]>([]);
    const [selectedImpact, setSelectedImpact] = useState<MacroImpact | 'ALL'>('ALL');
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setIsLoading(true);
            const data = await fetchMacroEvents();
            if (isMounted) {
                setEvents(data);
                setIsLoading(false);
            }
        };
        load();
        return () => { isMounted = false; };
    }, []);


    const filteredEvents = filterEventsByImpact(events, selectedImpact);

    return (
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl shadow-2xl space-y-4">
            
            {/* Header & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/20 text-slate-950">
                        <Calendar className="w-5 h-5 font-bold" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-100">
                            Calendario Macro Economico
                        </h3>
                        <div className="text-[11px] text-slate-400 font-mono">
                            Eventi Imminenti • Impatto di Mercato
                        </div>
                    </div>
                </div>

                {/* Impact Filter Badges */}
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
                    {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((impact) => (
                        <button
                            key={impact}
                            type="button"
                            onClick={() => setSelectedImpact(impact)}
                            className={`px-3 py-1 rounded-xl font-semibold transition ${
                                selectedImpact === impact
                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            {impact === 'ALL' ? 'Tutti' : impact === 'HIGH' ? 'Alto' : impact === 'MEDIUM' ? 'Medio' : 'Basso'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Event List */}
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-16 bg-slate-950/60 border border-slate-800/80 rounded-2xl animate-pulse" />
                    ))
                ) : filteredEvents.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">
                        Nessun evento macroeconomico trovato per il filtro selezionato.
                    </div>
                ) : (
                    filteredEvents.map((evt) => {
                        const eventDate = new Date(evt.date);
                        const timeString = eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const dateString = eventDate.toLocaleDateString([], { month: 'short', day: 'numeric' });

                        let impactBadge = {
                            label: 'Basso Impatto',
                            color: 'bg-slate-900 text-slate-400 border-slate-700'
                        };
                        if (evt.impact === 'HIGH') {
                            impactBadge = {
                                label: 'Alto Impatto',
                                color: 'bg-rose-950/80 text-rose-400 border-rose-800 shadow-rose-950/50'
                            };
                        } else if (evt.impact === 'MEDIUM') {
                            impactBadge = {
                                label: 'Medio Impatto',
                                color: 'bg-amber-950/80 text-amber-400 border-amber-800 shadow-amber-950/50'
                            };
                        }

                        return (
                            <div
                                key={evt.id}
                                className="bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition group shadow-md"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-center justify-center min-w-[54px] px-2 py-1 bg-slate-900 border border-slate-800 rounded-xl text-center">
                                        <Clock className="w-3 h-3 text-cyan-400 mb-0.5" />
                                        <span className="text-[11px] font-mono font-bold text-slate-200">{timeString}</span>
                                        <span className="text-[9px] text-slate-500 font-mono uppercase">{dateString}</span>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">{evt.flagEmoji || '🌐'}</span>
                                            <span className="font-bold text-sm text-slate-100 group-hover:text-cyan-400 transition">
                                                {evt.title}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${impactBadge.color}`}>
                                                {evt.impact === 'HIGH' && <AlertCircle className="w-3 h-3 inline mr-1" />}
                                                {impactBadge.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Macro Values Comparison */}
                                <div className="flex items-center gap-4 text-xs font-mono self-end sm:self-center bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800/60">
                                    <div>
                                        <div className="text-[9px] uppercase text-slate-500 font-sans">Attuale</div>
                                        <div className="font-extrabold text-cyan-400">{evt.actual || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] uppercase text-slate-500 font-sans">Previsto</div>
                                        <div className="font-bold text-slate-300">{evt.forecast || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] uppercase text-slate-500 font-sans">Precedente</div>
                                        <div className="text-slate-400">{evt.previous || '-'}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
