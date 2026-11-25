// ============================================================================
// TRADYX API GATEWAY — ATLAS LIVE MARKETS PROXY (api/atlas/markets.ts)
// Server-side authenticated proxy for Twelve Data, Finnhub, CoinGecko,
// Open ExchangeRate API, and Yahoo Finance with 10s distributed caching.
// ============================================================================

import { ApiRequest, ApiResponse, getQueryParam, handleCorsAndMethod } from '../_lib/http';
import { verifyAuth } from '../_lib/authGuard';
import { marketsQuerySchema, sendValidationError } from '../_lib/validators';
import { CACHE_TTL, withCache } from '../_lib/cacheAndRateLimit';

export interface NormalizedMarketQuote {
    symbol: string;
    price: number;
    changePct: number;
    source: 'twelvedata' | 'finnhub' | 'coingecko' | 'yahoo' | 'fx_api';
    updatedAt: string;
}

export interface MarketsGatewayResponse {
    crypto: Record<string, { price: number; change24h: number }>;
    fx: Record<string, number>;
    quotes: Record<string, NormalizedMarketQuote>;
    providersUsed: string[];
    cachedAt: string;
    cacheHit?: boolean;
    cacheLayer?: 'upstash_redis' | 'memory';
}

async function fetchWithTimeout(url: string, timeoutMs = 3500): Promise<Response | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                Accept: 'application/json',
                'User-Agent': 'Tradyx-API-Gateway/2.0'
            }
        });
        return res.ok ? res : null;
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
}

async function fetchCoinGeckoQuotes(): Promise<Record<string, { price: number; change24h: number }>> {
    const result: Record<string, { price: number; change24h: number }> = {};
    const res = await fetchWithTimeout(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin,ripple,chainlink&vs_currencies=usd&include_24hr_change=true',
        3200
    );
    if (!res) return result;

    try {
        const data = (await res.json()) as Record<string, { usd?: number; usd_24h_change?: number }>;
        const mapping: Record<string, string> = {
            bitcoin: 'BTC',
            ethereum: 'ETH',
            solana: 'SOL',
            binancecoin: 'BNB',
            ripple: 'XRP',
            chainlink: 'LINK'
        };
        for (const [cgId, sym] of Object.entries(mapping)) {
            const entry = data?.[cgId];
            if (entry && typeof entry.usd === 'number' && Number.isFinite(entry.usd)) {
                result[sym] = {
                    price: Number(entry.usd),
                    change24h: Number((entry.usd_24h_change ?? 0).toFixed(2))
                };
            }
        }
    } catch {
        // Ignore parse error
    }
    return result;
}

async function fetchExchangeRates(): Promise<Record<string, number>> {
    const res = await fetchWithTimeout('https://open.er-api.com/v6/latest/USD', 3200);
    if (!res) return {};
    try {
        const data = (await res.json()) as { rates?: Record<string, number> };
        if (data?.rates && typeof data.rates === 'object') {
            return data.rates;
        }
    } catch {
        // Ignore parse error
    }
    return {};
}

async function fetchTwelveDataQuotes(
    symbols: string[],
    apiKey: string
): Promise<Record<string, NormalizedMarketQuote>> {
    const quotes: Record<string, NormalizedMarketQuote> = {};
    if (!apiKey || symbols.length === 0) return quotes;

    const batch = symbols.slice(0, 8).join(',');
    const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(batch)}&apikey=${encodeURIComponent(apiKey)}`;
    const res = await fetchWithTimeout(url, 3800);
    if (!res) return quotes;

    try {
        const payload = (await res.json()) as Record<string, any>;
        const nowIso = new Date().toISOString();
        const entries =
            payload?.symbol && payload?.close
                ? [[String(payload.symbol), payload]]
                : Object.entries(payload || {});

        for (const [sym, raw] of entries) {
            const price = Number(raw?.close ?? raw?.price);
            const changePct = Number(raw?.percent_change ?? 0);
            if (Number.isFinite(price) && price > 0) {
                quotes[sym.toUpperCase()] = {
                    symbol: sym.toUpperCase(),
                    price,
                    changePct: Number.isFinite(changePct) ? Number(changePct.toFixed(2)) : 0,
                    source: 'twelvedata',
                    updatedAt: nowIso
                };
            }
        }
    } catch {
        // Ignore parse error
    }
    return quotes;
}

async function fetchFinnhubQuotes(
    symbols: string[],
    apiKey: string
): Promise<Record<string, NormalizedMarketQuote>> {
    const quotes: Record<string, NormalizedMarketQuote> = {};
    if (!apiKey || symbols.length === 0) return quotes;

    const nowIso = new Date().toISOString();
    const subset = symbols.slice(0, 6);
    await Promise.all(
        subset.map(async (sym) => {
            const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(sym)}&token=${encodeURIComponent(apiKey)}`;
            const res = await fetchWithTimeout(url, 2800);
            if (!res) return;
            try {
                const raw = (await res.json()) as { c?: number; dp?: number };
                if (typeof raw?.c === 'number' && raw.c > 0) {
                    quotes[sym.toUpperCase()] = {
                        symbol: sym.toUpperCase(),
                        price: raw.c,
                        changePct: typeof raw.dp === 'number' ? Number(raw.dp.toFixed(2)) : 0,
                        source: 'finnhub',
                        updatedAt: nowIso
                    };
                }
            } catch {
                // Ignore parse error
            }
        })
    );
    return quotes;
}

