// ============================================================================
// TRADYX GLOBAL MARKET WATCH HUB SERVICE (src/services/marketWatchService.ts)
// Zero-Cost Free Public APIs Aggregator (CoinGecko v3 + Binance Public 24hr Fallback + Macro Feeds)
// Features: 90-second SessionStorage Cache, Resilient Multi-Tier Failover, 7d Wave Sparklines
// ============================================================================

import { WatchlistAsset, MarketWatchFetchResult } from '../types/market';

const CACHE_KEY = 'tradyx_market_watch_v2';
const CACHE_TTL_MS = 90 * 1000; // 90 seconds cache

const COINGECKO_URL =
    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h';

const BINANCE_24HR_URL = 'https://api.binance.com/api/v3/ticker/24hr';

// Recognized Layer 1 Symbols
const LAYER_1_SYMBOLS = new Set([
    'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'AVAX', 'SUI', 'NEAR',
    'DOT', 'TON', 'TRX', 'ATOM', 'APT', 'ALGO', 'FTM', 'ICP', 'SEI',
    'KAS', 'HBAR', 'INJ'
]);

// Benchmark Curated Macro Assets
export const BENCHMARK_MACRO_ASSETS: WatchlistAsset[] = [
    {
        id: 'sp500',
        symbol: 'SPX',
        name: 'S&P 500 Index',
        type: 'macro_index',
        category: 'macro_index',
        current_price: 5864.67,
        price_change_percentage_24h: 0.42,
        high_24h: 5882.10,
        low_24h: 5840.35,
        total_volume: 3850000000,
        market_cap: 45200000000000,
        sparkline_7d: [5810, 5822, 5805, 5835, 5848, 5840, 5855, 5864.67],
        last_updated: new Date().toISOString(),
        description: 'Standard & Poor\'s 500 Benchmark index of top US public companies.'
    },
    {
        id: 'nasdaq100',
        symbol: 'NDX',
        name: 'Nasdaq 100',
        type: 'macro_index',
        category: 'macro_index',
        current_price: 20425.80,
        price_change_percentage_24h: 0.78,
        high_24h: 20510.40,
        low_24h: 20315.20,
        total_volume: 5210000000,
        market_cap: 22800000000000,
        sparkline_7d: [20150, 20210, 20180, 20290, 20340, 20380, 20425.8],
        last_updated: new Date().toISOString(),
        description: 'Tech-heavy benchmark measuring 100 largest non-financial Nasdaq leaders.'
    },
    {
        id: 'dxy',
        symbol: 'DXY',
        name: 'US Dollar Index',
        type: 'macro_index',
        category: 'macro_index',
        current_price: 104.18,
        price_change_percentage_24h: -0.15,
        high_24h: 104.42,
        low_24h: 104.05,
        total_volume: 1200000000,
        market_cap: 0,
        sparkline_7d: [104.65, 104.50, 104.55, 104.32, 104.28, 104.18],
        last_updated: new Date().toISOString(),
        description: 'Value of the United States dollar relative to a basket of foreign currencies.'
    },
    {
        id: 'gold',
        symbol: 'XAU',
        name: 'Gold Spot ($/oz)',
        type: 'commodity',
        category: 'commodity',
        current_price: 2748.50,
        price_change_percentage_24h: 0.85,
        high_24h: 2758.20,
        low_24h: 2724.80,
        total_volume: 24500000000,
        market_cap: 18400000000000,
        sparkline_7d: [2712, 2720, 2715, 2732, 2738, 2742, 2748.5],
        last_updated: new Date().toISOString(),
        description: 'Primary global safe-haven commodity and institutional monetary store of value.'
    },
    {
        id: 'crude-oil',
        symbol: 'WTI',
        name: 'Crude Oil WTI ($/bbl)',
        type: 'commodity',
        category: 'commodity',
        current_price: 71.35,
        price_change_percentage_24h: -1.45,
        high_24h: 72.80,
        low_24h: 70.65,
        total_volume: 18900000000,
        market_cap: 2100000000000,
        sparkline_7d: [73.20, 72.85, 73.10, 72.40, 71.90, 71.60, 71.35],
        last_updated: new Date().toISOString(),
        description: 'West Texas Intermediate crude oil global macroeconomic energy benchmark.'
    },
    {
        id: 'us10y',
        symbol: 'US10Y',
        name: 'US 10Y Yield (%)',
        type: 'macro_index',
        category: 'macro_index',
        current_price: 4.24,
        price_change_percentage_24h: 0.28,
        high_24h: 4.28,
        low_24h: 4.21,
        total_volume: 0,
        market_cap: 0,
        sparkline_7d: [4.18, 4.20, 4.22, 4.21, 4.25, 4.23, 4.24],
        last_updated: new Date().toISOString(),
        description: 'US 10-Year Treasury Bond Yield - critical global discount rate barometer.'
    }
];

