// ============================================================================
// TRADYX API GATEWAY — ATLAS CONTEXTUAL BATCH NEWS & CAUSAL AI REASONING
// (api/atlas/news.ts)
// Aggregates real country news (Marketaux, NewsData, GNews) strictly server-side,
// injects the country's live macroeconomic regime (policy rate, CPI, GDP, 10Y
// yield, currency, top tickers) into Gemini 2.5 Flash via reasoningEngine.ts,
// and caches 15 min in Upstash Redis with 30 req/min anti-abuse rate limiting.
// ============================================================================

import { ApiRequest, ApiResponse, getQueryParam, handleCorsAndMethod } from '../_lib/http';
import { verifyAuth } from '../_lib/authGuard';
import {
    atlasNewsBatchOutputSchema,
    newsQuerySchema,
    sendValidationError
} from '../_lib/validators';
import {
    AI_RATE_LIMIT,
    applyRateLimitOrReject,
    CACHE_TTL,
    withCache
} from '../_lib/cacheAndRateLimit';
import { runStructuredReasoning } from '../_lib/reasoningEngine';

type NewsSentiment = 'BULLISH' | 'BEARISH' | 'VOLATILITÀ' | 'NEUTRAL';
type NewsHorizon = 'Intraday' | 'Multi-day';

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
        transmissionMechanism: string;
        sentiment: NewsSentiment;
        horizon: NewsHorizon;
        impactedTickers: string[];
        internalReasoning: string[];
    };
}

interface CountryMacroContext {
    iso2: string;
    country: string;
    city: string;
    indexSymbol: string;
    fxPair: string;
    currencyCode: string;
    centralBank: string;
    policyRate?: number;
    inflationCpi?: number;
    gdpGrowth?: number;
    yield10y?: number;
    topStocks: string[];
}

interface NewsGatewayPayload {
    iso2: string;
    items: ServerNewsItem[];
    providersUsed: string[];
    aiEnriched: boolean;
    modelUsed?: string;
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

