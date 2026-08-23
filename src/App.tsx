// ============================================================================
// TRADYX STANDALONE MARKETING & DEMO ENTRYPOINT (src/App.tsx)
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
        const handlePopState = () => {
            if (window.location.pathname.startsWith('/demo')) {
                setCurrentView('demo');
            } else {
                setCurrentView('landing');
            }
        };

        window.addEventListener('popstate', handlePopState);

        // Check active Supabase session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                const activeUser: UserAccount = {
                    id: session.user.id,
                    email: session.user.email || '',
                    full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                    email_confirmed: !!session.user.email_confirmed_at,
                    role: session.user.email?.toLowerCase().includes('admin') ? 'admin' : 'user',
                    created_at: session.user.created_at
                };
                setAuthUser(activeUser);
                localStorage.setItem('tradyx_user', JSON.stringify(activeUser));
            }
        });

        return () => window.removeEventListener('popstate', handlePopState);
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

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-[#090D16] text-slate-100 relative">
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
                    isOpen={isAuthModalOpen}
                    onClose={() => setIsAuthModalOpen(false)}
                    onAuthenticated={handleAuthenticated}
                />
            </div>
        </ErrorBoundary>
    );
};

export default App;


