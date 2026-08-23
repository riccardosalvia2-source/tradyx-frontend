// ============================================================================
// TRADYX DEDICATED ADMIN PORTAL PAGE (src/pages/AdminPortal.tsx)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { UserAccount } from '../types/auth';
import { AdminPanel } from '../components/AdminPanel';
import { signInUser, signOutUser, verifyAdminPIN, PRIMARY_ADMIN_EMAIL } from '../services/authService';
import { 
    ShieldCheck, 
    Lock, 
    Mail, 
    LogIn, 
    AlertCircle, 
    ArrowLeft, 
    LogOut, 
    ShieldAlert, 
    KeyRound
} from 'lucide-react';

interface AdminPortalProps {
    currentUser: UserAccount | null;
    onNavigateHome: (deniedNotice?: string) => void;
    onLoginSuccess: (user: UserAccount) => void;
    onLogout: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
    currentUser,
    onNavigateHome,
    onLoginSuccess,
    onLogout
}) => {
    // Mode: EMAIL auth or 6-digit PIN auth
    const [authMode, setAuthMode] = useState<'EMAIL' | 'PIN'>('EMAIL');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [securityPIN, setSecurityPIN] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Force reset initial admin state to empty string on mount
    useEffect(() => {
        setAdminEmail('');
        setAdminPassword('');
        setSecurityPIN('');
    }, []);

    const isAdminAuthenticated = !!currentUser && (currentUser.role === 'admin' || currentUser.email.toLowerCase() === PRIMARY_ADMIN_EMAIL);

    const handleAdminEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setIsLoading(true);

        const res = await signInUser(adminEmail, adminPassword);
        setIsLoading(false);

        if (!res.success || !res.user) {
            setErrorMsg(res.message || 'Credenziali di amministrazione non valide.');
            return;
        }

        if (res.user.role !== 'admin' && res.user.email.toLowerCase() !== PRIMARY_ADMIN_EMAIL) {
            setErrorMsg('Accesso negato. Utente non autorizzato come amministratore.');
            return;
        }

        onLoginSuccess(res.user);
    };

    const handlePINUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (!verifyAdminPIN(securityPIN)) {
            setErrorMsg("PIN di sicurezza non valido. Accesso negato.");
            return;
        }

        // Grant Admin session via valid PIN
        const adminSession: UserAccount = {
            id: 'admin-pin-session',
            email: PRIMARY_ADMIN_EMAIL,
            full_name: 'Riccardo Salvia (Admin PIN Verified)',
            email_confirmed: true,
            role: 'admin',
            created_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString()
        };

        onLoginSuccess(adminSession);
    };

    const handleLogoutClick = async () => {
        await signOutUser();
        onLogout();
    };

    return (
        <div className="min-h-screen bg-transparent text-white selection:bg-cyan-500 selection:text-slate-950 pb-24 font-sans relative">
            
            {/* Dedicated Admin Header */}
            <header className="border-b border-purple-950/80 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-40 shadow-2xl shadow-purple-950/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-purple-900 to-indigo-950 border border-purple-500/50 rounded-xl shadow-lg shadow-purple-950/50">
                            <ShieldCheck className="w-6 h-6 text-purple-300 font-bold" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-purple-200 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
                                    TRADYX ADMIN PORTAL
                                </h1>
                                <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-purple-950 text-purple-300 border border-purple-800 uppercase">
                                    RBAC RESTRICTED
                                </span>
                            </div>
                            <div className="text-[10px] text-purple-400/90 font-mono tracking-widest uppercase font-semibold">
                                Console Riservata Amministratore (/admin)
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => onNavigateHome()}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition active:scale-95"
                        >
                            <ArrowLeft className="w-4 h-4 text-cyan-400" />
                            <span>Torna alla App</span>
                        </button>

                        {isAdminAuthenticated && (
                            <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
                                <div className="hidden sm:flex flex-col text-right">
                                    <span className="text-xs font-bold text-purple-200">{currentUser?.full_name || currentUser?.email}</span>
                                    <span className="text-[10px] text-emerald-400 font-mono">Ruolo: ADMIN</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleLogoutClick}
                                    className="p-2 text-rose-400 hover:bg-rose-950/50 border border-rose-950 rounded-xl transition"
                                    title="Disconnetti Amministratore"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Dedicated Admin Portal Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
                
                {/* STATE 1: UNAUTHENTICATED - SECURE CLEAN ADMIN LOGIN / PIN UNLOCK */}
                {!isAdminAuthenticated ? (
                    <div className="max-w-md mx-auto my-12 bg-slate-900/95 border border-purple-900/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
                        
                        <div className="text-center space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-950/80 border border-purple-500/40 rounded-full text-purple-300 text-xs font-bold uppercase tracking-wider">
                                <ShieldAlert className="w-4 h-4 text-purple-400" />
                                Accesso Riservato Amministratore
                            </div>
                            <h2 className="text-2xl font-extrabold text-white">
                                Sblocco Console Admin
                            </h2>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Inserisci le credenziali di amministrazione autorizzate oppure sblocca con il PIN di sicurezza a 6 cifre.
                            </p>
                        </div>

                        {/* Mode Switcher */}
                        <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold">
                            <button
                                type="button"
                                onClick={() => { setAuthMode('EMAIL'); setErrorMsg(null); }}
                                className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${authMode === 'EMAIL' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Mail className="w-3.5 h-3.5" />
                                Login Email
                            </button>
                            <button
                                type="button"
                                onClick={() => { setAuthMode('PIN'); setErrorMsg(null); }}
                                className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${authMode === 'PIN' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                            >
                                <KeyRound className="w-3.5 h-3.5" />
                                PIN a 6 Cifre
                            </button>
                        </div>

                        {errorMsg && (
                            <div className="p-3.5 bg-rose-950/90 border border-rose-500/80 rounded-2xl flex items-center gap-3 text-rose-200 text-xs shadow-lg">
                                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                                <div>{errorMsg}</div>
                            </div>
                        )}

                        {/* OPTION A: EMAIL & PASSWORD LOGIN */}
                        {authMode === 'EMAIL' ? (
                            <form onSubmit={handleAdminEmailLogin} autoComplete="off" className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1 font-mono">Email Amministratore</label>
                                    <div className="relative">
                                        <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                                        <input
                                            type="email"
                                            name="admin_user_field_no_suggest"
                                            id="admin_user_field_no_suggest"
                                            value={adminEmail}
                                            onChange={(e) => setAdminEmail(e.target.value)}
                                            autoComplete="one-time-code"
                                            autoCorrect="off"
                                            autoCapitalize="off"
                                            spellCheck="false"
                                            placeholder="Email amministratore"
                                            className="bg-slate-950 border border-purple-900/60 text-white rounded-xl p-3 pl-10 w-full text-sm focus:border-purple-500 outline-none font-mono"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1 font-mono">Password</label>
                                    <div className="relative">
                                        <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                                        <input
                                            type="password"
                                            name="admin_pass_field_no_suggest"
                                            id="admin_pass_field_no_suggest"
                                            value={adminPassword}
                                            onChange={(e) => setAdminPassword(e.target.value)}
                                            autoComplete="one-time-code"
                                            autoCorrect="off"
                                            autoCapitalize="off"
                                            spellCheck="false"
                                            placeholder="••••••••"
                                            className="bg-slate-950 border border-purple-900/60 text-white rounded-xl p-3 pl-10 w-full text-sm focus:border-purple-500 outline-none font-mono"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-xl transition shadow-xl shadow-purple-950/50 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <LogIn className="w-4 h-4" />
                                    <span>{isLoading ? 'Verifica credenziali...' : 'Accedi come Amministratore'}</span>
                                </button>
                            </form>
                        ) : (
                            /* OPTION B: 6-DIGIT SECURITY PIN UNLOCK */
                            <form onSubmit={handlePINUnlock} autoComplete="off" className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1 font-mono text-center">Inserisci PIN di Sicurezza a 6 Cifre</label>
                                    <div className="relative">
                                        <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-purple-400" />
                                        <input
                                            type="password"
                                            maxLength={6}
                                            name="admin_pin_field_no_suggest"
                                            id="admin_pin_field_no_suggest"
                                            value={securityPIN}
                                            onChange={(e) => setSecurityPIN(e.target.value)}
                                            autoComplete="one-time-code"
                                            autoCorrect="off"
                                            autoCapitalize="off"
                                            spellCheck="false"
                                            placeholder="777888"
                                            className="bg-slate-950 border border-purple-900/80 text-center tracking-[0.5em] text-purple-300 rounded-xl p-3 pl-10 text-lg font-mono font-bold focus:border-purple-500 outline-none w-full"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-xl transition shadow-xl shadow-purple-950/50 active:scale-[0.99] flex items-center justify-center gap-2"
                                >
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>Sblocca Console con PIN</span>
                                </button>
                            </form>
                        )}

                        <div className="pt-4 border-t border-slate-800/80 text-center">
                            <button
                                type="button"
                                onClick={() => onNavigateHome()}
                                className="text-xs text-slate-400 hover:text-cyan-400 transition underline font-mono"
                            >
                                Torna alla Home Utente (/)
                            </button>
                        </div>
                    </div>
                ) : (
                    /* STATE 2: AUTHENTICATED ADMIN - FULL DASHBOARD PANEL */
                    <AdminPanel />
                )}

            </main>
        </div>
    );
};
