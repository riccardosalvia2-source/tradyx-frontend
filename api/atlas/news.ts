// ============================================================================
// TRADYX API GATEWAY — ATLAS NEWS & SERVER-SIDE GEMINI AI IMPACT
// (api/atlas/news.ts)
// Aggregates real country news (Marketaux, NewsData, GNews) strictly server-side,
// filters out broken Google News links, runs batch impact analysis via
// @google/genai (gemini-2.5-flash), caches 15 min in Upstash Redis, and enforces
// 30 req/min anti-abuse rate limiting.
// ============================================================================

import { GoogleGenAI } from '@google/genai';
import { ApiRequest, ApiResponse, getQueryParam, handleCorsAndMethod } from '../_lib/http';
import { verifyAuth } from '../_lib/authGuard';
import { newsQuerySchema, sendValidationError } from '../_lib/validators';
import {
    AI_RATE_LIMIT,
    applyRateLimitOrReject,
    CACHE_TTL,
    withCache
} from '../_lib/cacheAndRateLimit';

type NewsSentiment = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

interface RawHeadline {
    title: string;
    source: string;
    url: string;
    publishedAt: string;
    provider: 'marketaux' | 'newsdata' | 'gnews';
}

export interface ServerNewsItem {
    id: string;
    title: string;
    source: string;
    publishedAt: string;
    url: string;
    category: string;
    isLiveFeed: boolean;
    aiImpact: {
        operationalImpact: string;
        sentiment: NewsSentiment;
        impactedTickers: string[];
    };
}

interface NewsGatewayPayload {
    iso2: string;
    items: ServerNewsItem[];
    providersUsed: string[];
    aiEnriched: boolean;
    cachedAt: string;
}

function isBlockedUrl(url: unknown): boolean {
    if (typeof url !== 'string') return true;
    const trimmed = url.trim();
    return !trimmed || trimmed.includes('news.google.com') || !/^https?:\/\//i.test(trimmed);
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 3500): Promise<any | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { Accept: 'application/json' }
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
}

