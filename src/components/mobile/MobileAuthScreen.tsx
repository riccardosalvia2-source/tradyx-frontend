// ============================================================================
// TRADYX MOBILE-FIRST AUTH SCREEN (src/components/mobile/MobileAuthScreen.tsx)
// Supabase Email/Password + Google OAuth Login & Sign Up Optimized for Mobile
// Seamlessly integrated with Neuro-Behavioral Diagnostic Onboarding
// ============================================================================

import React, { useState, useEffect } from 'react';
import { signInUser, signUpUser, signInWithGoogle } from '../../services/authService';
import { UserAccount } from '../../types/auth';
import { DiagnosticResult } from '../../types/onboarding';
import {
    BrainCircuit,
    Mail,
    Lock,
    User,
    Eye,
    EyeOff,
    ArrowLeft,
    ArrowRight,
    AlertCircle,
    CheckCircle2,
    ShieldCheck,
    Sparkles,
    Play
} from 'lucide-react';

interface MobileAuthScreenProps {
    onAuthenticated: (user: UserAccount) => void;
    onContinueAsDemo: () => void;
    initialMode?: 'LOGIN' | 'SIGNUP';
    diagnosticResult?: DiagnosticResult | null;
    onBackToWelcome?: () => void;
    onBackToDiagnosis?: () => void;
    onStartDiagnostic?: () => void;
}

