// ============================================================================
// TRADYX GUIDED BREATHING PRE-COMMIT MODAL (4-4-4-4 BOX BREATHING)
// (src/components/GuidedBreathingModal.tsx)
// Clinically validated autonomic nervous system reset: 4s Inhale, 4s Hold Full, 4s Exhale, 4s Hold Empty
// ============================================================================

import React, { useState, useEffect } from 'react';
import { triggerHaptic } from '../services/circuitBreakerService';
import { Heart, Sparkles, CheckCircle2, Wind } from 'lucide-react';

interface GuidedBreathingModalProps {
    isOpen: boolean;
    onComplete: () => void;
    onSkip: () => void;
    reason?: string;
}

type BoxPhase = 'INHALE' | 'HOLD_FULL' | 'EXHALE' | 'HOLD_EMPTY';

export const GuidedBreathingModal: React.FC<GuidedBreathingModalProps> = ({
    isOpen,
    onComplete,
    onSkip,
    reason = 'Centra il tuo stato emotivo con il Box Breathing 4-4-4-4 prima di eseguire.'
}) => {
    const [secondsLeftInPhase, setSecondsLeftInPhase] = useState<number>(4);
    const [phase, setPhase] = useState<BoxPhase>('INHALE');
    const [completedCycles, setCompletedCycles] = useState<number>(0);

    useEffect(() => {
        if (!isOpen) return;

        setSecondsLeftInPhase(4);
        setPhase('INHALE');
        setCompletedCycles(0);
        triggerHaptic('calm');

        const interval = setInterval(() => {
            setSecondsLeftInPhase(prev => {
                if (prev <= 1) {
                    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                        try { navigator.vibrate([30]); } catch (e) { /* ignore */ }
                    }

                    setPhase(curr => {
                        if (curr === 'INHALE') return 'HOLD_FULL';
                        if (curr === 'HOLD_FULL') return 'EXHALE';
                        if (curr === 'EXHALE') return 'HOLD_EMPTY';
                        setCompletedCycles(c => c + 1);
                        return 'INHALE';
                    });
                    return 4;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen]);

    if (!isOpen) return null;

    const phaseLabel = 
        phase === 'INHALE' ? '4s INHALE (Espandi il diaframma)' :
        phase === 'HOLD_FULL' ? '4s TRATTIENI A POLMONI PIENI (Glow stabile)' :
        phase === 'EXHALE' ? '4s EXHALE (Rilascia ogni tensione simpatica)' :
        '4s TRATTIENI A POLMONI VUOTI (Reset recettori vagali)';

    return (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-300 select-none">
            <div className="relative w-full max-w-sm bg-[#08090C]/95 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center space-y-5">
                
                {/* Header Tag */}
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800 text-[10px] font-mono font-bold text-emerald-300">
                    <Wind className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>BOX BREATHING 4-4-4-4 • RESET SISTEMA AUTONOMO</span>
                </div>

                <div className="space-y-1">
                    <h3 className="text-base font-black text-white font-mono">
                        Respiro Quadrato Quasar
                    </h3>
                    <p className="text-xs text-slate-400 font-mono leading-relaxed">
                        {reason}
                    </p>
                </div>

                {/* Animated Expanding & Contracting Quasar Orb */}
                <div className="relative w-48 h-48 flex items-center justify-center my-2">
                    {/* Outer Glow */}
                    <div 
                        className={`absolute rounded-full pointer-events-none transition-all duration-1000 ${
                            phase === 'INHALE' ? 'w-48 h-48 bg-[#10B981]/35 blur-2xl' :
                            phase === 'HOLD_FULL' ? 'w-48 h-48 bg-[#10B981]/45 blur-2xl' :
                            phase === 'EXHALE' ? 'w-32 h-32 bg-[#059669]/20 blur-xl' :
                            'w-28 h-28 bg-slate-700/20 blur-lg'
                        }`} 
                    />

                    {/* Central Bubble Orb (Emerald #10B981) */}
                    <div 
                        className={`rounded-full flex flex-col items-center justify-center shadow-2xl border border-white/30 transition-all duration-1000 transform ${
                            phase === 'INHALE' ? 'w-40 h-40 bg-gradient-to-br from-[#10B981] via-[#059669] to-[#047857] scale-110 shadow-emerald-500/50' :
                            phase === 'HOLD_FULL' ? 'w-40 h-40 bg-gradient-to-br from-[#10B981] via-[#059669] to-[#047857] scale-110 shadow-emerald-500/70' :
                            phase === 'EXHALE' ? 'w-32 h-32 bg-gradient-to-br from-[#059669] via-slate-800 to-emerald-950 scale-95' :
                            'w-30 h-30 bg-gradient-to-br from-slate-800 via-slate-900 to-black scale-90'
                        }`}
                    >
                        <span className="text-3xl font-black font-mono text-white tabular-nums drop-shadow">
                            0{secondsLeftInPhase}s
                        </span>
                        <span className="text-[9px] font-mono uppercase tracking-widest text-white/90 font-black">
                            {phase === 'HOLD_FULL' ? 'HOLD PIENO' : phase === 'HOLD_EMPTY' ? 'HOLD VUOTO' : phase}
                        </span>
                    </div>
                </div>

                {/* Phase Instruction Text */}
                <div className="px-3.5 py-1.5 rounded-xl glass-subcard text-xs font-mono font-bold text-emerald-300 border border-emerald-500/30 animate-pulse">
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
                        <span>Conferma & Procedi ({completedCycles} cicli completati)</span>
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