async function fetchExternalHeadlines(
    iso2: string,
    countryName: string
): Promise<{ headlines: RawHeadline[]; providersUsed: string[] }> {
    const headlines: RawHeadline[] = [];
    const providersUsed: string[] = [];

    const marketauxKey = (process.env.MARKETAUX_API_KEY || '').trim();
    const newsDataKey = (process.env.NEWSDATA_API_KEY || '').trim();
    const gnewsKey = (process.env.GNEWS_API_KEY || '').trim();

    if (marketauxKey) {
        const url = `https://api.marketaux.com/v1/news/all?countries=${encodeURIComponent(
            iso2.toLowerCase()
        )}&filter_entities=true&limit=10&api_token=${encodeURIComponent(marketauxKey)}`;
        const json = await fetchJsonWithTimeout(url, 3800);
        if (Array.isArray(json?.data)) {
            for (const a of json.data) {
                if (!a?.title || isBlockedUrl(a?.url)) continue;
                headlines.push({
                    title: String(a.title).trim(),
                    source: String(a.source || 'Marketaux'),
                    url: String(a.url),
                    publishedAt: a.published_at
                        ? new Date(a.published_at).toISOString()
                        : new Date().toISOString(),
                    provider: 'marketaux'
                });
            }
            if (headlines.length > 0) providersUsed.push('marketaux');
        }
    }

    if (headlines.length < 6 && newsDataKey) {
        const url = `https://newsdata.io/api/1/news?apikey=${encodeURIComponent(
            newsDataKey
        )}&country=${encodeURIComponent(iso2.toLowerCase())}&category=business`;
        const json = await fetchJsonWithTimeout(url, 3800);
        if (Array.isArray(json?.results)) {
            let added = 0;
            for (const a of json.results.slice(0, 10)) {
                if (!a?.title || isBlockedUrl(a?.link)) continue;
                headlines.push({
                    title: String(a.title).trim(),
                    source: String(a.source_id || 'NewsData'),
                    url: String(a.link),
                    publishedAt: a.pubDate ? new Date(a.pubDate).toISOString() : new Date().toISOString(),
                    provider: 'newsdata'
                });
                added += 1;
            }
            if (added > 0) providersUsed.push('newsdata');
        }
    }

    if (headlines.length < 6 && gnewsKey) {
        const query = `${countryName} economy finance markets`;
        const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(
            query
        )}&topic=business&max=10&token=${encodeURIComponent(gnewsKey)}`;
        const json = await fetchJsonWithTimeout(url, 3800);
        if (Array.isArray(json?.articles)) {
            let added = 0;
            for (const a of json.articles) {
                if (!a?.title || isBlockedUrl(a?.url)) continue;
                headlines.push({
                    title: String(a.title).trim(),
                    source: String(a.source?.name || 'GNews'),
                    url: String(a.url),
                    publishedAt: a.publishedAt
                        ? new Date(a.publishedAt).toISOString()
                        : new Date().toISOString(),
                    provider: 'gnews'
                });
                added += 1;
            }
            if (added > 0) providersUsed.push('gnews');
        }
    }

    // Deduplicate by normalized title
    const seen = new Set<string>();
    const unique = headlines.filter((h) => {
        const key = h.title.toLowerCase().slice(0, 72);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    return { headlines: unique.slice(0, 12), providersUsed };
}

function deterministicImpactFallback(
    title: string,
    indexSymbol: string,
    fxPair: string,
    iso2: string
): ServerNewsItem['aiImpact'] {
    const lower = title.toLowerCase();
    const bnd = `${iso2}10Y`;
    if (/(rate|central bank|ecb|fed|boj|boe|tassi|inflazione|cpi|inflation|yield|bond)/.test(lower)) {
        const hawkish = /(hike|rise|hot|high|sticky|aumento|rialzo|sale|above)/.test(lower);
        return {
            operationalImpact: hawkish
                ? `Pressione rialzista sui rendimenti ${bnd} e supporto su ${fxPair}; possibili prese di profitto intraday su ${indexSymbol}.`
                : `Raffreddamento delle attese sui tassi: contesto favorevole per duration su ${bnd} e rotazione risk-on su ${indexSymbol}.`,
            sentiment: hawkish ? 'NEUTRAL' : 'BULLISH',
            impactedTickers: [bnd, fxPair, indexSymbol]
        };
    }
    if (/(recession|slump|cut|deficit|downgrade|tariff|sanction|crisis|calo|crisi|debito|selloff|drop)/.test(lower)) {
        return {
            operationalImpact: `Premio al rischio in ampliamento su ${iso2}: monitorare deflussi su ${indexSymbol} e volatilità su ${fxPair}.`,
            sentiment: 'BEARISH',
            impactedTickers: [indexSymbol, bnd, fxPair]
        };
    }
    if (/(earnings|profit|revenue|merger|acquisition|ipo|upgrade|rally|record|surge|utili|ai|chip)/.test(lower)) {
        return {
            operationalImpact: `Catalizzatore positivo sui flussi azionari locali con trazione istituzionale su ${indexSymbol}.`,
            sentiment: 'BULLISH',
            impactedTickers: [indexSymbol, fxPair, 'SPX']
        };
    }
    return {
        operationalImpact: `Riposizionamento tattico dei desk istituzionali su ${indexSymbol} e ${fxPair} in attesa di conferme di volume.`,
        sentiment: 'NEUTRAL',
        impactedTickers: [indexSymbol, fxPair, bnd]
    };
}

async function analyzeBatchWithGemini(
    headlines: RawHeadline[],
    countryName: string,
    indexSymbol: string,
    fxPair: string,
    iso2: string
): Promise<Map<number, ServerNewsItem['aiImpact']> | null> {
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey || headlines.length === 0) return null;

    try {
        const ai = new GoogleGenAI({ apiKey });
        const numbered = headlines.map((h, i) => `${i}: "${h.title}" (${h.source})`).join('\n');

        const prompt = `Sei un analista macro-quantitativo istituzionale. Analizza in batch queste notizie finanziarie relative a ${countryName} (${iso2}, indice principale ${indexSymbol}, cambio ${fxPair}).
Restituisci SOLO un array JSON valido (senza markdown né testo extra) con un oggetto per ogni notizia:
[{"index": 0, "sentiment": "BULLISH"|"BEARISH"|"NEUTRAL", "operationalImpact": "1 frase tecnica in italiano max 180 caratteri su impatto operativo/flussi senza consigli finanziari", "impactedTickers": ["TICKER1", "TICKER2", "TICKER3"]}]

NOTIZIE:
${numbered}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.2,
                responseMimeType: 'application/json'
            }
        });

        const text = response?.text?.trim();
        if (!text) return null;
        const cleanJson = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(cleanJson);
        if (!Array.isArray(parsed)) return null;

        const map = new Map<number, ServerNewsItem['aiImpact']>();
        for (const row of parsed) {
            const idx = Number(row?.index);
            if (!Number.isInteger(idx) || idx < 0 || idx >= headlines.length) continue;
            const sentiment: NewsSentiment =
                row?.sentiment === 'BULLISH' || row?.sentiment === 'BEARISH'
                    ? row.sentiment
                    : 'NEUTRAL';
            const impact =
                typeof row?.operationalImpact === 'string' && row.operationalImpact.trim().length > 10
                    ? row.operationalImpact.trim().slice(0, 240)
                    : deterministicImpactFallback(headlines[idx].title, indexSymbol, fxPair, iso2)
                          .operationalImpact;
            const tickers = Array.isArray(row?.impactedTickers)
                ? row.impactedTickers
                      .filter((t: unknown): t is string => typeof t === 'string' && t.trim().length > 0)
                      .map((t: string) => t.trim().toUpperCase().slice(0, 14))
                      .slice(0, 4)
                : [indexSymbol, fxPair, `${iso2}10Y`];

            map.set(idx, {
                operationalImpact: impact,
                sentiment,
                impactedTickers: tickers.length > 0 ? tickers : [indexSymbol, fxPair]
            });
        }
        return map.size > 0 ? map : null;
    } catch {
        return null;
    }
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
    if (!handleCorsAndMethod(req, res, ['GET'])) return;

    const auth = await verifyAuth(req, res, { requireAuth: false });

    // Anti-abuse rate limit: 30 req/min per user or IP
    const allowed = await applyRateLimitOrReject(
        req,
        res,
        'atlas_news',
        auth?.userId,
        AI_RATE_LIMIT.MAX_REQUESTS,
        AI_RATE_LIMIT.WINDOW_SECONDS
    );
    if (!allowed) return;

    const parsed = newsQuerySchema.safeParse({
        iso2: getQueryParam(req, 'iso2'),
        country: getQueryParam(req, 'country'),
        city: getQueryParam(req, 'city'),
        indexSymbol: getQueryParam(req, 'indexSymbol'),
        fxPair: getQueryParam(req, 'fxPair'),
        centralBank: getQueryParam(req, 'centralBank')
    });

    if (!parsed.success) {
        sendValidationError(res, parsed.error);
        return;
    }

    const {
        iso2,
        country = iso2,
        indexSymbol = 'SPX',
        fxPair = 'EUR/USD'
    } = parsed.data;

    const cacheKey = `tradyx:atlas:news:v1:${iso2}`;

    const cached = await withCache<NewsGatewayPayload>(
        cacheKey,
        CACHE_TTL.NEWS_SECONDS, // 15 minutes
        async () => {
            const { headlines, providersUsed } = await fetchExternalHeadlines(iso2, country);
            const aiMap = await analyzeBatchWithGemini(
                headlines,
                country,
                indexSymbol,
                fxPair,
                iso2
            );

            const items: ServerNewsItem[] = headlines.map((h, idx) => ({
                id: `${h.provider}-${iso2}-${idx}`,
                title: h.title,
                source: h.source,
                publishedAt: h.publishedAt,
                url: h.url,
                category: 'LIVE NEWS',
                isLiveFeed: true,
                aiImpact:
                    aiMap?.get(idx) ||
                    deterministicImpactFallback(h.title, indexSymbol, fxPair, iso2)
            }));

            return {
                iso2,
                items,
                providersUsed: aiMap ? [...providersUsed, 'gemini-2.5-flash'] : providersUsed,
                aiEnriched: !!aiMap,
                cachedAt: new Date().toISOString()
            };
        }
    );

    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=300');
    res.setHeader('X-Tradyx-Cache', `${cached.hit ? 'HIT' : 'MISS'} (${cached.layer})`);
    res.status(200).json({
        ...cached.data,
        cacheHit: cached.hit,
        cacheLayer: cached.layer
    });
}
