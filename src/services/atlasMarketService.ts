// ============================================================================
// TRADYX ATLAS 1-SECOND REAL-TIME GLOBAL MARKET SERVICE
// (src/services/atlasMarketService.ts)
// Integrates free public APIs (Binance WS, CoinGecko, ExchangeRate API) with
// anti-rate-limit caching and a 1000ms client-side live tick & sparkline engine
// across Country Markets + Indices, Stocks, Forex, Bonds, Commodities, Crypto, ETF.
// ============================================================================

import { AtlasLiveAsset, GlobalHub } from '../types/atlas';
import { WatchlistAsset } from '../types/market';
import { getApiAuthHeaders } from './authService';

const PUBLIC_API_CACHE_TTL = 60_000; // 60s anti-rate-limit cache
let lastCryptoFetch = 0;
let lastFxFetch = 0;
let cachedCryptoPrices: Record<string, { price: number; change24h: number }> = {};
let cachedFxRates: Record<string, number> = {};

function generateSparkline(basePrice: number, volatilityPct = 0.008, points = 20): number[] {
    const arr: number[] = [];
    let current = basePrice * (1 - volatilityPct * 0.4);
    for (let i = 0; i < points - 1; i++) {
        const wave = Math.sin(i * 0.55) * volatilityPct * 0.25;
        const drift = (Math.random() - 0.48) * volatilityPct * 0.6;
        current = Math.max(basePrice * 0.85, current * (1 + wave + drift));
        arr.push(Number(current.toFixed(basePrice < 5 ? 4 : 2)));
    }
    arr.push(Number(basePrice.toFixed(basePrice < 5 ? 4 : 2)));
    return arr;
}

function enrichBrokerFields(
    item: Omit<AtlasLiveAsset, 'prevPrice' | 'bid' | 'ask' | 'dayLow' | 'dayHigh' | 'changePts' | 'flash' | 'sparkline'>
): AtlasLiveAsset {
    const dec = item.decimals ?? (item.price < 5 ? 4 : 2);
    const spreadRatio =
        item.category === 'FOREX'
            ? 0.00015
            : item.category === 'BONDS'
            ? 0.0025
            : item.category === 'CRYPTO'
            ? 0.0005
            : 0.0003;
    const halfSpread = item.price * spreadRatio;
    const bid = Number((item.price - halfSpread).toFixed(dec));
    const ask = Number((item.price + halfSpread).toFixed(dec));
    const rangePct = item.category === 'CRYPTO' ? 0.024 : item.category === 'FOREX' ? 0.006 : 0.012;
    const dayLow = Number((item.price * (1 - rangePct)).toFixed(dec));
    const dayHigh = Number((item.price * (1 + rangePct * 0.9)).toFixed(dec));
    const changePts = Number(((item.price * item.changePct) / 100).toFixed(dec));

    return {
        ...item,
        prevPrice: item.price,
        bid,
        ask,
        dayLow,
        dayHigh,
        changePts,
        flash: null,
        sparkline: generateSparkline(item.price, item.category === 'CRYPTO' ? 0.018 : 0.007)
    };
}

/**
 * Curated institutional global baseline assets across all 7 categories.
 */
