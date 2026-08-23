// ============================================================================
// TRADYX CRYPTO PRICE SERVICE (src/services/cryptoService.ts)
// Author: Senior Front-End Developer & API Integration Expert
// Description: CoinGecko API v3 Integration with 60-Second LocalStorage Cache
//              and Resilient Offline Fallback Data Handling.
// ============================================================================

import { CryptoPrice, CryptoFetchResult } from '../types/market';

const COINGECKO_ENDPOINT = 
    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana&price_change_percentage=24h';

const CACHE_KEY = 'tradyx_crypto_cache_v1';
const CACHE_TTL_MS = 60 * 1000; // 60 Seconds TTL

/**
 * Emergency Fallback Mock Data used when CoinGecko Rate Limits (429) or CORS block network calls.
 */
export const EMERGENCY_MOCK_CRYPTO: CryptoPrice[] = [
    {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        current_price: 96450.00,
        price_change_percentage_24h: 3.45,
        high_24h: 97800.00,
        low_24h: 94200.00,
        last_updated: new Date().toISOString(),
        image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'
    },
    {
        id: 'ethereum',
        symbol: 'eth',
        name: 'Ethereum',
        current_price: 3420.50,
        price_change_percentage_24h: 2.15,
        high_24h: 3500.00,
        low_24h: 3350.00,
        last_updated: new Date().toISOString(),
        image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png'
    },
    {
        id: 'solana',
        symbol: 'sol',
        name: 'Solana',
        current_price: 198.75,
        price_change_percentage_24h: -1.20,
        high_24h: 205.00,
        low_24h: 192.50,
        last_updated: new Date().toISOString(),
        image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png'
    }
];

/**
 * Fetches live Crypto Prices from CoinGecko with 60-second LocalStorage cache lock.
 * Prevents HTTP 429 rate limit saturation and provides graceful offline fallback.
 * 
 * @param {boolean} [forceRefresh=false] Force bypass cache if true
 * @returns {Promise<CryptoFetchResult>} Market data result
 */
export async function fetchCryptoPrices(forceRefresh = false): Promise<CryptoFetchResult> {
    const now = Date.now();

    // 1. Check LocalStorage Cache
    try {
        const cachedRaw = localStorage.getItem(CACHE_KEY);
        if (cachedRaw) {
            const cached: CryptoFetchResult = JSON.parse(cachedRaw);
            const isCacheValid = (now - cached.lastUpdated) < CACHE_TTL_MS;

            if (!forceRefresh && isCacheValid) {
                return {
                    data: cached.data,
                    isCached: true,
                    isFallback: cached.isFallback || false,
                    lastUpdated: cached.lastUpdated
                };
            }
        }
    } catch (e) {
        console.warn('LocalStorage read warning:', e);
    }

    // 2. Fetch Live Market Data from CoinGecko API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s network timeout

    try {
        const response = await fetch(COINGECKO_ENDPOINT, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`CoinGecko API returned status ${response.status}`);
        }

        const rawData = await response.json();
        if (!Array.isArray(rawData) || rawData.length === 0) {
            throw new Error('CoinGecko returned invalid data payload');
        }

        const formattedData: CryptoPrice[] = rawData.map((coin: any) => ({
            id: String(coin.id),
            symbol: String(coin.symbol).toLowerCase(),
            name: String(coin.name),
            current_price: Number(coin.current_price || 0),
            price_change_percentage_24h: Number(coin.price_change_percentage_24h || 0),
            high_24h: coin.high_24h ? Number(coin.high_24h) : undefined,
            low_24h: coin.low_24h ? Number(coin.low_24h) : undefined,
            last_updated: coin.last_updated || new Date().toISOString(),
            image: coin.image ? String(coin.image) : undefined
        }));

        const result: CryptoFetchResult = {
            data: formattedData,
            isCached: false,
            isFallback: false,
            lastUpdated: now
        };

        // Cache successful response
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(result));
        } catch (e) {
            console.warn('LocalStorage write warning:', e);
        }

        return result;

    } catch (err: any) {
        clearTimeout(timeoutId);
        console.warn('CoinGecko fetch fallback notice:', err.message);

        // Try using stale cache if available
        try {
            const staleRaw = localStorage.getItem(CACHE_KEY);
            if (staleRaw) {
                const stale: CryptoFetchResult = JSON.parse(staleRaw);
                return {
                    data: stale.data,
                    isCached: true,
                    isFallback: true,
                    lastUpdated: stale.lastUpdated
                };
            }
        } catch (e) {
            // Ignore
        }

        // Fallback to Emergency Mock Data
        return {
            data: EMERGENCY_MOCK_CRYPTO,
            isCached: false,
            isFallback: true,
            lastUpdated: now
        };
    }
}
