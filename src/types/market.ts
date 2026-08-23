// ============================================================================
// TRADYX TYPE DEFINITIONS - MARKET & MACRO DATA (src/types/market.ts)
// ============================================================================

export interface CryptoPrice {
    id: string;
    symbol: string;
    name: string;
    current_price: number;
    price_change_percentage_24h: number;
    high_24h?: number;
    low_24h?: number;
    last_updated: string;
    image?: string;
}

export type MacroImpact = 'HIGH' | 'MEDIUM' | 'LOW';

export interface EconomicEvent {
    id: string;
    title: string;
    country: string; // e.g. 'US', 'EU', 'GB', 'JP'
    flagEmoji?: string;
    date: string;    // ISO timestamp string
    impact: MacroImpact;
    actual?: string | null;
    forecast?: string | null;
    previous?: string | null;
}

export interface CryptoFetchResult {
    data: CryptoPrice[];
    isCached: boolean;
    isFallback: boolean;
    lastUpdated: number; // Timestamp in ms
}