    const seen = new Set<string>();
    const unique = headlines.filter((h) => {
        const key = h.title.toLowerCase().slice(0, 72);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    return { headlines: unique.slice(0, 10), providersUsed };
}

function causalFallbackForHeadline(
    title: string,
    ctx: CountryMacroContext
): ServerNewsItem['aiImpact'] {
    const lower = title.toLowerCase();
    const bnd = `${ctx.iso2}10Y`;
    const leadStock = ctx.topStocks[0] || ctx.indexSymbol;
    const secondStock = ctx.topStocks[1] || 'XAU/USD';
    const rateTxt = ctx.policyRate != null ? `${ctx.policyRate.toFixed(2)}%` : 'livelli attuali';
    const cpiTxt = ctx.inflationCpi != null ? `${ctx.inflationCpi.toFixed(1)}%` : 'target';

    if (/(rate|central bank|ecb|fed|boj|boe|tassi|inflazione|cpi|inflation|yield|bond)/.test(lower)) {
        const hawkish = /(hike|rise|hot|high|sticky|aumento|rialzo|sale|above)/.test(lower);
        return {
            transmissionMechanism: hawkish
                ? `Tassi ${ctx.centralBank} (${rateTxt}) più restrittivi -> rialzo rendimenti ${bnd} -> aumento WACC e compressione multipli P/E`
                : `Inflazione (${cpiTxt}) in raffreddamento -> discesa rendimenti ${bnd} -> espansione multipli azionari e sollievo sul rifinanziamento`,
            operationalImpact: hawkish
                ? `Con ${ctx.centralBank} al ${rateTxt} e CPI al ${cpiTxt}, l'irrigidimento della curva ${bnd} sostiene ${ctx.fxPair} ma comprime i multipli su ${ctx.indexSymbol}.`
                : `Il calo delle pressioni sui prezzi rispetto al ${cpiTxt} riduce il premio a termine su ${bnd}, liberando flussi istituzionali su ${ctx.indexSymbol} e ${leadStock}.`,
            sentiment: hawkish ? 'VOLATILITÀ' : 'BULLISH',
            horizon: 'Multi-day',
            impactedTickers: [bnd, ctx.fxPair, ctx.indexSymbol, leadStock].slice(0, 4),
            internalReasoning: [
                `1. Notizia legata a politica monetaria/inflazione in ${ctx.country} (tasso ${ctx.centralBank} al ${rateTxt}, CPI ${cpiTxt}).`,
                `2. Canale di trasmissione diretto attraverso la curva sovrana ${bnd} e il costo del capitale domestico.`,
                `3. Sensibilità immediata su ${ctx.fxPair} e rotazione sui titoli ad alta duration di ${ctx.indexSymbol}.`
            ]
        };
    }

    if (/(recession|slump|cut|deficit|downgrade|tariff|sanction|crisis|calo|crisi|debito|selloff|drop)/.test(lower)) {
        return {
            transmissionMechanism: `Deterioramento premi al rischio/export -> allargamento spread ${bnd} -> deflussi esteri dall'equity domestico`,
            operationalImpact: `Lo shock su crescita/conti pubblici in ${ctx.country} alza il premio per il rischio su ${bnd} e induce de-risking su ${ctx.indexSymbol} e ${leadStock}.`,
            sentiment: 'BEARISH',
            horizon: 'Multi-day',
            impactedTickers: [ctx.indexSymbol, bnd, ctx.fxPair, leadStock].slice(0, 4),
            internalReasoning: [
                `1. Titolo segnala pressione macro o geopolitica diretta sull'economia di ${ctx.country}.`,
                `2. Impatto sul premio al rischio sovrano (${bnd}) e revisione al ribasso degli utili prospettici.`,
                `3. Pressione di vendita sui titoli ciclici di ${ctx.indexSymbol} e ricerca di copertura su ${ctx.fxPair}.`
            ]
        };
    }

    if (/(earnings|profit|revenue|merger|acquisition|ipo|upgrade|rally|record|surge|utili|ai|chip|bank)/.test(lower)) {
        return {
            transmissionMechanism: `Espansione margini/EPS o M&A -> revisione al rialzo stime analisti -> afflussi istituzionali su equity locale`,
            operationalImpact: `Catalizzatore diretto sugli utili del listino di ${ctx.city}: miglioramento dei flussi in ingresso su ${leadStock} e traino settoriale su ${ctx.indexSymbol}.`,
            sentiment: 'BULLISH',
            horizon: 'Intraday',
            impactedTickers: [leadStock, ctx.indexSymbol, secondStock].slice(0, 4),
            internalReasoning: [
                `1. Evento societario/settoriale con impatto diretto su ricavi, margini o multipli di valutazione.`,
                `2. Trasmissione immediata sui flussi di ordini del listino di ${ctx.city} (${ctx.indexSymbol}).`,
                `3. Effetto trascinamento su ${leadStock} e peer del comparto (${secondStock}).`
            ]
        };
    }

    return {
        transmissionMechanism: `Ricalibrazione liquidità cross-asset -> variazione volatilità implicita su ${ctx.indexSymbol} e cambio ${ctx.fxPair}`,
        operationalImpact: `Riprofilatura dei portafogli istituzionali esposti a ${ctx.country} (tassi ${rateTxt}): aumento della dispersione intraday tra ${leadStock}, ${secondStock} e ${ctx.fxPair}.`,
        sentiment: 'VOLATILITÀ',
        horizon: 'Intraday',
        impactedTickers: [ctx.indexSymbol, ctx.fxPair, leadStock, bnd].slice(0, 4),
        internalReasoning: [
            `1. Evento di mercato specifico su ${ctx.country} in regime di tassi ${ctx.centralBank} al ${rateTxt}.`,
            `2. Impatto bidirezionale su volatilità implicita e flussi di copertura valutaria (${ctx.fxPair}).`,
            `3. Monitoraggio dei livelli di liquidità su ${ctx.indexSymbol} e ${leadStock}.`
        ]
    };
}

async function analyzeBatchWithReasoningEngine(
    headlines: RawHeadline[],
    ctx: CountryMacroContext
): Promise<{ map: Map<number, ServerNewsItem['aiImpact']>; modelUsed: string } | null> {
    if (headlines.length === 0) return null;

    const numbered = headlines.map((h, i) => `${i}: "${h.title}" [Fonte: ${h.source}]`).join('\n');
    const stockPool = ctx.topStocks.length > 0 ? ctx.topStocks.join(', ') : ctx.indexSymbol;

    const systemInstruction = `Sei il Chief Macro Strategist di un hedge fund globale.
Analizza OGNI SINGOLA NOTIZIA in modo distinto, collegandola rigorosamente al regime macroeconomico reale del paese fornito.
VIETATO ripetere la stessa spiegazione o usare frasi vaghe.

Per ogni notizia devi spiegare:
1. "internal_reasoning": 3 passaggi causali espliciti (Notizia -> Canale macro/finanziario -> Effetto sui prezzi nel contesto di ${ctx.centralBank}/CPI/yield).
2. "transmission_mechanism": meccanismo di trasmissione sintetico a frecce (es. "Rialzo gas -> Compressione margini manifattura -> Pressione su industriali e EUR").
3. "operationalImpact": 1-2 frasi dense in italiano (max 240 caratteri) sull'impatto operativo concreto su asset e flussi.
4. "sentiment": "BULLISH" | "BEARISH" | "VOLATILITÀ" (usa "VOLATILITÀ" per eventi binari o bidirezionali).
5. "horizon": "Intraday" oppure "Multi-day".
6. "impactedTickers": 2-4 ticker reali pertinenti a questo paese/settore (priorità a ${ctx.indexSymbol}, ${ctx.fxPair}, ${ctx.iso2}10Y e ai titoli locali ${stockPool}).

SCHEMA JSON OBBLIGATORIO:
{
  "internal_reasoning": [
    "Sintesi macro del paese (tasso, CPI, yield 10Y) come lente interpretativa",
    "Distinzione dei catalyst prevalenti nelle notizie ricevute"
  ],
  "analyses": [
    {
      "index": 0,
      "internal_reasoning": ["Passo 1", "Passo 2", "Passo 3"],
      "transmission_mechanism": "Evento -> Canale -> Effetto",
      "operationalImpact": "Impatto causale specifico in italiano",
      "sentiment": "BULLISH" | "BEARISH" | "VOLATILITÀ",
      "horizon": "Intraday" | "Multi-day",
      "impactedTickers": ["TICKER1", "TICKER2", "TICKER3"]
    }
  ]
}`;

    const userPrompt = `[REGIME MACRO REALE DEL PAESE]
- Paese: ${ctx.country} (${ctx.iso2}) — Piazza finanziaria: ${ctx.city}
- Banca Centrale: ${ctx.centralBank} | Tasso Ufficiale: ${ctx.policyRate != null ? `${ctx.policyRate}%` : 'N/D'}
- Inflazione CPI: ${ctx.inflationCpi != null ? `${ctx.inflationCpi}%` : 'N/D'} | Crescita PIL: ${ctx.gdpGrowth != null ? `${ctx.gdpGrowth}%` : 'N/D'}
- Rendimento Sovrano 10Y (${ctx.iso2}10Y): ${ctx.yield10y != null ? `${ctx.yield10y}%` : 'N/D'}
- Indice Principale: ${ctx.indexSymbol} | Cambio: ${ctx.fxPair} (${ctx.currencyCode})
- Principali Blue Chip Locali: ${stockPool}

[NOTIZIE DA ANALIZZARE SINGOLARMENTE]
${numbered}`;

    const result = await runStructuredReasoning({
        tier: 'fast',
        systemInstruction,
        userPrompt,
        zodSchema: atlasNewsBatchOutputSchema,
        temperature: 0.25,
        thinkingBudget: 1024
    });

    if (!result.ok) return null;

    const map = new Map<number, ServerNewsItem['aiImpact']>();
    for (const row of result.data.analyses) {
        if (row.index < 0 || row.index >= headlines.length) continue;
        const normalizedSentiment: NewsSentiment =
            row.sentiment === 'NEUTRAL' ? 'VOLATILITÀ' : row.sentiment;
        map.set(row.index, {
            operationalImpact: row.operationalImpact.trim(),
            transmissionMechanism: row.transmission_mechanism.trim(),
            sentiment: normalizedSentiment,
            horizon: row.horizon,
            impactedTickers: row.impactedTickers
                .map((t) => t.trim().toUpperCase())
                .filter(Boolean)
                .slice(0, 4),
            internalReasoning: row.internal_reasoning
        });
    }

    return map.size > 0 ? { map, modelUsed: result.modelUsed } : null;
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
        currencyCode: getQueryParam(req, 'currencyCode'),
        centralBank: getQueryParam(req, 'centralBank'),
        policyRate: getQueryParam(req, 'policyRate'),
        inflationCpi: getQueryParam(req, 'inflationCpi'),
        gdpGrowth: getQueryParam(req, 'gdpGrowth'),
        yield10y: getQueryParam(req, 'yield10y'),
        topStocks: getQueryParam(req, 'topStocks')
    });