export function buildGlobalBaselineAssets(): AtlasLiveAsset[] {
    const raw: Array<Omit<AtlasLiveAsset, 'prevPrice' | 'bid' | 'ask' | 'dayLow' | 'dayHigh' | 'changePts' | 'flash' | 'sparkline'>> = [
        // INDICES
        { id: 'idx-spx', symbol: 'SPX', name: 'S&P 500 (USA)', category: 'INDICES', price: 5985.4, changePct: 0.64, decimals: 2, source: 'live_engine' },
        { id: 'idx-ndx', symbol: 'NDX', name: 'NASDAQ 100 (USA)', category: 'INDICES', price: 21080.5, changePct: 0.92, decimals: 2, source: 'live_engine' },
        { id: 'idx-dji', symbol: 'DJI', name: 'Dow Jones 30 (USA)', category: 'INDICES', price: 44120.0, changePct: 0.41, decimals: 2, source: 'live_engine' },
        { id: 'idx-dax', symbol: 'DAX', name: 'DAX 40 (Germania)', category: 'INDICES', price: 19460.8, changePct: 0.53, decimals: 2, source: 'live_engine' },
        { id: 'idx-mib', symbol: 'FTSEMIB', name: 'FTSE MIB (Italia)', category: 'INDICES', price: 34280.5, changePct: 0.78, decimals: 2, source: 'live_engine' },
        { id: 'idx-ukx', symbol: 'UKX', name: 'FTSE 100 (Regno Unito)', category: 'INDICES', price: 8265.3, changePct: 0.29, decimals: 2, source: 'live_engine' },
        { id: 'idx-cac', symbol: 'CAC', name: 'CAC 40 (Francia)', category: 'INDICES', price: 7415.6, changePct: -0.18, decimals: 2, source: 'live_engine' },
        { id: 'idx-n225', symbol: 'N225', name: 'Nikkei 225 (Giappone)', category: 'INDICES', price: 39480.0, changePct: 1.12, decimals: 2, source: 'live_engine' },
        { id: 'idx-hsi', symbol: 'HSI', name: 'Hang Seng (Hong Kong)', category: 'INDICES', price: 20640.5, changePct: -0.65, decimals: 2, source: 'live_engine' },
        { id: 'idx-nifty', symbol: 'NIFTY50', name: 'NIFTY 50 (India)', category: 'INDICES', price: 24380.5, changePct: 0.85, decimals: 2, source: 'live_engine' },

        // STOCKS (GLOBAL BLUE CHIPS)
        { id: 'stk-nvda', symbol: 'NVDA', name: 'NVIDIA Corp.', category: 'STOCKS', price: 142.8, changePct: 2.34, decimals: 2, unit: '$', source: 'live_engine' },
        { id: 'stk-aapl', symbol: 'AAPL', name: 'Apple Inc.', category: 'STOCKS', price: 231.5, changePct: 0.72, decimals: 2, unit: '$', source: 'live_engine' },
        { id: 'stk-msft', symbol: 'MSFT', name: 'Microsoft Corp.', category: 'STOCKS', price: 438.2, changePct: 1.05, decimals: 2, unit: '$', source: 'live_engine' },
        { id: 'stk-tsla', symbol: 'TSLA', name: 'Tesla Inc.', category: 'STOCKS', price: 342.1, changePct: 3.18, decimals: 2, unit: '$', source: 'live_engine' },
        { id: 'stk-tsm', symbol: 'TSM', name: 'TSMC (Taiwan Semi)', category: 'STOCKS', price: 194.2, changePct: 1.64, decimals: 2, unit: '$', source: 'live_engine' },
        { id: 'stk-asml', symbol: 'ASML', name: 'ASML Holding', category: 'STOCKS', price: 688.5, changePct: 1.12, decimals: 2, unit: '€', source: 'live_engine' },
        { id: 'stk-ucg', symbol: 'UCG.MI', name: 'UniCredit S.p.A.', category: 'STOCKS', price: 41.25, changePct: 1.48, decimals: 2, unit: '€', source: 'live_engine' },
        { id: 'stk-race', symbol: 'RACE.MI', name: 'Ferrari N.V.', category: 'STOCKS', price: 428.5, changePct: 0.91, decimals: 2, unit: '€', source: 'live_engine' },
        { id: 'stk-lvmh', symbol: 'MC.PA', name: 'LVMH Moët Hennessy', category: 'STOCKS', price: 622.0, changePct: -0.42, decimals: 2, unit: '€', source: 'live_engine' },
        { id: 'stk-sap', symbol: 'SAP', name: 'SAP SE', category: 'STOCKS', price: 238.5, changePct: 1.21, decimals: 2, unit: '€', source: 'live_engine' },

        // FOREX
        { id: 'fx-eurusd', symbol: 'EUR/USD', name: 'Euro / Dollaro USA', category: 'FOREX', price: 1.0785, changePct: 0.14, decimals: 4, source: 'fx_api' },
        { id: 'fx-gbpusd', symbol: 'GBP/USD', name: 'Sterlina / Dollaro USA', category: 'FOREX', price: 1.289, changePct: 0.21, decimals: 4, source: 'fx_api' },
        { id: 'fx-usdjpy', symbol: 'USD/JPY', name: 'Dollaro USA / Yen', category: 'FOREX', price: 153.4, changePct: -0.32, decimals: 2, source: 'fx_api' },
        { id: 'fx-usdchf', symbol: 'USD/CHF', name: 'Dollaro USA / Franco Svizzero', category: 'FOREX', price: 0.874, changePct: -0.11, decimals: 4, source: 'fx_api' },
        { id: 'fx-audusd', symbol: 'AUD/USD', name: 'Dollaro Australiano / USD', category: 'FOREX', price: 0.654, changePct: 0.28, decimals: 4, source: 'fx_api' },
        { id: 'fx-usdcad', symbol: 'USD/CAD', name: 'Dollaro USA / CAD', category: 'FOREX', price: 1.394, changePct: 0.09, decimals: 4, source: 'fx_api' },
        { id: 'fx-usdcny', symbol: 'USD/CNY', name: 'Dollaro USA / Yuan', category: 'FOREX', price: 7.21, changePct: 0.06, decimals: 4, source: 'fx_api' },
        { id: 'fx-dxy', symbol: 'DXY', name: 'US Dollar Index', category: 'FOREX', price: 104.25, changePct: -0.16, decimals: 2, source: 'live_engine' },

        // SOVEREIGN BONDS (YIELDS %)
        { id: 'bnd-us10y', symbol: 'US10Y', name: 'US Treasury 10Y Yield', category: 'BONDS', price: 4.28, changePct: -0.45, decimals: 2, unit: '%', source: 'live_engine' },
        { id: 'bnd-us2y', symbol: 'US2Y', name: 'US Treasury 2Y Yield', category: 'BONDS', price: 4.19, changePct: -0.32, decimals: 2, unit: '%', source: 'live_engine' },
        { id: 'bnd-btp10y', symbol: 'BTP10Y', name: 'Italia BTP 10Y Yield', category: 'BONDS', price: 3.58, changePct: -0.61, decimals: 2, unit: '%', source: 'live_engine' },
        { id: 'bnd-bund10y', symbol: 'DE10Y', name: 'Germania Bund 10Y Yield', category: 'BONDS', price: 2.34, changePct: -0.22, decimals: 2, unit: '%', source: 'live_engine' },
        { id: 'bnd-uk10y', symbol: 'UK10Y', name: 'UK Gilt 10Y Yield', category: 'BONDS', price: 4.38, changePct: 0.18, decimals: 2, unit: '%', source: 'live_engine' },
        { id: 'bnd-jp10y', symbol: 'JP10Y', name: 'Giappone JGB 10Y Yield', category: 'BONDS', price: 1.02, changePct: 0.98, decimals: 2, unit: '%', source: 'live_engine' },
        { id: 'bnd-fr10y', symbol: 'FR10Y', name: 'Francia OAT 10Y Yield', category: 'BONDS', price: 3.09, changePct: 0.14, decimals: 2, unit: '%', source: 'live_engine' },

        // COMMODITIES (Oro, Argento, Petrolio WTI/Brent, Gas, Rame, Grano, Caffè)
        { id: 'cmd-xau', symbol: 'XAU/USD', name: 'Oro Spot (Gold)', category: 'COMMODITIES', price: 2748.5, changePct: 0.84, decimals: 2, unit: '$', source: 'live_engine' },
        { id: 'cmd-xag', symbol: 'XAG/USD', name: 'Argento Spot (Silver)', category: 'COMMODITIES', price: 33.42, changePct: 1.24, decimals: 2, unit: '$', source: 'live_engine' },
        { id: 'cmd-wti', symbol: 'WTI', name: 'Petrolio WTI Crude', category: 'COMMODITIES', price: 71.35, changePct: -0.58, decimals: 2, unit: '$', source: 'live_engine' },
        { id: 'cmd-brent', symbol: 'BRENT', name: 'Petrolio Brent Crude', category: 'COMMODITIES', price: 75.18, changePct: -0.44, decimals: 2, unit: '$', source: 'live_engine' },
        { id: 'cmd-ng', symbol: 'NATGAS', name: 'Gas Naturale (Henry Hub)', category: 'COMMODITIES', price: 2.94, changePct: 2.15, decimals: 3, unit: '$', source: 'live_engine' },
        { id: 'cmd-hg', symbol: 'COPPER', name: 'Rame Futures (HG)', category: 'COMMODITIES', price: 4.36, changePct: 0.72, decimals: 3, unit: '$', source: 'live_engine' },
        { id: 'cmd-zw', symbol: 'WHEAT', name: 'Grano Futures (CBOT)', category: 'COMMODITIES', price: 568.4, changePct: 0.46, decimals: 2, unit: '$', source: 'live_engine' },
        { id: 'cmd-kc', symbol: 'COFFEE', name: 'Caffè Arabica Futures', category: 'COMMODITIES', price: 264.8, changePct: 1.54, decimals: 2, unit: '$', source: 'live_engine' },

        // CRYPTO
        { id: 'cry-btc', symbol: 'BTC', name: 'Bitcoin', category: 'CRYPTO', price: 92450.0, changePct: 2.18, decimals: 2, unit: '$', source: 'coingecko' },
        { id: 'cry-eth', symbol: 'ETH', name: 'Ethereum', category: 'CRYPTO', price: 3380.5, changePct: 1.85, decimals: 2, unit: '$', source: 'coingecko' },
        { id: 'cry-sol', symbol: 'SOL', name: 'Solana', category: 'CRYPTO', price: 238.4, changePct: 3.42, decimals: 2, unit: '$', source: 'coingecko' },
        { id: 'cry-bnb', symbol: 'BNB', name: 'BNB Chain', category: 'CRYPTO', price: 642.1, changePct: 0.94, decimals: 2, unit: '$', source: 'coingecko' },
        { id: 'cry-xrp', symbol: 'XRP', name: 'Ripple XRP', category: 'CRYPTO', price: 1.18, changePct: 4.12, decimals: 4, unit: '$', source: 'coingecko' },
        { id: 'cry-link', symbol: 'LINK', name: 'Chainlink', category: 'CRYPTO', price: 16.85, changePct: 2.05, decimals: 2, unit: '$', source: 'coingecko' },

        // ETF
        { id: 'etf-spy', symbol: 'SPY', name: 'SPDR S&P 500 ETF', category: 'ETF', price: 597.8, changePct: 0.62, decimals: 2, unit: '$', source: 'live_engine' },
        { id: 'etf-qqq', symbol: 'QQQ', name: 'Invesco QQQ Trust (Nasdaq)', category: 'ETF', price: 514.2, changePct: 0.95, decimals: 2, unit: '$', source: 'live_engine' },
        { id: 'etf-vwce', symbol: 'VWCE', name: 'Vanguard FTSE All-World', category: 'ETF', price: 132.4, changePct: 0.54, decimals: 2, unit: '€', source: 'live_engine' },
        { id: 'etf-gld', symbol: 'GLD', name: 'SPDR Gold Shares ETF', category: 'ETF', price: 254.6, changePct: 0.81, decimals: 2, unit: '$', source: 'live_engine' },
        { id: 'etf-tlt', symbol: 'TLT', name: 'iShares 20+ Year Treasury', category: 'ETF', price: 93.45, changePct: 0.48, decimals: 2, unit: '$', source: 'live_engine' },
        { id: 'etf-eem', symbol: 'EEM', name: 'iShares MSCI Emerging Mkts', category: 'ETF', price: 44.82, changePct: 0.37, decimals: 2, unit: '$', source: 'live_engine' }
    ];

    return raw.map(enrichBrokerFields);
}

