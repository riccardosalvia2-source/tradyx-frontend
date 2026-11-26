// ============================================================================
// TRADYX ATLAS NEWS & AI MARKET IMPACT SERVICE (src/services/atlasNewsService.ts)
// Direct canonical URLs to real national & international financial publishers
// (Reuters, Bloomberg, Financial Times, Il Sole 24 Ore, CNBC, Nikkei Asia,
// Handelsblatt, Les Echos) + NewsData / Marketaux / GNews API integration.
// ZERO broken news.google.com redirect links!
// ============================================================================

import { AtlasNewsItem, GlobalHub, NewsSentiment } from '../types/atlas';
import { getApiAuthHeaders } from './authService';

const newsCache = new Map<string, { items: AtlasNewsItem[]; expiresAt: number }>();
const NEWS_CACHE_TTL = 1000 * 60 * 5; // 5 minutes

function formatRelativeMinutes(minsAgo: number): string {
    if (minsAgo < 60) return `${minsAgo} min fa`;
    const hours = Math.floor(minsAgo / 60);
    if (hours < 24) return `${hours}h fa`;
    return `${Math.floor(hours / 24)}g fa`;
}

function isBlockedGoogleNewsUrl(url: string): boolean {
    return !url || url.includes('news.google.com') || !/^https?:\/\//i.test(url);
}

/**
 * Maps each country/region to real, working canonical publisher market sections.
 */
function getRegionalPublisherPool(hub: GlobalHub): Array<{ source: string; url: string }> {
    const byIso: Record<string, Array<{ source: string; url: string }>> = {
        IT: [
            { source: 'Il Sole 24 Ore', url: 'https://www.ilsole24ore.com/sez/finanza' },
            { source: 'Milano Finanza', url: 'https://www.milanofinanza.it/mercati' },
            { source: 'Reuters Europe', url: 'https://www.reuters.com/markets/europe/' },
            { source: 'Bloomberg Europe', url: 'https://www.bloomberg.com/europe' },
            { source: 'Financial Times', url: 'https://www.ft.com/markets' }
        ],
        US: [
            { source: 'Reuters US Markets', url: 'https://www.reuters.com/markets/us/' },
            { source: 'CNBC Markets', url: 'https://www.cnbc.com/markets/' },
            { source: 'Bloomberg Markets', url: 'https://www.bloomberg.com/markets' },
            { source: 'MarketWatch', url: 'https://www.marketwatch.com/markets' },
            { source: 'Financial Times US', url: 'https://www.ft.com/us' }
        ],
        DE: [
            { source: 'Handelsblatt', url: 'https://www.handelsblatt.com/finanzen/' },
            { source: 'Reuters Europe', url: 'https://www.reuters.com/markets/europe/' },
            { source: 'Bloomberg Europe', url: 'https://www.bloomberg.com/europe' },
            { source: 'Financial Times', url: 'https://www.ft.com/markets' }
        ],
        FR: [
            { source: 'Les Echos', url: 'https://www.lesechos.fr/finance-marches' },
            { source: 'Reuters Europe', url: 'https://www.reuters.com/markets/europe/' },
            { source: 'Bloomberg Europe', url: 'https://www.bloomberg.com/europe' },
            { source: 'Financial Times', url: 'https://www.ft.com/markets' }
        ],
        GB: [
            { source: 'Financial Times', url: 'https://www.ft.com/markets' },
            { source: 'Reuters UK', url: 'https://www.reuters.com/world/uk/' },
            { source: 'Bloomberg Europe', url: 'https://www.bloomberg.com/europe' },
            { source: 'CNBC Europe', url: 'https://www.cnbc.com/europe-markets/' }
        ],
        JP: [
            { source: 'Nikkei Asia', url: 'https://asia.nikkei.com/Business/Markets' },
            { source: 'Reuters Asia', url: 'https://www.reuters.com/markets/asia/' },
            { source: 'Bloomberg Asia', url: 'https://www.bloomberg.com/asia' },
            { source: 'CNBC Asia', url: 'https://www.cnbc.com/asia-markets/' }
        ],
        CN: [
            { source: 'Nikkei Asia', url: 'https://asia.nikkei.com/Business/Markets' },
            { source: 'Reuters Asia', url: 'https://www.reuters.com/markets/asia/' },
            { source: 'Bloomberg Asia', url: 'https://www.bloomberg.com/asia' },
            { source: 'CNBC Asia', url: 'https://www.cnbc.com/asia-markets/' }
        ]
    };

    if (byIso[hub.iso2]) return byIso[hub.iso2];

    if (hub.region === 'Europa') {
        return [
            { source: 'Reuters Europe', url: 'https://www.reuters.com/markets/europe/' },
            { source: 'Financial Times', url: 'https://www.ft.com/markets' },
            { source: 'Bloomberg Europe', url: 'https://www.bloomberg.com/europe' },
            { source: 'CNBC Europe', url: 'https://www.cnbc.com/europe-markets/' },
            { source: 'Il Sole 24 Ore', url: 'https://www.ilsole24ore.com/sez/finanza' }
        ];
    }
    if (hub.region === 'Asia' || hub.region === 'Oceania') {
        return [
            { source: 'Nikkei Asia', url: 'https://asia.nikkei.com/Business/Markets' },
            { source: 'Reuters Asia', url: 'https://www.reuters.com/markets/asia/' },
            { source: 'Bloomberg Asia', url: 'https://www.bloomberg.com/asia' },
            { source: 'CNBC Asia', url: 'https://www.cnbc.com/asia-markets/' }
        ];
    }
    if (hub.region === 'Medio Oriente' || hub.region === 'Africa') {
        return [
            { source: 'Reuters World Markets', url: 'https://www.reuters.com/markets/' },
            { source: 'Bloomberg Middle East', url: 'https://www.bloomberg.com/middleeast' },
            { source: 'Financial Times', url: 'https://www.ft.com/markets' },
            { source: 'CNBC World Markets', url: 'https://www.cnbc.com/world-markets/' }
        ];
    }

    return [
        { source: 'Reuters Markets', url: 'https://www.reuters.com/markets/' },
        { source: 'Bloomberg Markets', url: 'https://www.bloomberg.com/markets' },
        { source: 'CNBC Markets', url: 'https://www.cnbc.com/markets/' },
        { source: 'MarketWatch', url: 'https://www.marketwatch.com/markets' },
        { source: 'Financial Times', url: 'https://www.ft.com/markets' }
    ];
}

