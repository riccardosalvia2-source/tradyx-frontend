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

// ============================================================================
// GLOBAL MARKET WATCH HUB TYPES
// ============================================================================

export type MarketCategoryFilter = 'ALL' | 'TOP_10' | 'LAYER_1' | 'MACRO';

export type MarketAssetType = 'crypto' | 'macro_index' | 'commodity';

export interface WatchlistAsset {
    id: string;
    symbol: string;         // e.g. "BTC", "SOL", "SPX"
    name: string;           // e.g. "Bitcoin", "Solana", "S&P 500"
    type: MarketAssetType;  // 'crypto' | 'macro_index' | 'commodity'
    category: 'crypto_top' | 'crypto_l1' | 'macro_index' | 'commodity';
    current_price: number;
    price_change_percentage_24h: number;
    high_24h: number;
    low_24h: number;
    total_volume: number;
    market_cap: number;
    sparkline_7d: number[];
    image?: string;
    rank?: number;
    last_updated: string;
    description?: string;
}

export interface MarketWatchFetchResult {
    assets: WatchlistAsset[];
    isCached: boolean;
    isFallback: boolean;
    source: 'coingecko' | 'binance_fallback' | 'resilient_feed';
    lastUpdated: number;
}

