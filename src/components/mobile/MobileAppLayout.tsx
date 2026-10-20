// ============================================================================
// TRADYX MOBILE-FIRST APP LAYOUT (src/components/mobile/MobileAppLayout.tsx)
// 7 Core Institutional Views: HOME, TRADE, HISTORY, STATS, WALLET, COACH, BOLLA
// Native Mobile-First PWA for iOS Safari & iPhone Notch / Safe Areas
// ============================================================================

import React, { useState } from 'react';
import { UserAccount } from '../../types/auth';
import { BottomNavBar, AppTab } from '../BottomNavBar';
import { TabHome } from '../tabs/TabHome';
import { TabTrade } from '../tabs/TabTrade';
import { TabHistory } from '../tabs/TabHistory';
import { TabStats } from '../tabs/TabStats';
import { TabWallet } from '../tabs/TabWallet';
import { TabAICoach } from '../tabs/TabAICoach';
import { TabBubble } from '../tabs/TabBubble';

interface MobileAppLayoutProps {
    authUser: UserAccount | null;
    onLogout: () => void;
}

export const MobileAppLayout: React.FC<MobileAppLayoutProps> = ({
    authUser,
    onLogout
}) => {
    const [activeTab, setActiveTab] = useState<AppTab>('home');

    return (
        <div className="w-full min-h-[100dvh] bg-[#08090C] flex justify-center items-start selection:bg-[#00E599] selection:text-[#08090C]">
            {/* Centered Mobile Container with Safe Areas */}
            <div className="w-full max-w-lg mx-auto min-h-[100dvh] bg-[#08090C] text-white overflow-x-hidden relative flex flex-col pt-[env(safe-area-inset-top,12px)] shadow-2xl">
                
                {/* Active Tab Content Screen */}
                <main className="w-full flex-1">
                    {activeTab === 'home' && (
                        <TabHome authUser={authUser} setActiveTab={setActiveTab} />
                    )}
                    {activeTab === 'trade' && (
                        <TabTrade />
                    )}
                    {activeTab === 'history' && (
                        <TabHistory />
                    )}
                    {activeTab === 'stats' && (
                        <TabStats />
                    )}
                    {activeTab === 'wallet' && (
                        <TabWallet authUser={authUser} onLogout={onLogout} />
                    )}
                    {activeTab === 'coach' && (
                        <TabAICoach />
                    )}
                    {activeTab === 'bubble' && (
                        <TabBubble />
                    )}
                </main>

                {/* Fixed Mobile Bottom Navigation Bar (7 Tabs, with iOS Safe Area) */}
                <BottomNavBar 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab} 
                />

            </div>
        </div>
    );
};

export default MobileAppLayout;