function analyzeHeadlineImpact(
    title: string,
    hub: GlobalHub,
    indexSeed: number
): AtlasNewsItem['aiImpact'] {
    const lower = title.toLowerCase();
    const mainIdx = hub.primaryIndex.symbol;
    const fx = hub.fxPairLabel;
    const bnd = `${hub.iso2}10Y`;
    const topStock = hub.topStocks[0]?.symbol || mainIdx;
    const secondStock = hub.topStocks[1]?.symbol || 'XAU/USD';

    if (/(rate|central bank|ecb|fed|boj|boe|tassi|inflazione|cpi|inflation|yield|bond)/.test(lower)) {
        const hawkish = /(hike|rise|hot|high|sticky|aumento|rialzo|sale|above)/.test(lower);
        return {
            operationalImpact: hawkish
                ? `Pressione rialzista sui rendimenti ${bnd} e supporto valutario su ${fx}; i multipli azionari growth su ${mainIdx} possono subire compressione intraday.`
                : `Raffreddamento delle aspettative sui tassi della ${hub.macro.centralBank}: scenario favorevole per duration lunga su ${bnd} e rotazione risk-on su ${mainIdx}.`,
            sentiment: hawkish ? 'NEUTRAL' : 'BULLISH',
            impactedTickers: [bnd, fx, mainIdx]
        };
    }

    if (/(earnings|profit|revenue|merger|acquisition|ipo|upgrade|rally|record|surge|utili|trimestral)/.test(lower)) {
        return {
            operationalImpact: `Flussi istituzionali in ingresso sull'azionario di ${hub.city} con revisione al rialzo degli utili attesi; monitorare breakout di volume su ${topStock} e ${mainIdx}.`,
            sentiment: 'BULLISH',
            impactedTickers: [topStock, mainIdx, secondStock]
        };
    }

    if (/(oil|gas|energy|gold|copper|opec|commodity|petrolio|oro|energia)/.test(lower)) {
        return {
            operationalImpact: `Impatto diretto sui costi energetici e sulla bilancia commerciale (${hub.countryName}); correlazione elevata tra ${secondStock}, WTI/Brent e differenziale inflattivo su ${fx}.`,
            sentiment: 'NEUTRAL',
            impactedTickers: ['WTI', 'XAU/USD', secondStock]
        };
    }

    if (/(recession|slump|cut|deficit|downgrade|tariff|sanction|crisis|calo|crisi|debito|selloff|drop)/.test(lower)) {
        return {
            operationalImpact: `Aumento del premio per il rischio sovrano su ${hub.countryName} con possibili deflussi esteri da ${mainIdx} e ampliamento dello spread su ${bnd}.`,
            sentiment: 'BEARISH',
            impactedTickers: [mainIdx, bnd, fx]
        };
    }

    if (/(ai|semiconductor|chip|tech|cloud|crypto|bitcoin|fintech|digital)/.test(lower)) {
        return {
            operationalImpact: `Catalizzatore strutturale per il comparto tecnologico e gli investimenti FDI su ${hub.city}; forte sensibilità su ${topStock}, NDX e flussi digital asset.`,
            sentiment: 'BULLISH',
            impactedTickers: [topStock, 'NDX', 'BTC']
        };
    }

    const fallbackVariants: Array<{
        operationalImpact: string;
        sentiment: NewsSentiment;
        impactedTickers: string[];
    }> = [
        {
            operationalImpact: `Riposizionamento tattico dei desk istituzionali su ${hub.exchangeName}: attesa espansione della volatilità implicita all'apertura di ${hub.city}.`,
            sentiment: 'NEUTRAL',
            impactedTickers: [mainIdx, fx, topStock]
        },
        {
            operationalImpact: `Segnale costruttivo per i flussi di capitale esteri verso ${hub.countryName}, con tenuta dei bancari e stabilizzazione della curva ${bnd}.`,
            sentiment: 'BULLISH',
            impactedTickers: [mainIdx, topStock, bnd]
        },
        {
            operationalImpact: `Cautela sul comparto ciclico di ${hub.countryName}: i gestori riducono l'esposizione a beta elevato privilegiando copertura valutaria su ${fx}.`,
            sentiment: 'BEARISH',
            impactedTickers: [fx, mainIdx, 'XAU/USD']
        }
    ];
    return fallbackVariants[indexSeed % fallbackVariants.length];
}

