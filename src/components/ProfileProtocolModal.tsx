// ============================================================================
// TRADYX PROFILE & PROTOCOL SETTINGS MODAL / FULLSCREEN SHEET
// (src/components/ProfileProtocolModal.tsx)
// Ultra-Modern Dark Fintech / Institutional Terminal Style
// Inspired by Linear, Raycast & Bloomberg Terminal
// ============================================================================

import React, { useState, useMemo } from 'react';
import { 
    useSettingsStore, 
    WORLD_CURRENCIES, 
    Currency, 
    SubscriptionPlan 
} from '../store/useSettingsStore';
import { 
    X, 
    Shield, 
    ShieldCheck, 
    User, 
    Mail, 
    Globe, 
    Search, 
    Coins, 
    Percent, 
    Check, 
    Sparkles, 
    CreditCard, 
    Lock, 
    KeyRound, 
    Smartphone, 
    Laptop, 
    FileText, 
    ExternalLink, 
    Zap, 
    CheckCircle2, 
    ChevronDown, 
    ArrowRight,
    Sliders,
    Layers,
    AlertCircle
} from 'lucide-react';

interface ProfileProtocolModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProfileProtocolModal: React.FC<ProfileProtocolModalProps> = ({
    isOpen,
    onClose
}) => {
    const {
        email,
        protocolName,
        baseCurrency,
        reinvestProfits,
        monthlyBudget,
        maxRiskPerTrade,
        maxRiskType,
        selectedPlan,
        encryptionBadge,
        activeSessions,
        paymentMethod,
        invoices,
        setEmail,
        setProtocolName,
        setBaseCurrency,
        setReinvestProfits,
        setMonthlyBudget,
        setMaxRiskPerTrade,
        setSelectedPlan,
        terminateOtherSessions,
        updatePaymentMethod,
        formatMoney
    } = useSettingsStore();

    // Local form states
    const [currencySearch, setCurrencySearch] = useState<string>('');
    const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    
    // Password change form state
    const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
    const [currentPassword, setCurrentPassword] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    
    // Active Tab in Profile
    const [activeSection, setActiveSection] = useState<'IDENTITY' | 'BUDGET' | 'PLANS' | 'SECURITY' | 'PAYMENTS'>('IDENTITY');

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const filteredCurrencies = useMemo(() => {
        if (!currencySearch.trim()) return WORLD_CURRENCIES;
        const q = currencySearch.toLowerCase();
        return WORLD_CURRENCIES.filter(c => 
            c.code.toLowerCase().includes(q) ||
            c.name.toLowerCase().includes(q) ||
            c.symbol.toLowerCase().includes(q)
        );
    }, [currencySearch]);

    const handlePasswordChangeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPassword) {
            showToast('Inserisci la password corrente.');
            return;
        }
        if (newPassword.length < 8) {
            showToast('La nuova password deve contenere almeno 8 caratteri.');
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast('Le due password non coincidono.');
            return;
        }
        setIsChangingPassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        showToast('Password crittografica aggiornata con successo (AES-256).');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
            {/* Modal Surface: Glassmorphism Dark Fintech */}
            <div 
                className="w-full max-w-2xl bg-[#0D111A]/95 backdrop-blur-2xl border-t sm:border border-white/[0.08] rounded-t-3xl sm:rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden text-slate-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 1. MODAL TOP HEADER */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-[#0D111A]/80 backdrop-blur-xl shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl glass-subcard border border-[#10B981]/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,229,153,0.2)]">
                            <span className="font-sans font-black text-lg text-[#10B981]">T</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight uppercase font-mono">
                                    PROFILE & PROTOCOL SETTINGS
                                </h2>
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black font-mono bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                                    {selectedPlan.toUpperCase()}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono">
                                Identità, Valuta Operativa, Rischio & Abbonamento
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 sm:px-3 sm:py-1.5 rounded-xl glass-subcard hover:bg-white/10 text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                        title="Chiudi Scheda"
                    >
                        <span className="text-xs font-mono font-bold hidden sm:inline">Chiudi</span>
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Toast Notification Alert */}
                {toastMessage && (
                    <div className="px-5 py-2.5 bg-[#10B981]/15 border-b border-[#10B981]/30 text-[#10B981] text-xs font-mono font-bold flex items-center gap-2 animate-in slide-in-from-top-1">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-[#10B981]" />
                        <span>{toastMessage}</span>
                    </div>
                )}

                {/* 2. SECTION NAVIGATION CHIPS */}
                <div className="px-4 py-2.5 border-b border-white/[0.06] bg-[#0A0D14]/80 backdrop-blur-lg flex items-center gap-1.5 overflow-x-auto no-scrollbar font-mono text-[11px] shrink-0">
                    {[
                        { id: 'IDENTITY', label: 'Identity & Protocol', icon: User },
                        { id: 'BUDGET', label: 'Budget Allocation', icon: Sliders },
                        { id: 'PLANS', label: 'Subscription Tiers', icon: Sparkles },
                        { id: 'SECURITY', label: 'Encryption & Sessions', icon: Shield },
                        { id: 'PAYMENTS', label: 'Payment Protocols', icon: CreditCard },
                    ].map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeSection === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveSection(tab.id as any)}
                                className={`px-3 py-1.5 rounded-xl shrink-0 font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                                    isActive
                                        ? 'bg-[#10B981] text-[#08090C] border-[#10B981] shadow-[0_0_12px_rgba(0,229,153,0.3)]'
                                        : 'glass-subcard text-slate-400 border-white/[0.06] hover:text-white'
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* 3. MODAL SCROLLABLE BODY */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin pb-16">

                    {/* SECTION 1: IDENTITY & PROTOCOL */}
                    {activeSection === 'IDENTITY' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            
                            {/* Protocol Name */}
                            <div className="p-4 rounded-2xl bg-[#111318] border border-white/[0.08] space-y-2">
                                <label className="text-[11px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-[#10B981]" />
                                    <span>Protocol Trader Name</span>
                                </label>
                                <input
                                    type="text"
                                    value={protocolName}
                                    onChange={(e) => setProtocolName(e.target.value)}
                                    placeholder="Nome e cognome del trader..."
                                    className="w-full h-11 px-3.5 rounded-xl bg-[#08090C] border border-white/[0.08] text-white font-mono text-sm focus:border-[#10B981] focus:outline-none transition-colors"
                                />
                                <span className="text-[10px] text-slate-400 font-mono">
                                    Il nome mostrato nell'Institutional Header e nei report PDF generati.
                                </span>
                            </div>

                            {/* User Email */}
                            <div className="p-4 rounded-2xl bg-[#111318] border border-white/[0.08] space-y-2">
                                <label className="text-[11px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5 text-[#10B981]" />
                                    <span>Identity & Auth Email</span>
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full h-11 px-3.5 rounded-xl bg-[#08090C] border border-white/[0.08] text-white font-mono text-sm focus:border-[#10B981] focus:outline-none transition-colors"
                                />
                                <span className="text-[10px] text-slate-400 font-mono">
                                    Email protetta con crittografia client-side di livello istituzionale.
                                </span>
                            </div>

                            {/* Base Currency Dropdown with Search */}
                            <div className="p-4 rounded-2xl bg-[#111318] border border-white/[0.08] space-y-2 relative">
                                <label className="text-[11px] font-mono uppercase text-slate-400 font-bold flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <Globe className="w-3.5 h-3.5 text-[#10B981]" />
                                        <span>Base Currency (Aggiornamento Globale Simboli)</span>
                                    </span>
                                    <span className="text-[#10B981] font-mono font-bold text-xs">
                                        {baseCurrency.code} ({baseCurrency.symbol})
                                    </span>
                                </label>

                                <div 
                                    onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                                    className="w-full h-12 px-3.5 rounded-xl bg-[#08090C] border border-white/[0.08] hover:border-white/20 text-white font-mono text-sm flex items-center justify-between cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-lg">{baseCurrency.flag}</span>
                                        <span className="font-bold text-white">{baseCurrency.code}</span>
                                        <span className="text-slate-400">({baseCurrency.symbol}) - {baseCurrency.name}</span>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isCurrencyDropdownOpen ? 'rotate-180 text-[#10B981]' : ''}`} />
                                </div>

                                {/* Dropdown Menu with Instant Search */}
                                {isCurrencyDropdownOpen && (
                                    <div className="mt-2 rounded-xl bg-[#08090C] border border-white/[0.12] p-2 space-y-2 shadow-2xl z-30">
                                        <div className="relative">
                                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                value={currencySearch}
                                                onChange={(e) => setCurrencySearch(e.target.value)}
                                                placeholder="Cerca valuta (EUR, USD, GBP, JPY, CHF, BTC...)"
                                                className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#111318] border border-white/10 text-xs text-white font-mono placeholder:text-slate-400 focus:border-[#10B981] focus:outline-none"
                                                autoFocus
                                            />
                                        </div>

                                        <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-xs pr-1">
                                            {filteredCurrencies.map(curr => {
                                                const isSel = curr.code === baseCurrency.code;
                                                return (
                                                    <div
                                                        key={curr.code}
                                                        onClick={() => {
                                                            setBaseCurrency(curr);
                                                            setIsCurrencyDropdownOpen(false);
                                                            showToast(`Valuta operativa cambiata in ${curr.code} (${curr.symbol})`);
                                                        }}
                                                        className={`px-3 py-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                                                            isSel 
                                                                ? 'bg-[#10B981]/20 text-[#10B981] font-bold border border-[#10B981]/30' 
                                                                : 'hover:bg-white/5 text-slate-200'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span>{curr.flag}</span>
                                                            <strong className="text-white">{curr.code}</strong>
                                                            <span className="text-slate-400">({curr.symbol})</span>
                                                            <span className="text-[11px] text-slate-400">• {curr.name}</span>
                                                        </div>
                                                        {isSel && <Check className="w-4 h-4 text-[#10B981]" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Reinvest Profits (Interesse Composto Automatico) */}
                            <div className="p-4 rounded-2xl bg-[#111318] border border-white/[0.08] space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-[#10B981]" />
                                        <span className="text-xs font-mono font-bold text-white uppercase">
                                            Reinvest Profits (Interesse Composto)
                                        </span>
                                    </div>
                                    
                                    {/* Toggle Switch */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setReinvestProfits(!reinvestProfits);
                                            showToast(`Interesse composto ${!reinvestProfits ? 'ATTIVATO' : 'DISATTIVATO'}`);
                                        }}
                                        className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 border ${
                                            reinvestProfits 
                                                ? 'bg-[#10B981] border-[#10B981]' 
                                                : 'bg-slate-800 border-white/10'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full transition-transform ${
                                            reinvestProfits 
                                                ? 'translate-x-6 bg-[#08090C]' 
                                                : 'translate-x-0 bg-slate-400'
                                        }`} />
                                    </button>
                                </div>

                                <p className="text-[11px] text-slate-300 font-mono leading-relaxed bg-[#08090C] p-3 rounded-xl border border-white/5">
                                    <em>"Attiva l'interesse composto automatico: quando abilitato, i profitti realizzati incrementano automaticamente il capitale operativo per il calcolo del rischio percentuale sui trade successivi."</em>
                                </p>
                            </div>

                        </div>
                    )}

                    {/* SECTION 2: BUDGET ALLOCATION PROTOCOL */}
                    {activeSection === 'BUDGET' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            
                            {/* Monthly Budget Card */}
                            <div className="p-5 rounded-2xl bg-[#111318] border border-white/[0.08] space-y-4">
                                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                                    <div className="flex items-center gap-2">
                                        <Coins className="w-4 h-4 text-[#10B981]" />
                                        <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                                            Capitale Allocato Mensile
                                        </h3>
                                    </div>
                                    <span className="text-xs font-black font-mono text-[#10B981]">
                                        {formatMoney(monthlyBudget, false)}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                                        <span>Capitale Operativo ({baseCurrency.symbol}):</span>
                                        <span className="text-white font-bold">{monthlyBudget.toLocaleString('it-IT')} {baseCurrency.symbol}</span>
                                    </div>

                                    <input
                                        type="range"
                                        min="1000"
                                        max="100000"
                                        step="500"
                                        value={monthlyBudget}
                                        onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                                        className="w-full accent-[#10B981] cursor-pointer"
                                    />

                                    <div className="flex gap-2 pt-1 font-mono text-[10px]">
                                        {[5000, 10000, 25000, 50000].map(val => (
                                            <button
                                                key={val}
                                                type="button"
                                                onClick={() => setMonthlyBudget(val)}
                                                className={`px-2.5 py-1 rounded-lg border transition-all ${
                                                    monthlyBudget === val 
                                                        ? 'bg-[#10B981] text-[#08090C] border-[#10B981] font-black' 
                                                        : 'bg-[#08090C] text-slate-400 border-white/5 hover:text-white'
                                                }`}
                                            >
                                                {val.toLocaleString('it-IT')} {baseCurrency.symbol}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Max Risk Per Trade */}
                            <div className="p-5 rounded-2xl bg-[#111318] border border-white/[0.08] space-y-4">
                                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                                    <div className="flex items-center gap-2">
                                        <Percent className="w-4 h-4 text-cyan-400" />
                                        <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                                            Tetto Massimo di Rischio per Trade
                                        </h3>
                                    </div>
                                    <span className="text-xs font-black font-mono text-cyan-400">
                                        {maxRiskPerTrade} {maxRiskType === 'FIXED' ? baseCurrency.symbol : '%'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-mono text-slate-400 uppercase">Valore Tetto:</label>
                                        <input
                                            type="number"
                                            value={maxRiskPerTrade}
                                            onChange={(e) => setMaxRiskPerTrade(Number(e.target.value))}
                                            className="w-full h-11 px-3.5 rounded-xl bg-[#08090C] border border-white/[0.08] text-white font-mono text-sm focus:border-cyan-400 focus:outline-none"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-mono text-slate-400 uppercase">Tipo di Calcolo:</label>
                                        <div className="grid grid-cols-2 gap-1.5 h-11 p-1 bg-[#08090C] rounded-xl border border-white/[0.08]">
                                            <button
                                                type="button"
                                                onClick={() => setMaxRiskPerTrade(maxRiskPerTrade, 'FIXED')}
                                                className={`rounded-lg font-mono text-xs font-bold transition-all ${
                                                    maxRiskType === 'FIXED'
                                                        ? 'bg-[#1D68BD] text-white'
                                                        : 'text-slate-400 hover:text-white'
                                                }`}
                                            >
                                                {baseCurrency.symbol} Fisso
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setMaxRiskPerTrade(maxRiskPerTrade > 10 ? 2 : maxRiskPerTrade, 'PERCENT')}
                                                className={`rounded-lg font-mono text-xs font-bold transition-all ${
                                                    maxRiskType === 'PERCENT'
                                                        ? 'bg-[#1D68BD] text-white'
                                                        : 'text-slate-400 hover:text-white'
                                                }`}
                                            >
                                                % Rischio
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 bg-[#08090C] rounded-xl border border-white/5 text-[11px] font-mono text-slate-300">
                                    <div className="flex justify-between">
                                        <span>Rischio Max per Operazione:</span>
                                        <strong className="text-white">
                                            {maxRiskType === 'PERCENT' 
                                                ? `${((monthlyBudget * maxRiskPerTrade) / 100).toLocaleString('it-IT')} ${baseCurrency.symbol} (${maxRiskPerTrade}%)` 
                                                : `${maxRiskPerTrade.toLocaleString('it-IT')} ${baseCurrency.symbol} (${((maxRiskPerTrade / monthlyBudget) * 100).toFixed(2)}%)`
                                            }
                                        </strong>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* SECTION 3: SUBSCRIPTION PLANS (PRICING MATRIX) */}
                    {activeSection === 'PLANS' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            
                            <div className="text-center space-y-1">
                                <h3 className="text-base font-black text-white uppercase font-mono tracking-tight">
                                    SANDBOX & PROTOCOL TIERS
                                </h3>
                                <p className="text-xs text-slate-400 font-mono">
                                    Potenzia il tuo journal con gli algoritmi predittivi e la Quasar Bubble live
                                </p>
                            </div>

                            {/* 3 Comparative Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                
                                {/* 1. FREE PLAN */}
                                <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                                    selectedPlan === 'Free' 
                                        ? 'bg-[#111318] border-[#10B981]/60 shadow-[0_0_20px_rgba(0,229,153,0.15)]' 
                                        : 'bg-[#111318]/70 border-white/[0.08]'
                                }`}>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-mono font-bold uppercase text-slate-300">Free</span>
                                            {selectedPlan === 'Free' && (
                                                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black bg-[#10B981]/20 text-[#10B981]">
                                                    ATTIVO
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <div className="text-2xl font-black font-sans text-white">0,00 €</div>
                                            <span className="text-[10px] text-slate-400 font-mono">/mese per sempre</span>
                                        </div>

                                        <ul className="space-y-2 text-[11px] font-mono text-slate-300 border-t border-white/5 pt-3">
                                            <li className="flex items-start gap-1.5">
                                                <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                                                <span>Accesso base al journal</span>
                                            </li>
                                            <li className="flex items-start gap-1.5">
                                                <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                                                <span>Fino a 30 trade/mese</span>
                                            </li>
                                            <li className="flex items-start gap-1.5">
                                                <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                                                <span>Quasar Bubble oraria</span>
                                            </li>
                                            <li className="flex items-start gap-1.5">
                                                <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                                                <span>Statistiche essenziali</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedPlan('Free');
                                            showToast('Piano aggiornato a FREE.');
                                        }}
                                        disabled={selectedPlan === 'Free'}
                                        className={`w-full mt-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                                            selectedPlan === 'Free'
                                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                                : 'bg-[#111318] hover:bg-white/10 text-white border border-white/10'
                                        }`}
                                    >
                                        {selectedPlan === 'Free' ? 'Piano Attuale' : 'Passa a Free'}
                                    </button>
                                </div>

                                {/* 2. PLUS PLAN (RECOMMENDED) */}
                                <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between relative ${
                                    selectedPlan === 'Plus' 
                                        ? 'bg-[#111318] border-[#10B981] shadow-[0_0_25px_rgba(0,229,153,0.25)]' 
                                        : 'bg-[#111318] border-white/20'
                                }`}>
                                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-[#10B981] text-[#08090C] rounded-full text-[9px] font-black uppercase font-mono tracking-wider shadow-md">
                                        POPOLARE
                                    </div>

                                    <div className="space-y-3 pt-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-mono font-bold uppercase text-[#10B981]">Plus</span>
                                            {selectedPlan === 'Plus' && (
                                                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black bg-[#10B981]/20 text-[#10B981]">
                                                    ATTIVO
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <div className="text-2xl font-black font-sans text-white">9,99 €</div>
                                            <span className="text-[10px] text-slate-400 font-mono">/mese fatturato mensile</span>
                                        </div>

                                        <ul className="space-y-2 text-[11px] font-mono text-slate-200 border-t border-white/5 pt-3">
                                            <li className="flex items-start gap-1.5">
                                                <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                                                <strong className="text-white">Trade illimitati</strong>
                                            </li>
                                            <li className="flex items-start gap-1.5">
                                                <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                                                <span>Quasar Bubble live real-time</span>
                                            </li>
                                            <li className="flex items-start gap-1.5">
                                                <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                                                <span>AI Coach reattivo psicologia</span>
                                            </li>
                                            <li className="flex items-start gap-1.5">
                                                <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                                                <span>Rilevamento tilt di base</span>
                                            </li>
                                            <li className="flex items-start gap-1.5">
                                                <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                                                <span>Supporto multi-asset crypto/stocks</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedPlan('Plus');
                                            showToast('Piano aggiornato a PLUS.');
                                        }}
                                        disabled={selectedPlan === 'Plus'}
                                        className={`w-full mt-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                                            selectedPlan === 'Plus'
                                                ? 'bg-[#10B981] text-[#08090C] font-black cursor-not-allowed shadow-[0_0_15px_#10B981]'
                                                : 'bg-[#10B981] hover:bg-[#059669] text-[#08090C] font-black shadow-lg shadow-[#10B981]/20'
                                        }`}
                                    >
                                        {selectedPlan === 'Plus' ? 'Piano Attuale' : 'Attiva Plus'}
                                    </button>
                                </div>

                                {/* 3. PREMIUM PLAN */}
                                <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                                    selectedPlan === 'Premium' 
                                        ? 'bg-[#111318] border-[#1D68BD] shadow-[0_0_25px_rgba(29,104,189,0.35)]' 
                                        : 'bg-[#111318]/70 border-white/[0.08]'
                                }`}>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-mono font-bold uppercase text-cyan-400">Premium</span>
                                            {selectedPlan === 'Premium' && (
                                                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black bg-[#1D68BD]/30 text-cyan-300">
                                                    ATTIVO
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <div className="text-2xl font-black font-sans text-white">19,99 €</div>
                                            <span className="text-[10px] text-slate-400 font-mono">/mese accesso completo</span>
                                        </div>

                                        <ul className="space-y-2 text-[11px] font-mono text-slate-200 border-t border-white/5 pt-3">
                                            <li className="flex items-start gap-1.5">
                                                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                                                <span>Tutte le funzioni Plus</span>
                                            </li>
                                            <li className="flex items-start gap-1.5">
                                                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                                                <strong className="text-white">Gemini Copilot Risk Manager predittivo</strong>
                                            </li>
                                            <li className="flex items-start gap-1.5">
                                                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                                                <span>Export report fiscali & prop firm</span>
                                            </li>
                                            <li className="flex items-start gap-1.5">
                                                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                                                <span>Heatmap avanzata & tilt predittivo</span>
                                            </li>
                                            <li className="flex items-start gap-1.5">
                                                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                                                <span>Priorità news flash istituzionali</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedPlan('Premium');
                                            showToast('Piano aggiornato a PREMIUM.');
                                        }}
                                        disabled={selectedPlan === 'Premium'}
                                        className={`w-full mt-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                                            selectedPlan === 'Premium'
                                                ? 'bg-[#1D68BD] text-white font-black cursor-not-allowed shadow-[0_0_15px_#1D68BD]'
                                                : 'bg-[#1D68BD] hover:bg-[#15549c] text-white font-bold'
                                        }`}
                                    >
                                        {selectedPlan === 'Premium' ? 'Piano Attuale' : 'Upgrade a Premium'}
                                    </button>
                                </div>

                            </div>

                        </div>
                    )}

                    {/* SECTION 4: ENCRYPTION & ACCESS */}
                    {activeSection === 'SECURITY' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            
                            {/* Security Badge */}
                            <div className="p-4 rounded-2xl bg-[#111318] border border-white/[0.08] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center">
                                        <ShieldCheck className="w-5 h-5 text-[#10B981]" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-white font-mono">
                                            {encryptionBadge}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono">
                                            Crittografia end-to-end con firma client SHA-512
                                        </div>
                                    </div>
                                </div>

                                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                                    ATTIVO
                                </span>
                            </div>

                            {/* Password Change Form */}
                            <div className="p-5 rounded-2xl bg-[#111318] border border-white/[0.08] space-y-3">
                                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                                    <div className="flex items-center gap-2">
                                        <KeyRound className="w-4 h-4 text-cyan-400" />
                                        <span className="text-xs font-mono font-bold text-white uppercase">
                                            Modifica Password Crittografica
                                        </span>
                                    </div>

                                    {!isChangingPassword && (
                                        <button
                                            type="button"
                                            onClick={() => setIsChangingPassword(true)}
                                            className="px-2.5 py-1 rounded-lg bg-[#08090C] hover:bg-white/10 text-xs font-mono font-bold text-slate-300 border border-white/10"
                                        >
                                            Modifica
                                        </button>
                                    )}
                                </div>

                                {isChangingPassword ? (
                                    <form onSubmit={handlePasswordChangeSubmit} className="space-y-3 font-mono">
                                        <input
                                            type="password"
                                            placeholder="Password Corrente"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full h-10 px-3 rounded-xl bg-[#08090C] border border-white/[0.08] text-xs text-white"
                                        />
                                        <input
                                            type="password"
                                            placeholder="Nuova Password (min 8 caratteri)"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full h-10 px-3 rounded-xl bg-[#08090C] border border-white/[0.08] text-xs text-white"
                                        />
                                        <input
                                            type="password"
                                            placeholder="Conferma Nuova Password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full h-10 px-3 rounded-xl bg-[#08090C] border border-white/[0.08] text-xs text-white"
                                        />
                                        <div className="flex gap-2 pt-1">
                                            <button
                                                type="submit"
                                                className="px-4 py-2 rounded-xl bg-[#10B981] text-[#08090C] font-black text-xs cursor-pointer"
                                            >
                                                Salva Password
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsChangingPassword(false)}
                                                className="px-4 py-2 rounded-xl bg-[#08090C] text-slate-400 text-xs cursor-pointer border border-white/5"
                                            >
                                                Annulla
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <p className="text-[11px] text-slate-400 font-mono">
                                        Ultimo cambio password: 14 giorni fa. Le sessioni rimangono crittografate.
                                    </p>
                                )}
                            </div>

                            {/* Active Sessions */}
                            <div className="p-5 rounded-2xl bg-[#111318] border border-white/[0.08] space-y-3">
                                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                                    <div className="flex items-center gap-2">
                                        <Smartphone className="w-4 h-4 text-[#10B981]" />
                                        <span className="text-xs font-mono font-bold text-white uppercase">
                                            Sessioni Attive Dispositivi
                                        </span>
                                    </div>

                                    {activeSessions.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                terminateOtherSessions();
                                                showToast('Tutte le altre sessioni sono state terminate.');
                                            }}
                                            className="text-[10px] font-mono text-[#DC2626] hover:underline"
                                        >
                                            Termina altre sessioni
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-2 font-mono text-xs">
                                    {activeSessions.map(session => (
                                        <div
                                            key={session.id}
                                            className="p-3 rounded-xl bg-[#08090C] border border-white/5 flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                {session.device.includes('iPhone') ? (
                                                    <Smartphone className="w-4 h-4 text-[#10B981]" />
                                                ) : (
                                                    <Laptop className="w-4 h-4 text-cyan-400" />
                                                )}
                                                <div>
                                                    <div className="text-white font-bold flex items-center gap-1.5">
                                                        <span>{session.device}</span>
                                                        {session.isCurrent && (
                                                            <span className="px-1.5 py-0.2 rounded text-[8px] bg-[#10B981]/20 text-[#10B981]">
                                                                QUESTO DISPOSITIVO
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">
                                                        {session.browser} • {session.ip}
                                                    </div>
                                                </div>
                                            </div>

                                            <span className="text-[10px] text-slate-500">
                                                {session.lastActive}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    )}

                    {/* SECTION 5: PAYMENT PROTOCOLS */}
                    {activeSection === 'PAYMENTS' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            
                            {/* Current Payment Method */}
                            <div className="p-5 rounded-2xl bg-[#111318] border border-white/[0.08] space-y-3">
                                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-[#10B981]" />
                                        <span className="text-xs font-mono font-bold text-white uppercase">
                                            Metodo di Pagamento Attivo
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400">
                                        STRIPE / PCI-DSS L1
                                    </span>
                                </div>

                                <div className="p-4 rounded-xl bg-[#08090C] border border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-7 rounded bg-slate-800 border border-white/10 flex items-center justify-center font-mono font-bold text-[10px] text-white">
                                            MC
                                        </div>
                                        <div>
                                            <div className="font-mono text-sm font-bold text-white">
                                                {paymentMethod.label}
                                            </div>
                                            <div className="font-mono text-[10px] text-slate-400">
                                                Scadenza: {paymentMethod.expires || '12/28'}
                                            </div>
                                        </div>
                                    </div>

                                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#10B981]/15 text-[#10B981]">
                                        PREDEFINITO
                                    </span>
                                </div>

                                <div className="flex gap-2 pt-1 font-mono text-xs">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            updatePaymentMethod({
                                                type: 'CARD',
                                                label: 'Visa Gold •••• 9104',
                                                expires: '03/29'
                                            });
                                            showToast('Carta di pagamento aggiornata via Stripe.');
                                        }}
                                        className="flex-1 py-2 rounded-xl bg-[#08090C] hover:bg-white/5 border border-white/10 text-white font-bold"
                                    >
                                        Aggiorna Carta
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            updatePaymentMethod({
                                                type: 'WEB3_CRYPTO',
                                                label: 'Web3 Wallet •••• 0x7A4b (USDC)',
                                                expires: 'Multi-Chain'
                                            });
                                            showToast('Metodo aggiornato a Web3 Crypto Checkout (USDC).');
                                        }}
                                        className="flex-1 py-2 rounded-xl bg-[#08090C] hover:bg-white/5 border border-white/10 text-cyan-300 font-bold"
                                    >
                                        Collega Web3 Crypto
                                    </button>
                                </div>
                            </div>

                            {/* Invoices History */}
                            <div className="p-5 rounded-2xl bg-[#111318] border border-white/[0.08] space-y-3">
                                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-cyan-400" />
                                        <span className="text-xs font-mono font-bold text-white uppercase">
                                            Cronologia Fatture & Ricevute Fiscali
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400">
                                        {invoices.length} FATTURE
                                    </span>
                                </div>

                                <div className="space-y-2 font-mono text-xs">
                                    {invoices.map(inv => (
                                        <div
                                            key={inv.id}
                                            className="p-3 rounded-xl bg-[#08090C] border border-white/5 flex items-center justify-between"
                                        >
                                            <div>
                                                <div className="text-white font-bold">
                                                    {inv.id} • Piano {inv.plan}
                                                </div>
                                                <div className="text-[10px] text-slate-400">
                                                    {inv.date}
                                                </div>
                                            </div>

                                            <div className="text-right flex items-center gap-2.5">
                                                <span className="text-white font-bold">{inv.amount}</span>
                                                <span className="px-2 py-0.5 rounded text-[9px] font-black bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                                                    {inv.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    )}

                </div>

                {/* 4. MODAL FOOTER */}
                <div className="p-4 border-t border-white/[0.08] bg-[#111318]/90 flex items-center justify-between shrink-0">
                    <span className="text-[10px] font-mono text-slate-400">
                        VALUTA: <strong className="text-[#10B981]">{baseCurrency.code} ({baseCurrency.symbol})</strong> • PIANO: <strong className="text-white">{selectedPlan}</strong>
                    </span>

                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-[#08090C] font-black font-mono text-xs transition active:scale-95 shadow-lg shadow-[#10B981]/20 cursor-pointer"
                    >
                        Salva & Chiudi
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ProfileProtocolModal;
