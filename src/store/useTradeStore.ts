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
