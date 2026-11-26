// ============================================================================
// TRADYX GLOBAL TRADE STORE & QUASAR BUBBLE REACTIVITY (src/store/useTradeStore.ts)
// Author: Senior React/TypeScript Developer & WebGL Expert
// ============================================================================

import { create } from 'zustand';
import { Trade, NewTradeInput, EmotionalState } from '../types/trade';
import { BubbleConfig } from '../types/bubble';
import {
    supabase,
    isSupabaseConfigured,
    isValidUuid,
    addSystemLog
} from '../services/authService';
import { isTiltDetected } from '../services/circuitBreakerService';
import { recordNeuralEvent } from '../services/tradyxNeuralContext';

export { supabase };

interface TradeState {
    trades: Trade[];
    deletedTrades: Trade[];
    isLoading: boolean;
    error: string | null;
    bubbleConfig: BubbleConfig;
    draftTradeAsset: string | null;
    
    // Actions
    setDraftTradeAsset: (asset: string | null) => void;
    fetchTrades: (userId: string) => Promise<void>;
    addTrade: (tradeData: NewTradeInput) => Promise<void>;
    deleteTrade: (tradeId: string) => Promise<void>;
    restoreTrade: (tradeId: string) => Promise<void>;
    emptyTrash: () => Promise<void>;
    permanentDeleteTrade: (tradeId: string) => Promise<void>;
    injectMockTrades: (newTrades: Trade[]) => Promise<void>;
    clearAllTrades: () => Promise<void>;
    subscribeToRealtimeTrades: (userId: string) => () => void;
    recalculateBubbleConfig: () => void;
}

// Initial Default Neutral Bubble Config
const DEFAULT_BUBBLE_CONFIG: BubbleConfig = {
    primaryColor: '#8A2BE2',
    secondaryColor: '#00FFFF',
    speed: 0.8,
    turbulence: 0.2,
    pulseRate: 1.0,
    glowIntensity: 1.0
};

/**
 * Calculates the dominant emotional state and total PnL from recent trades,
 * then maps them to the 3D Quasar Bubble transformation matrix.
 */
export function computeBubbleConfig(trades: Trade[]): BubbleConfig {
    if (!trades || !Array.isArray(trades) || trades.length === 0) {
        return DEFAULT_BUBBLE_CONFIG;
    }

    // Take recent 10 trades for responsive state reflection
    const recentTrades = Array.isArray(trades) ? trades.slice(0, 10) : [];

    // 1. Calculate Cumulative PnL
    const totalPnl = recentTrades.reduce((acc, t) => acc + (Number(t?.pnl) || 0), 0);

    // 2. Map Dominant Emotion Count
    const emotionCounts: Record<EmotionalState, number> = {
        Calm: 0,
        Disciplined: 0,
        Greedy: 0,
        Anxious: 0,
        FOMO: 0,
        Frustrated: 0
    };

    recentTrades.forEach(t => {
        if (t && t.emotional_state && emotionCounts[t.emotional_state] !== undefined) {
            emotionCounts[t.emotional_state]++;
        }
    });

    // Find dominant emotion
    let dominantEmotion: EmotionalState = 'Calm';
    let maxCount = -1;
    (Object.keys(emotionCounts) as EmotionalState[]).forEach(e => {
        if (emotionCounts[e] > maxCount) {
            maxCount = emotionCounts[e];
            dominantEmotion = e;
        }
    });

    // 3. Transformation Matrix Logic
    // Case 0: Tilt Detector Triggered (2 consecutive losses or FOMO/Revenge -> Pulsing Red Alarm #EF4444)
    const tiltCheck = isTiltDetected(recentTrades);
    if (tiltCheck.isTilt) {
        return {
            primaryColor: '#EF4444',
            secondaryColor: '#991B1B',
            speed: 3.2,
            turbulence: 0.95,
            pulseRate: 3.0,
            glowIntensity: 2.2
        };
    }

    const isProfitable = totalPnl >= 0;

    // Case A: Profit + Calm / Disciplined (Harmonic & Fluid Cyan/Blue)
    if (isProfitable && (dominantEmotion === 'Calm' || dominantEmotion === 'Disciplined')) {
        return {
            primaryColor: '#00F0FF',
            secondaryColor: '#0047FF',
            speed: 0.5,
            turbulence: 0.1,
            pulseRate: 0.8,
            glowIntensity: 1.2
        };
    }

    // Case B: Profit + Greedy (Energetic Gold & Neon Green)
    if (isProfitable && dominantEmotion === 'Greedy') {
        return {
            primaryColor: '#00FF88',
            secondaryColor: '#FFD700',
            speed: 1.2,
            turbulence: 0.4,
            pulseRate: 1.4,
            glowIntensity: 1.5
        };
    }

    // Case C: Loss or Negative Emotions (Anxious, FOMO, Frustrated -> Fire Red & Orange Chaos)
    if (!isProfitable || dominantEmotion === 'FOMO' || dominantEmotion === 'Anxious' || dominantEmotion === 'Frustrated') {
        return {
            primaryColor: '#FF0055',
            secondaryColor: '#FF5500',
            speed: 2.5,
            turbulence: 0.85,
            pulseRate: 2.2,
            glowIntensity: 1.8
        };
    }

    // Default Fallback
    return DEFAULT_BUBBLE_CONFIG;
}