// Fallback Crypto Assets (High Fidelity Mock / Offline)
export const BENCHMARK_CRYPTO_ASSETS: WatchlistAsset[] = [
    {
        id: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        type: 'crypto',
        category: 'crypto_top',
        rank: 1,
        current_price: 67840.00,
        price_change_percentage_24h: 3.84,
        high_24h: 68650.00,
        low_24h: 65920.00,
        total_volume: 38400000000,
        market_cap: 1340000000000,
        sparkline_7d: [65200, 65800, 66100, 65900, 66700, 67200, 67840],
        image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
        last_updated: new Date().toISOString()
    },
    {
        id: 'ethereum',
        symbol: 'ETH',
        name: 'Ethereum',
        type: 'crypto',
        category: 'crypto_top',
        rank: 2,
        current_price: 2540.20,
        price_change_percentage_24h: 2.15,
        high_24h: 2595.00,
        low_24h: 2470.00,
        total_volume: 19800000000,
        market_cap: 305000000000,
        sparkline_7d: [2460, 2480, 2495, 2475, 2510, 2525, 2540.2],
        image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
        last_updated: new Date().toISOString()
    },
    {
        id: 'solana',
        symbol: 'SOL',
        name: 'Solana',
        type: 'crypto',
        category: 'crypto_top',
        rank: 3,
        current_price: 178.60,
        price_change_percentage_24h: 5.42,
        high_24h: 182.10,
        low_24h: 168.40,
        total_volume: 6800000000,
        market_cap: 84000000000,
        sparkline_7d: [162, 166, 169, 167, 173, 175, 178.6],
        image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
        last_updated: new Date().toISOString()
    },
    {
        id: 'binancecoin',
        symbol: 'BNB',
        name: 'BNB',
        type: 'crypto',
        category: 'crypto_top',
        rank: 4,
        current_price: 595.30,
        price_change_percentage_24h: 1.12,
        high_24h: 602.00,
        low_24h: 588.50,
        total_volume: 1200000000,
        market_cap: 87000000000,
        sparkline_7d: [585, 588, 590, 589, 592, 594, 595.3],
        image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
        last_updated: new Date().toISOString()
    },
    {
        id: 'ripple',
        symbol: 'XRP',
        name: 'XRP',
        type: 'crypto',
        category: 'crypto_top',
        rank: 5,
        current_price: 0.528,
        price_change_percentage_24h: -0.85,
        high_24h: 0.536,
        low_24h: 0.521,
        total_volume: 1100000000,
        market_cap: 30000000000,
        sparkline_7d: [0.54, 0.535, 0.538, 0.532, 0.530, 0.528],
        image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
        last_updated: new Date().toISOString()
    },
    {
        id: 'dogecoin',
        symbol: 'DOGE',
        name: 'Dogecoin',
        type: 'crypto',
        category: 'crypto_top',
        rank: 6,
        current_price: 0.165,
        price_change_percentage_24h: 8.92,
        high_24h: 0.174,
        low_24h: 0.149,
        total_volume: 2900000000,
        market_cap: 24000000000,
        sparkline_7d: [0.138, 0.142, 0.145, 0.152, 0.158, 0.165],
        image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
        last_updated: new Date().toISOString()
    },
    {
        id: 'cardano',
        symbol: 'ADA',
        name: 'Cardano',
        type: 'crypto',
        category: 'crypto_l1',
        rank: 7,
        current_price: 0.355,
        price_change_percentage_24h: 1.40,
        high_24h: 0.362,
        low_24h: 0.348,
        total_volume: 450000000,
        market_cap: 12500000000,
        sparkline_7d: [0.345, 0.348, 0.350, 0.352, 0.355],
        image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
        last_updated: new Date().toISOString()
    },
    {
        id: 'avalanche-2',
        symbol: 'AVAX',
        name: 'Avalanche',
        type: 'crypto',
        category: 'crypto_l1',
        rank: 8,
        current_price: 26.85,
        price_change_percentage_24h: 3.10,
        high_24h: 27.50,
        low_24h: 25.90,
        total_volume: 520000000,
        market_cap: 11000000000,
        sparkline_7d: [25.2, 25.6, 25.9, 26.2, 26.5, 26.85],
        image: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
        last_updated: new Date().toISOString()
    },
    {
        id: 'sui',
        symbol: 'SUI',
        name: 'Sui',
        type: 'crypto',
        category: 'crypto_l1',
        rank: 9,
        current_price: 2.15,
        price_change_percentage_24h: 6.80,
        high_24h: 2.24,
        low_24h: 1.98,
        total_volume: 890000000,
        market_cap: 6100000000,
        sparkline_7d: [1.88, 1.94, 1.99, 2.05, 2.15],
        image: 'https://assets.coingecko.com/coins/images/26375/large/sui-ocean-square.png',
        last_updated: new Date().toISOString()
    },
    {
        id: 'near',
        symbol: 'NEAR',
        name: 'NEAR Protocol',
        type: 'crypto',
        category: 'crypto_l1',
        rank: 10,
        current_price: 5.10,
        price_change_percentage_24h: 4.25,
        high_24h: 5.25,
        low_24h: 4.85,
        total_volume: 480000000,
        market_cap: 6200000000,
        sparkline_7d: [4.75, 4.85, 4.90, 5.02, 5.10],
        image: 'https://assets.coingecko.com/coins/images/10365/large/near.png',
        last_updated: new Date().toISOString()
    }
];

