// ============================================================================
// TRADYX PRE-LOGIN & DIAGNOSTIC ONBOARDING FUNNEL
// (src/components/OnboardingFunnel.tsx)
// High-conversion, mobile-first neuro-behavioral diagnostic sequence:
// Step 0: Hero Welcome -> Steps 1-6: Interactive Single-Tap Quiz ->
// 3s Cognitive Calibration -> Personalized Diagnostic Card -> Sign Up / Login
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    BrainCircuit,
    ShieldAlert,
    ShieldCheck,
    CheckCircle2,
    Sparkles,
    TrendingUp,
    CandlestickChart,
    Globe2,
    Landmark,
    Wallet,
    Trophy,
    Layers,
    Compass,
    Flame,
    Zap,
    AlertTriangle,
    Target,
    Clock,
    BookOpen,
    Mic,
    Activity,
    Lock,
    Check,
    RotateCcw
} from 'lucide-react';
import {
    DiagnosticAnswers,
    DiagnosticResult,
    MarketPreference,
    CapitalType,
    LossTriggerType,
    MainEnemyType,
    RuleViolationFrequency,
    PrimaryGoalType
} from '../types/onboarding';
import {
    evaluateDiagnosticProfile,
    saveDiagnosticProfile,
    loadDiagnosticProfile
} from '../services/onboardingDiagnosticService';
import { triggerHaptic } from '../services/circuitBreakerService';

export type FunnelStage = 'WELCOME' | 'QUIZ' | 'CALIBRATING' | 'RESULT';

interface OnboardingFunnelProps {
    initialStage?: FunnelStage;
    onGoToLogin: () => void;
    onUnlockSignup: (result: DiagnosticResult, answers: Required<DiagnosticAnswers>) => void;
}

interface QuizOption<T extends string> {
    value: T;
    label: string;
    sublabel?: string;
    badge?: string;
    badgeTone?: 'rose' | 'amber' | 'emerald' | 'cyan';
    icon: React.ReactNode;
}

interface QuizStepConfig {
    id: keyof DiagnosticAnswers;
    stepNumber: number;
    category: string;
    question: string;
    subtitle: string;
    options: QuizOption<any>[];
}