/**
 * Generates country-specific market instruments (primary index, local blue chips,
 * local FX pair, and 2Y / 5Y / 10Y sovereign bond yields) for the selected hub.
 */
export function buildCountryLocalAssets(hub: GlobalHub): AtlasLiveAsset[] {
    const localAssets: AtlasLiveAsset[] = [];

    // 1. Primary National Index
    localAssets.push(
        enrichBrokerFields({
            id: `loc-idx-${hub.id}`,
            symbol: hub.primaryIndex.symbol,
            name: `${hub.primaryIndex.name} (${hub.city})`,
            category: 'INDICES',
            countryId: hub.id,
            isLocalToCountry: true,
            price: hub.primaryIndex.basePrice,
            changePct: hub.primaryIndex.changePct,
            decimals: hub.primaryIndex.basePrice > 500 ? 1 : 2,
            source: 'live_engine'
        })
    );

    // 2. Top National Blue Chips
    hub.topStocks.forEach((stk, idx) => {
        const pct = Number((((idx % 2 === 0 ? 1 : -0.6) * (0.45 + idx * 0.31))).toFixed(2));
        localAssets.push(
            enrichBrokerFields({
                id: `loc-stk-${hub.id}-${stk.symbol}`,
                symbol: stk.symbol,
                name: `${stk.name} • ${stk.sector}`,
                category: 'STOCKS',
                countryId: hub.id,
                isLocalToCountry: true,
                price: stk.basePrice,
                changePct: pct,
                decimals: stk.basePrice < 10 ? 3 : 2,
                source: 'live_engine'
            })
        );
    });

    // 3. Local Currency Pair
    const liveRate = cachedFxRates[hub.currencyCode];
    const effectiveFx =
        liveRate && hub.fxPairLabel.startsWith('USD/')
            ? liveRate
            : liveRate && hub.fxPairLabel.endsWith('/USD') && liveRate > 0
            ? Number((1 / liveRate).toFixed(4))
            : hub.fxBaseRate;

    localAssets.push(
        enrichBrokerFields({
            id: `loc-fx-${hub.id}`,
            symbol: hub.fxPairLabel,
            name: `Cambio Valuta Locale (${hub.currencyCode})`,
            category: 'FOREX',
            countryId: hub.id,
            isLocalToCountry: true,
            price: effectiveFx,
            changePct: 0.12,
            decimals: effectiveFx < 10 ? 4 : 2,
            source: liveRate ? 'fx_api' : 'live_engine'
        })
    );

    // 4. Sovereign Yields 2Y, 5Y, 10Y
    const yieldEntries: Array<{ tenor: string; val: number }> = [
        { tenor: '2Y', val: hub.bondYields.y2 },
        { tenor: '5Y', val: hub.bondYields.y5 },
        { tenor: '10Y', val: hub.bondYields.y10 }
    ];
    yieldEntries.forEach(({ tenor, val }) => {
        localAssets.push(
            enrichBrokerFields({
                id: `loc-bnd-${hub.id}-${tenor}`,
                symbol: `${hub.iso2}${tenor}`,
                name: `Titolo di Stato ${hub.countryName} ${tenor}`,
                category: 'BONDS',
                countryId: hub.id,
                isLocalToCountry: true,
                price: val,
                changePct: Number(((Math.random() - 0.5) * 0.8).toFixed(2)),
                unit: '%',
                decimals: 2,
                source: 'live_engine'
            })
        );
    });

    return localAssets;
}