async function fetchYahooFallbackQuotes(
    symbols: string[]
): Promise<Record<string, NormalizedMarketQuote>> {
    const quotes: Record<string, NormalizedMarketQuote> = {};
    if (symbols.length === 0) return quotes;

    const nowIso = new Date().toISOString();
    const subset = symbols.slice(0, 4);
    await Promise.all(
        subset.map(async (sym) => {
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=2d`;
            const res = await fetchWithTimeout(url, 2600);
            if (!res) return;
            try {
                const json = (await res.json()) as any;
                const meta = json?.chart?.result?.[0]?.meta;
                const price = Number(meta?.regularMarketPrice);
                const prevClose = Number(meta?.chartPreviousClose || meta?.previousClose);
                if (Number.isFinite(price) && price > 0) {
                    const changePct =
                        Number.isFinite(prevClose) && prevClose > 0
                            ? Number((((price - prevClose) / prevClose) * 100).toFixed(2))
                            : 0;
                    quotes[sym.toUpperCase()] = {
                        symbol: sym.toUpperCase(),
                        price,
                        changePct,
                        source: 'yahoo',
                        updatedAt: nowIso
                    };
                }
            } catch {
                // Ignore parse error
            }
        })
    );
    return quotes;
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
    if (!handleCorsAndMethod(req, res, ['GET'])) return;

    // Optional auth identification (non-blocking for public market quotes, verifies JWT if provided)
    await verifyAuth(req, res, { requireAuth: false });

    const parsed = marketsQuerySchema.safeParse({
        iso2: getQueryParam(req, 'iso2'),
        symbols: getQueryParam(req, 'symbols'),
        category: getQueryParam(req, 'category')
    });

    if (!parsed.success) {
        sendValidationError(res, parsed.error);
        return;
    }

    const { iso2, symbols = [], category = 'ALL' } = parsed.data;
    const cacheKey = `tradyx:atlas:markets:v1:${iso2 || 'GLOBAL'}:${category}:${symbols.join(',') || 'CORE'}`;

    const cached = await withCache<MarketsGatewayResponse>(
        cacheKey,
        CACHE_TTL.MARKETS_SECONDS,
        async () => {
            const providersUsed: string[] = [];
            const twelveDataKey = (process.env.TWELVEDATA_API_KEY || '').trim();
            const finnhubKey = (process.env.FINNHUB_API_KEY || '').trim();

            const targetEquitySymbols =
                symbols.length > 0 ? symbols : ['SPY', 'QQQ', 'NVDA', 'AAPL', 'MSFT', 'TSLA'];

            const [crypto, fx] = await Promise.all([
                fetchCoinGeckoQuotes(),
                fetchExchangeRates()
            ]);

            if (Object.keys(crypto).length > 0) providersUsed.push('coingecko');
            if (Object.keys(fx).length > 0) providersUsed.push('open_er_api');

            let quotes: Record<string, NormalizedMarketQuote> = {};

            if (twelveDataKey) {
                const tdQuotes = await fetchTwelveDataQuotes(targetEquitySymbols, twelveDataKey);
                quotes = { ...quotes, ...tdQuotes };
                if (Object.keys(tdQuotes).length > 0) providersUsed.push('twelvedata');
            }

            const missingAfterTd = targetEquitySymbols.filter((s) => !quotes[s]);
            if (finnhubKey && missingAfterTd.length > 0) {
                const fhQuotes = await fetchFinnhubQuotes(missingAfterTd, finnhubKey);
                quotes = { ...quotes, ...fhQuotes };
                if (Object.keys(fhQuotes).length > 0) providersUsed.push('finnhub');
            }

            const missingAfterFh = targetEquitySymbols.filter((s) => !quotes[s]);
            if (missingAfterFh.length > 0 && symbols.length > 0) {
                const yhQuotes = await fetchYahooFallbackQuotes(missingAfterFh);
                quotes = { ...quotes, ...yhQuotes };
                if (Object.keys(yhQuotes).length > 0) providersUsed.push('yahoo');
            }

            return {
                crypto,
                fx,
                quotes,
                providersUsed,
                cachedAt: new Date().toISOString()
            };
        }
    );

    res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=20');
    res.setHeader('X-Tradyx-Cache', `${cached.hit ? 'HIT' : 'MISS'} (${cached.layer})`);
    res.status(200).json({
        ...cached.data,
        cacheHit: cached.hit,
        cacheLayer: cached.layer
    });
}