export const DEFAULT_MOCK_TRADES: Trade[] = [
    {
        id: 'mock-tr-001',
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        asset_pair: 'BTC/USD',
        direction: 'LONG',
        strategy: 'Trend Following / Breakout',
        entry_price: 64250.00,
        exit_price: 67985.00,
        position_size: 1.0,
        pnl: 3735.00,
        roi: 24.9,
        risk_reward: '1:3.2',
        fees: 15.00,
        emotional_state: 'Disciplined',
        psychology: 'CONFIDENCE',
        errors: [],
        notes: 'Breakout confermato sopra la resistenza giornaliera con alto volume istituzionale.',
        reasoning: 'Clean institutional breakout above key daily resistance at $64.2k with expanding volume and tight ATR stop.',
        created_at: new Date(Date.now() - 86400000 * 1).toISOString()
    },
    {
        id: 'mock-tr-002',
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        asset_pair: 'ETH/USD',
        direction: 'SHORT',
        strategy: 'Mean Reversion',
        entry_price: 3480.00,
        exit_price: 3522.00,
        position_size: 10.0,
        pnl: -420.00,
        roi: -4.2,
        risk_reward: '1:2.0',
        fees: 8.00,
        emotional_state: 'Anxious',
        psychology: 'NEUTRAL',
        errors: ['FOMO'],
        notes: 'Tentativo di anticipare la divergenza su 1H prima della chiusura oraria.',
        reasoning: 'Attempted to fade upper Bollinger Band on 1H without waiting for candle close; stopped out on sudden wick.',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
        id: 'mock-tr-003',
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        asset_pair: 'SOL/USD',
        direction: 'LONG',
        strategy: 'Liquidity Sweep',
        entry_price: 142.50,
        exit_price: 155.30,
        position_size: 100.0,
        pnl: 1280.00,
        roi: 16.0,
        risk_reward: '1:3.5',
        fees: 12.00,
        emotional_state: 'Disciplined',
        psychology: 'CONFIDENCE',
        errors: [],
        notes: 'Sweep del minimo settimanale e violento assorbimento di liquidità.',
        reasoning: 'Reclaimed weekly point of control (PoC) after liquidity sweep of retail stop cluster.',
        created_at: new Date(Date.now() - 86400000 * 4).toISOString()
    },
    {
        id: 'mock-tr-004',
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        asset_pair: 'AAPL',
        direction: 'SHORT',
        strategy: 'Earnings Fade',
        entry_price: 228.00,
        exit_price: 224.20,
        position_size: 100.0,
        pnl: 380.00,
        roi: 3.8,
        risk_reward: '1:2.2',
        fees: 5.00,
        emotional_state: 'Disciplined',
        psychology: 'CONFIDENCE',
        errors: [],
        notes: 'Gap fill post-earnings in concomitanza con debolezza del settore tech.',
        reasoning: 'Pre-market gap rejection at $228 psychological round number followed by heavy dealer delta selling.',
        created_at: new Date(Date.now() - 86400000 * 6).toISOString()
    },
    {
        id: 'mock-tr-005',
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        asset_pair: 'TSLA',
        direction: 'SHORT',
        strategy: 'Break & Retest',
        entry_price: 245.00,
        exit_price: 250.50,
        position_size: 100.0,
        pnl: -550.00,
        roi: -5.5,
        risk_reward: '1:2.0',
        fees: 6.00,
        emotional_state: 'Frustrated',
        psychology: 'FEAR',
        errors: ['OVERTRADING', 'EARLY EXIT'],
        notes: 'Violazione del piano di trading e chiusura anticipata emotiva.',
        reasoning: 'Short entered into strong buyer order flow without confirmation; violated max daily risk threshold.',
        created_at: new Date(Date.now() - 86400000 * 8).toISOString()
    }
];