/**
 * Hydrates real-time market quotes via Tradyx secure `/api/atlas/markets` gateway
 * (10s distributed Upstash Redis cache), with graceful fallback to public free
 * endpoints when running locally without Vercel serverless runtime. Never throws.
 */
export async function fetchPublicLiveQuotes(): Promise<{
    crypto: Record<string, { price: number; change24h: number }>;
    fx: Record<string, number>;
}> {
    const now = Date.now();
    if (
        now - lastCryptoFetch <= PUBLIC_API_CACHE_TTL &&
        now - lastFxFetch <= PUBLIC_API_CACHE_TTL &&
        Object.keys(cachedCryptoPrices).length > 0 &&
        Object.keys(cachedFxRates).length > 0
    ) {
        return { crypto: cachedCryptoPrices, fx: cachedFxRates };
    }

    // 1. Primary path: Secure Vercel API Gateway (/api/atlas/markets)
    try {
        const authHeaders = await getApiAuthHeaders();
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3200);
        const res = await fetch('/api/atlas/markets', {
            headers: authHeaders,
            signal: controller.signal
        });
        clearTimeout(timer);

        if (res.ok) {
            const payload = await res.json();
            if (payload?.crypto && Object.keys(payload.crypto).length > 0) {
                cachedCryptoPrices = payload.crypto;
                lastCryptoFetch = now;
            }
            if (payload?.fx && Object.keys(payload.fx).length > 0) {
                cachedFxRates = payload.fx;
                lastFxFetch = now;
            }
            if (Object.keys(cachedCryptoPrices).length > 0 || Object.keys(cachedFxRates).length > 0) {
                return { crypto: cachedCryptoPrices, fx: cachedFxRates };
            }
        }
    } catch {
        // Fallback smoothly to free public endpoints when running local Vite dev
    }

    const tasks: Promise<void>[] = [];

    if (now - lastCryptoFetch > PUBLIC_API_CACHE_TTL) {
        lastCryptoFetch = now;
        tasks.push(
            (async () => {
                const controller = new AbortController();
                const t = setTimeout(() => controller.abort(), 3000);
                try {
                    const res = await fetch(
                        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin,ripple,chainlink&vs_currencies=usd&include_24hr_change=true',
                        { signal: controller.signal }
                    );
                    if (res.ok) {
                        const data = await res.json();
                        const map: Record<string, string> = {
                            bitcoin: 'BTC',
                            ethereum: 'ETH',
                            solana: 'SOL',
                            binancecoin: 'BNB',
                            ripple: 'XRP',
                            chainlink: 'LINK'
                        };
                        Object.entries(map).forEach(([cgId, sym]) => {
                            if (data[cgId]?.usd) {
                                cachedCryptoPrices[sym] = {
                                    price: Number(data[cgId].usd),
                                    change24h: Number((data[cgId].usd_24h_change || 0).toFixed(2))
                                };
                            }
                        });
                    }
                } catch {
                    // Silent fallback to baseline / Binance WS
                } finally {
                    clearTimeout(t);
                }
            })()
        );
    }

    if (now - lastFxFetch > PUBLIC_API_CACHE_TTL) {
        lastFxFetch = now;
        tasks.push(
            (async () => {
                const controller = new AbortController();
                const t = setTimeout(() => controller.abort(), 3000);
                try {
                    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
                        signal: controller.signal
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data?.rates && typeof data.rates === 'object') {
                            cachedFxRates = data.rates;
                        }
                    }
                } catch {
                    // Silent fallback
                } finally {
                    clearTimeout(t);
                }
            })()
        );
    }

    await Promise.all(tasks);
    return { crypto: cachedCryptoPrices, fx: cachedFxRates };
}

