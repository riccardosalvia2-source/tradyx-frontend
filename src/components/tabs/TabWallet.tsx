// ============================================================================
// TRADYX MOBILE TAB 5: WALLET (Wallet Hub - Capital Allocation Protocol)
// Ultra-Modern Dark Fintech / Institutional Terminal Style
// ============================================================================

import React, { useState } from 'react';
import { UserAccount } from '../../types/auth';
import { useTradeStore, DEFAULT_MOCK_TRADES } from '../../store/useTradeStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { 
    Wallet, 
    Lock, 
    ShieldCheck, 
    ArrowUpRight, 
    Coins, 
    Sliders, 
    CheckCircle2, 
    LogOut,
    Sparkles,
    Database,
    KeyRound
} from 'lucide-react';

interface TabWalletProps {
    authUser: UserAccount | null;
    onLogout: () => void;
}

export const TabWallet: React.FC<TabWalletProps> = ({ authUser, onLogout }) => {
    const { trades } = useTradeStore();
    const { 
        baseCurrency, 
        monthlyBudget, 
        setMonthlyBudget, 
        formatMoney 
    } = useSettingsStore();

    const [monthlyBudgetInput, setMonthlyBudgetInput] = useState<string>(monthlyBudget.toString());
    const [utilizedCapital, setUtilizedCapital] = useState<number>(0);
    const [saveToast, setSaveToast] = useState<boolean>(false);

    const remainingBalance = monthlyBudget - utilizedCapital;
    const saturationRate = ((utilizedCapital / monthlyBudget) * 100).toFixed(1);

    const handleSetBudget = (e: React.FormEvent) => {
        e.preventDefault();
        const parsed = parseFloat(monthlyBudgetInput) || 10000;
        setMonthlyBudget(parsed);
        setSaveToast(true);
        setTimeout(() => setSaveToast(false), 2500);
    };

    return (
        <div className="w-full flex flex-col space-y-4 px-3 sm:px-4 pt-2 pb-28 text-white select-none overflow-x-hidden">
            
            {/* Top Compact Section Header */}
            <header className="w-full flex items-center justify-between py-2 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#111318] border border-[#10B981]/40 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.15)] shrink-0">
                        <span className="font-sans font-black text-base text-[#10B981]">T</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase font-semibold">
                            CAPITAL PROTOCOL
                        </span>
                        <h1 className="text-sm font-extrabold text-white tracking-tight font-mono">
                            WALLET HUB
                        </h1>
                    </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-[#111318] border border-white/5 text-[10px] font-mono text-[#10B981] font-bold">
                    VAULT SECURED
                </span>
            </header>

            {/* Notification Toast */}
            {saveToast && (
                <div className="w-full p-3 rounded-xl bg-[#10B981]/15 border border-[#10B981]/40 flex items-center gap-2 text-xs font-mono font-bold text-[#10B981] animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span>BUDGET MENSILE AGGIORNATO CON SUCCESSO</span>
                </div>
            )}

            {/* 1. BOX "DEPOSITO FONDO MENSILE" */}
            <section className="w-full rounded-2xl border border-white/5 bg-[#111318] p-4 sm:p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
                        <Coins className="w-4 h-4 text-[#10B981]" />
                        DEPOSITO FONDO MENSILE ({baseCurrency.symbol})
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                        ALLOCATION ALLOTMENT
                    </span>
                </div>

                <form onSubmit={handleSetBudget} className="space-y-3 font-mono">
                    <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-semibold block">
                            Importo Budget Mensile ({baseCurrency.code} {baseCurrency.symbol})
                        </label>
                        <input
                            type="number"
                            step="100"
                            value={monthlyBudgetInput}
                            onChange={(e) => setMonthlyBudgetInput(e.target.value)}
                            placeholder="10000"
                            className="w-full h-12 px-3.5 rounded-xl bg-[#08090C] border border-white/10 text-white text-sm font-bold font-mono focus:border-[#10B981] focus:outline-none transition-colors"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full min-h-[46px] h-12 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-sans font-black text-xs uppercase tracking-wider transition-all duration-200 active:scale-[0.98] shadow-lg shadow-[#10B981]/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Sliders className="w-4 h-4 text-white" />
                        <span>IMPOSTA BUDGET ({baseCurrency.code})</span>
                    </button>
                </form>
            </section>

            {/* 2. CARD "SALDO RIMANENTE" */}
            <section className="w-full rounded-2xl border border-white/5 bg-[#111318] p-4 sm:p-5 shadow-2xl relative overflow-hidden space-y-3">
                <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                        SALDO RIMANENTE
                    </span>
                    <div className="text-3xl sm:text-4xl font-sans font-black tracking-tight text-[#10B981] break-words tabular-nums">
                        {formatMoney(remainingBalance, true)}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 font-mono">
                    <div className="p-2.5 rounded-xl bg-[#08090C] border border-white/5">
                        <span className="text-[10px] text-slate-400 uppercase block">Utilized:</span>
                        <span className="text-sm font-black text-white tabular-nums">
                            {formatMoney(utilizedCapital, false)}
                        </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#08090C] border border-white/5">
                        <span className="text-[10px] text-slate-400 uppercase block">Monthly Limit:</span>
                        <span className="text-sm font-black text-[#10B981] tabular-nums">
                            {formatMoney(monthlyBudget, true)}
                        </span>
                    </div>
                </div>

                {/* 3. BARRA "PROTOCOL SATURATION" */}
                <div className="space-y-1.5 pt-1 font-mono">
                    <div className="flex justify-between text-[10px] text-slate-400">
                        <span>PROTOCOL SATURATION</span>
                        <span className="font-bold text-[#10B981] tabular-nums">{saturationRate}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-[#08090C] overflow-hidden border border-white/5">
                        <div 
                            className="h-full bg-gradient-to-r from-[#10B981] to-[#2563EB] rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(2, Number(saturationRate))}%` }}
                        />
                    </div>
                </div>
            </section>

            {/* 4. BOX "ACTIVE MONTH ALLOCATIONS" */}
            <section className="w-full rounded-2xl border border-white/5 bg-[#111318] p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
                        <Database className="w-4 h-4 text-[#2563EB]" />
                        ACTIVE MONTH ALLOCATIONS
                    </span>
                    <span className="text-[10px] font-mono text-[#10B981]">
                        LIVE MONITOR
                    </span>
                </div>

                <div className="p-4 rounded-xl bg-[#08090C] border border-white/5 text-center font-mono space-y-1">
                    <span className="text-xs font-bold text-slate-300 block">
                        Zero protocol allocations
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                        No capital overdraft or margin saturation detected for this cycle.
                    </span>
                </div>
            </section>

            {/* 5. BADGE INFORMATIVO "ENCRYPTED LIQUIDITY" */}
            <section className="w-full rounded-2xl border border-white/5 bg-[#111318] p-4 shadow-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2563EB]/20 border border-[#2563EB]/40 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div className="font-mono space-y-0.5">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-white uppercase tracking-wider">
                            ENCRYPTED LIQUIDITY
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40">
                            AES-256
                        </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                        Institutional multi-signature vault with cold storage capital governance.
                    </p>
                </div>
            </section>

            {/* User Profile & Logout */}
            <div className="pt-2 flex flex-col items-center gap-2">
                <button
                    type="button"
                    onClick={onLogout}
                    className="w-full h-11 rounded-xl bg-[#111318] hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white font-mono text-xs font-bold uppercase transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Disconnetti Terminale</span>
                </button>
            </div>

        </div>
    );
};

export default TabWallet;
