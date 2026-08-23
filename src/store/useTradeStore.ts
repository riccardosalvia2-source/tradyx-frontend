// ============================================================================
// TRADYX GLOBAL TRADE STORE & QUASAR BUBBLE REACTIVITY (src/store/useTradeStore.ts)
// Author: Senior React/TypeScript Developer & WebGL Expert
// ============================================================================

import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';
import { Trade, NewTradeInput, EmotionalState } from '../types/trade';
import { BubbleConfig } from '../types/bubble';
import { addSystemLog } from '../services/authService';

// Initialize Supabase Client dynamically from environment variables
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'dummy_key';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface TradeState {
    trades: Trade[];
    isLoading: boolean;
    error: string | null;
    bubbleConfig: BubbleConfig;
    
    // Actions
    fetchTrades: (userId: string) => Promise<void>;
    addTrade: (tradeData: NewTradeInput) => Promise<void>;
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
        asset_pair: 'BTC/USDT',
        direction: 'LONG',
        entry_price: 64200,
        exit_price: 66800,
        position_size: 1.5,
        pnl: 3900,
        emotional_state: 'Disciplined',
        notes: 'Breakout confermato su grafico 4H con R:R 1:3 rispettato.',
        created_at: new Date(Date.now() - 86400000 * 1).toISOString()
    },
    {
        id: 'mock-tr-002',
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        asset_pair: 'ETH/USDT',
        direction: 'LONG',
        entry_price: 3450,
        exit_price: 3310,
        position_size: 2.0,
        pnl: -2800,
        emotional_state: 'FOMO',
        notes: 'Ingresso in ritardo in piena estensione senza attendere il pullback.',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
        id: 'mock-tr-003',
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        asset_pair: 'SOL/USDT',
        direction: 'SHORT',
        entry_price: 185,
        exit_price: 168,
        position_size: 25,
        pnl: 4250,
        emotional_state: 'Calm',
        notes: 'Divergenza ribassista RSI identificata sul livello di resistenza.',
        created_at: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
        id: 'mock-tr-004',
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        asset_pair: 'NVDA',
        direction: 'LONG',
        entry_price: 125,
        exit_price: 118,
        position_size: 50,
        pnl: -3500,
        emotional_state: 'Frustrated',
        notes: 'Revenge trade per recuperare lo stop precedente. Tagliare subito.',
        created_at: new Date(Date.now() - 86400000 * 5).toISOString()
    },
    {
        id: 'mock-tr-005',
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        asset_pair: 'BTC/USDT',
        direction: 'SHORT',
        entry_price: 68500,
        exit_price: 65200,
        position_size: 1.0,
        pnl: 3300,
        emotional_state: 'Disciplined',
        notes: 'Rejection su media mobile a 200 periodi. Esecuzione perfetta.',
        created_at: new Date(Date.now() - 86400000 * 7).toISOString()
    },
    {
        id: 'mock-tr-006',
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        asset_pair: 'EUR/USD',
        direction: 'LONG',
        entry_price: 1.085,
        exit_price: 1.081,
        position_size: 100000,
        pnl: -1600,
        emotional_state: 'Anxious',
        notes: 'Chiusura anticipata per ansia prima dei dati CPI USA.',
        created_at: new Date(Date.now() - 86400000 * 9).toISOString()
    },
    {
        id: 'mock-tr-007',
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        asset_pair: 'AAPL',
        direction: 'LONG',
        entry_price: 220,
        exit_price: 232,
        position_size: 30,
        pnl: 3600,
        emotional_state: 'Disciplined',
        notes: 'Pattern Cup and Handle completato con aumento volumi.',
        created_at: new Date(Date.now() - 86400000 * 12).toISOString()
    },
    {
        id: 'mock-tr-008',
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        asset_pair: 'ETH/USDT',
        direction: 'LONG',
        entry_price: 3100,
        exit_price: 2950,
        position_size: 3.0,
        pnl: -4500,
        emotional_state: 'Greedy',
        notes: 'Mancata presa di profitto al target sperando in un pump indefinito.',
        created_at: new Date(Date.now() - 86400000 * 15).toISOString()
    }
];

export const useTradeStore = create<TradeState>((set, get) => ({
    trades: DEFAULT_MOCK_TRADES,
    isLoading: false,
    error: null,
    bubbleConfig: computeBubbleConfig(DEFAULT_MOCK_TRADES),

    fetchTrades: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('trades')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const tradesData = (data || []) as Trade[];
            const activeTrades = tradesData.length > 0 ? tradesData : DEFAULT_MOCK_TRADES;
            set({ trades: activeTrades, isLoading: false });
            get().recalculateBubbleConfig();
        } catch (err: any) {
            console.warn('Fetch trades error (using local state fallback):', err.message);
            set({ trades: DEFAULT_MOCK_TRADES, isLoading: false });
            get().recalculateBubbleConfig();
        }
    },

    addTrade: async (tradeData: NewTradeInput) => {
        // Log System Audit Event
        addSystemLog(
            'TRADE_LOGGED',
            `Trade registrato: ${tradeData.symbol} ${tradeData.direction} (${tradeData.pnl >= 0 ? '+' : ''}$${tradeData.pnl})`,
            'trader.pro@tradyx.ai',
            { symbol: tradeData.symbol, pnl: tradeData.pnl, emotional_state: tradeData.emotional_state }
        );

        // 1. Optimistic UI Update: Create transient trade object
        const optimisticTrade: Trade = {
            ...tradeData,
            id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            created_at: new Date().toISOString()
        };

        const updatedTrades = [optimisticTrade, ...get().trades];
        set({ trades: updatedTrades });
        
        // Recalculate bubble immediately for instant visual feedback!
        get().recalculateBubbleConfig();

        // 2. Persist to Supabase in background
        try {
            const { data, error } = await supabase
                .from('trades')
                .insert([tradeData])
                .select()
                .single();

            if (error) throw error;

            // Replace optimistic trade with persisted database trade
            if (data) {
                const confirmedTrades = get().trades.map(t => t.id === optimisticTrade.id ? (data as Trade) : t);
                set({ trades: confirmedTrades });
                get().recalculateBubbleConfig();
            }
        } catch (err: any) {
            console.warn('Optimistic trade saved locally:', err.message);
            // Local state remains active so demo is 100% interactive!
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