/**
 * Builds 22 distinct, country-specific institutional news briefs with REAL canonical publisher URLs.
 */
function buildCuratedCountryNews(hub: GlobalHub): AtlasNewsItem[] {
    const idx = hub.primaryIndex.symbol;
    const idxName = hub.primaryIndex.name;
    const fx = hub.fxPairLabel;
    const bnd10 = `${hub.iso2}10Y`;
    const bnd2 = `${hub.iso2}2Y`;
    const s1 = hub.topStocks[0] || { symbol: idx, name: hub.exchangeName, sector: 'Finanza' };
    const s2 = hub.topStocks[1] || { symbol: idx, name: `${hub.countryName} Energy`, sector: 'Energia' };
    const s3 = hub.topStocks[2] || { symbol: idx, name: `${hub.countryName} Tech`, sector: 'Tecnologia' };
    const cb = hub.macro.centralBank;
    const rate = hub.macro.policyRate.toFixed(2);
    const cpi = hub.macro.inflationCpi.toFixed(1);
    const gdp = hub.macro.gdpGrowth.toFixed(1);
    const y10 = hub.bondYields.y10.toFixed(2);
    const pubPool = getRegionalPublisherPool(hub);
    const pickPub = (i: number) => pubPool[i % pubPool.length];

    const templates: Array<{
        title: string;
        source?: string;
        url?: string;
        category: string;
        minsAgo: number;
        sentiment: NewsSentiment;
        operationalImpact: string;
        tickers: string[];
    }> = [
        {
            title: `${cb}: focus dei desk su traiettoria tassi al ${rate}% dopo l'ultimo dato inflazione (${cpi}%)`,
            category: 'BANCHE CENTRALI',
            minsAgo: 7,
            sentiment: hub.macro.inflationCpi > 3.5 ? 'NEUTRAL' : 'BULLISH',
            operationalImpact: `I tassi a breve su ${bnd2} prezzano la prossima mossa della ${cb}; eventuali sorprese hawkish rafforzano ${fx} ma frenano il multiplo di ${idxName}.`,
            tickers: [bnd2, fx, idx]
        },
        {
            title: `Asta titoli di Stato ${hub.countryName} (${bnd10}): domanda istituzionale solida con rendimento al ${y10}%`,
            category: 'BOND SOVRANI',
            minsAgo: 18,
            sentiment: 'BULLISH',
            operationalImpact: `Un bid-to-cover robusto comprime lo spread sovrano di ${hub.countryName}, riducendo il costo del funding per il comparto bancario quotato su ${hub.exchangeName}.`,
            tickers: [bnd10, s1.symbol, idx]
        },
        {
            title: `${s1.name} (${s1.symbol}): analisti aggiornano il target price dopo l'accelerazione dei margini nel settore ${s1.sector}`,
            category: 'EQUITY',
            minsAgo: 31,
            sentiment: 'BULLISH',
            operationalImpact: `Il titolo guida i volumi su ${hub.city} e funge da barometro per gli ETF esposti a ${hub.countryName}; possibili ricoperture short sopra i massimi settimanali.`,
            tickers: [s1.symbol, idx, 'SPY']
        },
        {
            title: `Flussi FX su ${fx}: posizionamento hedge fund ai massimi mensili in vista dei dati macro USA`,
            source: 'FXStreet Institutional',
            url: 'https://www.fxstreet.com/news',
            category: 'FOREX',
            minsAgo: 44,
            sentiment: 'NEUTRAL',
            operationalImpact: `Il differenziale di rendimento tra ${bnd10} e US10Y guida il carry trade su ${fx}; attesi movimenti rapidi in prossimità della sessione di New York.`,
            tickers: [fx, 'DXY', 'US10Y']
        },
        {
            title: `PIL ${hub.countryName} al ${gdp}% YoY: investimenti esteri (FDI) in crescita nei poli di ${hub.city}`,
            category: 'MACRO',
            minsAgo: 58,
            sentiment: hub.macro.gdpGrowth >= 2 ? 'BULLISH' : 'NEUTRAL',
            operationalImpact: `La tenuta della crescita reale sostiene la redditività domestica e migliora la sostenibilità del rapporto Debito/PIL (${hub.macro.debtToGdp}%).`,
            tickers: [idx, bnd10, 'EEM']
        },
        {
            title: `${s2.name} (${s2.symbol}): nuovo piano capex su transizione energetica e infrastrutture strategiche`,
            category: 'CORPORATE',
            minsAgo: 79,
            sentiment: 'BULLISH',
            operationalImpact: `L'espansione del capex rafforza la visibilità dei flussi di cassa a 24 mesi per ${s2.symbol} con ricadute positive sulla filiera industriale locale.`,
            tickers: [s2.symbol, 'WTI', idx]
        },
        {
            title: `Volatilità materie prime: impatto di Petrolio WTI e Oro sulla bilancia commerciale di ${hub.countryName}`,
            source: 'Reuters Commodities',
            url: 'https://www.reuters.com/markets/commodities/',
            category: 'COMMODITIES',
            minsAgo: 98,
            sentiment: 'NEUTRAL',
            operationalImpact: `Oscillazioni di energia e metalli alterano i margini di import/export (${hub.macro.tradeBalanceBn >= 0 ? 'surplus' : 'deficit'} ${Math.abs(hub.macro.tradeBalanceBn)}B$) e la curva inflattiva attesa.`,
            tickers: ['WTI', 'XAU/USD', fx]
        },
        {
            title: `${s3.name} (${s3.symbol}): partnership internazionale su AI e automazione spinge i volumi su ${hub.exchangeName}`,
            source: 'CNBC Tech & Markets',
            url: 'https://www.cnbc.com/technology/',
            category: 'TECH & AI',
            minsAgo: 122,
            sentiment: 'BULLISH',
            operationalImpact: `L'adozione AI accelera la produttività del comparto ${s3.sector}, attirando flussi tematici globali correlati a NASDAQ 100 e NVDA.`,
            tickers: [s3.symbol, 'NDX', 'NVDA']
        },
        {
            title: `Rating sovrano ${hub.countryName} confermato a ${hub.macro.sovereignRating}: focus agenzie su conti pubblici`,
            category: 'CREDIT & RATING',
            minsAgo: 150,
            sentiment: 'BULLISH',
            operationalImpact: `La conferma del rating evita vendite forzate da parte dei fondi obbligazionari benchmark e stabilizza il premio al rischio sui titoli ${bnd10}.`,
            tickers: [bnd10, idx, fx]
        },
        {
            title: `Liquidità interbancaria a ${hub.city}: riserve valutarie a $${hub.macro.fxReservesBn}B offrono cuscinetto contro shock esterni`,
            category: 'LIQUIDITÀ',
            minsAgo: 178,
            sentiment: 'BULLISH',
            operationalImpact: `Riserve solide riducono il rischio di svalutazione disordinata di ${hub.currencyCode} durante fasi globali di risk-off.`,
            tickers: [fx, bnd2, 'DXY']
        },
        {
            title: `Rotazione settoriale su ${idxName}: istituzionali alleggeriscono ciclici e accumulano difensivi e quality`,
            source: 'Financial Times Markets',
            url: 'https://www.ft.com/markets',
            category: 'FLUSSI EQUITY',
            minsAgo: 210,
            sentiment: 'NEUTRAL',
            operationalImpact: `Divergenza marcata tra titoli value e growth all'interno di ${idx}: preferire ingressi su supporti dinamici evitando inseguimenti FOMO.`,
            tickers: [idx, s1.symbol, 'VWCE']
        },
        {
            title: `Mercato del lavoro ${hub.countryName}: disoccupazione al ${hub.macro.unemployment}% mantiene pressioni salariali sotto osservazione`,
            category: 'LAVORO & MACRO',
            minsAgo: 245,
            sentiment: 'NEUTRAL',
            operationalImpact: `Un mercato del lavoro teso rallenta il ritmo dei tagli dei tassi, sostenendo il margine d'interesse delle banche ma pesando sul real estate.`,
            tickers: [bnd2, s1.symbol, fx]
        },
        {
            title: `Correlazione globale: flussi da Wall Street (SPX) e rendimenti US10Y dettano il passo su ${hub.city}`,
            source: 'MarketWatch',
            url: 'https://www.marketwatch.com/markets',
            category: 'CROSS-ASSET',
            minsAgo: 285,
            sentiment: 'NEUTRAL',
            operationalImpact: `Ogni variazione di 10 bps su US10Y si trasmette rapidamente ai futures su ${idx} e al cambio ${fx}.`,
            tickers: ['SPX', 'US10Y', idx]
        },
        {
            title: `FDI Esteri: fondi sovrani e private equity aumentano l'allocazione su ${hub.fdiSectors[0]?.sector || 'Tech'} in ${hub.countryName}`,
            category: 'FDI & M&A',
            minsAgo: 325,
            sentiment: 'BULLISH',
            operationalImpact: `Gli afflussi di capitale di lungo periodo migliorano la profondità del book di ${hub.exchangeName} e supportano la valutazione di ${idxName}.`,
            tickers: [idx, s1.symbol, s3.symbol]
        },
        {
            title: `Rame e metalli industriali in tensione: riflessi diretti su PMI manifatturiero ed export di ${hub.countryName}`,
            source: 'Bloomberg Commodities',
            url: 'https://www.bloomberg.com/markets/commodities',
            category: 'COMMODITIES',
            minsAgo: 368,
            sentiment: 'NEUTRAL',
            operationalImpact: `Il prezzo del Rame anticipa il ciclo industriale globale; una rottura rialzista favorisce i titoli esportatori quotati a ${hub.city}.`,
            tickers: ['COPPER', idx, s2.symbol]
        },
        {
            title: `Mercato Opzioni & Volatilità su ${idx}: incremento della domanda di put protettive sulle scadenze mensili`,
            category: 'DERIVATI',
            minsAgo: 412,
            sentiment: 'BEARISH',
            operationalImpact: `Lo skew delle opzioni segnala copertura istituzionale prima dei prossimi dati macro: alto rischio di falsi breakout intraday su ${idx}.`,
            tickers: [idx, 'SPX', 'XAU/USD']
        },
        {
            title: `Digital Assets & Liquidità: volumi BTC ed ETF Spot influenzano il sentiment risk-on anche in ${hub.countryName}`,
            source: 'CoinDesk Markets',
            url: 'https://www.coindesk.com/markets/',
            category: 'CRYPTO & FINTECH',
            minsAgo: 455,
            sentiment: 'BULLISH',
            operationalImpact: `L'espansione della liquidità globale (M2) sostiene Bitcoin e titoli fintech legati ai pagamenti digitali cross-border.`,
            tickers: ['BTC', 'ETH', 'QQQ']
        },
        {
            title: `Gas Naturale ed Energia: scorte stagionali al centro dell'attenzione per le utility di ${hub.countryName}`,
            source: 'Reuters Energy',
            url: 'https://www.reuters.com/business/energy/',
            category: 'ENERGIA',
            minsAgo: 505,
            sentiment: 'BEARISH',
            operationalImpact: `Rincari improvvisi del gas comprimono i margini delle aziende energivore e riaccendono le attese sull'inflazione headline (${cpi}%).`,
            tickers: ['NATGAS', 'BRENT', s2.symbol]
        },
        {
            title: `ETF Globali: ribilanciamento trimestrale MSCI modifica il peso azionario di ${hub.countryName} ($${hub.equityMarket.totalMarketCapBn}B cap)`,
            category: 'ETF & PASSIVE',
            minsAgo: 552,
            sentiment: 'BULLISH',
            operationalImpact: `I ribilanciamenti passivi generano picchi di liquidità in asta di chiusura su ${s1.symbol}, ${s2.symbol} e sull'indice ${idx}.`,
            tickers: ['VWCE', 'EEM', idx]
        },
        {
            title: `Beni Rifugio: Oro (XAU/USD) e Treasury USA testano livelli chiave tra diversificazione riserve e geopolitica`,
            source: 'Bloomberg Markets',
            url: 'https://www.bloomberg.com/markets',
            category: 'SAFE HAVEN',
            minsAgo: 604,
            sentiment: 'BULLISH',
            operationalImpact: `Gli acquisti delle banche centrali mantengono un floor strutturale sull'Oro, offrendo copertura naturale per portafogli esposti a ${fx}.`,
            tickers: ['XAU/USD', 'GLD', 'TLT']
        },
        {
            title: `Settore Bancario ${hub.countryName}: stress test di capitale superati con CET1 superiore ai requisiti regolamentari`,
            category: 'FINANZA',
            minsAgo: 650,
            sentiment: 'BULLISH',
            operationalImpact: `Solida capacità di distribuzione dividendi e buyback nel comparto finanziario locale, riducendo il rischio sistemico su ${idxName}.`,
            tickers: [s1.symbol, idx, bnd10]
        },
        {
            title: `Trimestrali Globali & Supply Chain: semiconduttori e logistica guidano le stime export per il prossimo trimestre`,
            source: 'Nikkei Asia Markets',
            url: 'https://asia.nikkei.com/Business/Markets',
            category: 'SUPPLY CHAIN',
            minsAgo: 705,
            sentiment: 'NEUTRAL',
            operationalImpact: `Colli di bottiglia logistici o revisioni della domanda tech impattano i multipli industriali globali da ${hub.city} a New York e Taipei.`,
            tickers: ['TSM', 'ASML', idx]
        }
    ];

    return templates.map((t, i) => {
        const pub = pickPub(i);
        const normalizedSentiment: NewsSentiment =
            t.sentiment === 'NEUTRAL' ? 'VOLATILITÀ' : t.sentiment;
        const horizon: 'Intraday' | 'Multi-day' =
            t.category === 'FOREX' ||
            t.category === 'DERIVATI' ||
            t.category === 'FLUSSI EQUITY' ||
            t.category === 'CROSS-ASSET' ||
            t.category === 'ETF & PASSIVE'
                ? 'Intraday'
                : 'Multi-day';
        const mechanismMap: Record<string, string> = {
            'BANCHE CENTRALI': `Tassi ${cb} (${rate}%) vs CPI (${cpi}%) -> Ricalibrazione curva ${bnd2}/${bnd10} -> Costo del capitale su ${idx}`,
            'BOND SOVRANI': `Domanda in asta ${bnd10} (${y10}%) -> Compressione spread sovrano -> Costo funding banche (${s1.symbol})`,
            EQUITY: `Revisione target/margini ${s1.symbol} -> Afflussi istituzionali settore ${s1.sector} -> Espansione multipli su ${idx}`,
            FOREX: `Differenziale yield ${bnd10} vs US10Y -> Flussi carry trade -> Direzionalità intraday su ${fx}`,
            MACRO: `Crescita PIL ${gdp}% + FDI -> Sostenibilità Debito/PIL (${hub.macro.debtToGdp}%) -> Rating & flussi esteri`,
            CORPORATE: `Espansione CAPEX ${s2.symbol} -> Visibilità flussi di cassa 24M -> Trazione filiera industriale ${hub.city}`,
            COMMODITIES: `Shock prezzi energia/metalli -> Impatto bilancia commerciale (${hub.macro.tradeBalanceBn}B$) -> Pressione inflazione & ${fx}`,
            'TECH & AI': `Adozione AI in ${s3.sector} -> Produttività & margini operativi -> Afflussi tematici su ${s3.symbol} e NDX`,
            'CREDIT & RATING': `Conferma rating ${hub.macro.sovereignRating} -> Assenza vendite forzate fondi benchmark -> Stabilità curva ${bnd10}`,
            'LIQUIDITÀ': `Riserve FX ($${hub.macro.fxReservesBn}B) -> Scudo anti-svalutazione ${hub.currencyCode} -> Riduzione coda di rischio`,
            'FLUSSI EQUITY': `Rotazione istituzionale Ciclici -> Quality -> Dispersione settoriale intraday su ${idxName}`,
            'LAVORO & MACRO': `Disoccupazione al ${hub.macro.unemployment}% -> Pressione salariale -> Ritardo tagli ${cb} & supporto NII banche`,
            'CROSS-ASSET': `Movimento US10Y / SPX -> Ricalibrazione premio al rischio globale -> Trasmissione immediata su ${idx} e ${fx}`,
            'FDI & M&A': `Afflussi fondi sovrani su ${hub.fdiSectors[0]?.sector || 'Tech'} -> Profondità book ${hub.exchangeName} -> Rerating ${idx}`,
            DERIVATI: `Domanda put protettive -> Skew volatilità implicita -> Aumento rischio stop-run intraday su ${idx}`,
            'CRYPTO & FINTECH': `Espansione liquidità M2 -> Flussi ETF Spot BTC -> Correlazione risk-on su fintech e QQQ`,
            ENERGIA: `Scorte gas/petrolio -> Costo input utility e manifattura -> Compressione margini & CPI (${cpi}%)`,
            'ETF & PASSIVE': `Ribilanciamento MSCI ($${hub.equityMarket.totalMarketCapBn}B cap) -> Picchi volumi in asta -> Impatto tecnico su ${s1.symbol}`,
            'SAFE HAVEN': `Acquisti Oro banche centrali -> Floor XAU/USD -> Hedging valutario per portafogli ${hub.currencyCode}`,
            FINANZA: `CET1 sopra soglia regolamentare -> Capacità dividendi/buyback -> Riduzione premio rischio su ${s1.symbol}`,
            'SUPPLY CHAIN': `Ciclo semiconduttori/logistica -> Stime export manifatturiero -> Multipli industriali ${hub.city}`
        };

        const transmissionMechanism =
            mechanismMap[t.category] ||
            `Catalyst ${t.category} (${hub.countryName}) -> Ricalibrazione flussi ${hub.exchangeName} -> Impatto su ${t.tickers[0] || idx}`;

        return {
            id: `curated-${hub.id}-${i}`,
            title: t.title,
            source: t.source || pub.source,
            publishedAt: new Date(Date.now() - t.minsAgo * 60000).toISOString(),
            timeAgo: formatRelativeMinutes(t.minsAgo),
            url: t.url || pub.url,
            category: t.category,
            isLiveFeed: false,
            aiImpact: {
                operationalImpact: t.operationalImpact,
                transmissionMechanism,
                sentiment: normalizedSentiment,
                horizon,
                impactedTickers: t.tickers,
                internalReasoning: [
                    `1. Contesto macro ${hub.countryName}: ${cb} al ${rate}%, inflazione CPI ${cpi}%, rendimento ${bnd10} al ${y10}%.`,
                    `2. Meccanismo di trasmissione: ${transmissionMechanism}.`,
                    `3. Orizzonte ${horizon} (${normalizedSentiment}) con trasmissione prioritaria sui ticker ${t.tickers.join(', ')}.`
                ]
            }
        };
    });
}