/**
 * Generate synthetic 7-day sparkline prices from 24h stats
 */
function generateSyntheticSparkline(lastPrice: number, changePercent: number): number[] {
    const pointsCount = 28;
    const startPrice = lastPrice / (1 + (changePercent / 100));
    const step = (lastPrice - startPrice) / pointsCount;
    const points: number[] = [];

    for (let i = 0; i <= pointsCount; i++) {
        const trend = startPrice + (step * i);
        // Small organic oscillation
        const jitter = (Math.sin(i * 0.9) + Math.cos(i * 1.4)) * (lastPrice * 0.007);
        points.push(Number((trend + jitter).toFixed(lastPrice < 1 ? 4 : 2)));
    }
    points[points.length - 1] = lastPrice;
    return points;
}

/**
 * Fetch Macro Quotes from Yahoo Finance public chart endpoint (with graceful fallback)
 */
async function fetchLiveMacroAssets(): Promise<WatchlistAsset[]> {
    try {
        const symbolsMap: { ticker: string; id: string; name: string; symbol: string; type: 'macro_index' | 'commodity' }[] = [
            { ticker: '%5EGSPC', id: 'sp500', name: 'S&P 500 Index', symbol: 'SPX', type: 'macro_index' },
            { ticker: '%5EIXIC', id: 'nasdaq100', name: 'Nasdaq 100', symbol: 'NDX', type: 'macro_index' },
            { ticker: 'DX-Y.NYB', id: 'dxy', name: 'US Dollar Index', symbol: 'DXY', type: 'macro_index' },
            { ticker: 'GC%3DF', id: 'gold', name: 'Gold Spot ($/oz)', symbol: 'XAU', type: 'commodity' },
            { ticker: 'CL%3DF', id: 'crude-oil', name: 'Crude Oil WTI ($/bbl)', symbol: 'WTI', type: 'commodity' }
        ];

        const requests = symbolsMap.map(async (item) => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 4000);
                const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${item.ticker}?interval=1d&range=5d`, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!res.ok) throw new Error(`Status ${res.status}`);
                const json = await res.json();
                const result = json?.chart?.result?.[0];
                const meta = result?.meta;
                const closePrices: number[] = result?.indicators?.quote?.[0]?.close?.filter((p: any) => typeof p === 'number') || [];

                if (!meta || typeof meta.regularMarketPrice !== 'number') {
                    throw new Error('Invalid meta');
                }

                const current_price = meta.regularMarketPrice;
                const changePct = meta.regularMarketChangePercent ?? 0;
                const high_24h = meta.regularMarketDayHigh ?? current_price * 1.008;
                const low_24h = meta.regularMarketDayLow ?? current_price * 0.992;
                const total_volume = meta.regularMarketVolume ?? 0;

                const sparkline = closePrices.length > 3 
                    ? closePrices 
                    : generateSyntheticSparkline(current_price, changePct);

                return {
                    id: item.id,
                    symbol: item.symbol,
                    name: item.name,
                    type: item.type,
                    category: item.type,
                    current_price,
                    price_change_percentage_24h: Number(changePct.toFixed(2)),
                    high_24h,
                    low_24h,
                    total_volume,
                    market_cap: 0,
                    sparkline_7d: sparkline,
                    last_updated: new Date().toISOString()
                } as WatchlistAsset;
            } catch {
                // Return matched benchmark asset on error
                return BENCHMARK_MACRO_ASSETS.find(m => m.id === item.id)!;
            }
        });

        const resolved = await Promise.all(requests);
        return resolved.filter(Boolean);
    } catch {
        return BENCHMARK_MACRO_ASSETS;
    }
}

/**
 * Fetch Binance Public 24hr Tickers (Instant Free Fallback)
 */
async function fetchBinanceFallback(): Promise<WatchlistAsset[]> {
    const liquidPairs = [
        { pair: 'BTCUSDT', symbol: 'BTC', name: 'Bitcoin', id: 'bitcoin', rank: 1 },
        { pair: 'ETHUSDT', symbol: 'ETH', name: 'Ethereum', id: 'ethereum', rank: 2 },
        { pair: 'SOLUSDT', symbol: 'SOL', name: 'Solana', id: 'solana', rank: 3 },
        { pair: 'BNBUSDT', symbol: 'BNB', name: 'BNB', id: 'binancecoin', rank: 4 },
        { pair: 'XRPUSDT', symbol: 'XRP', name: 'XRP', id: 'ripple', rank: 5 },
        { pair: 'DOGEUSDT', symbol: 'DOGE', name: 'Dogecoin', id: 'dogecoin', rank: 6 },
        { pair: 'ADAUSDT', symbol: 'ADA', name: 'Cardano', id: 'cardano', rank: 7 },
        { pair: 'AVAXUSDT', symbol: 'AVAX', name: 'Avalanche', id: 'avalanche-2', rank: 8 },
        { pair: 'SUIUSDT', symbol: 'SUI', name: 'Sui', id: 'sui', rank: 9 },
        { pair: 'NEARUSDT', symbol: 'NEAR', name: 'NEAR Protocol', id: 'near', rank: 10 }
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(BINANCE_24HR_URL, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`Binance returned ${res.status}`);
    const tickers: any[] = await res.json();

    const tickerMap = new Map<string, any>();
    tickers.forEach(t => tickerMap.set(t.symbol, t));

    const assets: WatchlistAsset[] = liquidPairs.map(item => {
        const t = tickerMap.get(item.pair);
        if (!t) {
            const bench = BENCHMARK_CRYPTO_ASSETS.find(b => b.symbol === item.symbol);
            return bench!;
        }

        const current_price = Number(t.lastPrice);
        const changePercent = Number(t.priceChangePercent);
        const high_24h = Number(t.highPrice);
        const low_24h = Number(t.lowPrice);
        const total_volume = Number(t.quoteVolume || t.volume);

        const sparkline = generateSyntheticSparkline(current_price, changePercent);

        return {
            id: item.id,
            symbol: item.symbol,
            name: item.name,
            type: 'crypto',
            category: (LAYER_1_SYMBOLS.has(item.symbol) && item.rank > 6) ? 'crypto_l1' : 'crypto_top',
            rank: item.rank,
            current_price,
            price_change_percentage_24h: changePercent,
            high_24h,
            low_24h,
            total_volume,
            market_cap: total_volume * 18, // Estimated liquid cap proxy
            sparkline_7d: sparkline,
            last_updated: new Date().toISOString()
        };
    });

    return assets;
}

/**
 * Primary Fetcher: CoinGecko Free Public API v3 with 50 coins and 7d sparkline
 */
async function fetchCoinGeckoPrimary(): Promise<WatchlistAsset[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);

    const res = await fetch(COINGECKO_URL, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeout);

    if (!res.ok) {
        throw new Error(`CoinGecko status: ${res.status}`);
    }

    const data: any[] = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error('CoinGecko returned empty array');
    }

    const assets: WatchlistAsset[] = data.map((coin, idx) => {
        const symbol = String(coin.symbol || '').toUpperCase();
        const rawSparkline: number[] = coin.sparkline_in_7d?.price || [];

        // Sample every 4th point if ~168 points to keep SVG rendering featherlight
        const sampledSparkline = rawSparkline.length > 40
            ? rawSparkline.filter((_, i) => i % 4 === 0)
            : (rawSparkline.length > 0 ? rawSparkline : generateSyntheticSparkline(coin.current_price, coin.price_change_percentage_24h || 0));

        const isL1 = LAYER_1_SYMBOLS.has(symbol);

        return {
            id: String(coin.id),
            symbol,
            name: String(coin.name),
            type: 'crypto',
            category: (isL1 && idx >= 10) ? 'crypto_l1' : 'crypto_top',
            rank: coin.market_cap_rank ?? (idx + 1),
            current_price: Number(coin.current_price) || 0,
            price_change_percentage_24h: Number((coin.price_change_percentage_24h || 0).toFixed(2)),
            high_24h: Number(coin.high_24h || coin.current_price * 1.02),
            low_24h: Number(coin.low_24h || coin.current_price * 0.98),
            total_volume: Number(coin.total_volume) || 0,
            market_cap: Number(coin.market_cap) || 0,
            sparkline_7d: sampledSparkline,
            image: coin.image,
            last_updated: coin.last_updated || new Date().toISOString()
        };
    });

    return assets;
}

/**
 * Main Public Function: Fetch All Market Watch Assets with 90-second cache
 */
export async function fetchGlobalMarketWatch(forceRefresh = false): Promise<MarketWatchFetchResult> {
    const now = Date.now();

    // 1. Read SessionStorage Cache
    if (!forceRefresh && typeof window !== 'undefined') {
        try {
            const raw = sessionStorage.getItem(CACHE_KEY);
            if (raw) {
                const parsed: MarketWatchFetchResult = JSON.parse(raw);
                if (now - parsed.lastUpdated < CACHE_TTL_MS && parsed.assets && parsed.assets.length > 0) {
                    return {
                        ...parsed,
                        isCached: true
                    };
                }
            }
        } catch {
            // Ignore sessionStorage error
        }
    }

    let cryptoAssets: WatchlistAsset[] = [];
    let source: MarketWatchFetchResult['source'] = 'coingecko';
    let isFallback = false;

    // 2. Try CoinGecko Primary
    try {
        cryptoAssets = await fetchCoinGeckoPrimary();
    } catch (errCG) {
        console.warn('[MarketWatch] CoinGecko primary failed, attempting Binance fallback...', errCG);
        try {
            cryptoAssets = await fetchBinanceFallback();
            source = 'binance_fallback';
            isFallback = true;
        } catch (errBN) {
            console.warn('[MarketWatch] Binance fallback failed, using benchmark assets.', errBN);
            cryptoAssets = BENCHMARK_CRYPTO_ASSETS;
            source = 'resilient_feed';
            isFallback = true;
        }
    }

    // 3. Fetch Macro Indices & Commodities in parallel
    let macroAssets: WatchlistAsset[] = [];
    try {
        macroAssets = await fetchLiveMacroAssets();
    } catch {
        macroAssets = BENCHMARK_MACRO_ASSETS;
    }

    // Combine: Macro assets at top or organized in sections, followed by top cryptos
    const combinedAssets: WatchlistAsset[] = [...macroAssets, ...cryptoAssets];

    const result: MarketWatchFetchResult = {
        assets: combinedAssets,
        isCached: false,
        isFallback,
        source,
        lastUpdated: now
    };

    // 4. Save to SessionStorage Cache
    if (typeof window !== 'undefined') {
        try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(result));
        } catch {
            // Ignore storage quota
        }
    }

    return result;
}

// ============================================================================
// FORMATTING UTILITIES & SVG GENERATION
// ============================================================================

export function formatPrice(val: number): string {
    if (val === undefined || val === null || isNaN(val)) return '$0.00';
    if (val >= 1000) {
        return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (val >= 1) {
        return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
    }
    return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 5 });
}

export function formatChangePercent(val: number): string {
    if (val === undefined || val === null || isNaN(val)) return '0.00%';
    const sign = val > 0 ? '+' : '';
    return `${sign}${val.toFixed(2)}%`;
}

export function formatCompactNumber(val: number): string {
    if (!val || isNaN(val)) return '$0';
    if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(1)}K`;
    return `$${val.toFixed(0)}`;
}

/**
 * Calculates a smooth SVG wave path and area for sparklines
 */
export function generateSvgSparkline(points: number[], width = 100, height = 34): {
    pathD: string;
    areaD: string;
    isPositive: boolean;
    min: number;
    max: number;
} {
    if (!points || points.length < 2) {
        return {
            pathD: `M 0 ${height / 2} L ${width} ${height / 2}`,
            areaD: `M 0 ${height / 2} L ${width} ${height / 2} L ${width} ${height} L 0 ${height} Z`,
            isPositive: true,
            min: 0,
            max: 0
        };
    }

    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const padding = 3;
    const usableHeight = height - padding * 2;

    const coords = points.map((p, i) => {
        const x = (i / (points.length - 1)) * width;
        const normalized = (p - min) / range;
        const y = height - padding - (normalized * usableHeight);
        return { x, y };
    });

    // Generate smooth SVG curve using cubic bezier control points
    let pathD = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;

    for (let i = 0; i < coords.length - 1; i++) {
        const current = coords[i];
        const next = coords[i + 1];
        const controlX = (current.x + next.x) / 2;
        pathD += ` C ${controlX.toFixed(1)} ${current.y.toFixed(1)}, ${controlX.toFixed(1)} ${next.y.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
    }

    const lastX = coords[coords.length - 1].x.toFixed(1);
    const areaD = `${pathD} L ${lastX} ${height} L 0 ${height} Z`;

    const isPositive = points[points.length - 1] >= points[0];

    return {
        pathD,
        areaD,
        isPositive,
        min,
        max
    };
}
