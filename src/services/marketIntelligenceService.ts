// ============================================================================
// TRADYX DYNAMIC MARKET INTELLIGENCE & CONTEXTUAL IMPACT ENGINE
// (src/services/marketIntelligenceService.ts)
// Deep Semantic Analysis for Financial & Crypto News - Zero Generic Templates
// ============================================================================

export type MarketDirection = 'BULLISH' | 'BEARISH' | 'NEUTRAL_VOLATILE';

export interface ArticleInput {
    title: string;
    summary?: string;
    sourceType?: string;
    sentimentHint?: string;
    url?: string;
}

export interface MarketIntelligenceInsight {
    direction: MarketDirection;
    directionLabel: string;
    directionBadgeColor: string;
    directionPillBg: string;
    assetsInvolved: string[];
    driver: string;             // Meccanismo causale specifico della notizia
    operationalOutlook: string; // Effetto atteso su volatilità, liquidità o direzionalità
    operationalMeaning: string; // Full composite caption (backward compatibility)
    confidenceScore: number;
}

/**
 * Deep contextual semantic impact analyzer.
 * Inspects title and summary to produce unique, tailored operational insights.
 */
export function generateArticleImpact(article: ArticleInput): MarketIntelligenceInsight {
    const rawTitle = article.title || '';
    const rawSummary = article.summary || '';
    const text = `${rawTitle} ${rawSummary}`.toLowerCase();
    const sourceType = (article.sourceType || 'ALL').toUpperCase();

    // 1. Identify specific named entities and catalyst categories
    const hasFedMacro = /fed|powell|lagarde|ecb|bce|cpi|pce|fomc|jobs|payroll|inflation|tassi|rate cut|rate hike|yield|treasury|recession/i.test(text);
    const hasCrypto = /bitcoin|btc|ethereum|eth|solana|sol|crypto|binance|sec|etf|halving|on-chain|defi|altcoin|mining|liquidation|stablecoin/i.test(text);
    const hasCommodities = /oil|crude|petrolio|brent|wti|gold|oro|silver|opec|middle east|geopolitic|gas|energy/i.test(text);
    const hasTechEquities = /tech|nasdaq|apple|aapl|nvidia|nvda|microsoft|msft|semiconductor|earnings|wall street|s&p|spx/i.test(text);

    // 2. Select targeted impacted assets
    const assets: string[] = [];

    if (hasFedMacro) {
        assets.push('Indici USA (NQ, ES)', 'Forex (DXY, EUR/USD)');
    }
    if (hasCrypto) {
        if (/bitcoin|btc/i.test(text)) assets.push('Crypto (BTC)');
        if (/ethereum|eth/i.test(text)) assets.push('Crypto (ETH)');
        if (/solana|sol|altcoin/i.test(text)) assets.push('Crypto (Altcoins)');
        if (!assets.some(a => a.includes('Crypto'))) assets.push('Crypto (BTC, ETH, Altcoins)');
    }
    if (hasCommodities) {
        assets.push('Commodities (Brent, Gold)');
    }
    if (hasTechEquities && !assets.some(a => a.includes('Indici USA'))) {
        assets.push('Tech Equities (NQ)');
    }

    // Fallback if none matched
    if (assets.length === 0) {
        if (sourceType === 'CRYPTO') assets.push('Crypto (BTC, ETH, Altcoins)');
        else if (sourceType === 'FED' || sourceType === 'MACRO') assets.push('Indici USA (NQ, ES)', 'Forex (DXY, EUR/USD)');
        else if (sourceType === 'COMMODITIES') assets.push('Commodities (Brent, Gold)');
        else assets.push('Indici Globali (ES, NQ)');
    }

    // 3. Directional classification with contextual weight
    const bullishKeywords = [
        'surge', 'gain', 'bull', 'record', 'soar', 'all-time high', 'ath', 'inflow', 'approved',
        'rate cut', 'cut rates', 'rally', 'positive', 'breakout', 'growth', 'backs', 'expands',
        'cooling inflation', 'disinflation', 'boost', 'upgrade', 'climb', 'accumul', 'support',
        'jump', 'green', 'acquisition', 'stimulus', 'dovish'
    ];
    const bearishKeywords = [
        'crash', 'drop', 'fall', 'plunge', 'dump', 'loss', 'liquidation', 'ban', 'sue',
        'lawsuit', 'bear', 'freeze', 'inflation surge', 'rejection', 'warning', 'risk',
        'slowdown', 'decline', 'hawkish', 'hike', 'tariff', 'recession', 'debt', 'selloff',
        'deficit', 'war', 'escalat', 'bleeding', 'fear'
    ];

    let bullScore = 0;
    let bearScore = 0;

    bullishKeywords.forEach(word => {
        if (text.includes(word)) bullScore += 1.5;
    });
    bearishKeywords.forEach(word => {
        if (text.includes(word)) bearScore += 1.5;
    });

    if (article.sentimentHint) {
        const hint = article.sentimentHint.toLowerCase();
        if (hint.includes('bull')) bullScore += 3;
        if (hint.includes('bear')) bearScore += 3;
    }

    let direction: MarketDirection = 'NEUTRAL_VOLATILE';
    if (bullScore > bearScore + 1) {
        direction = 'BULLISH';
    } else if (bearScore > bullScore + 1) {
        direction = 'BEARISH';
    } else {
        direction = 'NEUTRAL_VOLATILE';
    }

    // 4. Generate Specific, Contextual Driver & Operational Outlook
    // Extract key subjects or entities from the title
    const cleanTitleSnippet = rawTitle.length > 70 ? rawTitle.slice(0, 67) + '...' : rawTitle;

    let driver = '';
    let operationalOutlook = '';

    if (hasFedMacro) {
        if (direction === 'BULLISH') {
            driver = `Dati macroeconomici e segnali accomodanti da banche centrali ("${cleanTitleSnippet}") alimentano le probabilità di allentamento monetario e calo dei rendimenti obbligazionari.`;
            operationalOutlook = `Espansione di liquidità favorevole per risk-on: attesa compressione degli spread e rally su indici growth e digital asset con volatilità controllata.`;
        } else if (direction === 'BEARISH') {
            driver = `Pressioni inflazionistiche o toni restrittivi evidenziati in "${cleanTitleSnippet}" sostengono i rendimenti reali e drenano liquidità dai mercati azionari e crypto.`;
            operationalOutlook = `Rafforzamento del dollaro (DXY) e possibile de-risking istituzionale: atteso aumento della volatilità discendente con test dei supporti settimanali.`;
        } else {
            driver = `Posizionamento interlocutorio degli operatori di fronte alle dinamiche macro descritte in "${cleanTitleSnippet}".`;
            operationalOutlook = `Fase di attesa e consolidamento in range stretto: volatilità implicita compressa in attesa di rotture volumetriche confermate.`;
        }
    } else if (hasCrypto) {
        if (direction === 'BULLISH') {
            driver = `Catalizzatore strutturale su asset digitali ("${cleanTitleSnippet}") che stimola afflussi netti spot e consolidamento dei libri ordini.`;
            operationalOutlook = `Aumento di Open Interest con funding rate equilibrato: favoriti breakout di continuazione rialzista con trailing stop a protezione dei profitti.`;
        } else if (direction === 'BEARISH') {
            driver = `Pressioni venditrici o shock regolamentare/on-chain evidenziato in "${cleanTitleSnippet}", con flush di leva speculativa.`;
            operationalOutlook = `Rischio di liquidazioni a cascata e diradamento temporaneo del bid: attendere pattern di assorbimento volumetrico evitando ingressi impulsivi di rimbalzo.`;
        } else {
            driver = `Fase di accumulazione o riequilibrio di liquidità legata a "${cleanTitleSnippet}".`;
            operationalOutlook = `Volatilità laterale con oscillazioni adatte a strategie mean-reverting all'interno dei livelli di liquidità intraday.`;
        }
    } else if (hasCommodities) {
        if (direction === 'BULLISH') {
            driver = `Tensioni di offerta o driver geopolitici rilevati in "${cleanTitleSnippet}" innescano acquisti mirati su materie prime e beni rifugio.`;
            operationalOutlook = `Pressione al rialzo su oro e greggio che potrebbe riaccendere timori di inflazione importata: monitorare le correlazioni inverse con gli indici azionari.`;
        } else if (direction === 'BEARISH') {
            driver = `Aumento delle scorte o de-escalation che allenta i premi al rischio sulle materie prime ("${cleanTitleSnippet}").`;
            operationalOutlook = `Rientro dei prezzi energetici con effetto disinflazionistico positivo sui margini aziendali e sollievo per i comparti ciclici.`;
        } else {
            driver = `Equilibrio tra domanda globale e quote produttive in riferimento a "${cleanTitleSnippet}".`;
            operationalOutlook = `Prezzi ancorati ai pivot volumetrici di medio termine; volatilità stabile con focus sui dati settimanali di magazzino.`;
        }
    } else {
        // Tech & General
        if (direction === 'BULLISH') {
            driver = `Spinta positiva di settore ("${cleanTitleSnippet}") che rinvigorisce la fiducia degli investitori istituzionali.`;
            operationalOutlook = `Flussi selettivi su titoli leader; favorevole per operazioni in trend-following con rapporto Rischio:Rendimento superiore a 1:2.`;
        } else if (direction === 'BEARISH') {
            driver = `Avversione al rischio o prese di beneficio innescate da "${cleanTitleSnippet}".`;
            operationalOutlook = `Incremento del VIX e rotazione verso difensivi: raccomandata riduzione della size operativa e rigida applicazione dello stop loss.`;
        } else {
            driver = `Dinamica informativa neutrale o bilanciata legata a "${cleanTitleSnippet}".`;
            operationalOutlook = `Atteso trading di range; ideale per attendere conferme di prezzo prima di aprire nuove posizioni.`;
        }
    }

    // Direction visual configuration
    let directionLabel = 'Alta Volatilità / Neutro';
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

    const operationalMeaning = `Driver: ${driver} Outlook Operativo: ${operationalOutlook}`;

    return {
        direction,
        directionLabel,
        directionBadgeColor,
        directionPillBg,
        assetsInvolved: Array.from(new Set(assets)).slice(0, 3),
        driver,
        operationalOutlook,
        operationalMeaning,
        confidenceScore: Math.min(95, 65 + Math.round(Math.abs(bullScore - bearScore) * 6))
    };
}

/**
 * Backward compatible alias for analyzeMarketImpact
 */
export function analyzeMarketImpact(
    title: string,
    summary = '',
    sourceType = 'ALL',
    sentimentHint?: string
): MarketIntelligenceInsight {
    return generateArticleImpact({ title, summary, sourceType, sentimentHint });
}
