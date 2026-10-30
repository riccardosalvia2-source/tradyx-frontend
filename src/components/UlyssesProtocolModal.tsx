// ============================================================================
// TRADYX ULYSSES RE-CENTERING PROTOCOL MODAL
// (src/components/UlyssesProtocolModal.tsx)
// Active Neuro-Behavioral Friction Protocol (Prefrontal Cortex Activation)
// Clinical Framework: Rational Unlock Triad to neutralize amygdala hijacking
// ============================================================================

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
    BrainCircuit, 
    ShieldAlert, 
    CheckCircle2, 
    AlertTriangle, 
    HeartPulse, 
    Scale, 
    Compass, 
    X, 
    ArrowRight, 
    RotateCcw,
    Sparkles,
    Clock
} from 'lucide-react';
import { triggerHaptic } from '../services/circuitBreakerService';

interface UlyssesProtocolModalProps {
    isOpen: boolean;
    reason: string;
    onUnlockSuccess: () => void;
    onClose: () => void;
    onTakeBreak?: (minutes: number) => void;
}

type PhysiologicalState = 'CALMO' | 'BATTITO_ACCELERATO' | 'TENSIONE_MUSCOLARE' | 'RUMINAZIONE';

export const UlyssesProtocolModal: React.FC<UlyssesProtocolModalProps> = ({
    isOpen,
    reason,
    onUnlockSuccess,
    onClose,
    onTakeBreak
}) => {
    // Triad Step: 1 = Stato Fisiologico, 2 = Fatti vs Interpretazioni, 3 = Azione Procedurale, 4 = Success
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

    // Answers state
    const [physiologicalState, setPhysiologicalState] = useState<PhysiologicalState | null>(null);
    const [planCompliance, setPlanCompliance] = useState<'YES_PLANNED' | 'NO_REVENGE' | null>(null);
    const [proceduralAction, setProceduralAction] = useState<'EXECUTE_WITH_SL' | 'CLOSE_PLATFORM' | null>(null);

    // Dopamine Loop Warning Flag
    const [showDopamineLoopWarning, setShowDopamineLoopWarning] = useState<boolean>(false);

    if (!isOpen) return null;

    const handleSelectPhysiology = (state: PhysiologicalState) => {
        triggerHaptic('click');
        setPhysiologicalState(state);
        setCurrentStep(2);
    };

    const handleSelectCompliance = (choice: 'YES_PLANNED' | 'NO_REVENGE') => {
        triggerHaptic('click');
        setPlanCompliance(choice);
        if (choice === 'NO_REVENGE') {
            triggerHaptic('tilt');
            setShowDopamineLoopWarning(true);
        } else {
            setShowDopamineLoopWarning(false);
            setCurrentStep(3);
        }
    };

    const handleSelectProceduralAction = (action: 'EXECUTE_WITH_SL' | 'CLOSE_PLATFORM') => {
        setProceduralAction(action);
        if (action === 'CLOSE_PLATFORM') {
            triggerHaptic('calm');
            if (onTakeBreak) onTakeBreak(20);
            onClose();
        } else {
            triggerHaptic('calm');
            setCurrentStep(4);
            setTimeout(() => {
                onUnlockSuccess();
            }, 900);
        }
    };

    const handleResetTriad = () => {
        triggerHaptic('click');
        setCurrentStep(1);
        setPhysiologicalState(null);
        setPlanCompliance(null);
        setShowDopamineLoopWarning(false);
        setProceduralAction(null);
    };

    const modalContent = (
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-[#0D111A]/95 border border-rose-500/30 rounded-3xl p-5 sm:p-6 shadow-[0_8px_32px_0_rgba(220,38,38,0.25)] flex flex-col font-sans space-y-4 max-h-[92vh] overflow-y-auto scrollbar-thin">
                
                {/* Header Badge & Close Button */}
                <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] pb-3.5">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
                                <ShieldAlert className="w-3 h-3 text-rose-400 animate-pulse" />
                                <span>FRIZIONE ATTIVA • SISTEMA 2 TRIGGER</span>
                            </span>
                        </div>
                        <h2 className="text-base sm:text-lg font-black text-white font-mono tracking-tight flex items-center gap-2">
                            <span>ULYSSES RE-CENTERING PROTOCOL</span>
                        </h2>
                        <p className="text-[11px] text-slate-300 font-mono leading-relaxed">
                            L'amigdala sta bypassando la corteccia prefrontale (PFC). Risolvi la <strong className="text-cyan-400">Triade di Sblocco Razionale</strong> per ripristinare il controllo analitico.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-xl glass-subcard text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
                        title="Annulla inserimento"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Alarm Trigger Reason Banner */}
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center gap-2.5 text-xs font-mono text-rose-300">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <div className="leading-tight">
                        <strong className="text-rose-200">Sequenza Critica Rilevata: </strong>
                        <span>{reason}</span>
                    </div>
                </div>

                {/* Step Progress Indicators */}
                <div className="grid grid-cols-3 gap-2 py-1 font-mono text-[10px]">
                    <div className={`p-2 rounded-xl text-center border transition-all ${
                        currentStep === 1 
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-black shadow-sm'
                            : currentStep > 1 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                            : 'glass-subcard text-slate-500'
                    }`}>
                        1. Fisiologia
                    </div>

                    <div className={`p-2 rounded-xl text-center border transition-all ${
                        currentStep === 2 
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-black shadow-sm'
                            : currentStep > 2 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                            : 'glass-subcard text-slate-500'
                    }`}>
                        2. Fatti vs Bias
                    </div>

                    <div className={`p-2 rounded-xl text-center border transition-all ${
                        currentStep === 3 
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-black shadow-sm'
                            : currentStep === 4 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                            : 'glass-subcard text-slate-500'
                    }`}>
                        3. Azione
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* STEP 1: STATO FISIOLOGICO                                                 */}
                {/* ========================================================================= */}
                {currentStep === 1 && (
                    <div className="space-y-3.5 animate-in fade-in duration-200">
                        <div className="space-y-1">
                            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
                                Domanda 1 di 3 • Autoconsapevolezza Somatica
                            </span>
                            <h3 className="text-sm font-extrabold text-white">
                                Qual è il tuo livello di attivazione corporea attuale?
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {[
                                { key: 'CALMO', title: 'Calmo', desc: 'Respiro regolare, battito stabile, mente lucida' },
                                { key: 'BATTITO_ACCELERATO', title: 'Battito Accelerato', desc: 'Tachicardia da adrenalina, respiro toracico corto' },
                                { key: 'TENSIONE_MUSCOLARE', title: 'Tensione Muscolare', desc: 'Spalle/mascella serrate, agitazione motoria' },
                                { key: 'RUMINAZIONE', title: 'Ruminazione', desc: 'Pensieri ossessivi ricorrenti sulla perdita subita' }
                            ].map((opt) => (
                                <button
                                    key={opt.key}
                                    type="button"
                                    onClick={() => handleSelectPhysiology(opt.key as PhysiologicalState)}
                                    className="p-3.5 rounded-2xl glass-panel hover:border-cyan-400/60 hover:bg-white/[0.06] text-left transition active:scale-98 cursor-pointer flex flex-col space-y-1 group border border-white/[0.08]"
                                >
                                    <div className="flex items-center justify-between text-xs font-mono font-black text-white group-hover:text-cyan-300">
                                        <span>{opt.title}</span>
                                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-mono leading-tight">
                                        {opt.desc}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* STEP 2: FATTI VS INTERPRETAZIONI                                          */}
                {/* ========================================================================= */}
                {currentStep === 2 && !showDopamineLoopWarning && (
                    <div className="space-y-3.5 animate-in fade-in duration-200">
                        <div className="space-y-1">
                            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
                                Domanda 2 di 3 • Test di Oggettività
                            </span>
                            <h3 className="text-sm font-extrabold text-white">
                                L'operazione che stai per fare rispetta al 100% il tuo piano oggettivo scritto?
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5">
                            <button
                                type="button"
                                onClick={() => handleSelectCompliance('YES_PLANNED')}
                                className="p-4 rounded-2xl glass-panel hover:border-emerald-400/80 hover:bg-emerald-950/20 text-left transition active:scale-98 cursor-pointer border border-emerald-500/30 group"
                            >
                                <div className="flex items-center justify-between text-xs font-mono font-black text-emerald-400">
                                    <span>SÌ, È A PIANO</span>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                </div>
                                <p className="text-[11px] text-slate-300 font-mono mt-1 leading-snug">
                                    Setup valido con edge statistico, punto di invalidazione chiaro e Stop Loss predefinito.
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSelectCompliance('NO_REVENGE')}
                                className="p-4 rounded-2xl glass-panel hover:border-rose-400/80 hover:bg-rose-950/20 text-left transition active:scale-98 cursor-pointer border border-rose-500/30 group"
                            >
                                <div className="flex items-center justify-between text-xs font-mono font-black text-rose-400">
                                    <span>NO, VOGLIO RECUPERARE</span>
                                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                                </div>
                                <p className="text-[11px] text-slate-300 font-mono mt-1 leading-snug">
                                    Voglio compensare la perdita precedente e cancellare il drawdown con un trade rapido.
                                </p>
                            </button>
                        </div>
                    </div>
                )}

                {/* DOPAMINE LOOP WARNING (SE SCEGLIE "NO, VOGLIO RECUPERARE") */}
                {currentStep === 2 && showDopamineLoopWarning && (
                    <div className="space-y-3.5 animate-in zoom-in-95 duration-200">
                        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/60 text-left space-y-2.5 shadow-xl">
                            <div className="flex items-center gap-2 text-rose-400 font-mono font-black text-xs uppercase">
                                <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse shrink-0" />
                                <span>LOOP DOPAMINERGICO RILEVATO</span>
                            </div>

                            <p className="text-xs text-rose-200 leading-relaxed font-mono">
                                Stai agendo sotto l'impulso dell'amigdala: il cervello cerca una scarica dopaminergica immediata per sedare il dolore della perdita. In questo stato, la probabilità statistica di subire un'ulteriore perdita supera l'82%.
                            </p>

                            <div className="p-3 rounded-xl bg-black/40 border border-rose-500/30 text-[11px] font-mono text-white">
                                <strong className="text-rose-400">Esortazione Clinica: </strong>
                                Fermati adesso. La disciplina non si misura quando il mercato è facile, ma nella capacità di astenersi dall'operare durante il tilt.
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                            <button
                                type="button"
                                onClick={() => {
                                    if (onTakeBreak) onTakeBreak(20);
                                    onClose();
                                }}
                                className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-black uppercase transition active:scale-95 cursor-pointer shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2"
                            >
                                <Clock className="w-4 h-4" />
                                <span>Chiudi Piattaforma (20 min)</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleResetTriad}
                                className="w-full py-3 px-4 rounded-xl glass-subcard hover:bg-white/10 text-slate-300 font-mono text-xs font-bold transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Rivaluta con Rigore</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* STEP 3: AZIONE PROCEDURALE                                                */}
                {/* ========================================================================= */}
                {currentStep === 3 && (
                    <div className="space-y-3.5 animate-in fade-in duration-200">
                        <div className="space-y-1">
                            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
                                Domanda 3 di 3 • Esecuzione Disciplinata
                            </span>
                            <h3 className="text-sm font-extrabold text-white">
                                Qual è la singola azione corretta adesso?
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5">
                            <button
                                type="button"
                                onClick={() => handleSelectProceduralAction('EXECUTE_WITH_SL')}
                                className="p-4 rounded-2xl glass-panel hover:border-emerald-400 hover:bg-emerald-950/20 text-left transition active:scale-98 cursor-pointer border border-emerald-500/30 group"
                            >
                                <div className="flex items-center justify-between text-xs font-mono font-black text-emerald-400">
                                    <span>ESEGUI CON STOP LOSS DEFINITO</span>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                </div>
                                <p className="text-[11px] text-slate-300 font-mono mt-1 leading-snug">
                                    Risk per trade entro i parametri, size regolata, Stop Loss posizionato a macchina senza eccezioni.
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSelectProceduralAction('CLOSE_PLATFORM')}
                                className="p-4 rounded-2xl glass-panel hover:border-amber-400 hover:bg-amber-950/20 text-left transition active:scale-98 cursor-pointer border border-amber-500/30 group"
                            >
                                <div className="flex items-center justify-between text-xs font-mono font-black text-amber-400">
                                    <span>CHIUDI LA PIATTAFORMA PER 20 MINUTI</span>
                                    <Clock className="w-4 h-4 text-amber-400" />
                                </div>
                                <p className="text-[11px] text-slate-300 font-mono mt-1 leading-snug">
                                    Pausa fisiologica per consentire il decadimento del cortisolo e azzerare il sovraccarico cognitivo.
                                </p>
                            </button>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* STEP 4: SUCCESS RE-CENTERED                                               */}
                {/* ========================================================================= */}
                {currentStep === 4 && (
                    <div className="py-6 text-center space-y-3 animate-in zoom-in-95 duration-200">
                        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-950/50">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-base font-black text-white font-mono">
                                CORTECCIA PREFRONTALE RIATTIVATA
                            </h3>
                            <p className="text-xs text-emerald-300 font-mono">
                                Triade superata in 10 secondi. Il form di inserimento è sbloccato.
                            </p>
                        </div>
                    </div>
                )}

                {/* Footer Cancel Action */}
                {currentStep !== 4 && (
                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-400">
                            Frizione attiva: tempo stimato ~10s
                        </span>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-slate-400 hover:text-rose-400 transition cursor-pointer underline"
                        >
                            Annulla inserimento (Conserva capitale)
                        </button>
                    </div>
                )}

            </div>
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
