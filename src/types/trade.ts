// ============================================================================
// TRADYX TYPE DEFINITIONS - TRADE (src/types/trade.ts)
// ============================================================================

export type TradeDirection = 'LONG' | 'SHORT';

export type EmotionalState = 
    | 'Calm' 
    | 'Anxious' 
    | 'FOMO' 
    | 'Greedy' 
    | 'Frustrated' 
    | 'Disciplined';

export type TradePsychology = 'CONFIDENCE' | 'NEUTRAL' | 'FEAR';

export interface Trade {
    id: string;
    user_id: string;
    asset_pair: string;
    direction: TradeDirection;
    entry_price?: number | null;
    exit_price?: number | null;
    position_size?: number | null;
    pnl?: number | null;
    emotional_state?: EmotionalState;
    notes?: string | null;
    created_at: string;
    strategy?: string | null;
    risk_reward?: string | null;
    fees?: number | null;
    roi?: number | null;
    errors?: string[];
    psychology?: TradePsychology | null;
    reasoning?: string | null;
    voice_logged?: boolean;
    screenshot_url?: string | null;
}

export type NewTradeInput = Omit<Trade, 'id' | 'created_at'>;