export const MobileAuthScreen: React.FC<MobileAuthScreenProps> = ({
    onAuthenticated,
    onContinueAsDemo,
    initialMode = 'LOGIN',
    diagnosticResult = null,
    onBackToWelcome,
    onBackToDiagnosis,
    onStartDiagnostic
}) => {
    const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>(initialMode);

    useEffect(() => {
        setMode(initialMode);
    }, [initialMode]);

    // Fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // States
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setInfoMessage(null);
        setIsLoading(true);

        try {
            if (mode === 'SIGNUP') {
                const fullName = `${firstName} ${lastName}`.trim();
                const res = await signUpUser(email, password, fullName, undefined, firstName, lastName);
                setIsLoading(false);

                if (!res.success) {
                    setErrorMessage(res.message);
                    return;
                }

                if (res.needsEmailVerification) {
                    setInfoMessage(res.message);
                } else if (res.user) {
                    onAuthenticated(res.user);
                }
            } else {
                const res = await signInUser(email, password);
                setIsLoading(false);

                if (!res.success) {
                    setErrorMessage(res.message);
                    return;
                }

                if (res.user) {
                    onAuthenticated(res.user);
                }
            }
        } catch (err: any) {
            setIsLoading(false);
            setErrorMessage(err?.message || 'Si è verificato un errore durante l\'autenticazione.');
        }
    };

    const handleGoogleAuth = async () => {
        setErrorMessage(null);
        setInfoMessage(null);
        setIsGoogleLoading(true);
        try {
            const res = await signInWithGoogle();
            setIsGoogleLoading(false);

            if (!res.success) {
                setErrorMessage(res.message);
                return;
            }

            if (res.user) {
                onAuthenticated(res.user);
            } else if (res.redirecting) {
                setInfoMessage(res.message);
            }
        } catch (err: any) {
            setIsGoogleLoading(false);
            setErrorMessage(err?.message || 'Errore durante l\'accesso con Google.');
        }
    };

    const handleBack = () => {
        if (diagnosticResult && onBackToDiagnosis) {
            onBackToDiagnosis();
        } else if (onBackToWelcome) {
            onBackToWelcome();
        }
    };

    const showBackButton = Boolean((diagnosticResult && onBackToDiagnosis) || onBackToWelcome);

    return (
        <div className="w-full min-h-[100dvh] bg-[#08090C] text-white relative overflow-x-hidden selection:bg-[#10B981] selection:text-slate-950 font-sans">
            {/* Ambient Emerald Background Glow */}
            <div
                className="fixed -top-24 left-1/2 -translate-x-1/2 w-[480px] h-[360px] rounded-full blur-[120px] pointer-events-none"
                style={{
                    background:
                        'radial-gradient(circle, rgba(16, 185, 129, 0.13) 0%, transparent 70%)'
                }}
            />

            <div className="w-full max-w-md mx-auto min-h-[100dvh] flex flex-col justify-between px-5 pt-[max(env(safe-area-inset-top,18px),20px)] pb-[max(env(safe-area-inset-bottom,20px),24px)] relative z-10">
                {/* TOP BAR NAVIGATION */}
                <div className="flex items-center justify-between min-h-[36px]">
                    {showBackButton ? (
                        <button
                            type="button"
                            onClick={handleBack}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 -ml-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-300 transition cursor-pointer active:scale-95"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>
                                {diagnosticResult && onBackToDiagnosis
                                    ? 'Torna alla Diagnosi'
                                    : 'Indietro'}
                            </span>
                        </button>
                    ) : (
                        <div />
                    )}

                    {!diagnosticResult && onStartDiagnostic && (
                        <button
                            type="button"
                            onClick={onStartDiagnostic}
                            className="text-[11px] font-mono font-bold text-[#10B981] hover:text-emerald-300 transition cursor-pointer"
                        >
                            Fai il Test 60s →
                        </button>
                    )}
                </div>

                {/* LOGO & BRANDING */}
                <div className="pt-4 pb-2 flex flex-col items-center text-center space-y-2">
                    <div className="w-13 h-13 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_28px_rgba(16,185,129,0.22)] flex items-center justify-center">
                        <BrainCircuit className="w-7 h-7 text-[#10B981]" />
                    </div>

                    <div className="space-y-0.5">
                        <h1 className="text-2xl font-black tracking-tight text-white">
                            TRADYX
                        </h1>
                        <p className="text-[10px] text-[#10B981]/90 font-mono tracking-[0.2em] uppercase font-bold">
                            NEURO-BEHAVIORAL TRADING OS
                        </p>
                    </div>
                </div>

                {/* MAIN AUTH CARD */}
                <div className="my-auto py-3 space-y-4">
                    {/* Calibrated Protocol Pre-Configuration Banner (shown when coming from diagnostic funnel) */}
                    {diagnosticResult && (
                        <div className="p-3.5 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/30 backdrop-blur-md space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-wider text-[#10B981]">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>Protocollo Calibrato Pronto</span>
                                </span>
                                <span className="text-[10px] font-mono font-bold text-slate-300">
                                    Rischio {diagnosticResult.riskLevel}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-snug">
                                {diagnosticResult.derivedPreferences.propFirmShieldEnabled
                                    ? 'Prop Firm Shield 5% e Protocollo Ulysses verranno pre-attivati automaticamente nel tuo account.'
                                    : 'Protocollo Ulysses e AI Risk Manager verranno pre-configurati automaticamente al primo accesso.'}
                            </p>
                        </div>
                    )}

                    {/* Mode Selector Tabs */}
                    <div className="flex bg-white/[0.04] p-1 rounded-2xl border border-white/[0.08] backdrop-blur-md">
                        <button
                            type="button"
                            onClick={() => {
                                setMode('LOGIN');
                                setErrorMessage(null);
                                setInfoMessage(null);
                            }}
                            className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                mode === 'LOGIN'
                                    ? 'bg-[#10B981] text-[#050A08] font-black shadow-md shadow-emerald-500/20'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            Accedi
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setMode('SIGNUP');
                                setErrorMessage(null);
                                setInfoMessage(null);
                            }}
                            className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                mode === 'SIGNUP'
                                    ? 'bg-[#10B981] text-[#050A08] font-black shadow-md shadow-emerald-500/20'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            Crea Account
                        </button>
                    </div>

                    {/* Google OAuth Button */}
                    <button
                        type="button"
                        disabled={isGoogleLoading || isLoading}
                        onClick={handleGoogleAuth}
                        className="w-full h-12 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.12] text-white font-bold text-xs transition flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.985] disabled:opacity-60"
                    >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                                fill="#EA4335"
                                d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12S6.8 21.5 12 21.5c6.9 0 9.1-4.8 9.1-7.3 0-.5-.1-.9-.1-1.3H12z"
                            />
                            <path
                                fill="#34A853"
                                d="M3.6 7.4l3.2 2.3C7.7 7.6 9.7 6 12 6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.5 12 2.5 8.3 2.5 5.1 4.6 3.6 7.4z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M12 21.5c2.6 0 4.8-.9 6.4-2.4l-3-2.4c-.8.6-1.9 1-3.4 1-2.6 0-4.9-1.7-5.7-4.1l-3.2 2.5c1.6 3.1 4.9 5.4 8.9 5.4z"
                            />
                            <path
                                fill="#4285F4"
                                d="M21.1 14.2c.1-.4.1-.9.1-1.3 0-.6-.1-1.2-.2-1.7H12v3.9h5.5c-.3 1.4-1.1 2.4-2.1 3l3 2.4c1.8-1.6 2.7-4 2.7-6.3z"
                            />
                        </svg>
                        <span>
                            {isGoogleLoading
                                ? 'Connessione a Google...'
                                : mode === 'SIGNUP'
                                ? 'Registrati con Google'
                                : 'Continua con Google'}
                        </span>
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-white/[0.08]" />
                        <span className="text-[10px] text-slate-500 font-mono uppercase">
                            oppure con email
                        </span>
                        <div className="flex-1 h-px bg-white/[0.08]" />
                    </div>

                    {/* Notifications & Error messages */}
                    {errorMessage && (
                        <div className="p-3 bg-rose-950/80 border border-rose-500/60 rounded-xl text-xs text-rose-200 flex items-center gap-2 font-mono">
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {infoMessage && (
                        <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-xs text-emerald-200 flex items-center gap-2 font-mono">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{infoMessage}</span>
                        </div>
                    )}

                    {/* Auth Form */}
                    <form onSubmit={handleSubmit} className="space-y-3">
                        {mode === 'SIGNUP' && (
                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-400">
                                        Nome
                                    </label>
                                    <div className="relative">
                                        <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            placeholder="Nome"
                                            className="w-full h-11 pl-9 pr-3 bg-white/[0.03] border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:border-[#10B981] outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-400">
                                        Cognome
                                    </label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="Cognome"
                                        className="w-full h-11 px-3 bg-white/[0.03] border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:border-[#10B981] outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-[11px] font-medium text-slate-400">
                                Indirizzo Email
                            </label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tuonome@email.com"
                                    className="w-full h-12 pl-9 pr-3 bg-white/[0.03] border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:border-[#10B981] outline-none font-mono"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-medium text-slate-400">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    minLength={6}
                                    className="w-full h-12 pl-9 pr-10 bg-white/[0.03] border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:border-[#10B981] outline-none font-mono"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                                    aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || isGoogleLoading}
                            className="w-full min-h-[52px] bg-[#10B981] hover:bg-emerald-400 text-[#050A08] font-black text-sm rounded-2xl shadow-[0_0_28px_rgba(16,185,129,0.28)] active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
                        >
                            {isLoading ? (
                                <span className="animate-pulse">Autenticazione in corso...</span>
                            ) : (
                                <>
                                    <span>
                                        {mode === 'LOGIN'
                                            ? 'Accedi al Terminale'
                                            : diagnosticResult
                                            ? 'Attiva Account e Protocollo'
                                            : 'Crea Account e Accedi'}
                                    </span>
                                    <ArrowRight className="w-4 h-4 text-[#050A08]" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* 1-Tap Demo Mode Access Button */}
                    <button
                        type="button"
                        onClick={onContinueAsDemo}
                        className="w-full h-11 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-emerald-500/40 text-slate-300 hover:text-white font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.985]"
                    >
                        <Play className="w-3.5 h-3.5 text-[#10B981]" />
                        <span>Esplora in Modalità Demo</span>
                    </button>

                    {/* Bottom Helper Link — Zero Dead Ends */}
                    {onStartDiagnostic && (
                        <div className="text-center pt-1">
                            <button
                                type="button"
                                onClick={onStartDiagnostic}
                                className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-emerald-300 transition cursor-pointer"
                            >
                                <Sparkles className="w-3 h-3 text-[#10B981]" />
                                <span>
                                    {diagnosticResult
                                        ? 'Vuoi ricalibrare il tuo profilo comportamentale?'
                                        : 'Nuovo su Tradyx? Analizza il tuo Profilo Trader in 60s'}
                                </span>
                            </button>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="text-center pt-2 pb-1">
                    <span className="text-[10px] text-slate-500 font-mono">
                        Tradyx Neuro-Behavioral OS • Crittografia AES-256
                    </span>
                </div>
            </div>
        </div>
    );
};

export default MobileAuthScreen;
