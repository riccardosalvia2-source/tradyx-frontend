// ============================================================================
// TRADYX SUPABASE AUTHENTICATION MODAL (src/components/AuthModal.tsx)
// ============================================================================

import React, { useState } from 'react';
import { signUpUser, signInUser } from '../services/authService';
import { UserAccount } from '../types/auth';
import { LogIn, UserPlus, Mail, Lock, User, CheckCircle2, AlertCircle, X, ShieldCheck, ArrowRight, AtSign } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAuthenticated: (user: UserAccount) => void;
    initialMode?: 'LOGIN' | 'SIGNUP';
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
    isOpen, 
    onClose, 
    onAuthenticated,
    initialMode = 'SIGNUP'
}) => {
    const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>(initialMode);
    
    // Form fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    
    // Notifications & Email Verification Banner state
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [emailVerificationBanner, setEmailVerificationBanner] = useState<string | null>(null);
    const [createdUser, setCreatedUser] = useState<UserAccount | null>(null);

    if (!isOpen) return null;

    const resetFeedback = () => {
        setErrorMsg(null);
        setEmailVerificationBanner(null);
    };

    const switchMode = (newMode: 'LOGIN' | 'SIGNUP') => {
        setMode(newMode);
        resetFeedback();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        resetFeedback();
        setIsLoading(true);

        if (mode === 'SIGNUP') {
            const fullName = `${firstName} ${lastName}`.trim();
            const res = await signUpUser(email, password, fullName, username, firstName, lastName);
            setIsLoading(false);

            if (!res.success) {
                setErrorMsg(res.message);
                return;
            }

            if (res.user) {
                setCreatedUser(res.user as UserAccount);
            }

            if (res.needsEmailVerification) {
                setEmailVerificationBanner(res.message);
            } else if (res.user) {
                onAuthenticated(res.user as UserAccount);
                onClose();
            }
        } else {
            const res = await signInUser(email, password);
            setIsLoading(false);

            if (!res.success) {
                if (res.needsEmailVerification) {
                    setEmailVerificationBanner(res.message);
                } else {
                    setErrorMsg(res.message);
                }
                return;
            }

            if (res.user) {
                onAuthenticated(res.user as UserAccount);
                onClose();
            }
        }
    };

    const handleDirectLoginBypass = () => {
        if (createdUser) {
            onAuthenticated(createdUser);
            onClose();
        } else {
            switchMode('LOGIN');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl overflow-y-auto pb-36 [webkit-overflow-scrolling:touch]">
            <div className="relative w-full max-w-md bg-slate-950/90 border border-slate-800/90 rounded-3xl p-6 sm:p-7 shadow-[0_0_60px_rgba(0,240,255,0.2)] backdrop-blur-2xl space-y-6 max-h-[90vh] overflow-y-auto">
                
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/50 hover:bg-slate-800 transition cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header Logo */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/60 border border-cyan-500/40 rounded-full text-cyan-400 text-xs font-bold uppercase tracking-wider">
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                        Autenticazione Supabase
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight">
                        {mode === 'SIGNUP' ? 'Crea il tuo Account Tradyx' : 'Accedi a Tradyx'}
                    </h2>
                    <p className="text-xs text-slate-400">
                        {mode === 'SIGNUP' 
                            ? 'Crea il tuo account per accedere alla dashboard di trading AI' 
                            : 'Inserisci le tue credenziali per accedere al tuo trading journal'}
                    </p>
                </div>

                {/* Mode Selector Tabs */}
                <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-2xl">
                    <button
                        type="button"
                        onClick={() => switchMode('SIGNUP')}
                        className={`py-2.5 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                            mode === 'SIGNUP' ? 'bg-emerald-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <UserPlus className="w-4 h-4" />
                        Registrati
                    </button>
                    <button
                        type="button"
                        onClick={() => switchMode('LOGIN')}
                        className={`py-2.5 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                            mode === 'LOGIN' ? 'bg-cyan-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <LogIn className="w-4 h-4" />
                        Accedi
                    </button>
                </div>

                {/* Top Interactive Mode Toggle Link */}
                <div className="text-center text-xs text-slate-400 font-medium">
                    {mode === 'SIGNUP' ? (
                        <span>
                            Hai già un account?{' '}
                            <button
                                type="button"
                                onClick={() => switchMode('LOGIN')}
                                className="text-cyan-400 hover:text-cyan-300 font-extrabold underline transition cursor-pointer"
                            >
                                Accedi
                            </button>
                        </span>
                    ) : (
                        <span>
                            Non hai un account?{' '}
                            <button
                                type="button"
                                onClick={() => switchMode('SIGNUP')}
                                className="text-emerald-400 hover:text-emerald-300 font-extrabold underline transition cursor-pointer"
                            >
                                Registrati
                            </button>
                        </span>
                    )}
                </div>

                {/* Email Verification Warning Banner */}
                {emailVerificationBanner && (
                    <div className="p-4 bg-amber-950/90 border border-amber-500/80 rounded-2xl space-y-3 text-amber-200 text-xs shadow-xl animate-in fade-in">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                                <div className="font-extrabold text-amber-300 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                                    📩 Verifica Email Richiesta
                                </div>
                                <div className="leading-relaxed text-amber-100">{emailVerificationBanner}</div>
                                <div className="mt-2 text-[11px] text-amber-300/80 font-mono bg-amber-950/80 p-2 rounded-lg border border-amber-800/60">
                                    ⚠️ <strong>Attenzione:</strong> Se non trovi l'email in Posta in Arrivo, controlla la cartella <strong>SPAM / Promozioni</strong>.
                                </div>
                            </div>
                        </div>

                        {/* Direct Login Trigger Button */}
                        <div className="pt-2 border-t border-amber-800/60 flex items-center justify-between gap-2">
                            <span className="text-[11px] text-amber-200 font-medium">Auto-conferma o accesso immediato:</span>
                            <button
                                type="button"
                                onClick={handleDirectLoginBypass}
                                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 text-xs font-bold rounded-xl transition shadow-lg flex items-center gap-1.5 active:scale-95 whitespace-nowrap cursor-pointer"
                            >
                                <span>Accedi Subito</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Auth Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'SIGNUP' && (
                        <>
                            {/* Nome & Cognome Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Nome</label>
                                    <div className="relative">
                                        <User className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            placeholder="Marco"
                                            className="bg-slate-900 border border-slate-700 text-white rounded-xl p-3 pl-10 w-full text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Cognome</label>
                                    <div className="relative">
                                        <User className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            placeholder="Rossi"
                                            className="bg-slate-900 border border-slate-700 text-white rounded-xl p-3 pl-10 w-full text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Username */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
                                <div className="relative">
                                    <AtSign className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="trader_pro"
                                        className="bg-slate-900 border border-slate-700 text-white rounded-xl p-3 pl-10 w-full text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                                        required
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail</label>
                        <div className="relative">
                            <Mail className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tuonome@email.com"
                                className="bg-slate-900 border border-slate-700 text-white rounded-xl p-3 pl-10 w-full text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
                                required
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                        <div className="relative">
                            <Lock className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="bg-slate-900 border border-slate-700 text-white rounded-xl p-3 pl-10 w-full text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-3.5 font-black text-sm rounded-xl transition shadow-lg active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer ${
                            mode === 'SIGNUP'
                                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
                                : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/25'
                        }`}
                    >
                        {isLoading ? (
                            'Elaborazione in corso...'
                        ) : mode === 'SIGNUP' ? (
                            <>
                                <span>INIZIA TRADING →</span>
                            </>
                        ) : (
                            <>
                                <span>ACCEDI →</span>
                            </>
                        )}
                    </button>

                    {/* Bottom Interactive Mode Toggle Link */}
                    <div className="pt-2 text-center text-xs text-slate-400 font-medium">
                        {mode === 'SIGNUP' ? (
                            <span>
                                Hai già un account?{' '}
                                <button
                                    type="button"
                                    onClick={() => switchMode('LOGIN')}
                                    className="text-cyan-400 hover:text-cyan-300 font-extrabold underline transition cursor-pointer"
                                >
                                    Accedi
                                </button>
                            </span>
                        ) : (
                            <span>
                                Non hai un account?{' '}
                                <button
                                    type="button"
                                    onClick={() => switchMode('SIGNUP')}
                                    className="text-emerald-400 hover:text-emerald-300 font-extrabold underline transition cursor-pointer"
                                >
                                    Registrati
                                </button>
                            </span>
                        )}
                    </div>
                </form>

                {/* Error Banner - Displayed clearly directly under the form */}
                {errorMsg && (
                    <div className="mt-4 p-3.5 bg-rose-950/90 border border-rose-500/80 rounded-2xl flex items-center gap-3 text-rose-200 text-xs shadow-lg animate-in fade-in">
                        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                        <div className="font-medium leading-relaxed">{errorMsg}</div>
                    </div>
                )}

            </div>
        </div>
    );
};
