// ============================================================================
// TRADYX STANDALONE APPLICATION ENTRYPOINT (src/App.tsx)
// Mobile-First PWA Web App with Definitive Persistent Auth & ATLAS Terminal
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MobileAppLayout } from './components/mobile/MobileAppLayout';
import { MobileAuthScreen } from './components/mobile/MobileAuthScreen';
import { OnboardingFunnel } from './components/OnboardingFunnel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { UserAccount } from './types/auth';
import { DiagnosticAnswers, DiagnosticResult } from './types/onboarding';
import {
    supabase,
    persistAuthSession,
    loadPersistedAuthSession,
    checkAndEnforceDataRetention,
    clearDataRetentionExpiry,
    logoutKeepDataFor30Days,
    logoutAndWipeAllData,
    DATA_EXPIRES_AT_KEY
} from './services/authService';
import { LogoutMode } from './components/LogoutConfirmModal';
import {
    loadDiagnosticProfile,
    saveDiagnosticProfile
} from './services/onboardingDiagnosticService';
import { useTradeStore } from './store/useTradeStore';
import { useSettingsStore } from './store/useSettingsStore';
import { SandboxTestPage } from './pages/SandboxTestPage';

type PreAuthView = 'WELCOME' | 'RESULT' | 'LOGIN' | 'SIGNUP';

export const App: React.FC = () => {
    // Synchronously restore persisted auth session so returning users go straight to HOME
    // with zero flash of Onboarding or Login.
    const initialPersistedUser = useRef<UserAccount | null>(loadPersistedAuthSession());

    const [authUser, setAuthUser] = useState<UserAccount | null>(initialPersistedUser.current);
    const [isInitializing, setIsInitializing] = useState<boolean>(!initialPersistedUser.current);
    const explicitLogoutRef = useRef<boolean>(false);

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

    // Pre-Auth navigation state (only used when user is NOT authenticated)
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
        void settings.hydrateFromCloud(user.id);
    }, []);

    useEffect(() => {
        let isMounted = true;
        let isSettled = false;

        // 1. GDPR 30-Day Retention Check: auto-wipe expired local data on app startup
        const wasExpiredAndWiped = checkAndEnforceDataRetention();
        if (wasExpiredAndWiped) {
            setAuthUser(null);
            setPendingDiagnosticResult(null);
            setPreAuthView('WELCOME');
        }

        // 2. If user already has a persisted local session, hydrate trades & preferences immediately
        const persisted = loadPersistedAuthSession();
        if (persisted) {
            clearDataRetentionExpiry();
            setAuthUser(persisted);
            applyOnboardingPreferencesForUser(persisted);
            fetchTrades(persisted.id);
            setIsInitializing(false);
            isSettled = true;
        }

        // Safety fallback timer: guarantee initialization unblocks after max 0.8s
        const safetyTimer = setTimeout(() => {
            if (!isSettled && isMounted) {
                isSettled = true;
                setIsInitializing(false);
            }
        }, 800);

        // Check active Supabase session (e.g. OAuth return or persisted Supabase JWT)
        const initializeSession = async () => {
            try {
                const getSessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
                    setTimeout(() => resolve({ data: { session: null } }), 700)
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
                    explicitLogoutRef.current = false;
                    persistAuthSession(activeUser, 'supabase');
                    setAuthUser(activeUser);
                    applyOnboardingPreferencesForUser(activeUser);
                    fetchTrades(activeUser.id);
                } else if (!session && isMounted) {
                    // Never drop an existing persisted local session unless Logout was explicitly clicked
                    const localUser = loadPersistedAuthSession();
                    if (localUser) {
                        setAuthUser(localUser);
                    } else {
                        setAuthUser(null);
                    }
                }
            } catch (err) {
                console.warn('[Tradyx Auth] Supabase Session check notice:', err);
                if (isMounted) {
                    const localUser = loadPersistedAuthSession();
                    setAuthUser(localUser);
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

        // Listen for real-time authentication state changes (e.g. Google OAuth redirect)
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
                explicitLogoutRef.current = false;
                persistAuthSession(activeUser, 'supabase');
                setAuthUser(activeUser);
                applyOnboardingPreferencesForUser(activeUser);
                fetchTrades(activeUser.id);
                if (!isSettled && isMounted) {
                    isSettled = true;
                    clearTimeout(safetyTimer);
                    setIsInitializing(false);
                }
            } else if (event === 'SIGNED_OUT' && explicitLogoutRef.current) {
                if (typeof window !== 'undefined' && !localStorage.getItem(DATA_EXPIRES_AT_KEY)) {
                    logoutAndWipeAllData();
                }
                setAuthUser(null);
                recalculateBubbleConfig();
            }
        });

        return () => {
            isMounted = false;
            clearTimeout(safetyTimer);
            subscription.unsubscribe();
        };
    }, [applyOnboardingPreferencesForUser, fetchTrades, recalculateBubbleConfig]);

    const handleAuthenticated = (user: UserAccount) => {
        explicitLogoutRef.current = false;
        clearDataRetentionExpiry();
        persistAuthSession(user, 'email');
        setAuthUser(user);
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
        explicitLogoutRef.current = false;
        clearDataRetentionExpiry();
        persistAuthSession(demoUser, 'demo');
        setAuthUser(demoUser);
        applyOnboardingPreferencesForUser(demoUser);
        fetchTrades(demoUser.id);
    };

    const handleLogout = async (mode: LogoutMode = 'keep_30d') => {
        explicitLogoutRef.current = true;

        if (mode === 'wipe_now') {
            logoutAndWipeAllData();
            useTradeStore.setState({ trades: [], deletedTrades: [] });
            setPendingDiagnosticResult(null);
            setPreAuthView('WELCOME');
        } else {
            logoutKeepDataFor30Days();
            setPreAuthView('LOGIN');
        }

        setAuthUser(null);
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

    // Failsafe loading screen: only shown on cold unauthenticated startup
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
