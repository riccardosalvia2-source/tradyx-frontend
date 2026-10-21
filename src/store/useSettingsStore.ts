// ============================================================================
// TRADYX GLOBAL SETTINGS & PROFILE PROTOCOL STORE
// (src/store/useSettingsStore.ts)
// ============================================================================

import { create } from 'zustand';

export interface Currency {
    code: string;
    symbol: string;
    name: string;
    flag: string;
}

export const WORLD_CURRENCIES: Currency[] = [
    { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
    { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
    { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
    { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
    { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', flag: '🇭🇰' },
    { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', flag: '🇸🇪' },
    { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', flag: '🇳🇴' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
    { code: 'AED', symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪' },
    { code: 'BTC', symbol: '₿', name: 'Bitcoin', flag: '⚡' },
    { code: 'ETH', symbol: 'Ξ', name: 'Ethereum', flag: '🔷' },
    { code: 'USDT', symbol: '₮', name: 'Tether USD', flag: '🟢' },
    { code: 'SOL', symbol: 'SOL', name: 'Solana', flag: '🟣' },
];

export type SubscriptionPlan = 'Free' | 'Plus' | 'Premium';

export interface PlanFeature {
    name: string;
    description: string;
    free: boolean | string;
    plus: boolean | string;
    premium: boolean | string;
}

export interface InvoiceItem {
    id: string;
    date: string;
    plan: SubscriptionPlan;
    amount: string;
    status: 'PAID' | 'SETTLED' | 'PENDING';
    pdfUrl?: string;
}

export interface ActiveSession {
    id: string;
    device: string;
    browser: string;
    ip: string;
    lastActive: string;
    isCurrent: boolean;
}

interface SettingsState {
    // Identity & Protocol
    email: string;
    protocolName: string;
    baseCurrency: Currency;
    reinvestProfits: boolean;
    
    // Budget Allocation
    monthlyBudget: number;
    maxRiskPerTrade: number;
    maxRiskType: 'PERCENT' | 'FIXED';
    
    // Subscription & Pricing
    selectedPlan: SubscriptionPlan;
    
    // Security & Sessions
    encryptionBadge: string;
    activeSessions: ActiveSession[];
    
    // Payments
    paymentMethod: {
        type: 'STRIPE' | 'CARD' | 'WEB3_CRYPTO';
        label: string;
        expires?: string;
    };
    invoices: InvoiceItem[];
    
    // Modal visibility
    isProfileModalOpen: boolean;
    
    // Actions
    setProtocolName: (name: string) => void;
    setEmail: (email: string) => void;
    setBaseCurrency: (currency: Currency) => void;
    setReinvestProfits: (val: boolean) => void;
    setMonthlyBudget: (amount: number) => void;
    setMaxRiskPerTrade: (amount: number, type?: 'PERCENT' | 'FIXED') => void;
    setSelectedPlan: (plan: SubscriptionPlan) => void;
    setIsProfileModalOpen: (open: boolean) => void;
    terminateOtherSessions: () => void;
    updatePaymentMethod: (pm: { type: 'STRIPE' | 'CARD' | 'WEB3_CRYPTO'; label: string; expires?: string }) => void;
    
    // Helper
    formatMoney: (amount: number, includeSign?: boolean) => string;
}

const STORAGE_KEY = 'tradyx_protocol_settings_v2';

const getInitialState = () => {
    if (typeof window !== 'undefined') {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) {
            console.warn('Failed to parse settings cache:', e);
        }
    }
    return null;
};

const cached = getInitialState();

export const useSettingsStore = create<SettingsState>((set, get) => ({
    email: cached?.email || 'suca.quant@tradyx.ai',
    protocolName: cached?.protocolName || 'Riccardo Salvia',
    baseCurrency: cached?.baseCurrency || WORLD_CURRENCIES[0], // EUR default
    reinvestProfits: cached?.reinvestProfits !== undefined ? cached.reinvestProfits : true,
    
    monthlyBudget: cached?.monthlyBudget || 10000,
    maxRiskPerTrade: cached?.maxRiskPerTrade || 200,
    maxRiskType: cached?.maxRiskType || 'FIXED',
    
    selectedPlan: cached?.selectedPlan || 'Plus',
    encryptionBadge: 'AES-256 Protocol Active',
    
    activeSessions: [
        {
            id: 'sess-1',
            device: 'iPhone 16 Pro',
            browser: 'Safari PWA Mobile',
            ip: '151.78.44.12 • Milan, IT',
            lastActive: 'Adesso (Attiva)',
            isCurrent: true
        },
        {
            id: 'sess-2',
            device: 'MacBook Pro M3 Max',
            browser: 'Brave Browser / macOS',
            ip: '151.78.44.12 • Milan, IT',
            lastActive: '2 ore fa',
            isCurrent: false
        }
    ],
    
    paymentMethod: cached?.paymentMethod || {
        type: 'CARD',
        label: 'Mastercard •••• 8842',
        expires: '11/28'
    },
    
    invoices: [
        {
            id: 'INV-2026-003',
            date: '01 Ottobre 2026',
            plan: 'Plus',
            amount: '9,99 €',
            status: 'PAID'
        },
        {
            id: 'INV-2026-002',
            date: '01 Settembre 2026',
            plan: 'Plus',
            amount: '9,99 €',
            status: 'SETTLED'
        },
        {
            id: 'INV-2026-001',
            date: '01 Agosto 2026',
            plan: 'Plus',
            amount: '9,99 €',
            status: 'SETTLED'
        }
    ],
    
    isProfileModalOpen: false,
    
    setProtocolName: (name: string) => {
        set({ protocolName: name });
        saveToCache({ ...get(), protocolName: name });
    },
    
    setEmail: (email: string) => {
        set({ email });
        saveToCache({ ...get(), email });
    },
    
    setBaseCurrency: (baseCurrency: Currency) => {
        set({ baseCurrency });
        saveToCache({ ...get(), baseCurrency });
    },
    
    setReinvestProfits: (reinvestProfits: boolean) => {
        set({ reinvestProfits });
        saveToCache({ ...get(), reinvestProfits });
    },
    
    setMonthlyBudget: (monthlyBudget: number) => {
        set({ monthlyBudget });
        saveToCache({ ...get(), monthlyBudget });
    },
    
    setMaxRiskPerTrade: (maxRiskPerTrade: number, maxRiskType?: 'PERCENT' | 'FIXED') => {
        set(state => {
            const nextType = maxRiskType || state.maxRiskType;
            const updated = { maxRiskPerTrade, maxRiskType: nextType };
            saveToCache({ ...get(), ...updated });
            return updated;
        });
    },
    
    setSelectedPlan: (selectedPlan: SubscriptionPlan) => {
        set({ selectedPlan });
        saveToCache({ ...get(), selectedPlan });
    },
    
    setIsProfileModalOpen: (isProfileModalOpen: boolean) => {
        set({ isProfileModalOpen });
    },
    
    terminateOtherSessions: () => {
        set(state => ({
            activeSessions: state.activeSessions.filter(s => s.isCurrent)
        }));
    },
    
    updatePaymentMethod: (pm) => {
        set({ paymentMethod: pm });
        saveToCache({ ...get(), paymentMethod: pm });
    },
    
    formatMoney: (amount: number, includeSign = true) => {
        const { baseCurrency } = get();
        const isPos = amount >= 0;
        const sign = includeSign ? (isPos ? '+' : '-') : (isPos ? '' : '-');
        const absVal = Math.abs(amount).toLocaleString('it-IT', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        // Currency placement rule: symbols like $, £, ₿ can precede or follow; in institutional standard:
        // "+10.000,00 €" or "+$10,000.00"
        if (baseCurrency.code === 'USD' || baseCurrency.code === 'GBP') {
            return `${sign}${baseCurrency.symbol}${absVal}`;
        }
        return `${sign}${absVal} ${baseCurrency.symbol}`;
    }
}));

function saveToCache(state: any) {
    if (typeof window !== 'undefined') {
        try {
            const toPersist = {
                email: state.email,
                protocolName: state.protocolName,
                baseCurrency: state.baseCurrency,
                reinvestProfits: state.reinvestProfits,
                monthlyBudget: state.monthlyBudget,
                maxRiskPerTrade: state.maxRiskPerTrade,
                maxRiskType: state.maxRiskType,
                selectedPlan: state.selectedPlan,
                paymentMethod: state.paymentMethod
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
        } catch (e) {
            console.warn('Failed to save settings to localStorage:', e);
        }
    }
}