    if (!parsed.success) {
        sendValidationError(res, parsed.error);
        return;
    }

    const q = parsed.data;
    const macroCtx: CountryMacroContext = {
        iso2: q.iso2,
        country: q.country || q.iso2,
        city: q.city || q.country || q.iso2,
        indexSymbol: q.indexSymbol || 'SPX',
        fxPair: q.fxPair || 'EUR/USD',
        currencyCode: q.currencyCode || 'USD',
        centralBank: q.centralBank || 'Banca Centrale',
        policyRate: q.policyRate,
        inflationCpi: q.inflationCpi,
        gdpGrowth: q.gdpGrowth,
        yield10y: q.yield10y,
        topStocks: q.topStocks
            ? q.topStocks
                  .split(',')
                  .map((s) => s.trim().toUpperCase())
                  .filter(Boolean)
                  .slice(0, 6)
            : []
    };

    const cacheKey = `tradyx:atlas:news:v2:${macroCtx.iso2}`;

    const cached = await withCache<NewsGatewayPayload>(
        cacheKey,
        CACHE_TTL.NEWS_SECONDS, // 15 minutes
        async () => {
            const { headlines, providersUsed } = await fetchExternalHeadlines(
                macroCtx.iso2,
                macroCtx.country
            );

            const batchRes = await analyzeBatchWithReasoningEngine(headlines, macroCtx);

            const items: ServerNewsItem[] = headlines.map((h, idx) => ({
                id: `${h.provider}-${macroCtx.iso2}-${idx}`,
                title: h.title,
                source: h.source,
                publishedAt: h.publishedAt,
                url: h.url,
                category: 'LIVE NEWS',
                isLiveFeed: true,
                aiImpact: batchRes?.map.get(idx) || causalFallbackForHeadline(h.title, macroCtx)
            }));

            return {
                iso2: macroCtx.iso2,
                items,
                providersUsed: batchRes
                    ? [...providersUsed, batchRes.modelUsed]
                    : providersUsed,
                aiEnriched: !!batchRes,
                modelUsed: batchRes?.modelUsed,
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
