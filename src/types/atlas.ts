// ============================================================================
// TRADYX ATLAS GLOBAL MACRO & MARKET INTELLIGENCE TYPES (src/types/atlas.ts)
// ============================================================================

export type WorldRegion =
    | 'Nord America'
    | 'Sud America'
    | 'Europa'
    | 'Medio Oriente'
    | 'Africa'
    | 'Asia'
    | 'Oceania';

export interface HubBlueChip {
    symbol: string;
    name: string;
    sector: string;
    basePrice: number;
    marketCapBn: number;
}

export interface HubMacroData {
    centralBank: string;
    policyRate: number;            // %
    inflationCpi: number;          // YoY %
    gdpGrowth: number;             // YoY %
    gdpNominalBn: number;          // USD Billions
    gdpPerCapitaUsd: number;       // USD
    unemployment: number;          // %
    debtToGdp: number;             // %
    tradeBalanceBn: number;        // USD Billions
    currentAccountToGdp: number;   // % of GDP
    grossFixedCapexPct: number;    // % of GDP (CAPEX)
    fdiToGdpPct: number;           // % of GDP
    fxReservesBn: number;          // USD Billions
    sovereignRating: string;       // e.g. AAA, AA+, BBB
    source?: 'worldbank_live' | 'institutional_baseline';
}

export interface FdiSectorAllocation {
    sector: string;
    share: number; // %
}

export interface FdiHistoryPoint {
    year: string;
    inflowBn: number; // USD Billions
}

export interface EquitySectorWeight {
    name: string;
    weight: number; // %
}

export interface GlobalHub {
    id: string;
    iso2: string;
    iso3: string;
    countryName: string;       // Italian name
    countryNameEn: string;     // English name
    flag: string;
    city: string;
    exchangeName: string;
    exchangeCode: string;      // e.g. NYSE, MTA, LSE, XETRA, TSE
    region: WorldRegion;
    lat: number;
    lng: number;
    utcOffset: number;         // hours from UTC
    openHour: number;          // local exchange open hour (0-23)
    closeHour: number;         // local exchange close hour (0-23)
    currencyCode: string;
    fxPairLabel: string;       // e.g. EUR/USD, USD/JPY
    fxBaseRate: number;
    primaryIndex: {
        symbol: string;
        name: string;
        basePrice: number;
        changePct: number;
    };
    topStocks: HubBlueChip[];
    bondYields: {
        y2: number;
        y5: number;
        y10: number;
    };
    macro: HubMacroData;
    fdiSectors: FdiSectorAllocation[];
    fdiHistory5Y: FdiHistoryPoint[];
    equityMarket: {
        totalMarketCapBn: number;
        marketCapToGdpPct: number;
        topSectors: EquitySectorWeight[];
    };
    isFlagship?: boolean;
}

export type AtlasAssetCategory =
    | 'COUNTRY'
    | 'INDICES'
    | 'STOCKS'
    | 'FOREX'
    | 'BONDS'
    | 'COMMODITIES'
    | 'CRYPTO'
    | 'ETF';

export interface AtlasLiveAsset {
    id: string;
    symbol: string;
    name: string;
    category: Exclude<AtlasAssetCategory, 'COUNTRY'>;
    countryId?: string;
    isLocalToCountry?: boolean;
    price: number;
    prevPrice: number;
    bid: number;
    ask: number;
    dayLow: number;
    dayHigh: number;
    changePct: number;
    changePts: number;
    flash: 'up' | 'down' | null;
    unit?: string;       // e.g. '%', '$', 'pts'
    decimals?: number;
    sparkline: number[];
    source: 'binance_ws' | 'coingecko' | 'fx_api' | 'live_engine';
}

export type NewsSentiment = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export interface AtlasNewsItem {
    id: string;
    title: string;
    source: string;
    publishedAt: string;
    timeAgo: string;
    url: string;
    category: string;
    isLiveFeed: boolean;
    aiImpact: {
        operationalImpact: string;
        sentiment: NewsSentiment;
        impactedTickers: string[];
    };
}
