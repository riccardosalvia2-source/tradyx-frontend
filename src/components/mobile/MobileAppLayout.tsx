// ============================================================================
// TRADYX MOBILE-FIRST APP LAYOUT (src/components/mobile/MobileAppLayout.tsx)
// 7 Core Institutional Views: HOME, TRADE, HISTORY, STATS, WALLET, COACH, ATLAS
// Native Mobile-First PWA for iOS Safari & iPhone Notch / Safe Areas
// ============================================================================

import React, { useState, useCallback, useEffect } from 'react';
import { LogOut, User } from 'lucide-react';
import { UserAccount } from '../../types/auth';
import { BottomNavBar, AppTab } from '../BottomNavBar';
import { TabHome } from '../tabs/TabHome';
import { TabTrade } from '../tabs/TabTrade';
import { TabHistory } from '../tabs/TabHistory';
import { TabStats } from '../tabs/TabStats';
import { TabWallet } from '../tabs/TabWallet';
import { TabAICoach } from '../tabs/TabAICoach';
import { AtlasTerminalView } from '../atlas/AtlasTerminalView';
import { LogoutConfirmModal, LogoutMode } from '../LogoutConfirmModal';
import { useNeuralTelemetryStore } from '../../services/tradyxNeuralContext';

interface MobileAppLayoutProps {
    authUser: UserAccount | null;
    onLogout: (mode: LogoutMode) => void | Promise<void>;
}

export const MobileAppLayout: React.FC<MobileAppLayoutProps> = ({
    authUser,
    onLogout
}) => {
    const [activeTab, setActiveTabState] = useState<AppTab>('home');
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

    const setActiveTab = useCallback((tab: AppTab) => {
        setActiveTabState(tab);
        useNeuralTelemetryStore.getState().setActiveTab(tab);
    }, []);

    useEffect(() => {
        useNeuralTelemetryStore.getState().setActiveTab('home');
    }, []);

    const handleOpenAtlas = useCallback(() => {
        setActiveTab('atlas');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [setActiveTab]);

    const handleNavigateToTrade = useCallback(() => {
        setActiveTab('trade');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [setActiveTab]);

    const handleAskTradyxAI = useCallback(
        (prompt: string, source: string) => {
            useNeuralTelemetryStore.getState().queueCopilotPrompt(prompt, source);
            setActiveTab('coach');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        [setActiveTab]
    );

    const isAtlasView = activeTab === 'atlas';
    const showQuickProfilePill =
        activeTab === 'home' ||
        activeTab === 'wallet' ||
        activeTab === 'stats' ||
        activeTab === 'coach';

    const handleConfirmLogout = useCallback(
        async (mode: LogoutMode) => {
            setIsLogoutModalOpen(false);
            await onLogout(mode);
        },
        [onLogout]
    );

    return (
        <div className="w-full min-h-[100dvh] bg-[#08090C] flex justify-center items-start selection:bg-[#10B981] selection:text-white relative">
            {/* Soft Ambient Radial Background Lights for Glassmorphism Depth */}
            {!isAtlasView && (
                <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                    <div className="absolute -top-[12%] left-1/2 -translate-x-1/2 w-[550px] h-[450px] bg-gradient-to-b from-[#10B981]/[0.035] via-[#2563EB]/[0.025] to-transparent rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute top-[35%] -right-36 w-[400px] h-[400px] bg-gradient-to-br from-[#2563EB]/[0.03] to-transparent rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-24 -left-36 w-[400px] h-[400px] bg-gradient-to-tr from-[#10B981]/[0.025] to-transparent rounded-full blur-3xl pointer-events-none" />
                </div>
            )}

            {/* Full-Bleed Container for ATLAS Orbital Map; Centered Mobile Shell for other tabs */}
            <div
                className={
                    isAtlasView
                        ? 'w-full min-h-[100dvh] bg-[#030612] text-white overflow-hidden relative z-10 flex flex-col'
                        : 'w-full max-w-lg mx-auto min-h-[100dvh] bg-[#08090C]/80 text-white overflow-x-hidden relative z-10 flex flex-col pt-[env(safe-area-inset-top,12px)] shadow-2xl'
                }
            >
                {/* Top-Right Quick Access Pill ("Profilo / Esci") on HOME, WALLET, STATS, COACH */}
                {showQuickProfilePill && (
                    <div className="w-full px-3 sm:px-4 pt-1 pb-0.5 flex items-center justify-end z-40">
                        <button
                            type="button"
                            onClick={() => setIsLogoutModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#08090C]/90 hover:bg-white/[0.08] border border-white/10 hover:border-[#10B981]/50 text-[10px] font-mono font-bold text-slate-200 hover:text-white transition shadow-lg backdrop-blur-xl cursor-pointer active:scale-95"
                            title="Gestisci profilo o esci dall'account"
                        >
                            <User className="w-3 h-3 text-[#10B981]" />
                            <span>Profilo / Esci</span>
                            <LogOut className="w-3 h-3 text-rose-400" />
                        </button>
                    </div>
                )}

                {/* Active Tab Content Screen */}
                <main className="w-full flex-1 flex flex-col min-h-0">
                    {activeTab === 'home' && (
                        <TabHome
                            authUser={authUser}
                            setActiveTab={setActiveTab}
                            onOpenMarketPulse={handleOpenAtlas}
                        />
                    )}
                    {activeTab === 'trade' && <TabTrade />}
                    {activeTab === 'history' && (
                        <TabHistory onAskTradyxAI={handleAskTradyxAI} />
                    )}
                    {activeTab === 'stats' && <TabStats />}
                    {activeTab === 'wallet' && (
                        <TabWallet
                            authUser={authUser}
                            onLogout={() => setIsLogoutModalOpen(true)}
                        />
                    )}
                    {activeTab === 'coach' && <TabAICoach />}
                    {activeTab === 'atlas' && (
                        <AtlasTerminalView
                            onNavigateToTrade={handleNavigateToTrade}
                            onAskTradyxAI={handleAskTradyxAI}
                        />
                    )}
                </main>

                {/* Fixed Mobile Bottom Navigation Bar (7 Tabs, untouched) */}
                <BottomNavBar activeTab={activeTab} setActiveTab={setActiveTab} />

                {/* Global Logout Confirmation Modal (30-day GDPR retention vs immediate wipe) */}
                <LogoutConfirmModal
                    isOpen={isLogoutModalOpen}
                    authUser={authUser}
                    onConfirmLogout={handleConfirmLogout}
                    onCancel={() => setIsLogoutModalOpen(false)}
                />
            </div>
        </div>
    );
};

export default MobileAppLayout;