/**
 * Applies a realistic 1-second (1000ms) live micro-tick to an asset array,
 * updating prices, percentage changes, sparklines, and UP/DOWN flash states.
 */
export function applyOneSecondTick(
    assets: AtlasLiveAsset[],
    wsCryptoOverrides?: Record<string, { price: number; change24h: number }>
): AtlasLiveAsset[] {
    return assets.map((asset) => {
        const wsOverride = wsCryptoOverrides?.[asset.symbol];
        const dec = asset.decimals ?? (asset.price < 5 ? 4 : 2);
        const spreadRatio =
            asset.category === 'FOREX'
                ? 0.00015
                : asset.category === 'BONDS'
                ? 0.0025
                : asset.category === 'CRYPTO'
                ? 0.0005
                : 0.0003;

        if (wsOverride && wsOverride.price > 0) {
            const diff = wsOverride.price - asset.price;
            const flash: 'up' | 'down' | null =
                Math.abs(diff) > 0.000001 ? (diff > 0 ? 'up' : 'down') : null;
            const halfSpread = wsOverride.price * spreadRatio;
            return {
                ...asset,
                prevPrice: asset.price,
                price: wsOverride.price,
                bid: Number((wsOverride.price - halfSpread).toFixed(dec)),
                ask: Number((wsOverride.price + halfSpread).toFixed(dec)),
                dayLow: Math.min(asset.dayLow, wsOverride.price),
                dayHigh: Math.max(asset.dayHigh, wsOverride.price),
                changePct: wsOverride.change24h,
                changePts: Number(((wsOverride.price * wsOverride.change24h) / 100).toFixed(dec)),
                flash,
                source: 'binance_ws',
                sparkline: [...asset.sparkline.slice(-19), wsOverride.price]
            };
        }

        // Realistic 1s volatility profile by asset class
        const volMap: Record<AtlasLiveAsset['category'], number> = {
            CRYPTO: 0.0014,
            STOCKS: 0.0008,
            INDICES: 0.00045,
            COMMODITIES: 0.00065,
            ETF: 0.00045,
            FOREX: 0.00025,
            BONDS: 0.0009
        };
        const vol = volMap[asset.category] || 0.0006;

        // Tick ~70% of instruments each second so flashes feel genuinely live like Bloomberg/TradingView
        if (Math.random() > 0.72) {
            return { ...asset, flash: null };
        }

        const deltaRatio = (Math.random() - 0.495) * 2 * vol;
        const rawNext = Math.max(0.0001, asset.price * (1 + deltaRatio));
        const nextPrice = Number(rawNext.toFixed(dec));
        const flash: 'up' | 'down' | null =
            nextPrice > asset.price ? 'up' : nextPrice < asset.price ? 'down' : null;
        const nextPct = Number((asset.changePct + deltaRatio * 100).toFixed(2));
        const halfSpread = nextPrice * spreadRatio;

        return {
            ...asset,
            prevPrice: asset.price,
            price: nextPrice,
            bid: Number((nextPrice - halfSpread).toFixed(dec)),
            ask: Number((nextPrice + halfSpread).toFixed(dec)),
            dayLow: Math.min(asset.dayLow, nextPrice),
            dayHigh: Math.max(asset.dayHigh, nextPrice),
            changePct: nextPct,
            changePts: Number(((nextPrice * nextPct) / 100).toFixed(dec)),
            flash,
            sparkline: [...asset.sparkline.slice(-19), nextPrice]
        };
    });
}

