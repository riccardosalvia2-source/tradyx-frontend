// ============================================================================
// TRADYX TYPE DEFINITIONS - AI COACH & STRUCTURED REASONING (src/types/chat.ts)
// ============================================================================

export interface CoachStructuredResponse {
    internal_reasoning: string[];
    diagnosis: string;
    cognitive_bias_detected: string;
    actionable_rule: string;
    risk_score: number; // 1..100
    modelUsed?: string;
}

export interface ChatMessage {
    id: string;
    sender: 'user' | 'assistant';
    content: string;
    timestamp: string;
    isStreaming?: boolean;
    structured?: CoachStructuredResponse;
}

export interface RecentTradeSnapshot {
    asset_pair: string;
    direction: 'LONG' | 'SHORT';
    pnl: number;
    position_size?: number;
    entry_price?: number;
    exit_price?: number;
    timestamp: string;
    minutesSincePreviousTrade: number | null;
    emotional_state?: string;
    errors?: string[];
    notes?: string;
}

export interface OnboardingTraderProfile {
    preferredMarket?: string;
    accountType?: 'PROP_FIRM' | 'PERSONAL';
    propFirmAccountSize?: number;
    propFirmMaxDailyLossPct?: number;
    primaryBiasDetected?: string;
    ulyssesStrictMode?: boolean;
    monthlyBudget?: number;
    maxRiskPerTrade?: number;
    maxRiskType?: 'PERCENT' | 'FIXED';
}

export interface UserTradingContext {
    recentEmotion?: string;
    recentPnL?: number;
    totalWinRate?: number;
    lastTradeNotes?: string;
    tradeCount?: number;
    cortisolClearingActive?: boolean;
    cortisolRemainingMinutes?: number;
    dispositionEffectDetected?: boolean;
    dispositionDetails?: string;
    delayDiscountingDetected?: boolean;
    delayDiscountingDetails?: string;
    // Deep Behavioral Telemetry Injected into Gemini Chain-of-Thought
    lossStreak?: number;
    avgPositionSize?: number;
    lastTradeSize?: number;
    sizeChangePctVsAvg?: number;
    dailyPnl?: number;
    dailyDrawdownPct?: number;
    dailyDrawdownLimitPct?: number;
    fastestReentryMinutesAfterLoss?: number | null;
    onboardingProfile?: OnboardingTraderProfile;
    recentTrades?: RecentTradeSnapshot[];
}
