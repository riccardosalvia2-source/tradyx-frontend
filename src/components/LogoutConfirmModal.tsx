// ============================================================================
// TRADYX LOGOUT CONFIRMATION MODAL — 30-DAY GDPR DATA RETENTION POLICY
// (src/components/LogoutConfirmModal.tsx)
// ============================================================================

import React from 'react';
import { createPortal } from 'react-dom';
import { LogOut, ShieldCheck, Trash2, X, Clock, User } from 'lucide-react';
import { UserAccount } from '../types/auth';
import { isSupabaseConfigured, THIRTY_DAYS_MS } from '../services/authService';

export type LogoutMode = 'keep_30d' | 'wipe_now';

interface LogoutConfirmModalProps {
    isOpen: boolean;
    authUser: UserAccount | null;
    onConfirmLogout: (mode: LogoutMode) => void | Promise<void>;
    onCancel: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
    isOpen,
    authUser,
    onConfirmLogout,
    onCancel
}) => {
    if (!isOpen || typeof document === 'undefined') return null;

    const expiryDateFormatted = new Date(Date.now() + THIRTY_DAYS_MS).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    const isCloud = isSupabaseConfigured();

    const modalNode = (
        <div
            className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 select-none"
            onClick={onCancel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
        >
            <div
                className="w-full max-w-md rounded-3xl bg-[#08090C]/95 backdrop-blur-xl border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.75)] p-5 sm:p-6 space-y-5 text-white relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Icon */}
                <button
                    type="button"
                    onClick={onCancel}
                    aria-label="Chiudi modale"
                    className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] text-slate-400 hover:text-white transition cursor-pointer"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Header */}
                <div className="flex items-start gap-3.5 pr-6">
                    <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/35 flex items-center justify-center shrink-0">
                        <LogOut className="w-5 h-5 text-rose-400" />
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-400">
                            GDPR DATA RETENTION · 30 GIORNI
                        </span>
                        <h2
                            id="logout-modal-title"
                            className="text-base sm:text-lg font-extrabold text-white leading-snug"
                        >
                            Sei sicuro di voler uscire dal tuo account?
                        </h2>
                    </div>
                </div>

                {/* Active Account Summary Pill */}
                {authUser && (
                    <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-[#10B981]/15 border border-[#10B981]/35 flex items-center justify-center text-[#10B981] shrink-0">
                                <User className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">
                                    {authUser.full_name || authUser.email.split('@')[0]}
                                </p>
                                <p className="text-[10px] font-mono text-slate-400 truncate">
                                    {authUser.email}
                                </p>
                            </div>
                        </div>
                        <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-black border shrink-0 ${
                                isCloud
                                    ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40'
                                    : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35'
                            }`}
                        >
                            {isCloud ? 'Account Cloud Supabase' : 'Account Locale'}
                        </span>
                    </div>
                )}

                {/* Description */}
                <div className="space-y-2.5">
                    <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed">
                        Puoi conservare i tuoi dati operativi (storico trade, saldo e impostazioni)
                        fino a 30 giorni per riprenderli al prossimo accesso, oppure eliminarli
                        subito.
                    </p>
                    <div className="px-3 py-2 rounded-xl bg-[#10B981]/[0.07] border border-[#10B981]/25 flex items-center gap-2 text-[10px] font-mono text-emerald-200">
                        <Clock className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                        <span>
                            Scadenza automatica dati locali: <strong>{expiryDateFormatted}</strong>
                        </span>
                    </div>
                </div>

                {/* 3 Action Buttons */}
                <div className="space-y-2.5 pt-1">
                    {/* 1. Primary — Emerald #10B981 */}
                    <button
                        type="button"
                        onClick={() => void onConfirmLogout('keep_30d')}
                        className="w-full min-h-[46px] px-4 py-3 rounded-xl bg-[#10B981] hover:bg-[#059669] text-[#050A08] font-sans font-extrabold text-xs sm:text-[13px] transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] shadow-lg shadow-[#10B981]/20"
                    >
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>Esci e conserva i dati per 30 giorni</span>
                    </button>

                    {/* 2. Secondary — Crimson #DC2626 */}
                    <button
                        type="button"
                        onClick={() => void onConfirmLogout('wipe_now')}
                        className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-sans font-bold text-xs sm:text-[13px] transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] shadow-lg shadow-[#DC2626]/20"
                    >
                        <Trash2 className="w-4 h-4 shrink-0" />
                        <span>Esci e cancella tutti i dati subito</span>
                    </button>

                    {/* 3. Neutral — Cancel */}
                    <button
                        type="button"
                        onClick={onCancel}
                        className="w-full min-h-[42px] px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-200 hover:text-white font-mono font-bold text-xs transition cursor-pointer active:scale-[0.98]"
                    >
                        Annulla
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalNode, document.body);
};

export default LogoutConfirmModal;