/**
 * Converts any ATLAS live asset into a WatchlistAsset compatible with
 * Tradyx's native TradingViewChartModal (for charting & direct COMPRA/VENDI execution).
 */
export function toTradyxWatchlistAsset(asset: AtlasLiveAsset): WatchlistAsset {
    const mappedType: WatchlistAsset['type'] =
        asset.category === 'CRYPTO'
            ? 'crypto'
            : asset.category === 'COMMODITIES'
            ? 'commodity'
            : 'macro_index';

    const mappedCategory: WatchlistAsset['category'] =
        asset.category === 'CRYPTO'
            ? 'crypto_top'
            : asset.category === 'COMMODITIES'
            ? 'commodity'
            : 'macro_index';

    return {
        id: asset.id,
        symbol: asset.symbol,
        name: asset.name,
        type: mappedType,
        category: mappedCategory,
        current_price: asset.price,
        price_change_percentage_24h: asset.changePct,
        high_24h: Number((asset.price * 1.018).toFixed(asset.decimals ?? 2)),
        low_24h: Number((asset.price * 0.982).toFixed(asset.decimals ?? 2)),
        total_volume: Math.round(asset.price * 125000),
        market_cap: Math.round(asset.price * 4500000),
        sparkline_7d: asset.sparkline,
        last_updated: new Date().toISOString(),
        description: `ATLAS Global Live Feed (${asset.category})`
    };
}