const ACTIVE_TRADES_STORAGE_KEY = 'tradyx_trades_cache_v2';

const loadInitialActiveTrades = (): Trade[] => {
    try {
        if (typeof window === 'undefined') return DEFAULT_MOCK_TRADES;
        const stored = localStorage.getItem(ACTIVE_TRADES_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch {
        // Fallback to baseline mock trades
    }
    return DEFAULT_MOCK_TRADES;
};

const saveActiveTrades = (trades: Trade[]) => {
    try {
        if (typeof window !== 'undefined') {
            localStorage.setItem(ACTIVE_TRADES_STORAGE_KEY, JSON.stringify(trades));
        }
    } catch {}
};

const loadInitialDeletedTrades = (): Trade[] => {
    try {
        if (typeof window === 'undefined') return [];
        const stored = localStorage.getItem('tradyx_deleted_trades');
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

const saveDeletedTrades = (trades: Trade[]) => {
    try {
        if (typeof window !== 'undefined') {
            localStorage.setItem('tradyx_deleted_trades', JSON.stringify(trades));
        }
    } catch {}
};

const initialTrades = loadInitialActiveTrades();

export const useTradeStore = create<TradeState>((set, get) => ({
    trades: initialTrades,
    deletedTrades: loadInitialDeletedTrades(),
    isLoading: false,
    error: null,
    bubbleConfig: computeBubbleConfig(initialTrades),
    draftTradeAsset: null,

    setDraftTradeAsset: (asset: string | null) => set({ draftTradeAsset: asset }),

    fetchTrades: async (userId: string) => {
        if (!isSupabaseConfigured() || !isValidUuid(userId)) {
            get().recalculateBubbleConfig();
            return;
        }

        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('trades')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const allCloudTrades = (data || []) as Trade[];
            const activeCloudTrades = allCloudTrades.filter((t) => !t.is_deleted);
            const deletedCloudTrades = allCloudTrades.filter((t) => t.is_deleted);

            const activeTrades =
                activeCloudTrades.length > 0 ? activeCloudTrades : get().trades;
            set({
                trades: activeTrades,
                deletedTrades: deletedCloudTrades.length > 0 ? deletedCloudTrades : get().deletedTrades,
                isLoading: false
            });
            saveActiveTrades(activeTrades);
            if (deletedCloudTrades.length > 0) {
                saveDeletedTrades(deletedCloudTrades);
            }
            get().recalculateBubbleConfig();
        } catch (err: any) {
            console.warn('Fetch trades error (using local-first cache fallback):', err.message);
            set({ isLoading: false });
            get().recalculateBubbleConfig();
        }
    },

    addTrade: async (tradeData: NewTradeInput) => {
        const assetLabel = (tradeData as any).symbol || tradeData.asset_pair || 'UNKNOWN';
        const pnlLabel = tradeData.pnl != null ? `${tradeData.pnl >= 0 ? '+' : ''}$${tradeData.pnl}` : 'Open';

        // Log System Audit Event + Neural Telemetry Event Bus
        addSystemLog(
            'TRADE_LOGGED',
            `Trade registrato: ${assetLabel} ${tradeData.direction} (${pnlLabel})`,
            'trader.pro@tradyx.ai',
            { symbol: assetLabel, pnl: tradeData.pnl, emotional_state: tradeData.emotional_state }
        );
        recordNeuralEvent(
            'TRADE_CREATED',
            `Registrato trade ${tradeData.direction} su ${assetLabel} (${pnlLabel}, stato: ${tradeData.emotional_state || 'N/D'})`,
            { symbol: assetLabel, direction: tradeData.direction, pnl: Number(tradeData.pnl) || 0 }
        );

        // 1. Optimistic UI Update (60fps instant local-first feedback)
        const optimisticTrade: Trade = {
            ...tradeData,
            id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            created_at: new Date().toISOString()
        };

        const updatedTrades = [optimisticTrade, ...get().trades];
        set({ trades: updatedTrades });
        saveActiveTrades(updatedTrades);
        get().recalculateBubbleConfig();

        // 2. Persist to Supabase PostgreSQL (protected by RLS) in background
        if (!isSupabaseConfigured()) return;
        try {
            const { data: userData } = await supabase.auth.getUser();
            const authUid = userData?.user?.id;
            if (!authUid || !isValidUuid(authUid)) return;

            const cloudPayload = {
                ...tradeData,
                user_id: authUid
            };

            const { data, error } = await supabase
                .from('trades')
                .insert([cloudPayload])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                const confirmedTrades = get().trades.map((t) =>
                    t.id === optimisticTrade.id ? (data as Trade) : t
                );
                set({ trades: confirmedTrades });
                saveActiveTrades(confirmedTrades);
                get().recalculateBubbleConfig();
            }
        } catch (err: any) {
            console.warn('Optimistic trade saved locally (cloud sync pending):', err.message);
        }
    },

    deleteTrade: async (tradeId: string) => {
        const tradeToDelete = get().trades.find(t => t.id === tradeId);
        if (!tradeToDelete) return;

        const deletedAt = new Date().toISOString();
        const updatedTrades = get().trades.filter(t => t.id !== tradeId);
        const softDeletedTrade: Trade = {
            ...tradeToDelete,
            is_deleted: true,
            deleted_at: deletedAt
        };
        const updatedDeletedTrades = [softDeletedTrade, ...get().deletedTrades];

        set({ trades: updatedTrades, deletedTrades: updatedDeletedTrades });
        saveActiveTrades(updatedTrades);
        saveDeletedTrades(updatedDeletedTrades);
        get().recalculateBubbleConfig();

        addSystemLog(
            'TRADE_LOGGED',
            `Trade spostato nel cestino: ${tradeToDelete.asset_pair} ${tradeToDelete.direction}`,
            'trader.pro@tradyx.ai',
            { action: 'TRADE_DELETED', id: tradeId, symbol: tradeToDelete.asset_pair }
        );
        recordNeuralEvent(
            'TRADE_DELETED',
            `Spostato nel cestino trade ${tradeToDelete.direction} su ${tradeToDelete.asset_pair}`,
            { symbol: tradeToDelete.asset_pair }
        );

        if (isSupabaseConfigured() && isValidUuid(tradeId)) {
            try {
                await supabase
                    .from('trades')
                    .update({ is_deleted: true, deleted_at: deletedAt })
                    .eq('id', tradeId);
            } catch (err: any) {
                console.warn('Cloud soft-delete notice:', err?.message);
            }
        }
    },

    restoreTrade: async (tradeId: string) => {
        const tradeToRestore = get().deletedTrades.find(t => t.id === tradeId);
        if (!tradeToRestore) return;

        const updatedDeleted = get().deletedTrades.filter(t => t.id !== tradeId);
        const restoredTrade: Trade = {
            ...tradeToRestore,
            is_deleted: false,
            deleted_at: undefined
        };
        const updatedTrades = [restoredTrade, ...get().trades];

        set({ trades: updatedTrades, deletedTrades: updatedDeleted });
        saveActiveTrades(updatedTrades);
        saveDeletedTrades(updatedDeleted);
        get().recalculateBubbleConfig();

        addSystemLog(
            'TRADE_LOGGED',
            `Trade ripristinato dal cestino: ${restoredTrade.asset_pair} ${restoredTrade.direction}`,
            'trader.pro@tradyx.ai',
            { action: 'TRADE_RESTORED', id: tradeId, symbol: restoredTrade.asset_pair }
        );

        if (isSupabaseConfigured() && isValidUuid(tradeId)) {
            try {
                await supabase
                    .from('trades')
                    .update({ is_deleted: false, deleted_at: null })
                    .eq('id', tradeId);
            } catch (err: any) {
                console.warn('Cloud restore notice:', err?.message);
            }
        }
    },

    emptyTrash: async () => {
        const toPurge = get().deletedTrades.filter((t) => isValidUuid(t.id)).map((t) => t.id);
        set({ deletedTrades: [] });
        saveDeletedTrades([]);
        addSystemLog(
            'TRADE_LOGGED',
            'Cestino svuotato definitivamente',
            'trader.pro@tradyx.ai',
            { action: 'TRASH_EMPTIED' }
        );

        if (isSupabaseConfigured() && toPurge.length > 0) {
            try {
                await supabase.from('trades').delete().in('id', toPurge);
            } catch (err: any) {
                console.warn('Cloud empty trash notice:', err?.message);
            }
        }
    },

    permanentDeleteTrade: async (tradeId: string) => {
        const updatedDeleted = get().deletedTrades.filter(t => t.id !== tradeId);
        set({ deletedTrades: updatedDeleted });
        saveDeletedTrades(updatedDeleted);
        addSystemLog(
            'TRADE_LOGGED',
            `Trade eliminato definitivamente dal cestino: ${tradeId}`,
            'trader.pro@tradyx.ai',
            { action: 'TRADE_PERMANENTLY_DELETED', id: tradeId }
        );

        if (isSupabaseConfigured() && isValidUuid(tradeId)) {
            try {
                await supabase.from('trades').delete().eq('id', tradeId);
            } catch (err: any) {
                console.warn('Cloud permanent delete notice:', err?.message);
            }
        }
    },

    injectMockTrades: async (newTrades: Trade[]) => {
        set({ trades: newTrades });
        saveActiveTrades(newTrades);
        get().recalculateBubbleConfig();

        if (!isSupabaseConfigured()) return;
        try {
            const { data: userData } = await supabase.auth.getUser();
            const authUid = userData?.user?.id;
            if (!authUid || !isValidUuid(authUid)) return;

            const rawTrades = newTrades.map(t => ({
                user_id: authUid,
                asset_pair: t.asset_pair,
                direction: t.direction,
                entry_price: t.entry_price,
                exit_price: t.exit_price,
                pnl: t.pnl,
                roi: t.roi,
                position_size: t.position_size,
                strategy: t.strategy,
                emotional_state: t.emotional_state,
                notes: t.notes,
                created_at: t.created_at
            }));
            await supabase.from('trades').insert(rawTrades);
        } catch (e) {
            console.warn('Supabase batch insert notice (persisted in local state):', e);
        }
    },

    clearAllTrades: async () => {
        set({ trades: [] });
        saveActiveTrades([]);
        get().recalculateBubbleConfig();

        if (!isSupabaseConfigured()) return;
        try {
            const { data: userData } = await supabase.auth.getUser();
            const authUid = userData?.user?.id;
            if (!authUid || !isValidUuid(authUid)) return;
            await supabase.from('trades').delete().eq('user_id', authUid);
        } catch (e) {
            console.warn('Supabase clear notice (persisted in local state):', e);
        }
    },

    subscribeToRealtimeTrades: (userId: string) => {
        const channel = supabase
            .channel(`realtime-trades-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'trades',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    const newTrade = payload.new as Trade;
                    const existing = get().trades.find(t => t.id === newTrade.id);
                    if (!existing) {
                        set({ trades: [newTrade, ...get().trades] });
                        get().recalculateBubbleConfig();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    },

    recalculateBubbleConfig: () => {
        const newConfig = computeBubbleConfig(get().trades);
        set({ bubbleConfig: newConfig });
    }
}));
