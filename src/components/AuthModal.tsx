// ============================================================================
// TRADYX SUPABASE AUTHENTICATION MODAL (src/components/AuthModal.tsx)
// ============================================================================

import React, { useState } from 'react';
import { signUpUser, signInUser } from '../services/authService';
import { UserAccount } from '../types/auth';
import { LogIn, UserPlus, Mail, Lock, User, CheckCircle2, AlertCircle, X, ShieldCheck, ArrowRight } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAuthenticated: (user: UserAccount) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthenticated }) => {
    const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('SIGNUP');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Notifications & Email Verification Banner state
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [emailVerificationBanner, setEmailVerificationBanner] = useState<string | null>(null);
    const [createdUser, setCreatedUser] = useState<UserAccount | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setEmailVerificationBanner(null);
        setIsLoading(true);

        if (mode === 'SIGNUP') {
            const res = await signUpUser(email, password, fullName);
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
            setMode('LOGIN');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl overflow-y-auto pb-36 [webkit-overflow-scrolling:touch]">
            <div className="relative w-full max-w-md bg-slate-950/90 border border-slate-800/90 rounded-3xl p-6 shadow-[0_0_60px_rgba(0,240,255,0.2)] backdrop-blur-2xl space-y-6 max-h-[90vh] overflow-y-auto">
                
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/50 hover:bg-slate-800 transition"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header Logo */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/60 border border-cyan-500/40 rounded-full text-cyan-400 text-xs font-bold uppercase tracking-wider">
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                        Supabase Authentication
                    </div>
                    <h2 className="text-2xl font-extrabold text-white">
                        {mode === 'SIGNUP' ? 'Crea il tuo Account Tradyx' : 'Accedi a Tradyx'}
                    </h2>
                    <p className="text-xs text-slate-400">
                        {mode === 'SIGNUP' 
                            ? 'Inserisci i tuoi dati per registrarti ed inviare l\'email di conferma' 
                            : 'Accedi al tuo trading journal psicologico reattivo'}
                    </p>
                </div>

                {/* Mode Selector Tabs */}
                <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-2xl">
                    <button
                        type="button"
                        onClick={() => { setMode('SIGNUP'); setErrorMsg(null); setEmailVerificationBanner(null); }}
                        className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
                            mode === 'SIGNUP' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <UserPlus className="w-4 h-4" />
                        Registrati (Sign Up)
                    </button>
                    <button
                        type="button"
                        onClick={() => { setMode('LOGIN'); setErrorMsg(null); setEmailVerificationBanner(null); }}
                        className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
                            mode === 'LOGIN' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <LogIn className="w-4 h-4" />
                        Accedi (Sign In)
                    </button>
                </div>

                {/* Prominent Email Verification Warning Banner with Direct Bypass Button */}
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
                                    ⚠️ <strong>Attenzione SMTP:</strong> Se non trovi l'email in Posta in Arrivo, controlla la cartella <strong>SPAM / Promozioni</strong>.
                                </div>
                            </div>
                        </div>

                        {/* Direct Login Trigger Button */}
                        <div className="pt-2 border-t border-amber-800/60 flex items-center justify-between gap-2">
                            <span className="text-[11px] text-amber-200 font-medium">Auto-conferma o accesso immediato:</span>
                            <button
                                type="button"
                                onClick={handleDirectLoginBypass}
                                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 text-xs font-bold rounded-xl transition shadow-lg flex items-center gap-1.5 active:scale-95 whitespace-nowrap"
                            >
                                <span>Accedi Subito</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Error Banner */}
                {errorMsg && (
                    <div className="p-3.5 bg-rose-950/80 border border-rose-500/80 rounded-2xl flex items-center gap-3 text-rose-200 text-xs shadow-lg">
                        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                        <div>{errorMsg}</div>
                    </div>
                )}

                {/* Auth Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'SIGNUP' && (
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Nome Completo</label>
                            <div className="relative">
                                <User className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="es. Marco Rossi"
                                    className="bg-slate-900 border border-slate-700 text-white rounded-lg p-3 pl-10 w-full text-sm focus:border-cyan-500 outline-none"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                        <div className="relative">
                            <Mail className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tuonome@email.com"
                                className="bg-slate-900 border border-slate-700 text-white rounded-lg p-3 pl-10 w-full text-sm focus:border-cyan-500 outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
                        <div className="relative">
                            <Lock className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="bg-slate-900 border border-slate-700 text-white rounded-lg p-3 pl-10 w-full text-sm focus:border-cyan-500 outline-none"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-cyan-500/20 active:scale-[0.99] disabled:opacity-50"
                    >
                        {isLoading 
                            ? 'Elaborazione in corso...' 
                            : mode === 'SIGNUP' 
                            ? 'Registrati & Invia Email di Verifica' 
                            : 'Accedi al tuo Account'}
                    </button>
                </form>

            </div>
        </div>
    );
};
