// ============================================================================
// TRADYX MOBILE TAB 5: WALLET & PROFILO (src/components/tabs/TabWallet.tsx)
// Balances, Equity, Margins, Account Settings & Logout
// ============================================================================

import React, { useState } from 'react';
import { UserAccount } from '../../types/auth';
import { useTradeStore, DEFAULT_MOCK_TRADES } from '../../store/useTradeStore';
import { 
    Wallet, 
    User, 
    ShieldCheck, 
    LogOut, 
    KeyRound, 
    Bell, 
    Smartphone, 
    Sliders, 
    TrendingUp, 
    PieChart, 
    ExternalLink, 
    ChevronRight,
    Lock,
    CheckCircle2
} from 'lucide-react';

interface TabWalletProps {
    authUser: UserAccount | null;
    onLogout: () => void;
}

export const TabWallet: React.FC<TabWalletProps> = ({ authUser, onLogout }) => {
    const { trades } = useTradeStore();
    const safeTrades = Array.isArray(trades) && trades.length > 0 ? trades : DEFAULT_MOCK_TRADES;

    const totalPnl = safeTrades.reduce((acc, t) => acc + (Number(t?.pnl) || 0), 0);
    const startingCapital = 25000;
    const currentEquity = startingCapital + totalPnl;
    const usedMargin = 5800;
    const freeMargin = Math.max(0, currentEquity - usedMargin);
    const marginLevel = usedMargin > 0 ? ((currentEquity / usedMargin) * 100).toFixed(0) : '450';

    const [isDemoMode, setIsDemoMode] = useState<boolean>(!authUser);
    const [faceIdEnabled, setFaceIdEnabled] = useState<boolean>(true);
    const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
    const [currency, setCurrency] = useState<'USD' | 'EUR'>('USD');
    const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

    return (
        <div className="w-full flex flex-col space-y-4 px-3.5 sm:px-4 pt-2 pb-28">
            
            {/* 1. USER PROFILE CARD */}
            <div className="w-full rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-4 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[40px] rounded-full pointer-events-none" />

                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 p-0.5 shadow-lg flex items-center justify-center">
                        <div className="w-full h-full bg-[#05070B] rounded-[14px] flex items-center justify-center font-black text-cyan-400 text-lg">
                            {authUser?.full_name ? authUser.full_name.charAt(0).toUpperCase() : 'T'}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-black text-white truncate">
                                {authUser?.full_name || 'Demo Trader Account'}
                            </h2>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700 uppercase">
                                {authUser?.role === 'admin' ? 'ADMIN' : 'PRO'}
                            </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono truncate">
                            {authUser?.email || 'demo.trader@tradyx.ai'}
                        </div>
                        <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>PWA Mobile Verified • iOS Safari</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. PANORAMICA SALDI, EQUITY E MARGINI */}
            <div className="w-full rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
                        <Wallet className="w-4 h-4 text-cyan-400" />
                        Panoramica Margini & Equity
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800">
                        LEVA 1:100
                    </span>
                </div>

                {/* Big Equity Display */}
                <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono uppercase">Equity Totale Portafoglio</span>
                    <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white break-words">
                        ${currentEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>

                {/* Margins Grid */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 font-mono text-xs">
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="text-[10px] text-slate-400">SALDO DISPONIBILE</div>
                        <div className="text-sm font-bold text-emerald-400 mt-0.5">
                            ${freeMargin.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="text-[10px] text-slate-400">MARGINE UTILIZZATO</div>
                        <div className="text-sm font-bold text-amber-400 mt-0.5">
                            ${usedMargin.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="text-[10px] text-slate-400">LIVELLO MARGINE</div>
                        <div className="text-sm font-bold text-cyan-400 mt-0.5">
                            {marginLevel}% (Sicuro)
                        </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="text-[10px] text-slate-400">P&L GIORNALIERO</div>
                        <div className={`text-sm font-bold mt-0.5 ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {totalPnl >= 0 ? `+$${totalPnl.toLocaleString()}` : `-$${Math.abs(totalPnl).toLocaleString()}`}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. ASSET ALLOCATION BREAKDOWN */}
            <div className="w-full rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-4 shadow-xl space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5 font-mono uppercase">
                        <PieChart className="w-4 h-4 text-purple-400" />
                        Asset Allocation
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">100% Attivo</span>
                </div>

                {/* Segmented multi-color progress bar */}
                <div className="w-full h-3 rounded-full overflow-hidden flex bg-white/5">
                    <div className="h-full bg-cyan-400" style={{ width: '55%' }} title="Crypto 55%" />
                    <div className="h-full bg-indigo-500" style={{ width: '25%' }} title="Forex 25%" />
                    <div className="h-full bg-purple-500" style={{ width: '20%' }} title="Equities 20%" />
                </div>

                <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-1">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        Crypto (55%)
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        Forex (25%)
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        Stocks (20%)
                    </span>
                </div>
            </div>

            {/* 4. IMPOSTAZIONI ACCOUNT & PWA OPTIONS */}
            <div className="w-full rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-4 shadow-xl space-y-3">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase block border-b border-white/5 pb-2">
                    Impostazioni PWA & Preferenze
                </span>

                <div className="space-y-2 text-xs">
                    {/* Demo Mode Toggle */}
                    <div className="flex items-center justify-between py-1.5">
                        <span className="text-slate-300 font-medium">Ambiente Simulato / Sandbox</span>
                        <button
                            type="button"
                            onClick={() => setIsDemoMode(!isDemoMode)}
                            className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                                isDemoMode ? 'bg-cyan-500' : 'bg-slate-800'
                            }`}
                        >
                            <div className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                                isDemoMode ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                        </button>
                    </div>

                    {/* Biometric FaceID Toggle */}
                    <div className="flex items-center justify-between py-1.5">
                        <span className="text-slate-300 font-medium">Sblocco Biometrico FaceID / TouchID</span>
                        <button
                            type="button"
                            onClick={() => setFaceIdEnabled(!faceIdEnabled)}
                            className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                                faceIdEnabled ? 'bg-cyan-500' : 'bg-slate-800'
                            }`}
                        >
                            <div className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                                faceIdEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                        </button>
                    </div>

                    {/* Currency selector */}
                    <div className="flex items-center justify-between py-1.5">
                        <span className="text-slate-300 font-medium">Valuta di Visualizzazione</span>
                        <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10">
                            <button
                                type="button"
                                onClick={() => setCurrency('USD')}
                                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                                    currency === 'USD' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                                }`}
                            >
                                USD ($)
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrency('EUR')}
                                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                                    currency === 'EUR' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                                }`}
                            >
                                EUR (€)
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. PULSANTE DI LOGOUT (Touch friendly, h-12 con conferma) */}
            <div className="w-full pt-2">
                {showLogoutConfirm ? (
                    <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500 space-y-3 text-center">
                        <div className="text-xs font-bold text-rose-200">
                            Sei sicuro di voler effettuare la disconnessione dall'account?
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setShowLogoutConfirm(false)}
                                className="h-10 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300"
                            >
                                Annulla
                            </button>
                            <button
                                type="button"
                                onClick={onLogout}
                                className="h-10 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-black text-white shadow-lg shadow-rose-600/30"
                            >
                                Sì, Disconnetti
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setShowLogoutConfirm(true)}
                        className="h-12 w-full rounded-2xl bg-rose-950/40 hover:bg-rose-950/70 border border-rose-700/60 text-rose-300 font-extrabold text-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-lg shadow-rose-950/50"
                    >
                        <LogOut className="w-4 h-4 text-rose-400" />
                        <span>Disconnetti Account</span>
                    </button>
                )}
            </div>

        </div>
    );
};

export default TabWallet;
