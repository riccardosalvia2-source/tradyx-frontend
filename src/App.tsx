// ============================================================================
// TRADYX STANDALONE APPLICATION ENTRYPOINT (src/App.tsx)
// Mobile-First PWA Web App for iOS / Safari on iPhone
// ============================================================================

import React, { useState, useEffect } from 'react';
import { MobileAppLayout } from './components/mobile/MobileAppLayout';
import { MobileAuthScreen } from './components/mobile/MobileAuthScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { UserAccount } from './types/auth';
import { supabase } from './services/authService';
import { useTradeStore } from './store/useTradeStore';

const DEFAULT_INSTITUTIONAL_USER: UserAccount = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    email: 'suca.quant@tradyx.ai',
    full_name: 'Suca',
    email_confirmed: true,
    role: 'admin',
    created_at: new Date().toISOString()
};

export const App: React.FC = () => {
    const [isInitializing, setIsInitializing] = useState<boolean>(true);

    const [authUser, setAuthUser] = useState<UserAccount | null>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('tradyx_user');
            if (saved) {
                try { return JSON.parse(saved); } catch (e) { /* ignore */ }
            }
        }
        return DEFAULT_INSTITUTIONAL_USER;
    });

    const { fetchTrades, recalculateBubbleConfig } = useTradeStore();

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

        // 1. Check active Supabase session immediately at startup
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
                        full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                        email_confirmed: !!session.user.email_confirmed_at,
                        role: session.user.user_metadata?.role || (session.user.email?.toLowerCase().includes('admin') ? 'admin' : 'user'),
                        created_at: session.user.created_at
                    };
                    setAuthUser(activeUser);
                    localStorage.setItem('tradyx_user', JSON.stringify(activeUser));
                    fetchTrades(activeUser.id);
                } else if (!session && isMounted) {
                    const saved = localStorage.getItem('tradyx_user');
                    if (saved) {
                        try {
                            const savedUser = JSON.parse(saved);
                            if (savedUser && isMounted) {
                                setAuthUser(savedUser);
                                fetchTrades(savedUser.id);
                            }
                        } catch (e) { /* ignore */ }
                    } else {
                        setAuthUser(DEFAULT_INSTITUTIONAL_USER);
                        fetchTrades(DEFAULT_INSTITUTIONAL_USER.id);
                    }
                }
            } catch (err) {
                console.warn('[Tradyx Auth] Supabase Session check notice:', err);
                if (isMounted) {
                    setAuthUser(DEFAULT_INSTITUTIONAL_USER);
                    fetchTrades(DEFAULT_INSTITUTIONAL_USER.id);
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
                fetchTrades(activeUser.id);
                if (!isSettled && isMounted) {
                    isSettled = true;
                    clearTimeout(safetyTimer);
                    setIsInitializing(false);
                }
            } else if (event === 'SIGNED_OUT') {
                setAuthUser(null);
                localStorage.removeItem('tradyx_user');
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
    }, []);

    const handleAuthenticated = (user: UserAccount) => {
        setAuthUser(user);
        if (typeof window !== 'undefined') {
            localStorage.setItem('tradyx_user', JSON.stringify(user));
        }
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
        fetchTrades(demoUser.id);
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
        recalculateBubbleConfig();
    };

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
                            TRADYX TERMINAL
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase animate-pulse block font-mono">
                            Avvio PWA Mobile...
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
                    <MobileAppLayout 
                        authUser={authUser} 
                        onLogout={handleLogout} 
                    />
                ) : (
                    <MobileAuthScreen 
                        onAuthenticated={handleAuthenticated} 
                        onContinueAsDemo={handleContinueAsDemo} 
                    />
                )}
            </div>
        </ErrorBoundary>
    );
};

export default App;