const QUIZ_STEPS: QuizStepConfig[] = [
    {
        id: 'market',
        stepNumber: 1,
        category: 'Contesto Operativo',
        question: 'Su quali mercati operi principalmente?',
        subtitle: 'Calibriamo volatilità media e profili di rischio sul tuo asset class.',
        options: [
            {
                value: 'CRYPTO' as MarketPreference,
                label: 'Crypto & Altcoins',
                sublabel: 'Mercati 24/7 ad alta volatilità e momentum rapido',
                icon: <Zap className="w-4 h-4 text-emerald-400" />
            },
            {
                value: 'INDICES_FUTURES' as MarketPreference,
                label: 'Indici & Futures (NQ, ES)',
                sublabel: 'Sessioni NY/Londra, leva elevata e reazioni macro',
                icon: <CandlestickChart className="w-4 h-4 text-emerald-400" />
            },
            {
                value: 'FOREX_COMMODITIES' as MarketPreference,
                label: 'Forex & Commodities',
                sublabel: 'Valute major, Oro (XAU) e dinamiche banche centrali',
                icon: <Globe2 className="w-4 h-4 text-emerald-400" />
            },
            {
                value: 'STOCKS_OPTIONS' as MarketPreference,
                label: 'Azioni & Opzioni',
                sublabel: 'Equities US/EU, earnings e strategie direzionali',
                icon: <Landmark className="w-4 h-4 text-emerald-400" />
            }
        ]
    },
    {
        id: 'capitalType',
        stepNumber: 2,
        category: 'Tipologia di Capitale',
        question: 'Che tipo di capitale stai gestendo attualmente?',
        subtitle: 'Configuriamo le soglie di protezione drawdown in base alla tua struttura.',
        options: [
            {
                value: 'PERSONAL' as CapitalType,
                label: 'Conto Personale',
                sublabel: 'Capitale privato con gestione libera del rischio',
                icon: <Wallet className="w-4 h-4 text-emerald-400" />
            },
            {
                value: 'PROP_FIRM' as CapitalType,
                label: 'Sfida / Conto Prop Firm (es. FTMO)',
                sublabel: 'Regole rigide di daily drawdown 4-5% e max loss',
                badge: 'Prop Shield',
                badgeTone: 'amber',
                icon: <Trophy className="w-4 h-4 text-amber-400" />
            },
            {
                value: 'BOTH' as CapitalType,
                label: 'Entrambi',
                sublabel: 'Gestione parallela di conto personale e account funded',
                badge: 'Multi-Account',
                badgeTone: 'cyan',
                icon: <Layers className="w-4 h-4 text-cyan-400" />
            },
            {
                value: 'STARTING' as CapitalType,
                label: 'Sto iniziando ora',
                sublabel: 'Costruzione delle abitudini corrette sin dal primo giorno',
                icon: <Compass className="w-4 h-4 text-emerald-400" />
            }
        ]
    },
    {
        id: 'lossTrigger',
        stepNumber: 3,
        category: 'Hot-Cold Empathy Gap',
        question: 'Cosa succede nella tua mente subito dopo una perdita inaspettata?',
        subtitle: 'Rispondi con onestà: identifica il tuo riflesso automatico del Sistema 1.',
        options: [
            {
                value: 'REVENGE_IMMEDIATE' as LossTriggerType,
                label: 'Cerco subito un altro trade per recuperare',
                badge: 'Rischio Revenge Trading',
                badgeTone: 'rose',
                icon: <Flame className="w-4 h-4 text-rose-400" />
            },
            {
                value: 'OVERSIZE_RECOVERY' as LossTriggerType,
                label: 'Aumento la size per rifarmi velocemente',
                badge: 'Rischio Oversizing',
                badgeTone: 'rose',
                icon: <AlertTriangle className="w-4 h-4 text-rose-400" />
            },
            {
                value: 'EARLY_PROFIT_CUT' as LossTriggerType,
                label: 'Chiudo i profitti successivi troppo presto per paura',
                badge: 'Loss Aversion',
                badgeTone: 'amber',
                icon: <ShieldAlert className="w-4 h-4 text-amber-400" />
            },
            {
                value: 'DISCIPLINED' as LossTriggerType,
                label: 'Resto lucido e rispetto il piano',
                badge: 'Sistema 2 Stabile',
                badgeTone: 'emerald',
                icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />
            }
        ]
    },
    {
        id: 'mainEnemy',
        stepNumber: 4,
        category: 'Ostacolo Numero Uno',
        question: 'Qual è il nemico principale dei tuoi risultati negli ultimi 3 mesi?',
        subtitle: 'Individuiamo la perdita invisibile che erode di più la tua curva equity.',
        options: [
            {
                value: 'FOMO_CHASING' as MainEnemyType,
                label: 'Entrare in FOMO su candele già partite',
                sublabel: 'Ingressi tardivi per paura di perdere il movimento',
                icon: <TrendingUp className="w-4 h-4 text-amber-400" />
            },
            {
                value: 'MOVING_SL' as MainEnemyType,
                label: 'Spostare o togliere lo Stop Loss',
                sublabel: 'Rifiuto psicologico di accettare una perdita programmata',
                icon: <ShieldAlert className="w-4 h-4 text-rose-400" />
            },
            {
                value: 'OVERTRADING' as MainEnemyType,
                label: 'Overtrading (troppe operazioni al giorno)',
                sublabel: 'Fatica decisionale e ricerca di azione anche senza setup',
                icon: <Activity className="w-4 h-4 text-rose-400" />
            },
            {
                value: 'NO_JOURNAL' as MainEnemyType,
                label: 'Mancanza di un diario strutturato',
                sublabel: 'Ripetizione degli stessi errori per assenza di dati oggettivi',
                icon: <BookOpen className="w-4 h-4 text-cyan-400" />
            }
        ]
    },
    {
        id: 'ruleViolationFreq',
        stepNumber: 5,
        category: 'Gestione del Rischio',
        question: 'Quanto spesso violi le regole che ti eri dato prima di aprire i grafici?',
        subtitle: 'Misura la distanza tra la tua strategia a freddo e l\'esecuzione live.',
        options: [
            {
                value: 'WEEKLY' as RuleViolationFrequency,
                label: 'Quasi ogni settimana',
                sublabel: 'Deviazioni ricorrenti durante le sessioni operative',
                icon: <Flame className="w-4 h-4 text-rose-400" />
            },
            {
                value: 'STRESS_DAYS' as RuleViolationFrequency,
                label: 'Solo nelle giornate stressanti',
                sublabel: 'Stanchezza o pressione esterna abbassano le difese cognitive',
                icon: <Clock className="w-4 h-4 text-amber-400" />
            },
            {
                value: 'RARE_CATASTROPHIC' as RuleViolationFrequency,
                label: 'Raramente, ma quando succede brucio i profitti del mese',
                sublabel: 'Rischio coda (tail-risk): un singolo tilt annulla settimane di lavoro',
                icon: <AlertTriangle className="w-4 h-4 text-rose-400" />
            },
            {
                value: 'NEVER' as RuleViolationFrequency,
                label: 'Mai',
                sublabel: 'Aderenza sistematica alle regole di risk management',
                icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            }
        ]
    },
    {
        id: 'primaryGoal',
        stepNumber: 6,
        category: 'Obiettivo a 90 Giorni',
        question: 'Qual è il tuo obiettivo principale nei prossimi 90 giorni?',
        subtitle: 'Ultimo passo: attiviamo i moduli prioritari del tuo Trading OS.',
        options: [
            {
                value: 'PROP_FIRM_PASS' as PrimaryGoalType,
                label: 'Superare o mantenere un conto Prop Firm',
                sublabel: 'Protezione drawdown giornaliero e payout costanti',
                icon: <Trophy className="w-4 h-4 text-amber-400" />
            },
            {
                value: 'ELIMINATE_TILT' as PrimaryGoalType,
                label: 'Eliminare le giornate di tilt e perdita incontrollata',
                sublabel: 'Spezzare per sempre il ciclo perdita → rabbia → revenge',
                icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />
            },
            {
                value: 'INSTITUTIONAL_DISCIPLINE' as PrimaryGoalType,
                label: 'Costruire costanza e disciplina istituzionale',
                sublabel: 'Trasformare il trading in un processo ripetibile e misurabile',
                icon: <Target className="w-4 h-4 text-cyan-400" />
            },
            {
                value: 'AI_VOICE_JOURNAL' as PrimaryGoalType,
                label: 'Tracciare i miei trade con AI e voce senza perdere tempo',
                sublabel: 'Diario istantaneo Voice-to-Trade + analisi psicologica automatica',
                icon: <Mic className="w-4 h-4 text-emerald-400" />
            }
        ]
    }
];

