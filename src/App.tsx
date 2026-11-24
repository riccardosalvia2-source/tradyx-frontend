// ============================================================================
// TRADYX STANDALONE APPLICATION ENTRYPOINT (src/App.tsx)
// Mobile-First PWA Web App with Pre-Login Neuro-Behavioral Diagnostic Funnel
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { MobileAppLayout } from './components/mobile/MobileAppLayout';
import { MobileAuthScreen } from './components/mobile/MobileAuthScreen';
import { OnboardingFunnel } from './components/OnboardingFunnel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { UserAccount } from './types/auth';
import { DiagnosticAnswers, DiagnosticResult } from './types/onboarding';
import { supabase } from './services/authService';
import {
    loadDiagnosticProfile,
    saveDiagnosticProfile
} from './services/onboardingDiagnosticService';
import { useTradeStore } from './store/useTradeStore';
import { useSettingsStore } from './store/useSettingsStore';
import { SandboxTestPage } from './pages/SandboxTestPage';

type PreAuthView = 'WELCOME' | 'RESULT' | 'LOGIN' | 'SIGNUP';

export const App: React.FC = () => {
    const [isInitializing, setIsInitializing] = useState<boolean>(true);
    const [currentPath, setCurrentPath] = useState<string>(() => {
        return typeof window !== 'undefined' ? window.location.pathname : '/';
    });

    useEffect(() => {
        const handleLocationChange = () => {
            setCurrentPath(window.location.pathname);
        };
        window.addEventListener('popstate', handleLocationChange);
        window.addEventListener('hashchange', handleLocationChange);
        return () => {
            window.removeEventListener('popstate', handleLocationChange);
            window.removeEventListener('hashchange', handleLocationChange);
        };
    }, []);

    const isSandboxRoute =
        currentPath.startsWith('/sandbox-test') ||
        (typeof window !== 'undefined' && window.location.hash.includes('sandbox-test'));

    // Authenticated user state: null for unauthenticated visitors so Pre-Login Funnel launches
    const [authUser, setAuthUser] = useState<UserAccount | null>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('tradyx_user');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    /* ignore */
                }
            }
        }
        return null;
    });

    // Pre-Auth navigation state (Welcome -> Quiz -> Result -> Sign Up / Login)
    const [preAuthView, setPreAuthView] = useState<PreAuthView>('WELCOME');
    const [pendingDiagnosticResult, setPendingDiagnosticResult] =
        useState<DiagnosticResult | null>(() => loadDiagnosticProfile()?.result || null);

    const { fetchTrades, recalculateBubbleConfig } = useTradeStore();

    // Sync user identity & any completed diagnostic profile into Zustand settings store
    const applyOnboardingPreferencesForUser = useCallback((user: UserAccount) => {
        const settings = useSettingsStore.getState();
        if (user.email) {
            settings.setEmail(user.email);
        }
        if (user.full_name) {
            settings.setProtocolName(user.full_name);
        }

        const storedDiagnostic = loadDiagnosticProfile();
        if (storedDiagnostic && storedDiagnostic.appliedToUserId !== user.id) {
            settings.applyDiagnosticProfile(storedDiagnostic);
            saveDiagnosticProfile(storedDiagnostic.answers, storedDiagnostic.result, user.id);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        let isSettled = false;

        // Safety fallback timer: guarantee initialization unblocks after max 1.0s
        const safetyTimer = setTimeout(() => {
            if (!isSettled && isMounted) {
                isSettled = true;
                setIsInitializing(false);
            }
        }, 1000);

        // 1. Check active Supabase session or persisted local session at startup
        const initializeSession = async () => {
            try {
                const getSessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
                    setTimeout(() => resolve({ data: { session: null } }), 800)
                );

                const result = await Promise.race([getSessionPromise, timeoutPromise]);
                const session = result?.data?.session;

                if (session?.user && isMounted) {
                    const activeUser: UserAccount = {
                        id: session.user.id,
                        email: session.user.email || '',
                        full_name:
                            session.user.user_metadata?.full_name ||
                            session.user.email?.split('@')[0],
                        email_confirmed: !!session.user.email_confirmed_at,
                        role:
                            session.user.user_metadata?.role ||
                            (session.user.email?.toLowerCase().includes('admin')
                                ? 'admin'
                                : 'user'),
                        created_at: session.user.created_at
                    };
                    setAuthUser(activeUser);
                    localStorage.setItem('tradyx_user', JSON.stringify(activeUser));
                    applyOnboardingPreferencesForUser(activeUser);
                    fetchTrades(activeUser.id);
                } else if (!session && isMounted) {
                    const saved = localStorage.getItem('tradyx_user');
                    if (saved) {
                        try {
                            const savedUser = JSON.parse(saved) as UserAccount;
                            if (savedUser && isMounted) {
                                setAuthUser(savedUser);
                                applyOnboardingPreferencesForUser(savedUser);
                                fetchTrades(savedUser.id);
                            }
                        } catch (e) {
                            localStorage.removeItem('tradyx_user');
                            setAuthUser(null);
                        }
                    } else {
                        // Unauthenticated visitor -> start Pre-Login & Diagnostic Onboarding
                        setAuthUser(null);
                    }
                }
            } catch (err) {
                console.warn('[Tradyx Auth] Supabase Session check notice:', err);
                if (isMounted) {
                    const saved = localStorage.getItem('tradyx_user');
                    if (saved) {
                        try {
                            const savedUser = JSON.parse(saved) as UserAccount;
                            setAuthUser(savedUser);
                            applyOnboardingPreferencesForUser(savedUser);
                            fetchTrades(savedUser.id);
                        } catch {
                            setAuthUser(null);
                        }
                    } else {
                        setAuthUser(null);
                    }
                }
            } finally {
                if (!isSettled && isMounted) {
                    isSettled = true;
                    clearTimeout(safetyTimer);
                    setIsInitializing(false);
                }
            }
        };

        initializeSession();

        // 2. Listen for real-time authentication state changes (including Google OAuth)
        const {
            data: { subscription }
        } = supabase.auth.onAuthStateChange((event, session) => {
            if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
                const activeUser: UserAccount = {
                    id: session.user.id,
                    email: session.user.email || '',
                    full_name:
                        session.user.user_metadata?.full_name ||
                        session.user.email?.split('@')[0],
                    email_confirmed: !!session.user.email_confirmed_at,
                    role:
                        session.user.user_metadata?.role ||
                        (session.user.email?.toLowerCase().includes('admin') ? 'admin' : 'user'),
                    created_at: session.user.created_at
                };
                setAuthUser(activeUser);
                localStorage.setItem('tradyx_user', JSON.stringify(activeUser));
                applyOnboardingPreferencesForUser(activeUser);
                fetchTrades(activeUser.id);
                if (!isSettled && isMounted) {
                    isSettled = true;
                    clearTimeout(safetyTimer);
                    setIsInitializing(false);
                }
            } else if (event === 'SIGNED_OUT') {
                setAuthUser(null);
                localStorage.removeItem('tradyx_user');
                setPreAuthView('WELCOME');
                recalculateBubbleConfig();
                if (!isSettled && isMounted) {
                    isSettled = true;
                    clearTimeout(safetyTimer);
                    setIsInitializing(false);
                }
            }
        });

        return () => {
            isMounted = false;
            clearTimeout(safetyTimer);
            subscription.unsubscribe();
        };
    }, [applyOnboardingPreferencesForUser, fetchTrades, recalculateBubbleConfig]);

    const handleAuthenticated = (user: UserAccount) => {
        setAuthUser(user);
        if (typeof window !== 'undefined') {
            localStorage.setItem('tradyx_user', JSON.stringify(user));
        }
        applyOnboardingPreferencesForUser(user);
        fetchTrades(user.id);
    };

    const handleContinueAsDemo = () => {
        const demoUser: UserAccount = {
            id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            email: 'demo.trader@tradyx.ai',
            full_name: 'Demo Quant Trader',
            email_confirmed: true,
            role: 'user',
            created_at: new Date().toISOString()
        };
        setAuthUser(demoUser);
        if (typeof window !== 'undefined') {
            localStorage.setItem('tradyx_user', JSON.stringify(demoUser));
        }
        applyOnboardingPreferencesForUser(demoUser);
        fetchTrades(demoUser.id);
    };

    const handleLogout = async () => {
        setAuthUser(null);
        setPreAuthView('WELCOME');
        if (typeof window !== 'undefined') {
            localStorage.removeItem('tradyx_user');
        }
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.warn('Signout notice:', e);
        }
        recalculateBubbleConfig();
    };

    const handleUnlockSignupFromFunnel = (
        result: DiagnosticResult,
        answers: Required<DiagnosticAnswers>
    ) => {
        saveDiagnosticProfile(answers, result);
        setPendingDiagnosticResult(result);
        setPreAuthView('SIGNUP');
    };

    // Dedicated Hidden Sandbox Route for Developer Load & Performance Testing
    if (isSandboxRoute) {
        return (
            <ErrorBoundary>
                <SandboxTestPage />
            </ErrorBoundary>
        );
    }

    // Failsafe loading screen: dark institutional terminal background
    if (isInitializing) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#08090C] text-white min-h-[100dvh] w-full">
                <div className="flex flex-col items-center gap-4 p-6 text-center">
                    <div className="relative w-14 h-14 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-2 border-[#10B981]/20 animate-ping" />
                        <div className="w-12 h-12 rounded-full border-2 border-[#10B981] border-t-transparent animate-spin" />
                    </div>
                    <div className="space-y-1">
                        <span className="text-xs font-black tracking-widest text-[#10B981] uppercase block font-mono">
                            TRADYX OS
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase animate-pulse block font-mono">
                            Inizializzazione...
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div className="min-h-[100dvh] w-full bg-[#08090C] text-slate-100 relative">
                {authUser ? (
                    <MobileAppLayout authUser={authUser} onLogout={handleLogout} />
                ) : preAuthView === 'WELCOME' || preAuthView === 'RESULT' ? (
                    <OnboardingFunnel
                        key={preAuthView}
                        initialStage={preAuthView}
                        onGoToLogin={() => setPreAuthView('LOGIN')}
                        onUnlockSignup={handleUnlockSignupFromFunnel}
                    />
                ) : (
                    <MobileAuthScreen
                        initialMode={preAuthView === 'SIGNUP' ? 'SIGNUP' : 'LOGIN'}
                        diagnosticResult={pendingDiagnosticResult}
                        onAuthenticated={handleAuthenticated}
                        onContinueAsDemo={handleContinueAsDemo}
                        onBackToWelcome={() => setPreAuthView('WELCOME')}
                        onBackToDiagnosis={
                            pendingDiagnosticResult
                                ? () => setPreAuthView('RESULT')
                                : undefined
                        }
                        onStartDiagnostic={() => setPreAuthView('WELCOME')}
                    />
                )}
            </div>
        </ErrorBoundary>
    );
};

export default App;
