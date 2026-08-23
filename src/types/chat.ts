// ============================================================================
// TRADYX TYPE DEFINITIONS - AI COACH & CHAT (src/types/chat.ts)
// Author: Senior AI Engineer & Lead React Developer
// ============================================================================

export interface ChatMessage {
    id: string;
    sender: 'user' | 'assistant';
    content: string;
    timestamp: string;
    isStreaming?: boolean;
}

export interface UserTradingContext {
    recentEmotion?: string;
    recentPnL?: number;
    totalWinRate?: number;
    lastTradeNotes?: string;
    tradeCount?: number;
}
