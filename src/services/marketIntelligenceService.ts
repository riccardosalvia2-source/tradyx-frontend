// ============================================================================
// TRADYX MARKET INTELLIGENCE & ASSET IMPACT ENGINE
// (src/services/marketIntelligenceService.ts)
// Macroeconomic Interpretation, Directional Sentiment & Asset Intelligence
// ============================================================================

export type MarketDirection = 'BULLISH' | 'BEARISH' | 'NEUTRAL_VOLATILE';

export interface MarketIntelligenceInsight {
    direction: MarketDirection;
    directionLabel: string;
    directionBadgeColor: string;
    directionPillBg: string;
    assetsInvolved: string[];
    operationalMeaning: string; // 2-3 clear sentences: macro driver + volatility/sentiment forecast
}

/**
 * Deterministic semantic parser with instant execution and zero latency.
 * Translates macro and crypto news into concrete operational guidance for retail traders.
 */
export function analyzeMarketImpact(
    title: string,
    summary = '',
    sourceType = 'ALL',
    sentimentHint?: string
): MarketIntelligenceInsight {
    const text = `${title} ${summary}`.toLowerCase();

    // 1. Detect Involved Assets
    const assets: string[] = [];

    // Crypto
    if (text.includes('bitcoin') || text.includes('btc')) {
        assets.push('Crypto (BTC)');
    }
    if (text.includes('ethereum') || text.includes('eth') || text.includes('layer 2') || text.includes('arbitrum')) {
        assets.push('Crypto (ETH)');
    }
    if (text.includes('solana') || text.includes('sol') || text.includes('altcoin') || text.includes('crypto')) {
        if (!assets.some(a => a.includes('Crypto'))) assets.push('Crypto (Altcoins)');
    }

    // Equities & Indices
    if (text.includes('nasdaq') || text.includes('tech') || text.includes('semiconductor') || text.includes('nvidia') || text.includes('nvda') || text.includes('apple') || text.includes('aapl')) {
        assets.push('Tech Equities (NQ)');
    }
    if (text.includes('s&p') || text.includes('sp 500') || text.includes('wall street') || text.includes('dow') || text.includes('stocks') || text.includes('equities')) {
        if (!assets.includes('Tech Equities (NQ)')) assets.push('US Indices (ES / SPX)');
    }

    // Forex / Central Banks
    if (text.includes('dollar') || text.includes('dxy') || text.includes('treasury') || text.includes('yield') || text.includes('fed') || text.includes('powell')) {
        assets.push('Valute / DXY');
    }
    if (text.includes('euro') || text.includes('eur') || text.includes('ecb') || text.includes('lagarde')) {
        assets.push('Forex (EUR/USD)');
    }
    if (text.includes('yen') || text.includes('boj') || text.includes('jpy')) {
        assets.push('Forex (USD/JPY)');
    }

    // Commodities
    if (text.includes('gold') || text.includes('oro') || text.includes('silver') || text.includes('commodity')) {
        assets.push('Commodities (Gold/XAU)');
    }
    if (text.includes('oil') || text.includes('petrolio') || text.includes('crude') || text.includes('energy') || text.includes('wti')) {
        assets.push('Commodities (Oil/WTI)');
    }

    // Default fallback asset based on category
    if (assets.length === 0) {
        if (sourceType === 'CRYPTO') assets.push('Crypto (BTC, ETH)');
        else if (sourceType === 'FED' || sourceType === 'FOREX') assets.push('Valute / DXY', 'Yields (US10Y)');
        else if (sourceType === 'EQUITIES') assets.push('Tech Equities (NQ)', 'US Indices (ES)');
        else if (sourceType === 'ETF') assets.push('Crypto (BTC)', 'Tech Equities (NQ)');
        else assets.push('Cross-Asset Market Risk');
    }

    // 2. Classify Directional Sentiment
    const bullishKeywords = [
        'surge', 'gain', 'bull', 'record', 'soar', 'high', 'inflow', 'approved',
        'cut rates', 'rally', 'positive', 'breakout', 'growth', 'backs', 'expands',
        'cooling inflation', 'disinflation', 'boost', 'upgrade', 'climb', 'accumul'
    ];
    const bearishKeywords = [
        'crash', 'drop', 'fall', 'plunge', 'dump', 'loss', 'liquidation', 'ban',
        'lawsuit', 'bear', 'freeze', 'inflation surge', 'rejection', 'warning',
        'slowdown', 'decline', 'hawkish', 'hike', 'tariff', 'recession', 'debt', 'selloff'
    ];

    let bullCount = 0;
    let bearCount = 0;
    bullishKeywords.forEach(k => { if (text.includes(k)) bullCount++; });
    bearishKeywords.forEach(k => { if (text.includes(k)) bearCount++; });

    if (sentimentHint) {
        if (sentimentHint.toLowerCase().includes('bull')) bullCount += 2;
        if (sentimentHint.toLowerCase().includes('bear')) bearCount += 2;
    }

    let direction: MarketDirection = 'NEUTRAL_VOLATILE';
    if (bullCount > bearCount) direction = 'BULLISH';
    else if (bearCount > bullCount) direction = 'BEARISH';
    else direction = 'NEUTRAL_VOLATILE';

    // 3. Synthesize Operational Caption ("Cosa significa per i mercati")
    let operationalMeaning = '';

    if (sourceType === 'FED' || text.includes('fed') || text.includes('powell') || text.includes('rate cut') || text.includes('inflation')) {
        if (direction === 'BULLISH') {
            operationalMeaning = 'Il rallentamento delle pressioni inflazionistiche rafforza le aspettative di allentamento monetario della FED. Questo riduce il rendimento dei Treasury e stimola la liquidità a favore degli asset ad alto beta (crypto e growth tech). Atteso sentiment costruttivo con compressione della volatilità intraday.';
        } else if (direction === 'BEARISH') {
            operationalMeaning = 'I timori di inflazione persistente o segnali hawkish della banca centrale spingono al rialzo i tassi reali dei titoli di stato USA. Ne consegue un drenaggio di liquidità dal mercato azionario e crypto con rafforzamento del dollaro (DXY). Elevato rischio di volatilità discendente nelle prossime sessioni.';
        } else {
            operationalMeaning = 'La Federal Reserve adotta una posizione attendista basata sulla lettura dei dati macro. Il mercato naviga in una fase di consolidamento orizzontale in attesa di catalizzatori chiari. Strategia per trader retail: evitare breakout impulsivi e attendere la reazione dei livelli chiave di liquidità.';
        }
    } else if (sourceType === 'CRYPTO' || text.includes('bitcoin') || text.includes('etf') || text.includes('ethereum')) {
        if (direction === 'BULLISH') {
            operationalMeaning = 'Gli afflussi istituzionali su veicoli spot e l\'assorbimento ordinato delle riserve sugli exchange confermano una domanda strutturale resiliente. L\'aumento di Open Interest favorisce il proseguimento del trend rialzista. Attesa continuazione con pull-back fisiologici ideali per ingressi a piano.';
        } else if (direction === 'BEARISH') {
            operationalMeaning = 'L\'ondata di liquidazioni forzate sui mercati dei derivati segnala un flush di leva finanziaria speculativa su resistenze chiave. La liquidità sui libri ordini si dirada temporaneamente. Evitare assolutamente ingressi anticipati di "Revenge Trading" prima dell\'assorbimento volumetrico.';
        } else {
            operationalMeaning = 'Fase di compressione della volatilità e riequilibrio dei funding rate sui perpetual contract. Il mercato sta accumulando ordini in un range definito prima di un\'espansione direzionale. Monitorare attentamente i volumi spot a conferma del breakout.';
        }
    } else if (sourceType === 'EQUITIES' || text.includes('nasdaq') || text.includes('s&p') || text.includes('earnings')) {
        if (direction === 'BULLISH') {
            operationalMeaning = 'I fondamentali aziendali e la tenuta degli utili societari supportano l\'espansione dei multipli su Wall Street. La propensione al rischio resta elevata su comparti semiconduttori e cloud. Possibile continuazione del momentum positivo con volatilità contenuta.';
        } else if (direction === 'BEARISH') {
            operationalMeaning = 'Prese di profitto istituzionali e revisioni conservative delle guidance innescano una rotazione difensiva dai megacap tech ai bond governativi. Incremento dell\'indice VIX. Mantenere stop loss rigorosi e ridurre l\'esposizione overnight.';
        } else {
            operationalMeaning = 'Consolidamento tecnico delle borse USA su supporti settimanali primari. Gli operatori istituzionali attendono la chiusura delle trimestrali per definire il posizionamento macro. Atteso trading di range con oscillazioni bilaterali.';
        }
    } else {
        // Generic Macro / Forex / Commodities
        if (direction === 'BULLISH') {
            operationalMeaning = 'Stabilità del contesto macroeconomico e condizioni di credito distese incoraggiano i flussi di capitale verso asset speculativi e materie prime industriali. Sentiment propenso al rischio favorevole per setup trend-following.';
        } else if (direction === 'BEARISH') {
            operationalMeaning = 'Aumento dell\'avversione al rischio globale causato da divergenze economiche o tensioni geopolitiche. Fuga verso asset rifugio (oro, USD, cash). Si raccomanda massima prudenza e dimensionamento ridotto delle posizioni.';
        } else {
            operationalMeaning = 'Forze macroeconomiche contrastanti mantengono il sentiment in equilibrio neutrale. La dispersione dei rendimenti impone selettività estrema nell\'esecuzione. Operare rigorosamente nel rispetto del Risk Management prefissato.';
        }
    }

    // Direction visual configuration
    let directionLabel = 'Volatilità / Neutro';
    let directionBadgeColor = '#F59E0B';
    let directionPillBg = 'bg-amber-500/10 border-amber-500/30 text-amber-400';

    if (direction === 'BULLISH') {
        directionLabel = 'Bullish / Rialzista';
        directionBadgeColor = '#10B981';
        directionPillBg = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    } else if (direction === 'BEARISH') {
        directionLabel = 'Bearish / Ribassista';
        directionBadgeColor = '#DC2626';
        directionPillBg = 'bg-rose-500/10 border-rose-500/30 text-rose-400';
    }

    return {
        direction,
        directionLabel,
        directionBadgeColor,
        directionPillBg,
        assetsInvolved: assets.slice(0, 3),
        operationalMeaning
    };
}