const CALIBRATION_CHECKLIST = [
    'Analisi del profilo di vulnerabilità emotiva (Sistema 1 vs Sistema 2)...',
    'Calibrazione soglie del Protocollo Ulysses e finestra di recupero...',
    'Configurazione AI Risk Manager e Prop Firm Shield...'
];

const badgeToneClasses: Record<'rose' | 'amber' | 'emerald' | 'cyan', string> = {
    rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    cyan: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
};

/**
 * Minimalist Ambient Quasar Bubble — lightweight organic jade/emerald orb
 * tailored for Hero Welcome background and Cognitive Calibration loading.
 */
const AmbientQuasarOrb: React.FC<{ variant: 'ambient' | 'calibrating' }> = ({ variant }) => {
    if (variant === 'ambient') {
        return (
            <div className="pointer-events-none select-none absolute inset-0 overflow-hidden flex items-center justify-center">
                {/* Soft Emerald Radial Field */}
                <div
                    className="absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full blur-[120px]"
                    style={{
                        background:
                            'radial-gradient(circle, rgba(16, 185, 129, 0.14) 0%, rgba(16, 185, 129, 0.04) 45%, transparent 72%)'
                    }}
                />

                {/* Minimalist Organic Quasar Sphere */}
                <div className="relative -translate-y-24 sm:-translate-y-20 opacity-45">
                    <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-full border border-emerald-500/15 animate-quasar-spin-slow flex items-center justify-center">
                        <div className="w-52 h-52 sm:w-56 sm:h-56 rounded-full border border-emerald-400/10 animate-quasar-spin-reverse flex items-center justify-center">
                            <div
                                className="w-36 h-36 sm:w-40 sm:h-40 animate-jade-bubble opacity-80 relative"
                                style={{
                                    background:
                                        'radial-gradient(circle at 30% 28%, rgba(16, 185, 129, 0.72) 0%, rgba(5, 150, 105, 0.42) 55%, rgba(6, 78, 59, 0.18) 100%)',
                                    boxShadow:
                                        '0 0 80px rgba(16, 185, 129, 0.25), inset 0 0 28px rgba(167, 243, 208, 0.18)'
                                }}
                            >
                                <div className="absolute top-5 left-6 w-12 h-6 rounded-full bg-white/20 blur-md -rotate-12" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Calibrating central pulsing Quasar Bubble
    return (
        <div className="relative w-48 h-48 flex items-center justify-center select-none">
            <div
                className="absolute inset-0 rounded-full blur-3xl animate-pulse"
                style={{
                    background:
                        'radial-gradient(circle, rgba(16, 185, 129, 0.36) 0%, rgba(16, 185, 129, 0.08) 60%, transparent 80%)'
                }}
            />
            <div className="absolute w-44 h-44 rounded-full border border-emerald-500/30 border-t-emerald-400 animate-spin" style={{ animationDuration: '4.5s' }} />
            <div className="absolute w-36 h-36 rounded-full border border-cyan-400/20 border-b-emerald-300/60 animate-quasar-spin-reverse" />

            <motion.div
                animate={{ scale: [0.96, 1.06, 0.96] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-28 h-28 animate-jade-bubble relative flex items-center justify-center border border-emerald-200/30"
                style={{
                    background:
                        'radial-gradient(circle at 30% 28%, #34D399 0%, #10B981 48%, #065F46 100%)',
                    boxShadow:
                        '0 0 55px rgba(16, 185, 129, 0.55), inset 0 0 22px rgba(255, 255, 255, 0.25)'
                }}
            >
                <div className="absolute top-3 left-5 w-9 h-4 rounded-full bg-white/30 blur-[3px] -rotate-12" />
                <div className="p-3 rounded-2xl bg-black/25 backdrop-blur-sm border border-white/20">
                    <BrainCircuit className="w-8 h-8 text-white drop-shadow" />
                </div>
            </motion.div>
        </div>
    );
};

export const OnboardingFunnel: React.FC<OnboardingFunnelProps> = ({
    initialStage = 'WELCOME',
    onGoToLogin,
    onUnlockSignup
}) => {
    const storedProfile = loadDiagnosticProfile();

    const [stage, setStage] = useState<FunnelStage>(() => {
        if (initialStage === 'RESULT' && storedProfile?.result) {
            return 'RESULT';
        }
        return initialStage === 'RESULT' ? 'WELCOME' : initialStage;
    });

    const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
    const [direction, setDirection] = useState<1 | -1>(1);
    const [answers, setAnswers] = useState<DiagnosticAnswers>(() => storedProfile?.answers || {});
    const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(
        () => storedProfile?.result || null
    );
    const [tappedValue, setTappedValue] = useState<string | null>(null);

    // Calibration loading state (3 seconds total)
    const [checkedCount, setCheckedCount] = useState<number>(0);
    const [calibrationProgress, setCalibrationProgress] = useState<number>(0);

    const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
        };
    }, []);

    // Run 3-second cognitive calibration animation when entering CALIBRATING stage
    useEffect(() => {
        if (stage !== 'CALIBRATING') return;

        setCheckedCount(0);
        setCalibrationProgress(10);

        const t1 = setTimeout(() => {
            setCheckedCount(1);
            setCalibrationProgress(42);
            triggerHaptic('click');
        }, 650);

        const t2 = setTimeout(() => {
            setCheckedCount(2);
            setCalibrationProgress(74);
            triggerHaptic('click');
        }, 1550);

        const t3 = setTimeout(() => {
            setCheckedCount(3);
            setCalibrationProgress(100);
            triggerHaptic('calm');
        }, 2400);

        const tDone = setTimeout(() => {
            setStage('RESULT');
        }, 3000);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(tDone);
        };
    }, [stage]);

    const handleStartQuiz = () => {
        triggerHaptic('click');
        setDirection(1);
        setCurrentStepIndex(0);
        setStage('QUIZ');
    };

    const handleSelectOption = (stepId: keyof DiagnosticAnswers, value: string) => {
        if (tappedValue) return; // Prevent double-tap race
        triggerHaptic('click');
        setTappedValue(value);

        const updatedAnswers: DiagnosticAnswers = {
            ...answers,
            [stepId]: value
        };
        setAnswers(updatedAnswers);

        advanceTimeoutRef.current = setTimeout(() => {
            setTappedValue(null);
            if (currentStepIndex < QUIZ_STEPS.length - 1) {
                setDirection(1);
                setCurrentStepIndex((prev) => prev + 1);
            } else {
                const completedAnswers = updatedAnswers as Required<DiagnosticAnswers>;
                const result = evaluateDiagnosticProfile(completedAnswers);
                setDiagnosticResult(result);
                saveDiagnosticProfile(completedAnswers, result);
                setStage('CALIBRATING');
            }
        }, 180);
    };

    const handleBackInQuiz = () => {
        if (advanceTimeoutRef.current) {
            clearTimeout(advanceTimeoutRef.current);
            setTappedValue(null);
        }
        triggerHaptic('click');
        if (currentStepIndex === 0) {
            setStage('WELCOME');
        } else {
            setDirection(-1);
            setCurrentStepIndex((prev) => prev - 1);
        }
    };

    const handleReviewAnswers = () => {
        triggerHaptic('click');
        setDirection(-1);
        setCurrentStepIndex(QUIZ_STEPS.length - 1);
        setStage('QUIZ');
    };

    const handleRestartDiagnostic = () => {
        triggerHaptic('click');
        setDirection(-1);
        setCurrentStepIndex(0);
        setStage('QUIZ');
    };

    const currentStep = QUIZ_STEPS[currentStepIndex];
    const progressPercent = ((currentStepIndex + 1) / QUIZ_STEPS.length) * 100;

    // ========================================================================
    // RENDER: STEP 0 — HERO WELCOME SCREEN
    // ========================================================================
    if (stage === 'WELCOME') {
        return (
            <div className="w-full min-h-[100dvh] bg-[#08090C] text-white relative overflow-hidden flex flex-col justify-between">
                <AmbientQuasarOrb variant="ambient" />

                <div className="w-full max-w-md mx-auto min-h-[100dvh] flex flex-col justify-between px-5 pt-[max(env(safe-area-inset-top,20px),24px)] pb-[max(env(safe-area-inset-bottom,20px),24px)] relative z-10">
                    {/* Top Brand Badge */}
                    <motion.header
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45 }}
                        className="flex flex-col items-center text-center pt-2"
                    >
                        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl shadow-lg">
                            <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_10px_#10B981] animate-pulse" />
                            <span className="text-sm font-black tracking-[0.22em] text-white font-sans">
                                TRADYX
                            </span>
                        </div>
                        <span className="mt-2.5 text-[10px] font-mono font-bold tracking-[0.24em] text-[#10B981]/90 uppercase">
                            NEURO-BEHAVIORAL TRADING OS
                        </span>
                    </motion.header>

                    {/* Center Hero Copy & Visual Telemetry */}
                    <motion.main
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.1 }}
                        className="my-auto py-8 flex flex-col items-center text-center space-y-6"
                    >
                        {/* Minimalist Neuro-Telemetry Pill */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-mono text-emerald-300">
                            <BrainCircuit className="w-3.5 h-3.5 text-[#10B981]" />
                            <span>Diagnosi Neuro-Finanziaria • 60 secondi</span>
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-[28px] sm:text-[32px] font-black leading-[1.14] tracking-tight text-white">
                                Il 90% dei trader perde per colpa della{' '}
                                <span className="text-[#10B981]">propria mente</span>, non dei grafici.
                            </h1>

                            <p className="text-sm sm:text-[15px] text-slate-400 leading-relaxed max-w-[340px] mx-auto">
                                Scopri i tuoi punti ciechi emotivi, blocca il revenge trading e proteggi il tuo capitale in 60 secondi.
                            </p>
                        </div>

                        {/* Subtle Behavioral Pillar Chips */}
                        <div className="grid grid-cols-3 gap-2 w-full pt-2">
                            {[
                                { label: 'Ulysses OS', sub: 'Anti-Tilt' },
                                { label: 'Prop Shield', sub: 'Drawdown 5%' },
                                { label: 'Voice AI', sub: 'Zero Friction' }
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className="px-2.5 py-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] backdrop-blur-md text-center"
                                >
                                    <div className="text-[11px] font-bold text-slate-100 font-mono">
                                        {item.label}
                                    </div>
                                    <div className="text-[10px] text-emerald-400/80 font-mono mt-0.5">
                                        {item.sub}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.main>

                    {/* Bottom Primary CTA & Secondary Login Link */}
                    <motion.footer
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="space-y-4 pb-1"
                    >
                        <button
                            type="button"
                            onClick={handleStartQuiz}
                            className="group relative w-full min-h-[56px] px-6 py-4 rounded-2xl bg-[#10B981] hover:bg-emerald-400 active:scale-[0.98] text-[#050A08] font-black text-[15px] tracking-tight shadow-[0_0_35px_rgba(16,185,129,0.32)] transition-all flex items-center justify-center gap-2 overflow-hidden cursor-pointer"
                        >
                            <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                            <span>Analizza il tuo Profilo Trader →</span>
                        </button>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => {
                                    triggerHaptic('click');
                                    onGoToLogin();
                                }}
                                className="text-xs text-slate-400 hover:text-white transition py-2 px-3 cursor-pointer"
                            >
                                Hai già un account?{' '}
                                <span className="text-[#10B981] font-bold underline underline-offset-4">
                                    Accedi
                                </span>
                            </button>
                        </div>
                    </motion.footer>
                </div>
            </div>
        );
    }

    // ========================================================================
    // RENDER: STEPS 1–6 — INTERACTIVE DIAGNOSTIC QUIZ
    // ========================================================================
    if (stage === 'QUIZ') {
        return (
            <div className="w-full min-h-[100dvh] bg-[#08090C] text-white relative overflow-hidden flex flex-col">
                {/* Subtle Emerald Radial Background Glow */}
                <div
                    className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[480px] h-[340px] rounded-full blur-[120px] opacity-60"
                    style={{
                        background:
                            'radial-gradient(circle, rgba(16, 185, 129, 0.11) 0%, transparent 70%)'
                    }}
                />

                <div className="w-full max-w-md mx-auto min-h-[100dvh] flex flex-col px-5 pt-[max(env(safe-area-inset-top,18px),20px)] pb-[max(env(safe-area-inset-bottom,20px),24px)] relative z-10">
                    {/* Top Navigation & Thin Progress Bar */}
                    <header className="space-y-3.5 pb-4">
                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={handleBackInQuiz}
                                className="inline-flex items-center gap-1.5 px-3 py-2 -ml-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-200 transition active:scale-95 cursor-pointer"
                                aria-label="Indietro"
                            >
                                <ArrowLeft className="w-4 h-4 text-slate-300" />
                                <span>Indietro</span>
                            </button>

                            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-slate-400">
                                Step{' '}
                                <span className="text-[#10B981] font-black">
                                    {currentStep.stepNumber}
                                </span>{' '}
                                di {QUIZ_STEPS.length}
                            </span>

                            <button
                                type="button"
                                onClick={() => {
                                    triggerHaptic('click');
                                    onGoToLogin();
                                }}
                                className="text-[11px] font-semibold text-slate-400 hover:text-[#10B981] transition px-2 py-1.5 cursor-pointer"
                            >
                                Accedi
                            </button>
                        </div>

                        {/* Thin Progress Bar */}
                        <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                                initial={false}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            />
                        </div>
                    </header>

                    {/* Animated Question Container */}
                    <div className="flex-1 flex flex-col justify-center py-3">
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={currentStep.id}
                                custom={direction}
                                initial={{ opacity: 0, x: direction * 28 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: direction * -28 }}
                                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                                className="space-y-6"
                            >
                                {/* Question Header */}
                                <div className="space-y-2">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">
                                        {currentStep.category}
                                    </span>

                                    <h2 className="text-[22px] sm:text-2xl font-black text-white leading-snug tracking-tight">
                                        {currentStep.question}
                                    </h2>

                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        {currentStep.subtitle}
                                    </p>
                                </div>

                                {/* Single-Tap Answer Cards */}
                                <div className="space-y-3">
                                    {currentStep.options.map((opt) => {
                                        const isSelected =
                                            tappedValue === opt.value ||
                                            answers[currentStep.id] === opt.value;

                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() =>
                                                    handleSelectOption(currentStep.id, opt.value)
                                                }
                                                className={`w-full text-left bg-white/[0.04] border rounded-2xl p-4 transition-all duration-200 cursor-pointer active:scale-[0.985] flex items-start gap-3.5 group backdrop-blur-md ${
                                                    isSelected
                                                        ? 'border-[#10B981] bg-emerald-500/[0.10] shadow-[0_0_24px_rgba(16,185,129,0.16)]'
                                                        : 'border-white/[0.08] hover:border-emerald-500/50 hover:bg-white/[0.06]'
                                                }`}
                                            >
                                                <div
                                                    className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center border transition-colors mt-0.5 ${
                                                        isSelected
                                                            ? 'bg-emerald-500/20 border-emerald-400/50'
                                                            : 'bg-white/[0.04] border-white/[0.08] group-hover:border-emerald-500/30'
                                                    }`}
                                                >
                                                    {opt.icon}
                                                </div>

                                                <div className="flex-1 min-w-0 space-y-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-sm font-bold text-white leading-snug">
                                                            {opt.label}
                                                        </span>
                                                        <div
                                                            className={`w-5 h-5 rounded-full shrink-0 border flex items-center justify-center transition-all ${
                                                                isSelected
                                                                    ? 'bg-[#10B981] border-[#10B981] text-slate-950'
                                                                    : 'border-white/20 group-hover:border-emerald-500/60'
                                                            }`}
                                                        >
                                                            {isSelected && (
                                                                <Check className="w-3 h-3 stroke-[3]" />
                                                            )}
                                                        </div>
                                                    </div>

                                                    {opt.sublabel && (
                                                        <p className="text-[11px] text-slate-400 leading-snug">
                                                            {opt.sublabel}
                                                        </p>
                                                    )}

                                                    {opt.badge && (
                                                        <span
                                                            className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                                                                badgeToneClasses[
                                                                    opt.badgeTone || 'emerald'
                                                                ]
                                                            }`}
                                                        >
                                                            {opt.badge}
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Subtle Footer Note */}
                    <footer className="pt-3 text-center">
                        <span className="text-[10px] font-mono text-slate-500 inline-flex items-center gap-1.5">
                            <Lock className="w-3 h-3 text-emerald-500/70" />
                            <span>Profilo crittografato localmente • Calibrazione istantanea</span>
                        </span>
                    </footer>
                </div>
            </div>
        );
    }

    // ========================================================================
    // RENDER: STEP 3 — COGNITIVE CALIBRATION LOADING (3 SECONDS)
    // ========================================================================
    if (stage === 'CALIBRATING') {
        return (
            <div className="w-full min-h-[100dvh] bg-[#08090C] text-white relative overflow-hidden flex flex-col items-center justify-center px-5 py-8">
                <div
                    className="pointer-events-none fixed inset-0"
                    style={{
                        background:
                            'radial-gradient(circle at 50% 40%, rgba(16, 185, 129, 0.12) 0%, transparent 60%)'
                    }}
                />

                <div className="w-full max-w-md mx-auto flex flex-col items-center text-center space-y-7 relative z-10">
                    {/* Top Telemetry Tag */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-emerald-300">
                        <Sparkles className="w-3.5 h-3.5 text-[#10B981] animate-pulse" />
                        <span>CALIBRAZIONE COGNITIVA IN CORSO</span>
                    </div>

                    {/* Central Pulsing Quasar Bubble */}
                    <AmbientQuasarOrb variant="calibrating" />

                    {/* Progress Readout */}
                    <div className="w-full max-w-xs space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-slate-400">Sintesi Neuro-Comportamentale</span>
                            <span className="text-[#10B981] font-black tabular-nums">
                                {calibrationProgress}%
                            </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                            <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-300"
                                initial={{ width: '8%' }}
                                animate={{ width: `${calibrationProgress}%` }}
                                transition={{ duration: 0.55, ease: 'easeOut' }}
                            />
                        </div>
                    </div>

                    {/* Animated Sequential Checklist */}
                    <div className="w-full space-y-2.5 text-left">
                        {CALIBRATION_CHECKLIST.map((item, idx) => {
                            const isChecked = checkedCount > idx;
                            const isActive = checkedCount === idx;

                            return (
                                <motion.div
                                    key={item}
                                    initial={{ opacity: 0.35, y: 6 }}
                                    animate={{
                                        opacity: isChecked || isActive ? 1 : 0.4,
                                        y: 0
                                    }}
                                    transition={{ duration: 0.3 }}
                                    className={`p-3.5 rounded-2xl border backdrop-blur-md flex items-center gap-3 transition-colors ${
                                        isChecked
                                            ? 'bg-emerald-500/[0.08] border-emerald-500/35 text-white'
                                            : isActive
                                            ? 'bg-white/[0.05] border-white/[0.14] text-slate-200'
                                            : 'bg-white/[0.02] border-white/[0.06] text-slate-500'
                                    }`}
                                >
                                    <div
                                        className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center transition-all ${
                                            isChecked
                                                ? 'bg-[#10B981] text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.6)]'
                                                : isActive
                                                ? 'border-2 border-emerald-400 border-t-transparent animate-spin'
                                                : 'border border-white/20'
                                        }`}
                                    >
                                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                    <span className="text-xs font-medium leading-snug">{item}</span>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================================
    // RENDER: STEP 4 — PERSONALIZED DIAGNOSTIC RESULT & SIGNUP CONVERSION
    // ========================================================================
    const activeResult = diagnosticResult;
    if (!activeResult) {
        return null;
    }

    const riskTheme =
        activeResult.riskLevel === 'CRITICO'
            ? {
                  badgeBg: 'bg-rose-500/15 border-rose-500/45 text-rose-300',
                  scoreColor: 'text-rose-400',
                  barGradient: 'from-amber-400 via-rose-500 to-rose-600',
                  cardBorder: 'border-rose-500/25'
              }
            : activeResult.riskLevel === 'ALTO'
            ? {
                  badgeBg: 'bg-amber-500/15 border-amber-500/45 text-amber-300',
                  scoreColor: 'text-amber-400',
                  barGradient: 'from-emerald-400 via-amber-400 to-rose-500',
                  cardBorder: 'border-amber-500/25'
              }
            : activeResult.riskLevel === 'MODERATO'
            ? {
                  badgeBg: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300',
                  scoreColor: 'text-cyan-400',
                  barGradient: 'from-emerald-400 to-cyan-400',
                  cardBorder: 'border-cyan-500/25'
              }
            : {
                  badgeBg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
                  scoreColor: 'text-[#10B981]',
                  barGradient: 'from-emerald-500 to-teal-300',
                  cardBorder: 'border-emerald-500/30'
              };

    const protocolAccentDot: Record<'emerald' | 'amber' | 'rose' | 'cyan', string> = {
        emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
        amber: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
        rose: 'bg-rose-500/15 text-rose-300 border-rose-500/35',
        cyan: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35'
    };

    return (
        <div className="w-full min-h-[100dvh] bg-[#08090C] text-white relative overflow-x-hidden flex flex-col">
            {/* Ambient Glow */}
            <div
                className="pointer-events-none fixed -top-20 left-1/2 -translate-x-1/2 w-[520px] h-[380px] rounded-full blur-[120px]"
                style={{
                    background:
                        'radial-gradient(circle, rgba(16, 185, 129, 0.13) 0%, transparent 70%)'
                }}
            />

            <div className="w-full max-w-md mx-auto min-h-[100dvh] flex flex-col px-5 pt-[max(env(safe-area-inset-top,18px),20px)] pb-[max(env(safe-area-inset-bottom,22px),26px)] relative z-10 space-y-5">
                {/* Top Action Row */}
                <header className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={handleReviewAnswers}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 -ml-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-300 transition cursor-pointer"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Rivedi risposte</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleRestartDiagnostic}
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-emerald-400 transition cursor-pointer"
                    >
                        <RotateCcw className="w-3 h-3" />
                        <span>Rifai test</span>
                    </button>
                </header>

                {/* Main Premium Diagnosis Card */}
                <motion.section
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className={`rounded-3xl bg-white/[0.035] border ${riskTheme.cardBorder} backdrop-blur-xl p-5 shadow-[0_12px_40px_rgba(0,0,0,0.45)] space-y-5`}
                >
                    {/* Alert Badge + Title */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-wider border ${riskTheme.badgeBg}`}
                            >
                                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                                <span>RISCHIO EMOTIVO: {activeResult.riskLevel}</span>
                            </span>

                            <span className="text-[11px] font-mono text-slate-400">
                                {activeResult.derivedPreferences.preferredMarketLabel}
                            </span>
                        </div>

                        <h2 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight">
                            La tua Diagnosi Comportamentale è pronta
                        </h2>
                    </div>

                    {/* Emotional Risk Indicator Box */}
                    <div className="p-4 rounded-2xl bg-[#08090C]/80 border border-white/[0.07] space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                                    Indice di Rischio Emotivo
                                </span>
                                <p className="text-xs sm:text-[13px] font-extrabold text-white leading-snug">
                                    {activeResult.riskBadgeTitle}
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <span
                                    className={`text-2xl font-black font-mono tabular-nums ${riskTheme.scoreColor}`}
                                >
                                    {activeResult.riskScore}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500 block">
                                    / 100
                                </span>
                            </div>
                        </div>

                        {/* Risk Bar */}
                        <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${activeResult.riskScore}%` }}
                                transition={{ duration: 0.7, ease: 'easeOut' }}
                                className={`h-full rounded-full bg-gradient-to-r ${riskTheme.barGradient}`}
                            />
                        </div>

                        {/* System 1 vs System 2 Balance */}
                        <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                                <span className="text-slate-400 block">Sistema 1 (Impulsivo)</span>
                                <strong className={`text-sm font-black ${riskTheme.scoreColor}`}>
                                    {activeResult.system1Percent}%
                                </strong>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                                <span className="text-slate-400 block">Sistema 2 (Analitico)</span>
                                <strong className="text-sm font-black text-[#10B981]">
                                    {activeResult.system2Percent}%
                                </strong>
                            </div>
                        </div>

                        <p className="text-[11px] text-slate-300 leading-relaxed pt-0.5">
                            {activeResult.riskSummary}
                        </p>
                    </div>

                    {/* Recommended Tailored Protocols */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">
                                Protocollo Consigliato su Misura
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                                Auto-configurato
                            </span>
                        </div>

                        <div className="space-y-2.5">
                            {activeResult.recommendedProtocols.map((protocol) => (
                                <div
                                    key={protocol.id}
                                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-1.5"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                                            <h3 className="text-xs font-extrabold text-white leading-snug">
                                                {protocol.title}
                                            </h3>
                                        </div>
                                        <span
                                            className={`shrink-0 px-2 py-0.5 rounded-md text-[9px] font-mono font-black border ${
                                                protocolAccentDot[protocol.accent]
                                            }`}
                                        >
                                            {protocol.tag}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 leading-relaxed pl-6">
                                        {protocol.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.section>

                {/* Primary Unlock CTA -> Sign Up */}
                <motion.footer
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.15 }}
                    className="space-y-3 pt-1 mt-auto"
                >
                    <button
                        type="button"
                        onClick={() => {
                            triggerHaptic('calm');
                            const completedAnswers = answers as Required<DiagnosticAnswers>;
                            saveDiagnosticProfile(completedAnswers, activeResult);
                            onUnlockSignup(activeResult, completedAnswers);
                        }}
                        className="group relative w-full min-h-[56px] px-5 py-4 rounded-2xl bg-[#10B981] hover:bg-emerald-400 active:scale-[0.98] text-[#050A08] font-black text-sm sm:text-[15px] tracking-tight shadow-[0_0_35px_rgba(16,185,129,0.34)] transition-all flex items-center justify-center gap-2 overflow-hidden cursor-pointer"
                    >
                        <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        <span>Crea il tuo Account e Attiva il Protocollo →</span>
                    </button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('click');
                                onGoToLogin();
                            }}
                            className="text-xs text-slate-400 hover:text-white transition py-1.5 px-3 cursor-pointer"
                        >
                            Hai già un account?{' '}
                            <span className="text-[#10B981] font-bold underline underline-offset-4">
                                Accedi
                            </span>
                        </button>
                    </div>
                </motion.footer>
            </div>
        </div>
    );
};

export default OnboardingFunnel;