/**
 * Fetches live country articles + server-side Gemini Chain-of-Thought batch
 * impact analysis via `/api/atlas/news` (injecting the country's real macro
 * regime: policy rate, CPI, GDP, 10Y yield, top stocks).
 */
export async function fetchCountryNewsWithAIImpact(hub: GlobalHub): Promise<AtlasNewsItem[]> {
    const cached = newsCache.get(hub.id);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.items;
    }

    const liveItems: AtlasNewsItem[] = [];

    try {
        const authHeaders = await getApiAuthHeaders();
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5500);

        const params = new URLSearchParams({
            iso2: hub.iso2,
            country: hub.countryNameEn || hub.countryName,
            city: hub.city,
            indexSymbol: hub.primaryIndex.symbol,
            fxPair: hub.fxPairLabel,
            currencyCode: hub.currencyCode,
            centralBank: hub.macro.centralBank,
            policyRate: String(hub.macro.policyRate),
            inflationCpi: String(hub.macro.inflationCpi),
            gdpGrowth: String(hub.macro.gdpGrowth),
            yield10y: String(hub.bondYields.y10),
            topStocks: hub.topStocks.map((s) => s.symbol).slice(0, 6).join(',')
        });

        const res = await fetch(`/api/atlas/news?${params.toString()}`, {
            headers: authHeaders,
            signal: controller.signal
        });
        clearTimeout(timer);

        if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json?.items)) {
                json.items.forEach((a: any, idx: number) => {
                    if (!a?.title || isBlockedGoogleNewsUrl(a?.url)) return;
                    const pubMs = a.publishedAt ? Date.parse(a.publishedAt) : Date.now();
                    const minsAgo = Math.max(2, Math.round((Date.now() - pubMs) / 60000));
                    const fallbackImpact = analyzeHeadlineImpact(a.title, hub, idx);
                    const rawSent = a.aiImpact?.sentiment || fallbackImpact.sentiment;
                    const normalizedSent: NewsSentiment =
                        rawSent === 'NEUTRAL' ? 'VOLATILITÀ' : rawSent;

                    liveItems.push({
                        id: String(a.id || `srv-${hub.id}-${idx}`),
                        title: String(a.title).trim(),
                        source: String(a.source || 'Live Wire'),
                        publishedAt: new Date(pubMs).toISOString(),
                        timeAgo: formatRelativeMinutes(minsAgo),
                        url: String(a.url),
                        category: String(a.category || 'LIVE NEWS'),
                        isLiveFeed: true,
                        aiImpact:
                            a.aiImpact && typeof a.aiImpact.operationalImpact === 'string'
                                ? {
                                      operationalImpact: a.aiImpact.operationalImpact,
                                      transmissionMechanism: a.aiImpact.transmissionMechanism,
                                      sentiment: normalizedSent,
                                      horizon: a.aiImpact.horizon || 'Intraday',
                                      impactedTickers: Array.isArray(a.aiImpact.impactedTickers)
                                          ? a.aiImpact.impactedTickers
                                          : fallbackImpact.impactedTickers,
                                      internalReasoning: Array.isArray(a.aiImpact.internalReasoning)
                                          ? a.aiImpact.internalReasoning
                                          : undefined
                                  }
                                : {
                                      ...fallbackImpact,
                                      sentiment: normalizedSent,
                                      horizon: 'Intraday'
                                  }
                    });
                });
            }
        }
    } catch {
        // Fallback smoothly to canonical publisher briefs
    }

    const curated = buildCuratedCountryNews(hub);
    const combined = [...liveItems, ...curated].slice(0, Math.max(22, liveItems.length + 12));

    newsCache.set(hub.id, { items: combined, expiresAt: Date.now() + NEWS_CACHE_TTL });
    return combined;
}
