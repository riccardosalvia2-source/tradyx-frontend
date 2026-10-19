// ============================================================================
// TRADYX MOBILE-FIRST APP LAYOUT (src/components/mobile/MobileAppLayout.tsx)
// Main Mobile-First Shell with iOS Dynamic Island & Home Bar Safe Areas
// ============================================================================

import React, { useState } from 'react';
import { UserAccount } from '../../types/auth';
import { BottomNavBar, AppTab } from '../BottomNavBar';
import { TabHome } from '../tabs/TabHome';
import { TabTrade } from '../tabs/TabTrade';
import { TabAICoach } from '../tabs/TabAICoach';
import { TabHistory } from '../tabs/TabHistory';
import { TabWallet } from '../tabs/TabWallet';

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
        <div className="w-full min-h-[100dvh] bg-[#05070B] flex justify-center items-start selection:bg-cyan-500 selection:text-slate-950">
            {/* Centered Mobile Container */}
            <div className="w-full max-w-md mx-auto min-h-[100dvh] bg-slate-950 text-white overflow-x-hidden relative flex flex-col pt-[env(safe-area-inset-top,16px)] shadow-2xl">
                
                {/* Active Tab Content Screen */}
                <main className="w-full flex-1">
                    {activeTab === 'home' && (
                        <TabHome authUser={authUser} setActiveTab={setActiveTab} />
                    )}
                    {activeTab === 'trade' && (
                        <TabTrade />
                    )}
                    {activeTab === 'coach' && (
                        <TabAICoach />
                    )}
                    {activeTab === 'history' && (
                        <TabHistory />
                    )}
                    {activeTab === 'wallet' && (
                        <TabWallet authUser={authUser} onLogout={onLogout} />
                    )}
                </main>

                {/* Fixed Mobile Bottom Navigation Bar (with iOS safe area) */}
                <BottomNavBar 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab} 
                />

            </div>
        </div>
    );
};

export default MobileAppLayout;
