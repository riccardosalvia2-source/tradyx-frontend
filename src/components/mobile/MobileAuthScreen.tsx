// ============================================================================
// TRADYX MOBILE-FIRST AUTH SCREEN (src/components/mobile/MobileAuthScreen.tsx)
// Minimalist, Clean Supabase Login & Registration Optimized for iOS / Safari
// ============================================================================

import React, { useState } from 'react';
import { signInUser, signUpUser } from '../../services/authService';
import { UserAccount } from '../../types/auth';
import { 
    BrainCircuit, 
    Sparkles, 
    Mail, 
    Lock, 
    User, 
    Eye, 
    EyeOff, 
    ArrowRight, 
    AlertCircle, 
    CheckCircle2,
    Play
} from 'lucide-react';

interface MobileAuthScreenProps {
    onAuthenticated: (user: UserAccount) => void;
    onContinueAsDemo: () => void;
}

export const MobileAuthScreen: React.FC<MobileAuthScreenProps> = ({
    onAuthenticated,
    onContinueAsDemo
}) => {
    const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

    // Fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // States
    const [isLoading, setIsLoading] = useState(false);
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

                if (res.user) {
                    onAuthenticated(res.user);
                } else if (res.needsEmailVerification) {
                    setInfoMessage(res.message);
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

    return (
        <div className="w-full max-w-md mx-auto min-h-[100dvh] bg-[#05070B] text-white flex flex-col justify-between px-4 pt-[env(safe-area-inset-top,24px)] pb-[env(safe-area-inset-bottom,24px)] relative overflow-x-hidden selection:bg-cyan-500 selection:text-slate-950 font-sans">
            
            {/* Ambient Background Glows */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/10 blur-[90px] rounded-full pointer-events-none" />

            {/* TOP LOGO & BRANDING */}
            <div className="pt-6 sm:pt-8 flex flex-col items-center text-center space-y-2 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-400 via-blue-600 to-indigo-600 p-0.5 shadow-[0_0_25px_rgba(0,240,255,0.4)] flex items-center justify-center animate-pulse">
                    <div className="w-full h-full bg-[#05070B] rounded-[14px] flex items-center justify-center">
                        <BrainCircuit className="w-8 h-8 text-cyan-400" />
                    </div>
                </div>

                <div className="space-y-0.5">
                    <h1 className="text-2xl font-black tracking-tight text-white font-sans">
                        TRADYX
                    </h1>
                    <p className="text-xs text-cyan-400 font-mono tracking-wider uppercase font-semibold">
                        Mobile AI Trading Journal & Quasar Sentiment
                    </p>
                </div>
            </div>

            {/* MAIN AUTH CARD */}
            <div className="my-auto py-4 relative z-10 space-y-4">
                
                {/* Mode Selector Tabs */}
                <div className="flex bg-white/[0.04] p-1 rounded-2xl border border-white/10 backdrop-blur-md">
                    <button
                        type="button"
                        onClick={() => {
                            setMode('LOGIN');
                            setErrorMessage(null);
                        }}
                        className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            mode === 'LOGIN'
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
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
                        }}
                        className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            mode === 'SIGNUP'
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        Crea Account
                    </button>
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
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-slate-400">Nome</label>
                                <div className="relative">
                                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="Nome"
                                        className="w-full h-11 pl-9 pr-3 bg-white/[0.03] border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:border-cyan-400 outline-none"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-slate-400">Cognome</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Cognome"
                                    className="w-full h-11 px-3 bg-white/[0.03] border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:border-cyan-400 outline-none"
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-400">Indirizzo Email</label>
                        <div className="relative">
                            <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tuonome@email.com"
                                className="w-full h-12 pl-9 pr-3 bg-white/[0.03] border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:border-cyan-400 outline-none font-mono"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-400">Password</label>
                        <div className="relative">
                            <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full h-12 pl-9 pr-10 bg-white/[0.03] border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:border-cyan-400 outline-none font-mono"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-13 min-h-[50px] bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-cyan-500/25 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                        {isLoading ? (
                            <span className="animate-pulse">Autenticazione in corso...</span>
                        ) : (
                            <>
                                <span>{mode === 'LOGIN' ? 'Accedi all\'App' : 'Registrati e Accedi'}</span>
                                <ArrowRight className="w-4 h-4 text-slate-950" />
                            </>
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-[10px] text-slate-500 font-mono uppercase">oppure</span>
                    <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* 1-Tap Demo Mode Access Button */}
                <button
                    type="button"
                    onClick={onContinueAsDemo}
                    className="w-full h-12 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-cyan-500/30 text-cyan-300 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-lg"
                >
                    <Play className="w-4 h-4 text-cyan-400" />
                    <span>Prova Subito in Modalità Demo</span>
                </button>

            </div>

            {/* FOOTER */}
            <div className="text-center pb-2">
                <span className="text-[10px] text-slate-500 font-mono">
                    Tradyx FinTech v2.5 • PWA Safe Areas iOS 18
                </span>
            </div>

        </div>
    );
};

export default MobileAuthScreen;
