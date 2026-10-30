// ============================================================================
// TRADYX PRICE ALERT CONFIGURATION MODAL (src/components/PriceAlertModal.tsx)
// Dark Fintech Glassmorphic Modal with Quick Target Offsets & Notification Sync
// ============================================================================

import React, { useState, useEffect } from 'react';
import { 
    Bell, 
    X, 
    Check, 
    TrendingUp, 
    TrendingDown, 
    Trash2, 
    ToggleLeft, 
    ToggleRight, 
    Sparkles, 
    AlertCircle, 
    Clock 
} from 'lucide-react';
import { 
    PriceAlert, 
    getStoredAlerts, 
    createPriceAlert, 
    deletePriceAlert, 
    togglePriceAlert, 
    requestNotificationPermission 
} from '../services/priceAlertService';
import { formatPrice } from '../services/marketWatchService';
import { triggerHaptic } from '../services/circuitBreakerService';

interface PriceAlertModalProps {
    symbol: string;
    currentPrice: number;
    isOpen: boolean;
    onClose: () => void;
    onAlertCreated?: (alert: PriceAlert) => void;
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({
    symbol,
    currentPrice,
    isOpen,
    onClose,
    onAlertCreated
}) => {
    const cleanSymbol = symbol.replace('/USD', '').replace('USDT', '').toUpperCase();

    const [targetPriceInput, setTargetPriceInput] = useState<string>(
        currentPrice > 0 ? (currentPrice * 1.01).toFixed(currentPrice > 100 ? 2 : 4) : ''
    );
    const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
    const [note, setNote] = useState<string>('');
    const [alertsList, setAlertsList] = useState<PriceAlert[]>([]);
    const [permissionStatus, setPermissionStatus] = useState<string>('default');
    const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermissionStatus(Notification.permission);
        }
        if (isOpen) {
            refreshAlerts();
            setTargetPriceInput(
                currentPrice > 0 ? (currentPrice * (condition === 'ABOVE' ? 1.015 : 0.985)).toFixed(currentPrice > 100 ? 2 : 4) : ''
            );
        }
    }, [isOpen, cleanSymbol, currentPrice]);

    const refreshAlerts = () => {
        const all = getStoredAlerts();
        setAlertsList(all.filter(a => a.symbol === cleanSymbol));
    };

    const handleQuickOffset = (multiplier: number) => {
        triggerHaptic('click');
        const calculated = currentPrice * multiplier;
        setTargetPriceInput(calculated.toFixed(currentPrice > 100 ? 2 : 4));
        if (multiplier >= 1) {
            setCondition('ABOVE');
        } else {
            setCondition('BELOW');
        }
    };

    const handleSaveAlert = async () => {
        const parsedTarget = parseFloat(targetPriceInput);
        if (isNaN(parsedTarget) || parsedTarget <= 0) return;

        triggerHaptic('success');
        await requestNotificationPermission();

        const created = createPriceAlert({
            symbol: cleanSymbol,
            targetPrice: parsedTarget,
            condition,
            note
        });

        refreshAlerts();
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2000);

        if (onAlertCreated) {
            onAlertCreated(created);
        }
    };

    const handleDeleteAlert = (id: string) => {
        triggerHaptic('click');
        deletePriceAlert(id);
        refreshAlerts();
    };

    const handleToggleAlert = (id: string) => {
        triggerHaptic('click');
        togglePriceAlert(id);
        refreshAlerts();
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-md bg-[#0D111A] border border-white/[0.12] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 font-sans text-white animate-in slide-in-from-bottom duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* iOS Handle for Mobile */}
                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto -mt-1 mb-2 sm:hidden" />

                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                            <Bell className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black font-mono tracking-tight uppercase">
                                CREA ALLARME PREZZO
                            </h3>
                            <p className="text-[10px] font-mono text-[#9CA3AF]">
                                Asset: <strong className="text-white">{cleanSymbol}</strong> • Notifiche Real-Time
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-white/[0.05] hover:bg-white/10 transition cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Current Price Reference Banner */}
                <div className="p-3 rounded-2xl bg-[#121620]/80 border border-white/[0.08] flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-mono uppercase text-[#9CA3AF]">Prezzo Corrente</span>
                        <div className="text-lg font-black font-mono text-white">
                            {formatPrice(currentPrice)}
                        </div>
                    </div>

                    <span className="px-2 py-1 rounded-lg text-[9px] font-mono font-bold bg-white/5 border border-white/10 text-slate-300">
                        STREAM LIVE
                    </span>
                </div>

                {/* Condition Selector */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[#9CA3AF] block font-bold">
                        Condizione di Trigger
                    </label>
                    <div className="grid grid-cols-2 gap-2 font-mono text-xs font-bold">
                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('click');
                                setCondition('ABOVE');
                            }}
                            className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                condition === 'ABOVE'
                                    ? 'bg-[#10B981] text-slate-950 border-[#10B981] font-black shadow-md shadow-[#10B981]/25'
                                    : 'bg-[#121620]/60 text-slate-300 border-white/[0.08] hover:bg-white/5'
                            }`}
                        >
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>Supera o Uguale (&gt;=)</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('click');
                                setCondition('BELOW');
                            }}
                            className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                condition === 'BELOW'
                                    ? 'bg-[#DC2626] text-white border-[#DC2626] font-black shadow-md shadow-[#DC2626]/25'
                                    : 'bg-[#121620]/60 text-slate-300 border-white/[0.08] hover:bg-white/5'
                            }`}
                        >
                            <TrendingDown className="w-3.5 h-3.5" />
                            <span>Scende o Uguale (&lt;=)</span>
                        </button>
                    </div>
                </div>

                {/* Target Price Input */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[#9CA3AF] block font-bold">
                        Prezzo Soglia Bersaglio (USD)
                    </label>
                    <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">$</span>
                        <input
                            type="number"
                            step="any"
                            value={targetPriceInput}
                            onChange={(e) => setTargetPriceInput(e.target.value)}
                            placeholder="es. 68500.00"
                            className="w-full bg-[#121620] border border-white/[0.1] focus:border-[#10B981] rounded-xl py-2.5 pl-8 pr-4 text-sm font-mono font-bold text-white outline-none"
                        />
                    </div>

                    {/* Quick Percentage Buttons */}
                    <div className="flex items-center gap-1.5 pt-1 overflow-x-auto text-[10px] font-mono">
                        <button
                            type="button"
                            onClick={() => handleQuickOffset(0.95)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20"
                        >
                            -5%
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickOffset(0.98)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20"
                        >
                            -2%
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickOffset(0.99)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20"
                        >
                            -1%
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickOffset(1.01)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20"
                        >
                            +1%
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickOffset(1.02)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20"
                        >
                            +2%
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickOffset(1.05)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20"
                        >
                            +5%
                        </button>
                    </div>
                </div>

                {/* Optional Note */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[#9CA3AF] block font-bold">
                        Nota Descrittiva (Opzionale)
                    </label>
                    <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="es. Rottura resistenza chiave, take profit strategico..."
                        className="w-full bg-[#121620] border border-white/[0.08] focus:border-[#10B981] rounded-xl py-2 px-3 text-xs font-mono text-white outline-none"
                    />
                </div>

                {/* Save Button */}
                <button
                    type="button"
                    onClick={handleSaveAlert}
                    className={`w-full min-h-[46px] rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                        savedSuccess
                            ? 'bg-emerald-400 text-slate-950 shadow-emerald-400/30'
                            : 'bg-[#10B981] hover:bg-[#059669] text-slate-950 shadow-[#10B981]/25 border border-[#10B981]'
                    }`}
                >
                    {savedSuccess ? (
                        <>
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>Allarme Creato con Successo!</span>
                        </>
                    ) : (
                        <>
                            <Bell className="w-4 h-4 fill-slate-950" />
                            <span>Attiva Allarme Prezzo</span>
                        </>
                    )}
                </button>

                {/* Existing Alerts List for this Symbol */}
                {alertsList.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/[0.08]">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#9CA3AF] font-bold block">
                            Allarmi Configurati per {cleanSymbol} ({alertsList.length})
                        </span>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {alertsList.map(item => (
                                <div
                                    key={item.id}
                                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono transition ${
                                        item.isTriggered 
                                            ? 'bg-white/[0.02] border-white/5 opacity-60' 
                                            : item.isActive 
                                            ? 'bg-[#121620] border-white/[0.08]' 
                                            : 'bg-white/[0.02] border-white/5 opacity-50'
                                    }`}
                                >
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-1.5 font-bold">
                                            <span className={item.condition === 'ABOVE' ? 'text-emerald-400' : 'text-rose-400'}>
                                                {item.condition === 'ABOVE' ? '>=' : '<='} {formatPrice(item.targetPrice)}
                                            </span>
                                            {item.isTriggered && (
                                                <span className="px-1.5 py-0.2 rounded text-[8px] bg-amber-500/20 text-amber-300 font-bold">
                                                    ESEGUITO
                                                </span>
                                            )}
                                        </div>
                                        {item.note && (
                                            <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                                                {item.note}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {!item.isTriggered && (
                                            <button
                                                type="button"
                                                onClick={() => handleToggleAlert(item.id)}
                                                className="text-slate-400 hover:text-white transition"
                                                title={item.isActive ? 'Disattiva' : 'Attiva'}
                                            >
                                                {item.isActive ? (
                                                    <ToggleRight className="w-5 h-5 text-emerald-400" />
                                                ) : (
                                                    <ToggleLeft className="w-5 h-5 text-slate-500" />
                                                )}
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteAlert(item.id)}
                                            className="p-1 text-slate-500 hover:text-rose-400 transition"
                                            title="Elimina allarme"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
