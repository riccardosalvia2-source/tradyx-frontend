// ============================================================================
// TRADYX GUIDED BREATHING PRE-COMMIT MODAL
// (src/components/GuidedBreathingModal.tsx)
// Controlled 5-10s breathwork with pulsating Quasar Bubble for emotional centering
// ============================================================================

import React, { useState, useEffect } from 'react';
import { triggerHaptic } from '../services/circuitBreakerService';
import { Heart, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface GuidedBreathingModalProps {
    isOpen: boolean;
    onComplete: () => void;
    onSkip: () => void;
    reason?: string;
}

export const GuidedBreathingModal: React.FC<GuidedBreathingModalProps> = ({
    isOpen,
    onComplete,
    onSkip,
    reason = 'L\'operazione precedente era in perdita. Centra il tuo stato emotivo prima di eseguire.'
}) => {
    const [secondsLeft, setSecondsLeft] = useState<number>(6);
    const [phase, setPhase] = useState<'INHALE' | 'HOLD' | 'EXHALE'>('INHALE');

    useEffect(() => {
        if (!isOpen) return;

        setSecondsLeft(6);
        setPhase('INHALE');
        triggerHaptic('calm');

        const interval = setInterval(() => {
            setSecondsLeft(prev => {
                const next = prev - 1;
                if (next <= 0) {
                    clearInterval(interval);
                    triggerHaptic('calm');
                    return 0;
                }
                if (next >= 4) {
                    setPhase('INHALE');
                } else if (next >= 2) {
                    setPhase('HOLD');
                } else {
                    setPhase('EXHALE');
                }
                return next;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen]);

    if (!isOpen) return null;

    const phaseLabel = 
        phase === 'INHALE' ? 'INHALE PROFONDAMENTE (4s)' :
        phase === 'HOLD' ? 'TRATTIENI & OSSERVA IL MERCATO (2s)' :
        'ESALA & RILASCIA OGNI TENSIONE (2s)';

    return (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="relative w-full max-w-sm bg-[#08090C]/95 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center space-y-5">
                
                {/* Header Tag */}
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800 text-[10px] font-mono font-bold text-cyan-300">
                    <Heart className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span>PRE-COMMIT EMOTIONAL CENTERING</span>
                </div>

                <div className="space-y-1">
                    <h3 className="text-base font-black text-white font-mono">
                        Respiro Guidato Quasar
                    </h3>
                    <p className="text-xs text-slate-400 font-mono leading-relaxed">
                        {reason}
                    </p>
                </div>

                {/* Animated Expanding & Contracting Quasar Orb */}
                <div className="relative w-44 h-44 flex items-center justify-center my-2">
                    {/* Outer Glow */}
                    <div 
                        className={`absolute rounded-full transition-all duration-1000 pointer-events-none ${
                            phase === 'INHALE' ? 'w-44 h-44 bg-cyan-500/25 blur-2xl' :
                            phase === 'HOLD' ? 'w-40 h-40 bg-emerald-500/30 blur-2xl' :
                            'w-28 h-28 bg-purple-500/20 blur-xl'
                        }`} 
                    />

                    {/* Central Bubble Orb */}
                    <div 
                        className={`rounded-full flex flex-col items-center justify-center shadow-2xl border border-white/30 transition-all duration-1000 transform ${
                            phase === 'INHALE' ? 'w-36 h-36 bg-gradient-to-br from-cyan-400 via-emerald-500 to-teal-700 scale-110' :
                            phase === 'HOLD' ? 'w-36 h-36 bg-gradient-to-br from-emerald-400 via-teal-600 to-cyan-700 scale-100' :
                            'w-28 h-28 bg-gradient-to-br from-teal-600 via-slate-800 to-cyan-950 scale-90'
                        }`}
                    >
                        <span className="text-2xl font-black font-mono text-white tabular-nums drop-shadow">
                            {secondsLeft}s
                        </span>
                        <span className="text-[9px] font-mono uppercase tracking-widest text-white/80 font-bold">
                            {phase}
                        </span>
                    </div>
                </div>

                {/* Phase Instruction Text */}
                <div className="px-3.5 py-1.5 rounded-xl glass-subcard text-xs font-mono font-bold text-cyan-300 border border-cyan-500/30 animate-pulse">
                    {phaseLabel}
                </div>

                {/* Bottom Actions */}
                <div className="w-full space-y-2 pt-2">
                    <button
                        type="button"
                        onClick={onComplete}
                        className="w-full h-12 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-mono text-xs font-black uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#10B981]/25"
                    >
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>Conferma & Salva Trade ({secondsLeft === 0 ? 'Pronto' : `${secondsLeft}s`})</span>
                    </button>

                    <button
                        type="button"
                        onClick={onSkip}
                        className="w-full py-2 text-slate-500 hover:text-slate-300 font-mono text-[11px] transition cursor-pointer"
                    >
                        Salta controllo emotivo
                    </button>
                </div>

            </div>
        </div>
    );
};
