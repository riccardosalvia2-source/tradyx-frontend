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

export interface Trade {
    id: string;
    user_id: string;
    asset_pair: string;
    direction: TradeDirection;
    entry_price: number;
    exit_price?: number | null;
    position_size: number;
    pnl?: number | null;
    emotional_state: EmotionalState;
    notes?: string | null;
    created_at: string;
}

export type NewTradeInput = Omit<Trade, 'id' | 'created_at'>;
