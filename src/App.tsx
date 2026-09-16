// ============================================================================
// TRADYX STANDALONE APPLICATION ENTRYPOINT (src/App.tsx)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { DemoSandboxView } from './components/DemoSandboxView';
import { AuthModal } from './components/AuthModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { UserAccount } from './types/auth';
import { supabase } from './services/authService';
import { useTradeStore } from './store/useTradeStore';

export const App: React.FC = () => {
    const [isInitializing, setIsInitializing] = useState<boolean>(true);
    const [currentView, setCurrentView] = useState<'landing' | 'demo'>(() => {
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/demo')) {
            return 'demo';
        }
        return 'landing';
    });

    const [authUser, setAuthUser] = useState<UserAccount | null>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('tradyx_user');
            if (saved) {
                try { return JSON.parse(saved); } catch (e) { /* ignore */ }
            }
        }
        return null;
    });

    const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

    useEffect(() => {
        let isMounted = true;
        let isSettled = false;

        const handlePopState = () => {
            if (window.location.pathname.startsWith('/demo')) {
                setCurrentView('demo');
            } else {
                setCurrentView('landing');
            }
        };

        window.addEventListener('popstate', handlePopState);

        // Safety fallback timer: guarantee initialization unblocks after max 2.5s
        const safetyTimer = setTimeout(() => {
            if (!isSettled && isMounted) {
                console.warn('[Tradyx Auth] Session retrieval timeout reached (2500ms). Unblocking loading state.');
                isSettled = true;
                setIsInitializing(false);
            }
        }, 2500);

        // 1. Check active Supabase session immediately at startup
        const initializeSession = async () => {
            try {
                const getSessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
                    setTimeout(() => resolve({ data: { session: null } }), 2200)
                );

                const result = await Promise.race([getSessionPromise, timeoutPromise]);
                const session = result?.data?.session;
                
                if (session?.user && isMounted) {
                    const activeUser: UserAccount = {
                        id: session.user.id,
                        email: session.user.email || '',
                        full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                        email_confirmed: !!session.user.email_confirmed_at,
                        role: session.user.user_metadata?.role || (session.user.email?.toLowerCase().includes('admin') ? 'admin' : 'user'),
                        created_at: session.user.created_at
                    };
                    setAuthUser(activeUser);
                    localStorage.setItem('tradyx_user', JSON.stringify(activeUser));
                } else if (!session && isMounted) {
                    const saved = localStorage.getItem('tradyx_user');
                    if (saved) {
                        try {
                            const savedUser = JSON.parse(saved);
                            if (savedUser && isMounted) {
                                setAuthUser(savedUser);
                            }
                        } catch (e) { /* ignore */ }
                    }
                }
            } catch (err) {
                console.warn('[Tradyx Auth] Supabase Session check error:', err);
            } finally {
                if (!isSettled && isMounted) {
                    isSettled = true;
                    clearTimeout(safetyTimer);
                    setIsInitializing(false);
                }
            }
        };

        initializeSession();

        // 2. Set up listener for real-time authentication state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
                const activeUser: UserAccount = {
                    id: session.user.id,
                    email: session.user.email || '',
                    full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                    email_confirmed: !!session.user.email_confirmed_at,
                    role: session.user.user_metadata?.role || (session.user.email?.toLowerCase().includes('admin') ? 'admin' : 'user'),
                    created_at: session.user.created_at
                };
                setAuthUser(activeUser);
                localStorage.setItem('tradyx_user', JSON.stringify(activeUser));
                if (!isSettled && isMounted) {
                    isSettled = true;
                    clearTimeout(safetyTimer);
                    setIsInitializing(false);
                }
            } else if (event === 'SIGNED_OUT') {
                setAuthUser(null);
                localStorage.removeItem('tradyx_user');
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
            window.removeEventListener('popstate', handlePopState);
            subscription.unsubscribe();
        };
    }, []);

    const navigateToDemo = () => {
        setCurrentView('demo');
        if (typeof window !== 'undefined' && window.location.pathname !== '/demo') {
            window.history.pushState({}, '', '/demo');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const navigateToLanding = () => {
        setCurrentView('landing');
        if (typeof window !== 'undefined' && window.location.pathname !== '/') {
            window.history.pushState({}, '', '/');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAuthenticated = (user: UserAccount) => {
        setAuthUser(user);
        if (typeof window !== 'undefined') {
            localStorage.setItem('tradyx_user', JSON.stringify(user));
        }
        setIsAuthModalOpen(false);
        navigateToDemo();
    };

    const handleLogout = async () => {
        setAuthUser(null);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('tradyx_user');
        }
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.warn('Signout notice:', e);
        }
        useTradeStore.getState().recalculateBubbleConfig();
    };

    // 3. Failsafe loading screen: explicit dark background to eliminate iOS black/white flashes
    if (isInitializing) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090D16] text-white min-h-[100dvh] w-full">
                <div className="flex flex-col items-center gap-4 p-6 text-center">
                    <div className="relative w-14 h-14 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
                        <div className="w-12 h-12 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
                    </div>
                    <div className="space-y-1">
                        <span className="text-xs font-black tracking-widest text-white uppercase block">
                            TRADYX
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase animate-pulse block">
                            Verifica sessione in corso...
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div className="min-h-[100dvh] w-full bg-[#090D16] text-slate-100 relative">
                {currentView === 'demo' ? (
                    <DemoSandboxView 
                        onBackToSite={navigateToLanding}
                        authUser={authUser}
                        onOpenAuthModal={() => setIsAuthModalOpen(true)}
                        onLogout={handleLogout}
                    />
                ) : (
                    <LandingPage 
                        onOpenDemo={navigateToDemo}
                        onOpenAuthModal={() => setIsAuthModalOpen(true)}
                        authUser={authUser}
                        onLogout={handleLogout}
                    />
                )}

                {/* Global Auth Modal Popup */}
                <AuthModal
                    isOpen={isAuthModalOpen || !authUser}
                    onClose={() => setIsAuthModalOpen(false)}
                    onAuthenticated={handleAuthenticated}
                />
            </div>
        </ErrorBoundary>
    );
};

export default App;
