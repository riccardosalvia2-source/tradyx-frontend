// ============================================================================
// TRADYX ATLAS — 115 GLOBAL FINANCIAL HUBS DATASET (110+ COUNTRIES)
// (src/data/globalHubs.ts)
// Covers North/Central/South America, Western & Eastern Europe, Middle East,
// Africa, Asia & Oceania with exact coordinates, exchanges, indices, blue chips,
// sovereign yields, macro indicators, FDI breakdown & Equity Market Cap.
// ============================================================================

import { GlobalHub, WorldRegion, HubBlueChip } from '../types/atlas';

interface CompactHubSeed {
    id: string;
    iso2: string;
    iso3: string;
    countryName: string;
    countryNameEn: string;
    flag: string;
    city: string;
    exchangeName: string;
    region: WorldRegion;
    lat: number;
    lng: number;
    utcOffset: number;
    openHour?: number;
    closeHour?: number;
    currency: string;
    fxPair: string;
    fxRate: number;
    idxSym: string;
    idxName: string;
    idxPrice: number;
    centralBank: string;
    policyRate: number;
    cpi: number;
    gdpGrowth: number;
    gdpBn: number;
    unemp: number;
    debtGdp: number;
    tradeBn: number;
    reservesBn: number;
    rating: string;
    y10: number;
    mktCapBn: number;
    fdiProfile: 'tech' | 'finance' | 'energy' | 'industrial' | 'balanced' | 'emerging';
    stocks?: HubBlueChip[];
    isFlagship?: boolean;
}

const FDI_PROFILES: Record<CompactHubSeed['fdiProfile'], { sector: string; share: number }[]> = {
    tech: [
        { sector: 'Tech & Digitale', share: 31 },
        { sector: 'Finanza & Banche', share: 19 },
        { sector: 'Sanità', share: 13 },
        { sector: 'Manifatturiero', share: 12 },
        { sector: 'Energia', share: 10 },
        { sector: 'Immobiliare', share: 8 },
        { sector: 'Trasporti', share: 7 }
    ],
    finance: [
        { sector: 'Finanza & Banche', share: 33 },
        { sector: 'Tech & Digitale', share: 20 },
        { sector: 'Immobiliare', share: 14 },
        { sector: 'Energia', share: 10 },
        { sector: 'Sanità', share: 9 },
        { sector: 'Trasporti', share: 7 },
        { sector: 'Manifatturiero', share: 7 }
    ],
    energy: [
        { sector: 'Energia', share: 34 },
        { sector: 'Immobiliare', share: 16 },
        { sector: 'Finanza & Banche', share: 15 },
        { sector: 'Manifatturiero', share: 12 },
        { sector: 'Trasporti', share: 9 },
        { sector: 'Tech & Digitale', share: 8 },
        { sector: 'Sanità', share: 6 }
    ],
    industrial: [
        { sector: 'Manifatturiero', share: 30 },
        { sector: 'Tech & Digitale', share: 19 },
        { sector: 'Energia', share: 14 },
        { sector: 'Finanza & Banche', share: 12 },
        { sector: 'Trasporti', share: 10 },
        { sector: 'Sanità', share: 9 },
        { sector: 'Immobiliare', share: 6 }
    ],
    balanced: [
        { sector: 'Finanza & Banche', share: 22 },
        { sector: 'Manifatturiero', share: 20 },
        { sector: 'Tech & Digitale', share: 17 },
        { sector: 'Energia', share: 13 },
        { sector: 'Immobiliare', share: 11 },
        { sector: 'Trasporti', share: 9 },
        { sector: 'Sanità', share: 8 }
    ],
    emerging: [
        { sector: 'Energia', share: 25 },
        { sector: 'Manifatturiero', share: 22 },
        { sector: 'Finanza & Banche', share: 17 },
        { sector: 'Immobiliare', share: 13 },
        { sector: 'Trasporti', share: 10 },
        { sector: 'Tech & Digitale', share: 8 },
        { sector: 'Sanità', share: 5 }
    ]
};

const EQUITY_SECTORS_BY_PROFILE: Record<CompactHubSeed['fdiProfile'], { name: string; weight: number }[]> = {
    tech: [
        { name: 'Tecnologia', weight: 32 },
        { name: 'Finanza', weight: 18 },
        { name: 'Sanità', weight: 15 },
        { name: 'Consumi', weight: 14 },
        { name: 'Industria', weight: 12 },
        { name: 'Energia', weight: 9 }
    ],
    finance: [
        { name: 'Finanza', weight: 35 },
        { name: 'Tecnologia', weight: 19 },
        { name: 'Immobiliare', weight: 14 },
        { name: 'Industria', weight: 13 },
        { name: 'Sanità', weight: 10 },
        { name: 'Energia', weight: 9 }
    ],
    energy: [
        { name: 'Energia & Materie', weight: 41 },
        { name: 'Finanza', weight: 24 },
        { name: 'Telecom & Utility', weight: 14 },
        { name: 'Industria', weight: 11 },
        { name: 'Immobiliare', weight: 10 }
    ],
    industrial: [
        { name: 'Industria & Auto', weight: 31 },
        { name: 'Tecnologia', weight: 22 },
        { name: 'Finanza', weight: 17 },
        { name: 'Sanità', weight: 12 },
        { name: 'Consumi', weight: 10 },
        { name: 'Energia', weight: 8 }
    ],
    balanced: [
        { name: 'Finanza', weight: 25 },
        { name: 'Industria', weight: 21 },
        { name: 'Consumi', weight: 17 },
        { name: 'Energia & Utility', weight: 15 },
        { name: 'Tecnologia', weight: 12 },
        { name: 'Sanità', weight: 10 }
    ],
    emerging: [
        { name: 'Finanza & Banche', weight: 34 },
        { name: 'Energia & Mining', weight: 26 },
        { name: 'Telecom', weight: 15 },
        { name: 'Consumi', weight: 14 },
        { name: 'Industria', weight: 11 }
    ]
};

function hashSeed(str: string): number {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
}

function buildHub(s: CompactHubSeed): GlobalHub {
    const h = hashSeed(s.id);
    const baseFdi = Math.max(0.4, Number((s.gdpBn * (0.015 + ((h % 25) / 1000))).toFixed(1)));
    const fdiHistory5Y = [
        { year: '2022', inflowBn: Number((baseFdi * 0.84).toFixed(1)) },
        { year: '2023', inflowBn: Number((baseFdi * 0.92).toFixed(1)) },
        { year: '2024', inflowBn: Number((baseFdi * 0.98).toFixed(1)) },
        { year: '2025', inflowBn: Number((baseFdi * 1.07).toFixed(1)) },
        { year: '2026', inflowBn: Number((baseFdi * 1.14).toFixed(1)) }
    ];

    const y10 = s.y10;
    const y2 = Number(Math.max(0.35, y10 - 0.45 + ((h % 9) - 4) * 0.08).toFixed(2));
    const y5 = Number(((y2 + y10) / 2).toFixed(2));
    const changePct = Number((((h % 320) - 140) / 100).toFixed(2));

    const defaultStocks: HubBlueChip[] = s.stocks || [
        {
            symbol: `${s.iso2}BK`,
            name: `${s.countryName} National Bank`,
            sector: 'Finanza',
            basePrice: Number((18 + (h % 85)).toFixed(2)),
            marketCapBn: Number(Math.max(1.2, s.mktCapBn * 0.14).toFixed(1))
        },
        {
            symbol: `${s.iso2}EN`,
            name: `${s.city} Energy & Grid`,
            sector: 'Energia',
            basePrice: Number((12 + (h % 64)).toFixed(2)),
            marketCapBn: Number(Math.max(0.9, s.mktCapBn * 0.11).toFixed(1))
        },
        {
            symbol: `${s.iso2}TL`,
            name: `${s.countryName} Telecom Group`,
            sector: 'Tech & Telecom',
            basePrice: Number((9 + (h % 50)).toFixed(2)),
            marketCapBn: Number(Math.max(0.7, s.mktCapBn * 0.09).toFixed(1))
        }
    ];

    const mktCapToGdpPct = Number(
        Math.min(340, Math.max(8, (s.mktCapBn / Math.max(1, s.gdpBn)) * 100)).toFixed(1)
    );

    const fdiToGdpPct = Number(
        Math.min(18, Math.max(0.6, (fdiHistory5Y[fdiHistory5Y.length - 1].inflowBn / Math.max(1, s.gdpBn)) * 100)).toFixed(2)
    );
    const currentAccountToGdp = Number(
        Math.max(-14, Math.min(18, (s.tradeBn / Math.max(1, s.gdpBn)) * 100)).toFixed(2)
    );
    const grossFixedCapexPct = Number(
        (s.fdiProfile === 'industrial' || s.fdiProfile === 'tech' ? 23.5 : s.fdiProfile === 'energy' ? 25.2 : 20.4 + ((h % 7) - 3) * 0.7).toFixed(1)
    );
    const gdpPerCapitaUsd = Math.round(
        s.rating.startsWith('AAA') ? 68000 + (h % 28000)
        : s.rating.startsWith('AA') ? 48000 + (h % 22000)
        : s.rating.startsWith('A') ? 32000 + (h % 18000)
        : s.rating.startsWith('BBB') ? 16500 + (h % 14000)
        : s.rating.startsWith('BB') ? 7800 + (h % 6800)
        : 2400 + (h % 4100)
    );
    const parenMatch = s.exchangeName.match(/\(([^)]+)\)/);
    const exchangeCode = parenMatch ? parenMatch[1].toUpperCase() : s.idxSym.slice(0, 6).toUpperCase();

    return {
        id: s.id,
        iso2: s.iso2,
        iso3: s.iso3,
        countryName: s.countryName,
        countryNameEn: s.countryNameEn,
        flag: s.flag,
        city: s.city,
        exchangeName: s.exchangeName,
        exchangeCode,
        region: s.region,
        lat: s.lat,
        lng: s.lng,
        utcOffset: s.utcOffset,
        openHour: s.openHour ?? 9,
        closeHour: s.closeHour ?? 17,
        currencyCode: s.currency,
        fxPairLabel: s.fxPair,
        fxBaseRate: s.fxRate,
        primaryIndex: {
            symbol: s.idxSym,
            name: s.idxName,
            basePrice: s.idxPrice,
            changePct
        },
        topStocks: defaultStocks,
        bondYields: { y2, y5, y10 },
        macro: {
            centralBank: s.centralBank,
            policyRate: s.policyRate,
            inflationCpi: s.cpi,
            gdpGrowth: s.gdpGrowth,
            gdpNominalBn: s.gdpBn,
            gdpPerCapitaUsd,
            unemployment: s.unemp,
            debtToGdp: s.debtGdp,
            tradeBalanceBn: s.tradeBn,
            currentAccountToGdp,
            grossFixedCapexPct,
            fdiToGdpPct,
            fxReservesBn: s.reservesBn,
            sovereignRating: s.rating,
            source: 'institutional_baseline'
        },
        fdiSectors: FDI_PROFILES[s.fdiProfile],
        fdiHistory5Y,
        equityMarket: {
            totalMarketCapBn: s.mktCapBn,
            marketCapToGdpPct: mktCapToGdpPct,
            topSectors: EQUITY_SECTORS_BY_PROFILE[s.fdiProfile]
        },
        isFlagship: s.isFlagship
    };
}

const HUB_SEEDS: CompactHubSeed[] = [
    // ======================= NORD & CENTRO AMERICA (13) =======================
    {
        id: 'us-nyc', iso2: 'US', iso3: 'USA', countryName: 'Stati Uniti (Wall Street)', countryNameEn: 'United States',
        flag: '🇺🇸', city: 'New York', exchangeName: 'NYSE / NASDAQ', region: 'Nord America',
        lat: 40.71, lng: -74.01, utcOffset: -5, openHour: 9, closeHour: 16, currency: 'USD', fxPair: 'DXY', fxRate: 104.25,
        idxSym: 'SPX', idxName: 'S&P 500', idxPrice: 5985.4, centralBank: 'Federal Reserve', policyRate: 4.5, cpi: 2.6,
        gdpGrowth: 2.7, gdpBn: 29180, unemp: 4.1, debtGdp: 122.3, tradeBn: -785, reservesBn: 245, rating: 'AA+', y10: 4.28, mktCapBn: 55200,
        fdiProfile: 'tech', isFlagship: true,
        stocks: [
            { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'AI & Semiconduttori', basePrice: 142.8, marketCapBn: 3490 },
            { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Tecnologia', basePrice: 231.5, marketCapBn: 3520 },
            { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Cloud & AI', basePrice: 438.2, marketCapBn: 3250 },
            { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Finanza', basePrice: 241.6, marketCapBn: 685 }
        ]
    },
    {
        id: 'us-chi', iso2: 'US', iso3: 'USA', countryName: 'Stati Uniti (Derivati CME)', countryNameEn: 'United States Chicago',
        flag: '🇺🇸', city: 'Chicago', exchangeName: 'CME Group / CBOE', region: 'Nord America',
        lat: 41.88, lng: -87.63, utcOffset: -6, openHour: 8, closeHour: 16, currency: 'USD', fxPair: 'DXY', fxRate: 104.25,
        idxSym: 'NQ', idxName: 'Nasdaq 100 Futures', idxPrice: 21145.0, centralBank: 'Federal Reserve', policyRate: 4.5, cpi: 2.6,
        gdpGrowth: 2.7, gdpBn: 29180, unemp: 4.1, debtGdp: 122.3, tradeBn: -785, reservesBn: 245, rating: 'AA+', y10: 4.28, mktCapBn: 55200,
        fdiProfile: 'finance', isFlagship: true,
        stocks: [
            { symbol: 'CME', name: 'CME Group Inc.', sector: 'Derivati & Exchange', basePrice: 229.4, marketCapBn: 82.6 },
            { symbol: 'CBOE', name: 'Cboe Global Markets', sector: 'Volatilità & Opzioni', basePrice: 204.2, marketCapBn: 21.4 },
            { symbol: 'CAT', name: 'Caterpillar Inc.', sector: 'Industria', basePrice: 389.5, marketCapBn: 188.0 }
        ]
    },
    {
        id: 'us-sf', iso2: 'US', iso3: 'USA', countryName: 'Stati Uniti (Silicon Valley)', countryNameEn: 'United States San Francisco',
        flag: '🇺🇸', city: 'San Francisco', exchangeName: 'NASDAQ Tech Hub', region: 'Nord America',
        lat: 37.77, lng: -122.42, utcOffset: -8, openHour: 6, closeHour: 13, currency: 'USD', fxPair: 'DXY', fxRate: 104.25,
        idxSym: 'NDX', idxName: 'NASDAQ 100', idxPrice: 21080.5, centralBank: 'Federal Reserve', policyRate: 4.5, cpi: 2.6,
        gdpGrowth: 2.7, gdpBn: 29180, unemp: 4.1, debtGdp: 122.3, tradeBn: -785, reservesBn: 245, rating: 'AA+', y10: 4.28, mktCapBn: 55200,
        fdiProfile: 'tech', isFlagship: true,
        stocks: [
            { symbol: 'META', name: 'Meta Platforms', sector: 'AI & Social', basePrice: 592.4, marketCapBn: 1495 },
            { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'AI & Search', basePrice: 179.8, marketCapBn: 2210 },
            { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'EV & Robotica', basePrice: 342.1, marketCapBn: 1095 }
        ]
    },
    {
        id: 'us-mia', iso2: 'US', iso3: 'USA', countryName: 'Stati Uniti (Miami LatAm Hub)', countryNameEn: 'United States Miami',
        flag: '🇺🇸', city: 'Miami', exchangeName: 'MIAX / LatAm Desk', region: 'Nord America',
        lat: 25.76, lng: -80.19, utcOffset: -5, openHour: 9, closeHour: 16, currency: 'USD', fxPair: 'DXY', fxRate: 104.25,
        idxSym: 'DJI', idxName: 'Dow Jones 30', idxPrice: 44120.0, centralBank: 'Federal Reserve', policyRate: 4.5, cpi: 2.6,
        gdpGrowth: 2.7, gdpBn: 29180, unemp: 4.1, debtGdp: 122.3, tradeBn: -785, reservesBn: 245, rating: 'AA+', y10: 4.28, mktCapBn: 55200,
        fdiProfile: 'finance',
        stocks: [
            { symbol: 'NEE', name: 'NextEra Energy', sector: 'Energia', basePrice: 78.4, marketCapBn: 161.0 },
            { symbol: 'LEN', name: 'Lennar Corp.', sector: 'Immobiliare', basePrice: 174.2, marketCapBn: 46.8 },
            { symbol: 'RCL', name: 'Royal Caribbean', sector: 'Consumi', basePrice: 234.5, marketCapBn: 62.1 }
        ]
    },
    {
        id: 'ca-tor', iso2: 'CA', iso3: 'CAN', countryName: 'Canada', countryNameEn: 'Canada',
        flag: '🇨🇦', city: 'Toronto', exchangeName: 'Toronto Stock Exchange (TSX)', region: 'Nord America',
        lat: 43.65, lng: -79.38, utcOffset: -5, openHour: 9, closeHour: 16, currency: 'CAD', fxPair: 'USD/CAD', fxRate: 1.394,
        idxSym: 'TSX', idxName: 'S&P/TSX Composite', idxPrice: 25140.2, centralBank: 'Bank of Canada', policyRate: 3.75, cpi: 2.0,
        gdpGrowth: 1.4, gdpBn: 2240, unemp: 6.5, debtGdp: 107.1, tradeBn: 12.4, reservesBn: 124, rating: 'AAA', y10: 3.31, mktCapBn: 3310,
        fdiProfile: 'energy', isFlagship: true,
        stocks: [
            { symbol: 'RY', name: 'Royal Bank of Canada', sector: 'Finanza', basePrice: 124.6, marketCapBn: 176.0 },
            { symbol: 'SHOP', name: 'Shopify Inc.', sector: 'Tech & E-Commerce', basePrice: 108.9, marketCapBn: 141.0 },
            { symbol: 'ENB', name: 'Enbridge Inc.', sector: 'Energia', basePrice: 43.2, marketCapBn: 94.0 }
        ]
    },
    {
        id: 'mx-cdmx', iso2: 'MX', iso3: 'MEX', countryName: 'Messico', countryNameEn: 'Mexico',
        flag: '🇲🇽', city: 'Città del Messico', exchangeName: 'Bolsa Mexicana (BMV)', region: 'Nord America',
        lat: 19.43, lng: -99.13, utcOffset: -6, openHour: 8, closeHour: 15, currency: 'MXN', fxPair: 'USD/MXN', fxRate: 20.18,
        idxSym: 'IPC', idxName: 'S&P/BMV IPC', idxPrice: 51480.0, centralBank: 'Banxico', policyRate: 10.25, cpi: 4.5,
        gdpGrowth: 1.8, gdpBn: 1850, unemp: 2.9, debtGdp: 54.2, tradeBn: -8.5, reservesBn: 228, rating: 'BBB', y10: 9.85, mktCapBn: 540,
        fdiProfile: 'industrial', isFlagship: true,
        stocks: [
            { symbol: 'AMX', name: 'América Móvil', sector: 'Telecom', basePrice: 15.8, marketCapBn: 49.5 },
            { symbol: 'WALMEX', name: 'Walmart de México', sector: 'Retail', basePrice: 2.95, marketCapBn: 51.4 },
            { symbol: 'GMEXICO', name: 'Grupo México', sector: 'Mining & Rame', basePrice: 5.4, marketCapBn: 42.1 }
        ]
    },
    {
        id: 'pa-pty', iso2: 'PA', iso3: 'PAN', countryName: 'Panama', countryNameEn: 'Panama',
        flag: '🇵🇦', city: 'Città di Panama', exchangeName: 'Latinex', region: 'Nord America',
        lat: 8.98, lng: -79.52, utcOffset: -5, currency: 'PAB', fxPair: 'USD/PAB', fxRate: 1.0,
        idxSym: 'BVPSI', idxName: 'BVPSI Index', idxPrice: 448.2, centralBank: 'Superintendencia Bancos', policyRate: 4.5, cpi: 1.6,
        gdpGrowth: 3.1, gdpBn: 87, unemp: 7.4, debtGdp: 61.5, tradeBn: -6.2, reservesBn: 6.8, rating: 'BBB-', y10: 6.42, mktCapBn: 16, fdiProfile: 'finance'
    },
    {
        id: 'cr-sjo', iso2: 'CR', iso3: 'CRI', countryName: 'Costa Rica', countryNameEn: 'Costa Rica',
        flag: '🇨🇷', city: 'San José', exchangeName: 'Bolsa Nacional de Valores', region: 'Nord America',
        lat: 9.93, lng: -84.09, utcOffset: -6, currency: 'CRC', fxPair: 'USD/CRC', fxRate: 512.4,
        idxSym: 'BNVCR', idxName: 'BNV Composite', idxPrice: 1185.0, centralBank: 'BCCR', policyRate: 4.0, cpi: 0.9,
        gdpGrowth: 4.0, gdpBn: 95, unemp: 7.1, debtGdp: 61.2, tradeBn: -2.1, reservesBn: 14.1, rating: 'BB-', y10: 6.15, mktCapBn: 4.8, fdiProfile: 'tech'
    },
    {
        id: 'do-sdq', iso2: 'DO', iso3: 'DOM', countryName: 'Repubblica Dominicana', countryNameEn: 'Dominican Republic',
        flag: '🇩🇴', city: 'Santo Domingo', exchangeName: 'BVRD', region: 'Nord America',
        lat: 18.48, lng: -69.93, utcOffset: -4, currency: 'DOP', fxPair: 'USD/DOP', fxRate: 60.15,
        idxSym: 'BVRD', idxName: 'BVRD Index', idxPrice: 742.5, centralBank: 'Banco Central RD', policyRate: 6.25, cpi: 3.4,
        gdpGrowth: 5.0, gdpBn: 127, unemp: 5.3, debtGdp: 59.0, tradeBn: -11.4, reservesBn: 15.2, rating: 'BB', y10: 6.85, mktCapBn: 9.2, fdiProfile: 'emerging'
    },
    {
        id: 'jm-kin', iso2: 'JM', iso3: 'JAM', countryName: 'Giamaica', countryNameEn: 'Jamaica',
        flag: '🇯🇲', city: 'Kingston', exchangeName: 'Jamaica Stock Exchange', region: 'Nord America',
        lat: 17.97, lng: -76.79, utcOffset: -5, currency: 'JMD', fxPair: 'USD/JMD', fxRate: 157.8,
        idxSym: 'JSEMAIN', idxName: 'JSE Main Index', idxPrice: 318450, centralBank: 'Bank of Jamaica', policyRate: 6.25, cpi: 5.1,
        gdpGrowth: 1.9, gdpBn: 20, unemp: 4.4, debtGdp: 72.4, tradeBn: -3.8, reservesBn: 5.3, rating: 'BB-', y10: 6.7, mktCapBn: 12.1, fdiProfile: 'finance'
    },
    {
        id: 'tt-pos', iso2: 'TT', iso3: 'TTO', countryName: 'Trinidad e Tobago', countryNameEn: 'Trinidad and Tobago',
        flag: '🇹🇹', city: 'Port of Spain', exchangeName: 'TTSE', region: 'Nord America',
        lat: 10.65, lng: -61.51, utcOffset: -4, currency: 'TTD', fxPair: 'USD/TTD', fxRate: 6.78,
        idxSym: 'TTCOMP', idxName: 'TTSE Composite', idxPrice: 1068.4, centralBank: 'Central Bank T&T', policyRate: 3.5, cpi: 0.8,
        gdpGrowth: 2.2, gdpBn: 28, unemp: 4.8, debtGdp: 54.0, tradeBn: 2.6, reservesBn: 6.1, rating: 'BBB-', y10: 5.65, mktCapBn: 15.4, fdiProfile: 'energy'
    },
    {
        id: 'bs-nas', iso2: 'BS', iso3: 'BHS', countryName: 'Bahamas', countryNameEn: 'Bahamas',
        flag: '🇧🇸', city: 'Nassau', exchangeName: 'BISX', region: 'Nord America',
        lat: 25.04, lng: -77.35, utcOffset: -5, currency: 'BSD', fxPair: 'USD/BSD', fxRate: 1.0,
        idxSym: 'BISX', idxName: 'BISX All Share', idxPrice: 2945.0, centralBank: 'Central Bank Bahamas', policyRate: 4.0, cpi: 2.1,
        gdpGrowth: 2.3, gdpBn: 15, unemp: 8.8, debtGdp: 82.0, tradeBn: -2.2, reservesBn: 2.8, rating: 'B+', y10: 7.45, mktCapBn: 5.4, fdiProfile: 'finance'
    },
    {
        id: 'gt-gua', iso2: 'GT', iso3: 'GTM', countryName: 'Guatemala', countryNameEn: 'Guatemala',
        flag: '🇬🇹', city: 'Città del Guatemala', exchangeName: 'BVN Guatemala', region: 'Nord America',
        lat: 14.63, lng: -90.51, utcOffset: -6, currency: 'GTQ', fxPair: 'USD/GTQ', fxRate: 7.72,
        idxSym: 'BVNGT', idxName: 'BVN Index', idxPrice: 615.0, centralBank: 'Banco de Guatemala', policyRate: 4.5, cpi: 3.2,
        gdpGrowth: 3.6, gdpBn: 112, unemp: 2.8, debtGdp: 27.4, tradeBn: -14.2, reservesBn: 23.4, rating: 'BB', y10: 6.25, mktCapBn: 6.1, fdiProfile: 'emerging'
    },

    // ======================= SUD AMERICA (11) =======================
    {
        id: 'br-sao', iso2: 'BR', iso3: 'BRA', countryName: 'Brasile', countryNameEn: 'Brazil',
        flag: '🇧🇷', city: 'San Paolo', exchangeName: 'B3 Brasil Bolsa Balcão', region: 'Sud America',
        lat: -23.55, lng: -46.63, utcOffset: -3, openHour: 10, closeHour: 17, currency: 'BRL', fxPair: 'USD/BRL', fxRate: 5.76,
        idxSym: 'BVSP', idxName: 'Ibovespa', idxPrice: 129450, centralBank: 'Banco Central do Brasil', policyRate: 11.25, cpi: 4.6,
        gdpGrowth: 3.0, gdpBn: 2290, unemp: 6.6, debtGdp: 87.6, tradeBn: 82.4, reservesBn: 368, rating: 'BB', y10: 12.65, mktCapBn: 910,
        fdiProfile: 'energy', isFlagship: true,
        stocks: [
            { symbol: 'PBR', name: 'Petrobras', sector: 'Energia', basePrice: 14.4, marketCapBn: 91.5 },
            { symbol: 'VALE', name: 'Vale S.A.', sector: 'Mining & Metalli', basePrice: 10.6, marketCapBn: 46.2 },
            { symbol: 'ITUB', name: 'Itaú Unibanco', sector: 'Finanza', basePrice: 6.2, marketCapBn: 60.4 }
        ]
    },
    {
        id: 'ar-bue', iso2: 'AR', iso3: 'ARG', countryName: 'Argentina', countryNameEn: 'Argentina',
        flag: '🇦🇷', city: 'Buenos Aires', exchangeName: 'BYMA', region: 'Sud America',
        lat: -34.60, lng: -58.38, utcOffset: -3, openHour: 11, closeHour: 17, currency: 'ARS', fxPair: 'USD/ARS', fxRate: 1005.0,
        idxSym: 'MERV', idxName: 'S&P Merval', idxPrice: 2145800, centralBank: 'BCRA', policyRate: 35.0, cpi: 38.5,
        gdpGrowth: 3.8, gdpBn: 635, unemp: 7.6, debtGdp: 89.2, tradeBn: 16.8, reservesBn: 31.2, rating: 'CCC', y10: 11.9, mktCapBn: 115,
        fdiProfile: 'energy',
        stocks: [
            { symbol: 'YPF', name: 'YPF S.A.', sector: 'Energia', basePrice: 36.4, marketCapBn: 14.3 },
            { symbol: 'GGAL', name: 'Grupo Financiero Galicia', sector: 'Finanza', basePrice: 58.2, marketCapBn: 8.6 },
            { symbol: 'MELI', name: 'MercadoLibre', sector: 'Tech & Fintech', basePrice: 1945.0, marketCapBn: 98.4 }
        ]
    },
    {
        id: 'cl-scl', iso2: 'CL', iso3: 'CHL', countryName: 'Cile', countryNameEn: 'Chile',
        flag: '🇨🇱', city: 'Santiago', exchangeName: 'Bolsa de Santiago', region: 'Sud America',
        lat: -33.45, lng: -70.66, utcOffset: -3, currency: 'CLP', fxPair: 'USD/CLP', fxRate: 965.0,
        idxSym: 'IPSA', idxName: 'S&P CLX IPSA', idxPrice: 6620.4, centralBank: 'Banco Central de Chile', policyRate: 5.25, cpi: 4.1,
        gdpGrowth: 2.5, gdpBn: 342, unemp: 8.5, debtGdp: 41.2, tradeBn: 18.4, reservesBn: 45.8, rating: 'A', y10: 5.65, mktCapBn: 184,
        fdiProfile: 'energy',
        stocks: [
            { symbol: 'SQM', name: 'Sociedad Química y Minera', sector: 'Litio & Chimica', basePrice: 40.8, marketCapBn: 11.6 },
            { symbol: 'BSAC', name: 'Banco Santander Chile', sector: 'Finanza', basePrice: 20.1, marketCapBn: 9.4 },
            { symbol: 'ENIC', name: 'Enel Chile', sector: 'Energia', basePrice: 3.1, marketCapBn: 4.2 }
        ]
    },
    {
        id: 'co-bog', iso2: 'CO', iso3: 'COL', countryName: 'Colombia', countryNameEn: 'Colombia',
        flag: '🇨🇴', city: 'Bogotà', exchangeName: 'Bolsa de Valores (BVC)', region: 'Sud America',
        lat: 4.71, lng: -74.07, utcOffset: -5, currency: 'COP', fxPair: 'USD/COP', fxRate: 4380.0,
        idxSym: 'COLCAP', idxName: 'MSCI COLCAP', idxPrice: 1384.2, centralBank: 'Banco de la República', policyRate: 9.75, cpi: 5.4,
        gdpGrowth: 2.1, gdpBn: 418, unemp: 9.8, debtGdp: 56.8, tradeBn: -9.8, reservesBn: 61.5, rating: 'BB+', y10: 10.35, mktCapBn: 82, fdiProfile: 'energy'
    },
    {
        id: 'pe-lim', iso2: 'PE', iso3: 'PER', countryName: 'Perù', countryNameEn: 'Peru',
        flag: '🇵🇪', city: 'Lima', exchangeName: 'Bolsa de Valores de Lima', region: 'Sud America',
        lat: -12.05, lng: -77.04, utcOffset: -5, currency: 'PEN', fxPair: 'USD/PEN', fxRate: 3.77,
        idxSym: 'SPBLPGPT', idxName: 'S&P/BVL Peru General', idxPrice: 29410.0, centralBank: 'BCRP', policyRate: 5.0, cpi: 2.1,
        gdpGrowth: 3.1, gdpBn: 285, unemp: 6.2, debtGdp: 33.4, tradeBn: 19.6, reservesBn: 82.4, rating: 'BBB', y10: 6.55, mktCapBn: 96, fdiProfile: 'energy'
    },
    {
        id: 'uy-mvd', iso2: 'UY', iso3: 'URY', countryName: 'Uruguay', countryNameEn: 'Uruguay',
        flag: '🇺🇾', city: 'Montevideo', exchangeName: 'Bolsa de Valores Montevideo', region: 'Sud America',
        lat: -34.90, lng: -56.16, utcOffset: -3, currency: 'UYU', fxPair: 'USD/UYU', fxRate: 41.9,
        idxSym: 'BVMUY', idxName: 'BVM Composite', idxPrice: 1520.0, centralBank: 'BCU', policyRate: 8.5, cpi: 5.0,
        gdpGrowth: 3.2, gdpBn: 83, unemp: 8.1, debtGdp: 63.4, tradeBn: 1.8, reservesBn: 17.5, rating: 'BBB+', y10: 8.9, mktCapBn: 4.5, fdiProfile: 'balanced'
    },
    {
        id: 'ec-uio', iso2: 'EC', iso3: 'ECU', countryName: 'Ecuador', countryNameEn: 'Ecuador',
        flag: '🇪🇨', city: 'Quito', exchangeName: 'Bolsa de Valores Quito', region: 'Sud America',
        lat: -0.18, lng: -78.47, utcOffset: -5, currency: 'USD', fxPair: 'USD/USD', fxRate: 1.0,
        idxSym: 'ECUINDEX', idxName: 'Ecuindex', idxPrice: 1214.0, centralBank: 'BCE Ecuador', policyRate: 4.5, cpi: 1.8,
        gdpGrowth: 1.4, gdpBn: 122, unemp: 3.8, debtGdp: 55.6, tradeBn: 4.1, reservesBn: 8.2, rating: 'B-', y10: 10.8, mktCapBn: 8.4, fdiProfile: 'energy'
    },
    {
        id: 'py-asu', iso2: 'PY', iso3: 'PRY', countryName: 'Paraguay', countryNameEn: 'Paraguay',
        flag: '🇵🇾', city: 'Asunción', exchangeName: 'BVA Paraguay', region: 'Sud America',
        lat: -25.26, lng: -57.58, utcOffset: -3, currency: 'PYG', fxPair: 'USD/PYG', fxRate: 7790.0,
        idxSym: 'BVAPY', idxName: 'BVA General', idxPrice: 892.0, centralBank: 'BCP', policyRate: 6.0, cpi: 3.8,
        gdpGrowth: 3.9, gdpBn: 46, unemp: 5.9, debtGdp: 39.2, tradeBn: 0.9, reservesBn: 10.1, rating: 'BBB-', y10: 6.1, mktCapBn: 3.8, fdiProfile: 'emerging'
    },
    {
        id: 'bo-lpz', iso2: 'BO', iso3: 'BOL', countryName: 'Bolivia', countryNameEn: 'Bolivia',
        flag: '🇧🇴', city: 'La Paz', exchangeName: 'Bolsa Boliviana (BBV)', region: 'Sud America',
        lat: -16.49, lng: -68.12, utcOffset: -4, currency: 'BOB', fxPair: 'USD/BOB', fxRate: 6.91,
        idxSym: 'BBVBO', idxName: 'BBV Index', idxPrice: 512.0, centralBank: 'BCB', policyRate: 4.0, cpi: 5.6,
        gdpGrowth: 1.7, gdpBn: 47, unemp: 4.2, debtGdp: 81.5, tradeBn: -0.7, reservesBn: 1.9, rating: 'CCC+', y10: 11.4, mktCapBn: 4.1, fdiProfile: 'energy'
    },
    {
        id: 've-ccs', iso2: 'VE', iso3: 'VEN', countryName: 'Venezuela', countryNameEn: 'Venezuela',
        flag: '🇻🇪', city: 'Caracas', exchangeName: 'Bolsa de Caracas (BVC)', region: 'Sud America',
        lat: 10.48, lng: -66.90, utcOffset: -4, currency: 'VES', fxPair: 'USD/VES', fxRate: 46.2,
        idxSym: 'IBC', idxName: 'IBC Caracas', idxPrice: 102400, centralBank: 'BCV', policyRate: 18.0, cpi: 44.0,
        gdpGrowth: 3.2, gdpBn: 102, unemp: 5.5, debtGdp: 158.0, tradeBn: 6.4, reservesBn: 10.3, rating: 'SD', y10: 14.5, mktCapBn: 3.6, fdiProfile: 'energy'
    },
    {
        id: 'gy-geo', iso2: 'GY', iso3: 'GUY', countryName: 'Guyana', countryNameEn: 'Guyana',
        flag: '🇬🇾', city: 'Georgetown', exchangeName: 'GASCI', region: 'Sud America',
        lat: 6.80, lng: -58.16, utcOffset: -4, currency: 'GYD', fxPair: 'USD/GYD', fxRate: 209.2,
        idxSym: 'GASCI', idxName: 'GASCI Composite', idxPrice: 1845.0, centralBank: 'Bank of Guyana', policyRate: 5.0, cpi: 2.9,
        gdpGrowth: 24.5, gdpBn: 24, unemp: 11.8, debtGdp: 26.2, tradeBn: 9.8, reservesBn: 1.1, rating: 'B+', y10: 6.9, mktCapBn: 3.2, fdiProfile: 'energy'
    },

    // ======================= EUROPA OCCIDENTALE & NORDICA (20) =======================
    {
        id: 'it-mil', iso2: 'IT', iso3: 'ITA', countryName: 'Italia', countryNameEn: 'Italy',
        flag: '🇮🇹', city: 'Milano', exchangeName: 'Borsa Italiana (Euronext)', region: 'Europa',
        lat: 45.46, lng: 9.19, utcOffset: 1, openHour: 9, closeHour: 17, currency: 'EUR', fxPair: 'EUR/USD', fxRate: 1.0785,
        idxSym: 'FTSEMIB', idxName: 'FTSE MIB', idxPrice: 34280.5, centralBank: 'BCE (Banca Centrale Europea)', policyRate: 3.25, cpi: 1.3,
        gdpGrowth: 0.8, gdpBn: 2370, unemp: 6.2, debtGdp: 136.8, tradeBn: 54.2, reservesBn: 268, rating: 'BBB', y10: 3.58, mktCapBn: 845,
        fdiProfile: 'industrial', isFlagship: true,
        stocks: [
            { symbol: 'UCG.MI', name: 'UniCredit S.p.A.', sector: 'Finanza', basePrice: 41.25, marketCapBn: 67.4 },
            { symbol: 'ISP.MI', name: 'Intesa Sanpaolo', sector: 'Finanza', basePrice: 3.92, marketCapBn: 71.2 },
            { symbol: 'RACE.MI', name: 'Ferrari N.V.', sector: 'Lusso & Auto', basePrice: 428.5, marketCapBn: 77.8 },
            { symbol: 'ENI.MI', name: 'Eni S.p.A.', sector: 'Energia', basePrice: 14.12, marketCapBn: 45.6 }
        ]
    },
    {
        id: 'gb-lon', iso2: 'GB', iso3: 'GBR', countryName: 'Regno Unito', countryNameEn: 'United Kingdom',
        flag: '🇬🇧', city: 'Londra', exchangeName: 'London Stock Exchange (LSE)', region: 'Europa',
        lat: 51.51, lng: -0.13, utcOffset: 0, openHour: 8, closeHour: 16, currency: 'GBP', fxPair: 'GBP/USD', fxRate: 1.289,
        idxSym: 'UKX', idxName: 'FTSE 100', idxPrice: 8265.3, centralBank: 'Bank of England', policyRate: 4.75, cpi: 2.3,
        gdpGrowth: 1.1, gdpBn: 3590, unemp: 4.3, debtGdp: 101.8, tradeBn: -52.1, reservesBn: 184, rating: 'AA', y10: 4.38, mktCapBn: 3240,
        fdiProfile: 'finance', isFlagship: true,
        stocks: [
            { symbol: 'AZN', name: 'AstraZeneca', sector: 'Sanità & Bio', basePrice: 131.4, marketCapBn: 204.0 },
            { symbol: 'SHEL', name: 'Shell plc', sector: 'Energia', basePrice: 66.2, marketCapBn: 208.0 },
            { symbol: 'HSBA', name: 'HSBC Holdings', sector: 'Finanza', basePrice: 45.8, marketCapBn: 168.0 }
        ]
    },
    {
        id: 'de-fra', iso2: 'DE', iso3: 'DEU', countryName: 'Germania', countryNameEn: 'Germany',
        flag: '🇩🇪', city: 'Francoforte', exchangeName: 'Deutsche Börse (XETRA)', region: 'Europa',
        lat: 50.11, lng: 8.68, utcOffset: 1, openHour: 9, closeHour: 17, currency: 'EUR', fxPair: 'EUR/USD', fxRate: 1.0785,
        idxSym: 'DAX', idxName: 'DAX 40', idxPrice: 19460.8, centralBank: 'BCE / Bundesbank', policyRate: 3.25, cpi: 2.0,
        gdpGrowth: 0.4, gdpBn: 4680, unemp: 6.0, debtGdp: 62.7, tradeBn: 242.0, reservesBn: 342, rating: 'AAA', y10: 2.34, mktCapBn: 2480,
        fdiProfile: 'industrial', isFlagship: true,
        stocks: [
            { symbol: 'SAP', name: 'SAP SE', sector: 'Enterprise Tech', basePrice: 238.5, marketCapBn: 282.0 },
            { symbol: 'SIE.DE', name: 'Siemens AG', sector: 'Industria & AI', basePrice: 184.2, marketCapBn: 146.0 },
            { symbol: 'ALV.DE', name: 'Allianz SE', sector: 'Finanza', basePrice: 296.4, marketCapBn: 115.0 }
        ]
    },
    {
        id: 'fr-par', iso2: 'FR', iso3: 'FRA', countryName: 'Francia', countryNameEn: 'France',
        flag: '🇫🇷', city: 'Parigi', exchangeName: 'Euronext Paris', region: 'Europa',
        lat: 48.86, lng: 2.35, utcOffset: 1, openHour: 9, closeHour: 17, currency: 'EUR', fxPair: 'EUR/USD', fxRate: 1.0785,
        idxSym: 'CAC', idxName: 'CAC 40', idxPrice: 7415.6, centralBank: 'BCE / Banque de France', policyRate: 3.25, cpi: 1.5,
        gdpGrowth: 1.1, gdpBn: 3170, unemp: 7.4, debtGdp: 112.3, tradeBn: -78.4, reservesBn: 266, rating: 'AA-', y10: 3.09, mktCapBn: 3180,
        fdiProfile: 'balanced', isFlagship: true,
        stocks: [
            { symbol: 'MC.PA', name: 'LVMH Moët Hennessy', sector: 'Lusso', basePrice: 622.0, marketCapBn: 312.0 },
            { symbol: 'TTE', name: 'TotalEnergies', sector: 'Energia', basePrice: 62.8, marketCapBn: 148.0 },
            { symbol: 'AIR.PA', name: 'Airbus SE', sector: 'Aerospazio', basePrice: 146.5, marketCapBn: 116.0 }
        ]
    },
    {
        id: 'ch-zur', iso2: 'CH', iso3: 'CHE', countryName: 'Svizzera', countryNameEn: 'Switzerland',
        flag: '🇨🇭', city: 'Zurigo', exchangeName: 'SIX Swiss Exchange', region: 'Europa',
        lat: 47.37, lng: 8.54, utcOffset: 1, openHour: 9, closeHour: 17, currency: 'CHF', fxPair: 'USD/CHF', fxRate: 0.874,
        idxSym: 'SMI', idxName: 'Swiss Market Index', idxPrice: 11895.4, centralBank: 'SNB (Banca Nazionale Svizzera)', policyRate: 1.0, cpi: 0.8,
        gdpGrowth: 1.5, gdpBn: 942, unemp: 2.5, debtGdp: 38.2, tradeBn: 58.6, reservesBn: 912, rating: 'AAA', y10: 0.44, mktCapBn: 2180,
        fdiProfile: 'finance', isFlagship: true,
        stocks: [
            { symbol: 'NESN.SW', name: 'Nestlé S.A.', sector: 'Consumi', basePrice: 84.6, marketCapBn: 222.0 },
            { symbol: 'NOVN.SW', name: 'Novartis AG', sector: 'Sanità & Bio', basePrice: 96.4, marketCapBn: 215.0 },
            { symbol: 'UBS', name: 'UBS Group AG', sector: 'Private Banking', basePrice: 31.8, marketCapBn: 104.0 }
        ]
    },
    {
        id: 'es-mad', iso2: 'ES', iso3: 'ESP', countryName: 'Spagna', countryNameEn: 'Spain',
        flag: '🇪🇸', city: 'Madrid', exchangeName: 'BME Bolsa de Madrid', region: 'Europa',
        lat: 40.42, lng: -3.70, utcOffset: 1, openHour: 9, closeHour: 17, currency: 'EUR', fxPair: 'EUR/USD', fxRate: 1.0785,
        idxSym: 'IBEX', idxName: 'IBEX 35', idxPrice: 11790.2, centralBank: 'BCE / Banco de España', policyRate: 3.25, cpi: 1.9,
        gdpGrowth: 2.8, gdpBn: 1730, unemp: 11.2, debtGdp: 105.1, tradeBn: -36.5, reservesBn: 104, rating: 'A', y10: 3.04, mktCapBn: 785,
        fdiProfile: 'balanced', isFlagship: true,
        stocks: [
            { symbol: 'ITX.MC', name: 'Inditex S.A.', sector: 'Retail', basePrice: 52.4, marketCapBn: 163.0 },
            { symbol: 'SAN', name: 'Banco Santander', sector: 'Finanza', basePrice: 4.85, marketCapBn: 75.2 },
            { symbol: 'IBE.MC', name: 'Iberdrola', sector: 'Energia Rinnovabile', basePrice: 13.7, marketCapBn: 87.4 }
        ]
    },
    {
        id: 'nl-ams', iso2: 'NL', iso3: 'NLD', countryName: 'Paesi Bassi', countryNameEn: 'Netherlands',
        flag: '🇳🇱', city: 'Amsterdam', exchangeName: 'Euronext Amsterdam', region: 'Europa',
        lat: 52.37, lng: 4.90, utcOffset: 1, openHour: 9, closeHour: 17, currency: 'EUR', fxPair: 'EUR/USD', fxRate: 1.0785,
        idxSym: 'AEX', idxName: 'AEX Index', idxPrice: 892.4, centralBank: 'BCE / DNB', policyRate: 3.25, cpi: 3.1,
        gdpGrowth: 0.9, gdpBn: 1210, unemp: 3.7, debtGdp: 46.2, tradeBn: 94.0, reservesBn: 67, rating: 'AAA', y10: 2.61, mktCapBn: 1180,
        fdiProfile: 'tech', isFlagship: true,
        stocks: [
            { symbol: 'ASML', name: 'ASML Holding', sector: 'Semiconduttori', basePrice: 688.5, marketCapBn: 274.0 },
            { symbol: 'ING', name: 'ING Groep', sector: 'Finanza', basePrice: 16.9, marketCapBn: 54.0 },
            { symbol: 'ADYEN', name: 'Adyen N.V.', sector: 'Fintech', basePrice: 1412.0, marketCapBn: 44.2 }
        ]
    },
    {
        id: 'be-bru', iso2: 'BE', iso3: 'BEL', countryName: 'Belgio', countryNameEn: 'Belgium',
        flag: '🇧🇪', city: 'Bruxelles', exchangeName: 'Euronext Brussels', region: 'Europa',
        lat: 50.85, lng: 4.35, utcOffset: 1, currency: 'EUR', fxPair: 'EUR/USD', fxRate: 1.0785,
        idxSym: 'BEL20', idxName: 'BEL 20', idxPrice: 4295.0, centralBank: 'BCE / NBB', policyRate: 3.25, cpi: 3.2,
        gdpGrowth: 1.2, gdpBn: 665, unemp: 5.7, debtGdp: 105.4, tradeBn: 14.2, reservesBn: 41, rating: 'AA-', y10: 2.94, mktCapBn: 342, fdiProfile: 'balanced'
    },
    {
        id: 'ie-dub', iso2: 'IE', iso3: 'IRL', countryName: 'Irlanda', countryNameEn: 'Ireland',
        flag: '🇮🇪', city: 'Dublino', exchangeName: 'Euronext Dublin', region: 'Europa',
        lat: 53.35, lng: -6.26, utcOffset: 0, currency: 'EUR', fxPair: 'EUR/USD', fxRate: 1.0785,
        idxSym: 'ISEQ', idxName: 'ISEQ Overall', idxPrice: 9840.2, centralBank: 'BCE / Central Bank Ireland', policyRate: 3.25, cpi: 1.2,
        gdpGrowth: 2.4, gdpBn: 564, unemp: 4.3, debtGdp: 43.1, tradeBn: 78.4, reservesBn: 13.5, rating: 'AA', y10: 2.68, mktCapBn: 145, fdiProfile: 'tech'
    },
    {
        id: 'pt-lis', iso2: 'PT', iso3: 'PRT', countryName: 'Portogallo', countryNameEn: 'Portugal',
        flag: '🇵🇹', city: 'Lisbona', exchangeName: 'Euronext Lisbon', region: 'Europa',
        lat: 38.72, lng: -9.14, utcOffset: 0, currency: 'EUR', fxPair: 'EUR/USD', fxRate: 1.0785,
        idxSym: 'PSI20', idxName: 'PSI Index', idxPrice: 6490.5, centralBank: 'BCE / Banco de Portugal', policyRate: 3.25, cpi: 2.1,
        gdpGrowth: 1.9, gdpBn: 303, unemp: 6.4, debtGdp: 95.8, tradeBn: -24.1, reservesBn: 36, rating: 'A-', y10: 2.84, mktCapBn: 88, fdiProfile: 'balanced'
    },
    {
        id: 'at-vie', iso2: 'AT', iso3: 'AUT', countryName: 'Austria', countryNameEn: 'Austria',
        flag: '🇦🇹', city: 'Vienna', exchangeName: 'Wiener Börse', region: 'Europa',
        lat: 48.21, lng: 16.37, utcOffset: 1, currency: 'EUR', fxPair: 'EUR/USD', fxRate: 1.0785,
        idxSym: 'ATX', idxName: 'ATX Vienna', idxPrice: 3680.4, centralBank: 'BCE / OeNB', policyRate: 3.25, cpi: 1.8,
        gdpGrowth: 0.7, gdpBn: 535, unemp: 5.2, debtGdp: 78.4, tradeBn: 8.2, reservesBn: 34, rating: 'AA+', y10: 2.81, mktCapBn: 138, fdiProfile: 'industrial'
    },
    {
        id: 'se-sto', iso2: 'SE', iso3: 'SWE', countryName: 'Svezia', countryNameEn: 'Sweden',
        flag: '🇸🇪', city: 'Stoccolma', exchangeName: 'Nasdaq Stockholm', region: 'Europa',
        lat: 59.33, lng: 18.07, utcOffset: 1, currency: 'SEK', fxPair: 'USD/SEK', fxRate: 10.68,
        idxSym: 'OMXS30', idxName: 'OMX Stockholm 30', idxPrice: 2565.8, centralBank: 'Sveriges Riksbank', policyRate: 2.75, cpi: 1.6,
        gdpGrowth: 1.2, gdpBn: 615, unemp: 8.2, debtGdp: 31.8, tradeBn: 12.4, reservesBn: 63, rating: 'AAA', y10: 2.14, mktCapBn: 1060, fdiProfile: 'tech', isFlagship: true
    },
    {
        id: 'no-osl', iso2: 'NO', iso3: 'NOR', countryName: 'Norvegia', countryNameEn: 'Norway',
        flag: '🇳🇴', city: 'Oslo', exchangeName: 'Euronext Oslo Børs', region: 'Europa',
        lat: 59.91, lng: 10.75, utcOffset: 1, currency: 'NOK', fxPair: 'USD/NOK', fxRate: 10.95,
        idxSym: 'OBX', idxName: 'Oslo OBX', idxPrice: 1345.2, centralBank: 'Norges Bank', policyRate: 4.5, cpi: 2.6,
        gdpGrowth: 1.6, gdpBn: 486, unemp: 4.0, debtGdp: 42.1, tradeBn: 74.5, reservesBn: 82, rating: 'AAA', y10: 3.68, mktCapBn: 395, fdiProfile: 'energy'
    },
    {
        id: 'dk-cph', iso2: 'DK', iso3: 'DNK', countryName: 'Danimarca', countryNameEn: 'Denmark',
        flag: '🇩🇰', city: 'Copenaghen', exchangeName: 'Nasdaq Copenhagen', region: 'Europa',
        lat: 55.68, lng: 12.57, utcOffset: 1, currency: 'DKK', fxPair: 'USD/DKK', fxRate: 6.92,
        idxSym: 'OMXC25', idxName: 'OMX Copenhagen 25', idxPrice: 1892.4, centralBank: 'Danmarks Nationalbank', policyRate: 3.1, cpi: 1.5,
        gdpGrowth: 2.1, gdpBn: 412, unemp: 2.9, debtGdp: 29.4, tradeBn: 26.8, reservesBn: 94, rating: 'AAA', y10: 2.26, mktCapBn: 780, fdiProfile: 'tech'
    },
    {
        id: 'fi-hel', iso2: 'FI', iso3: 'FIN', countryName: 'Finlandia', countryNameEn: 'Finland',
        flag: '🇫🇮', city: 'Helsinki', exchangeName: 'Nasdaq Helsinki', region: 'Europa',
        lat: 60.17, lng: 24.94, utcOffset: 2, currency: 'EUR', fxPair: 'EUR/USD', fxRate: 1.0785,
        idxSym: 'OMXH25', idxName: 'OMX Helsinki 25', idxPrice: 4580.0, centralBank: 'BCE / Bank of Finland', policyRate: 3.25, cpi: 1.1,
        gdpGrowth: 0.6, gdpBn: 306, unemp: 8.1, debtGdp: 79.2, tradeBn: -1.4, reservesBn: 17, rating: 'AA+', y10: 2.75, mktCapBn: 265, fdiProfile: 'tech'
    },
    {
        id: 'lu-lux', iso2: 'LU', iso3: 'LUX', countryName: 'Lussemburgo', countryNameEn: 'Luxembourg',
        flag: '🇱🇺', city: 'Lussemburgo', exchangeName: 'Luxembourg Stock Exchange', region: 'Europa',
        lat: 49.61, lng: 6.13, utcOffset: 1, currency: 'EUR', fxPair: 'EUR/USD', fxRate: 1.0785,
        idxSym: 'LUXX', idxName: 'LuxX Index', idxPrice: 1412.6, centralBank: 'BCE / BCL', policyRate: 3.25, cpi: 1.7,
        gdpGrowth: 1.8, gdpBn: 91, unemp: 5.6, debtGdp: 27.1, tradeBn: 3.9, reservesBn: 2.4, rating: 'AAA', y10: 2.66, mktCapBn: 64, fdiProfile: 'finance'
    },
    {
        id: 'is-rek', iso2: 'IS', iso3: 'ISL', countryName: 'Islanda', countryNameEn: 'Iceland',
        flag: '🇮🇸', city: 'Reykjavík', exchangeName: 'Nasdaq Iceland', region: 'Europa',
        lat: 64.15, lng: -21.94, utcOffset: 0, currency: 'ISK', fxPair: 'USD/ISK', fxRate: 137.4,
        idxSym: 'OMXI15', idxName: 'OMX Iceland 15', idxPrice: 2340.0, centralBank: 'Sedlabanki', policyRate: 8.5, cpi: 5.1,
        gdpGrowth: 2.0, gdpBn: 33, unemp: 3.4, debtGdp: 61.8, tradeBn: -1.6, reservesBn: 6.4, rating: 'A+', y10: 6.45, mktCapBn: 24, fdiProfile: 'energy'
    },
    {
        id: 'gr-ath', iso2: 'GR', iso3: 'GRC', countryName: 'Grecia', countryNameEn: 'Greece',
        flag: '🇬🇷', city: 'Atene', exchangeName: 'Athens Stock Exchange', region: 'Europa',
        lat: 37.98, lng: 23.73, utcOffset: 2, currency: 'EUR', fxPair: 'EUR/USD', fxRate: 1.0785,
        idxSym: 'GD.AT', idxName: 'ATHEX Composite', idxPrice: 1445.8, centralBank: 'BCE / Bank of Greece', policyRate: 3.25, cpi: 2.7,
        gdpGrowth: 2.2, gdpBn: 252, unemp: 9.8, debtGdp: 158.4, tradeBn: -31.2, reservesBn: 14.8, rating: 'BBB-', y10: 3.26, mktCapBn: 108, fdiProfile: 'balanced'
    },
    {
        id: 'mt-val', iso2: 'MT', iso3: 'MLT', countryName: 'Malta', countryNameEn: 'Malta',
        flag: '🇲🇹', city: 'La Valletta', exchangeName: 'Malta Stock Exchange', region: 'Europa',
        lat: 35.90, lng: 14.51, utcOffset: 1, currency: 'EUR', fxPair: 'EUR/USD', fxRate: 1.0785,
        idxSym: 'MSE', idxName: 'MSE Equity Price', idxPrice: 3820.0, centralBank: 'Central Bank of Malta', policyRate: 3.25, cpi: 2.3,
        gdpGrowth: 4.5, gdpBn: 23, unemp: 3.1, debtGdp: 50.8, tradeBn: -2.4, reservesBn: 1.4, rating: 'A-', y10: 3.22, mktCapBn: 5.2, fdiProfile: 'finance'
    },
    {
        id: 'cy-nic', iso2: 'CY', iso3: 'CYP', countryName: 'Cipro', countryNameEn: 'Cyprus',
        flag: '🇨🇾', city: 'Nicosia', exchangeName: 'Cyprus Stock Exchange', region: 'Europa',
        lat: 35.19, lng: 33.38, utcOffset: 2, currency: 'EUR', fxPair: 'EUR/USD', fxRate: 1.0785,
        idxSym: 'CYMAIN', idxName: 'CSE General', idxPrice: 204.5, centralBank: 'Central Bank of Cyprus', policyRate: 3.25, cpi: 1.8,
        gdpGrowth: 3.3, gdpBn: 34, unemp: 5.4, debtGdp: 72.1, tradeBn: -6.1, reservesBn: 1.8, rating: 'BBB+', y10: 3.08, mktCapBn: 14.5, fdiProfile: 'finance'
    },

    // ======================= EUROPA CENTRALE & ORIENTALE (16) =======================
    {
        id: 'pl-waw', iso2: 'PL', iso3: 'POL', countryName: 'Polonia', countryNameEn: 'Poland',
        flag: '🇵🇱', city: 'Varsavia', exchangeName: 'Warsaw Stock Exchange (GPW)', region: 'Europa',
        lat: 52.23, lng: 21.01, utcOffset: 1, currency: 'PLN', fxPair: 'USD/PLN', fxRate: 4.02,
        idxSym: 'WIG20', idxName: 'WIG 20', idxPrice: 2295.4, centralBank: 'NBP', policyRate: 5.75, cpi: 4.9,
        gdpGrowth: 3.1, gdpBn: 862, unemp: 2.9, debtGdp: 53.8, tradeBn: 6.4, reservesBn: 214, rating: 'A-', y10: 5.58, mktCapBn: 212, fdiProfile: 'industrial', isFlagship: true
    },
    {
        id: 'cz-prg', iso2: 'CZ', iso3: 'CZE', countryName: 'Repubblica Ceca', countryNameEn: 'Czech Republic',
        flag: '🇨🇿', city: 'Praga', exchangeName: 'Prague Stock Exchange', region: 'Europa',
        lat: 50.08, lng: 14.44, utcOffset: 1, currency: 'CZK', fxPair: 'USD/CZK', fxRate: 23.45,
        idxSym: 'PX', idxName: 'PX Prague', idxPrice: 1648.2, centralBank: 'CNB', policyRate: 4.0, cpi: 2.6,
        gdpGrowth: 1.3, gdpBn: 345, unemp: 2.7, debtGdp: 43.9, tradeBn: 11.2, reservesBn: 148, rating: 'AA-', y10: 4.02, mktCapBn: 38, fdiProfile: 'industrial'
    },
    {
        id: 'hu-bud', iso2: 'HU', iso3: 'HUN', countryName: 'Ungheria', countryNameEn: 'Hungary',
        flag: '🇭🇺', city: 'Budapest', exchangeName: 'Budapest Stock Exchange', region: 'Europa',
        lat: 47.50, lng: 19.04, utcOffset: 1, currency: 'HUF', fxPair: 'USD/HUF', fxRate: 378.5,
        idxSym: 'BUX', idxName: 'BUX Index', idxPrice: 76450.0, centralBank: 'MNB', policyRate: 6.5, cpi: 3.2,
        gdpGrowth: 1.8, gdpBn: 228, unemp: 4.4, debtGdp: 74.2, tradeBn: 9.6, reservesBn: 49, rating: 'BBB-', y10: 6.42, mktCapBn: 44, fdiProfile: 'industrial'
    },
    {
        id: 'ro-buc', iso2: 'RO', iso3: 'ROU', countryName: 'Romania', countryNameEn: 'Romania',
        flag: '🇷🇴', city: 'Bucarest', exchangeName: 'Bucharest Stock Exchange (BVB)', region: 'Europa',
        lat: 44.43, lng: 26.10, utcOffset: 2, currency: 'RON', fxPair: 'USD/RON', fxRate: 4.61,
        idxSym: 'BET', idxName: 'BET Bucharest', idxPrice: 17420.0, centralBank: 'BNR', policyRate: 6.5, cpi: 4.7,
        gdpGrowth: 2.4, gdpBn: 378, unemp: 5.4, debtGdp: 52.4, tradeBn: -28.4, reservesBn: 71, rating: 'BBB-', y10: 6.85, mktCapBn: 48, fdiProfile: 'tech'
    },
    {
        id: 'hr-zag', iso2: 'HR', iso3: 'HRV', countryName: 'Croazia', countryNameEn: 'Croatia',
        flag: '🇭🇷', city: 'Zagabria', exchangeName: 'Zagreb Stock Exchange', region: 'Europa',
        lat: 45.81, lng: 15.98, utcOffset: 1, currency: 'EUR', fxPair: 'EUR/USD', fxRate: 1.0785,
        idxSym: 'CROBEX', idxName: 'CROBEX', idxPrice: 3045.0, centralBank: 'BCE / HNB', policyRate: 3.25, cpi: 2.2,
        gdpGrowth: 3.4, gdpBn: 89, unemp: 5.2, debtGdp: 59.8, tradeBn: -14.2, reservesBn: 3.4, rating: 'A-', y10: 3.18, mktCapBn: 27, fdiProfile: 'balanced'
    },
    {
        id: 'bg-sof', iso2: 'BG', iso3: 'BGR', countryName: 'Bulgaria', countryNameEn: 'Bulgaria',
        flag: '🇧🇬', city: 'Sofia', exchangeName: 'Bulgarian Stock Exchange', region: 'Europa',
        lat: 42.70, lng: 23.32, utcOffset: 2, currency: 'BGN', fxPair: 'USD/BGN', fxRate: 1.81,
        idxSym: 'SOFIX', idxName: 'SOFIX', idxPrice: 852.4, centralBank: 'BNB', policyRate: 3.25, cpi: 1.9,
        gdpGrowth: 2.3, gdpBn: 108, unemp: 4.1, debtGdp: 24.1, tradeBn: -4.6, reservesBn: 42, rating: 'BBB', y10: 3.92, mktCapBn: 9.8, fdiProfile: 'tech'
    },
    {
        id: 'sk-bts', iso2: 'SK', iso3: 'SVK', countryName: 'Slovacchia', countryNameEn: 'Slovakia',
        flag: '🇸🇰', city: 'Bratislava', exchangeName: 'BSSE Bratislava', region: 'Europa',
        lat: 48.15, lng: 17.11, utcOffset: 1, currency: 'EUR', fxPair: 'EUR/USD', fxRate: 1.0785,
        idxSym: 'SAX', idxName: 'SAX Index', idxPrice: 312.8, centralBank: 'BCE / NBS', policyRate: 3.25, cpi: 2.8,
        gdpGrowth: 2.1, gdpBn: 141, unemp: 5.3, debtGdp: 58.6, tradeBn: 2.8, reservesBn: 13, rating: 'A+', y10: 3.35, mktCapBn: 4.2, fdiProfile: 'industrial'
    },
    {
        id: 'si-lju', iso2: 'SI', iso3: 'SVN', countryName: 'Slovenia', countryNameEn: 'Slovenia',
        flag: '🇸🇮', city: 'Lubiana', exchangeName: 'Ljubljana Stock Exchange', region: 'Europa',
        lat: 46.06, lng: 14.51, utcOffset: 1, currency: 'EUR', fxPair: 'EUR/USD', fxRate: 1.0785,
        idxSym: 'SBITOP', idxName: 'SBI TOP', idxPrice: 1642.0, centralBank: 'BCE / Banka Slovenije', policyRate: 3.25, cpi: 1.2,
        gdpGrowth: 1.7, gdpBn: 73, unemp: 3.4, debtGdp: 68.1, tradeBn: 2.1, reservesBn: 2.6, rating: 'AA-', y10: 2.95, mktCapBn: 11.4, fdiProfile: 'industrial'
    },
    {
        id: 'ee-tll', iso2: 'EE', iso3: 'EST', countryName: 'Estonia', countryNameEn: 'Estonia',
        flag: '🇪🇪', city: 'Tallinn', exchangeName: 'Nasdaq Tallinn', region: 'Europa',
        lat: 59.44, lng: 24.75, utcOffset: 2, currency: 'EUR', fxPair: 'EUR/USD', fxRate: 1.0785,
        idxSym: 'OMXT', idxName: 'OMX Tallinn', idxPrice: 1745.0, centralBank: 'Eesti Pank', policyRate: 3.25, cpi: 3.6,
        gdpGrowth: 0.9, gdpBn: 43, unemp: 7.4, debtGdp: 23.4, tradeBn: -2.1, reservesBn: 2.1, rating: 'A+', y10: 3.28, mktCapBn: 5.6, fdiProfile: 'tech'
    },
    {
        id: 'lv-rix', iso2: 'LV', iso3: 'LVA', countryName: 'Lettonia', countryNameEn: 'Latvia',
        flag: '🇱🇻', city: 'Riga', exchangeName: 'Nasdaq Riga', region: 'Europa',
        lat: 56.95, lng: 24.11, utcOffset: 2, currency: 'EUR', fxPair: 'EUR/USD', fxRate: 1.0785,
        idxSym: 'OMXR', idxName: 'OMX Riga', idxPrice: 1098.0, centralBank: 'Latvijas Banka', policyRate: 3.25, cpi: 1.6,
        gdpGrowth: 1.4, gdpBn: 45, unemp: 6.7, debtGdp: 45.2, tradeBn: -3.2, reservesBn: 5.4, rating: 'A', y10: 3.31, mktCapBn: 1.9, fdiProfile: 'balanced'
    },
    {
        id: 'lt-vno', iso2: 'LT', iso3: 'LTU', countryName: 'Lituania', countryNameEn: 'Lithuania',
        flag: '🇱🇹', city: 'Vilnius', exchangeName: 'Nasdaq Vilnius', region: 'Europa',
        lat: 54.69, lng: 25.28, utcOffset: 2, currency: 'EUR', fxPair: 'EUR/USD', fxRate: 1.0785,
        idxSym: 'OMXV', idxName: 'OMX Vilnius', idxPrice: 1012.4, centralBank: 'Bank of Lithuania', policyRate: 3.25, cpi: 0.9,
        gdpGrowth: 2.4, gdpBn: 82, unemp: 7.1, debtGdp: 38.6, tradeBn: -3.8, reservesBn: 6.1, rating: 'A', y10: 3.24, mktCapBn: 5.1, fdiProfile: 'tech'
    },
    {
        id: 'rs-beg', iso2: 'RS', iso3: 'SRB', countryName: 'Serbia', countryNameEn: 'Serbia',
        flag: '🇷🇸', city: 'Belgrado', exchangeName: 'Belgrade Stock Exchange', region: 'Europa',
        lat: 44.79, lng: 20.45, utcOffset: 1, currency: 'RSD', fxPair: 'USD/RSD', fxRate: 108.6,
        idxSym: 'BELEX15', idxName: 'BELEX 15', idxPrice: 1124.5, centralBank: 'NBS', policyRate: 5.75, cpi: 4.2,
        gdpGrowth: 3.9, gdpBn: 82, unemp: 8.6, debtGdp: 50.1, tradeBn: -7.9, reservesBn: 28.4, rating: 'BBB-', y10: 5.35, mktCapBn: 4.9, fdiProfile: 'industrial'
    },
    {
        id: 'ua-iev', iso2: 'UA', iso3: 'UKR', countryName: 'Ucraina', countryNameEn: 'Ukraine',
        flag: '🇺🇦', city: 'Kyiv', exchangeName: 'PFTS / UX Exchange', region: 'Europa',
        lat: 50.45, lng: 30.52, utcOffset: 2, currency: 'UAH', fxPair: 'USD/UAH', fxRate: 41.3,
        idxSym: 'PFTS', idxName: 'PFTS Index', idxPrice: 506.4, centralBank: 'NBU', policyRate: 13.0, cpi: 8.6,
        gdpGrowth: 3.2, gdpBn: 189, unemp: 14.2, debtGdp: 92.4, tradeBn: -24.5, reservesBn: 38.9, rating: 'CCC+', y10: 14.2, mktCapBn: 6.8, fdiProfile: 'emerging'
    },
    {
        id: 'tr-ist', iso2: 'TR', iso3: 'TUR', countryName: 'Turchia', countryNameEn: 'Turkey',
        flag: '🇹🇷', city: 'Istanbul', exchangeName: 'Borsa Istanbul (BIST)', region: 'Europa',
        lat: 41.01, lng: 28.98, utcOffset: 3, openHour: 10, closeHour: 18, currency: 'TRY', fxPair: 'USD/TRY', fxRate: 34.42,
        idxSym: 'XU100', idxName: 'BIST 100', idxPrice: 9380.4, centralBank: 'CBRT (TCMB)', policyRate: 50.0, cpi: 46.5,
        gdpGrowth: 3.1, gdpBn: 1320, unemp: 8.6, debtGdp: 29.8, tradeBn: -64.2, reservesBn: 158, rating: 'BB-', y10: 27.8, mktCapBn: 342, fdiProfile: 'industrial', isFlagship: true
    },
    {
        id: 'ge-tbs', iso2: 'GE', iso3: 'GEO', countryName: 'Georgia', countryNameEn: 'Georgia',
        flag: '🇬🇪', city: 'Tbilisi', exchangeName: 'Georgian Stock Exchange', region: 'Europa',
        lat: 41.72, lng: 44.83, utcOffset: 4, currency: 'GEL', fxPair: 'USD/GEL', fxRate: 2.72,
        idxSym: 'GSX', idxName: 'GSX Index', idxPrice: 178.4, centralBank: 'National Bank Georgia', policyRate: 8.0, cpi: 1.4,
        gdpGrowth: 7.6, gdpBn: 33, unemp: 14.1, debtGdp: 38.4, tradeBn: -7.8, reservesBn: 4.5, rating: 'BB', y10: 8.15, mktCapBn: 2.8, fdiProfile: 'finance'
    },
    {
        id: 'kz-ala', iso2: 'KZ', iso3: 'KAZ', countryName: 'Kazakistan', countryNameEn: 'Kazakhstan',
        flag: '🇰🇿', city: 'Almaty', exchangeName: 'KASE / AIX Astana', region: 'Asia',
        lat: 43.24, lng: 76.89, utcOffset: 5, currency: 'KZT', fxPair: 'USD/KZT', fxRate: 492.0,
        idxSym: 'KASE', idxName: 'KASE Index', idxPrice: 5340.0, centralBank: 'NBK', policyRate: 14.25, cpi: 8.4,
        gdpGrowth: 4.1, gdpBn: 288, unemp: 4.7, debtGdp: 23.6, tradeBn: 19.2, reservesBn: 44.5, rating: 'BBB-', y10: 12.4, mktCapBn: 74, fdiProfile: 'energy'
    },

    // ======================= MEDIO ORIENTE (11) =======================
    {
        id: 'ae-dxb', iso2: 'AE', iso3: 'ARE', countryName: 'Emirati Arabi Uniti', countryNameEn: 'United Arab Emirates',
        flag: '🇦🇪', city: 'Dubai / Abu Dhabi', exchangeName: 'DFM / ADX', region: 'Medio Oriente',
        lat: 25.20, lng: 55.27, utcOffset: 4, openHour: 10, closeHour: 15, currency: 'AED', fxPair: 'USD/AED', fxRate: 3.6725,
        idxSym: 'DFMGI', idxName: 'DFM General', idxPrice: 4620.8, centralBank: 'CBUAE', policyRate: 4.65, cpi: 2.3,
        gdpGrowth: 4.2, gdpBn: 545, unemp: 2.7, debtGdp: 30.8, tradeBn: 112.0, reservesBn: 218, rating: 'AA', y10: 4.62, mktCapBn: 985,
        fdiProfile: 'finance', isFlagship: true,
        stocks: [
            { symbol: 'EMAAR', name: 'Emaar Properties', sector: 'Immobiliare', basePrice: 2.48, marketCapBn: 21.8 },
            { symbol: 'FAB', name: 'First Abu Dhabi Bank', sector: 'Finanza', basePrice: 3.72, marketCapBn: 41.2 },
            { symbol: 'IHC', name: 'International Holding Co.', sector: 'Conglomerato AI', basePrice: 111.5, marketCapBn: 244.0 }
        ]
    },
    {
        id: 'sa-ruh', iso2: 'SA', iso3: 'SAU', countryName: 'Arabia Saudita', countryNameEn: 'Saudi Arabia',
        flag: '🇸🇦', city: 'Riad', exchangeName: 'Saudi Exchange (Tadawul)', region: 'Medio Oriente',
        lat: 24.71, lng: 46.68, utcOffset: 3, openHour: 10, closeHour: 15, currency: 'SAR', fxPair: 'USD/SAR', fxRate: 3.75,
        idxSym: 'TASI', idxName: 'Tadawul All Share', idxPrice: 12140.5, centralBank: 'SAMA', policyRate: 5.25, cpi: 1.7,
        gdpGrowth: 2.6, gdpBn: 1110, unemp: 3.3, debtGdp: 27.4, tradeBn: 118.5, reservesBn: 456, rating: 'A+', y10: 4.92, mktCapBn: 2760,
        fdiProfile: 'energy', isFlagship: true,
        stocks: [
            { symbol: '2222.SR', name: 'Saudi Aramco', sector: 'Energia', basePrice: 7.42, marketCapBn: 1795 },
            { symbol: '1120.SR', name: 'Al Rajhi Bank', sector: 'Finanza', basePrice: 23.8, marketCapBn: 95.2 },
            { symbol: '7010.SR', name: 'STC Group', sector: 'Telecom & Cloud', basePrice: 11.4, marketCapBn: 57.0 }
        ]
    },
    {
        id: 'qa-doh', iso2: 'QA', iso3: 'QAT', countryName: 'Qatar', countryNameEn: 'Qatar',
        flag: '🇶🇦', city: 'Doha', exchangeName: 'Qatar Stock Exchange (QSE)', region: 'Medio Oriente',
        lat: 25.29, lng: 51.53, utcOffset: 3, openHour: 9, closeHour: 13, currency: 'QAR', fxPair: 'USD/QAR', fxRate: 3.64,
        idxSym: 'QSI', idxName: 'QE General Index', idxPrice: 10540.2, centralBank: 'QCB', policyRate: 5.25, cpi: 1.4,
        gdpGrowth: 2.3, gdpBn: 222, unemp: 0.2, debtGdp: 41.2, tradeBn: 58.4, reservesBn: 69, rating: 'AA', y10: 4.58, mktCapBn: 168, fdiProfile: 'energy'
    },
    {
        id: 'il-tlv', iso2: 'IL', iso3: 'ISR', countryName: 'Israele', countryNameEn: 'Israel',
        flag: '🇮🇱', city: 'Tel Aviv', exchangeName: 'Tel Aviv Stock Exchange (TASE)', region: 'Medio Oriente',
        lat: 32.09, lng: 34.78, utcOffset: 2, openHour: 10, closeHour: 17, currency: 'ILS', fxPair: 'USD/ILS', fxRate: 3.74,
        idxSym: 'TA35', idxName: 'TA-35 Index', idxPrice: 2248.6, centralBank: 'Bank of Israel', policyRate: 4.5, cpi: 3.5,
        gdpGrowth: 1.6, gdpBn: 530, unemp: 2.9, debtGdp: 66.8, tradeBn: -22.4, reservesBn: 216, rating: 'A', y10: 4.86, mktCapBn: 312, fdiProfile: 'tech', isFlagship: true
    },
    {
        id: 'kw-kwi', iso2: 'KW', iso3: 'KWT', countryName: 'Kuwait', countryNameEn: 'Kuwait',
        flag: '🇰🇼', city: 'Kuwait City', exchangeName: 'Boursa Kuwait', region: 'Medio Oriente',
        lat: 29.38, lng: 47.98, utcOffset: 3, openHour: 9, closeHour: 13, currency: 'KWD', fxPair: 'USD/KWD', fxRate: 0.307,
        idxSym: 'BKP', idxName: 'Boursa Kuwait Premier', idxPrice: 7780.0, centralBank: 'CBK', policyRate: 4.0, cpi: 2.8,
        gdpGrowth: 1.9, gdpBn: 162, unemp: 2.1, debtGdp: 3.2, tradeBn: 41.2, reservesBn: 48, rating: 'A+', y10: 4.65, mktCapBn: 138, fdiProfile: 'energy'
    },
    {
        id: 'bh-bah', iso2: 'BH', iso3: 'BHR', countryName: 'Bahrein', countryNameEn: 'Bahrain',
        flag: '🇧🇭', city: 'Manama', exchangeName: 'Bahrain Bourse', region: 'Medio Oriente',
        lat: 26.23, lng: 50.59, utcOffset: 3, currency: 'BHD', fxPair: 'USD/BHD', fxRate: 0.376,
        idxSym: 'BAX', idxName: 'Bahrain All Share', idxPrice: 2018.4, centralBank: 'CBB', policyRate: 5.5, cpi: 1.2,
        gdpGrowth: 3.0, gdpBn: 47, unemp: 1.5, debtGdp: 122.4, tradeBn: 2.4, reservesBn: 5.1, rating: 'B+', y10: 6.35, mktCapBn: 21, fdiProfile: 'finance'
    },
    {
        id: 'om-mct', iso2: 'OM', iso3: 'OMN', countryName: 'Oman', countryNameEn: 'Oman',
        flag: '🇴🇲', city: 'Mascate', exchangeName: 'Muscat Stock Exchange', region: 'Medio Oriente',
        lat: 23.59, lng: 58.38, utcOffset: 4, currency: 'OMR', fxPair: 'USD/OMR', fxRate: 0.385,
        idxSym: 'MSX30', idxName: 'MSX 30', idxPrice: 4745.0, centralBank: 'CBO', policyRate: 5.25, cpi: 0.9,
        gdpGrowth: 2.4, gdpBn: 112, unemp: 3.1, debtGdp: 35.4, tradeBn: 17.8, reservesBn: 18.2, rating: 'BBB-', y10: 5.38, mktCapBn: 24, fdiProfile: 'energy'
    },
    {
        id: 'jo-amm', iso2: 'JO', iso3: 'JOR', countryName: 'Giordania', countryNameEn: 'Jordan',
        flag: '🇯🇴', city: 'Amman', exchangeName: 'Amman Stock Exchange', region: 'Medio Oriente',
        lat: 31.95, lng: 35.93, utcOffset: 3, currency: 'JOD', fxPair: 'USD/JOD', fxRate: 0.709,
        idxSym: 'AMGNRLX', idxName: 'ASE General', idxPrice: 2425.0, centralBank: 'CBJ', policyRate: 6.75, cpi: 1.7,
        gdpGrowth: 2.5, gdpBn: 53, unemp: 21.4, debtGdp: 89.2, tradeBn: -10.4, reservesBn: 20.1, rating: 'BB-', y10: 6.95, mktCapBn: 24, fdiProfile: 'finance'
    },
    {
        id: 'eg-cai', iso2: 'EG', iso3: 'EGY', countryName: 'Egitto', countryNameEn: 'Egypt',
        flag: '🇪🇬', city: 'Il Cairo', exchangeName: 'Egyptian Exchange (EGX)', region: 'Medio Oriente',
        lat: 30.04, lng: 31.24, utcOffset: 2, openHour: 10, closeHour: 14, currency: 'EGP', fxPair: 'USD/EGP', fxRate: 49.15,
        idxSym: 'EGX30', idxName: 'EGX 30', idxPrice: 31240.0, centralBank: 'Central Bank of Egypt', policyRate: 27.25, cpi: 25.4,
        gdpGrowth: 3.6, gdpBn: 382, unemp: 6.7, debtGdp: 91.4, tradeBn: -36.8, reservesBn: 46.9, rating: 'B-', y10: 21.5, mktCapBn: 46, fdiProfile: 'emerging'
    },
    {
        id: 'lb-bey', iso2: 'LB', iso3: 'LBN', countryName: 'Libano', countryNameEn: 'Lebanon',
        flag: '🇱🇧', city: 'Beirut', exchangeName: 'Beirut Stock Exchange', region: 'Medio Oriente',
        lat: 33.89, lng: 35.50, utcOffset: 2, currency: 'LBP', fxPair: 'USD/LBP', fxRate: 89500,
        idxSym: 'BLOM', idxName: 'BLOM Stock Index', idxPrice: 2110.0, centralBank: 'Banque du Liban', policyRate: 12.0, cpi: 32.0,
        gdpGrowth: -1.2, gdpBn: 21, unemp: 11.5, debtGdp: 201.0, tradeBn: -13.1, reservesBn: 10.4, rating: 'RD', y10: 15.2, mktCapBn: 18, fdiProfile: 'finance'
    },
    {
        id: 'iq-bgw', iso2: 'IQ', iso3: 'IRQ', countryName: 'Iraq', countryNameEn: 'Iraq',
        flag: '🇮🇶', city: 'Baghdad', exchangeName: 'Iraq Stock Exchange (ISX)', region: 'Medio Oriente',
        lat: 33.31, lng: 44.37, utcOffset: 3, currency: 'IQD', fxPair: 'USD/IQD', fxRate: 1310.0,
        idxSym: 'ISX60', idxName: 'ISX 60', idxPrice: 912.5, centralBank: 'CBI Iraq', policyRate: 5.5, cpi: 3.1,
        gdpGrowth: 2.8, gdpBn: 264, unemp: 15.5, debtGdp: 44.8, tradeBn: 28.4, reservesBn: 104, rating: 'B-', y10: 8.6, mktCapBn: 14, fdiProfile: 'energy'
    },

    // ======================= AFRICA (17) =======================
    {
        id: 'za-jnb', iso2: 'ZA', iso3: 'ZAF', countryName: 'Sudafrica', countryNameEn: 'South Africa',
        flag: '🇿🇦', city: 'Johannesburg', exchangeName: 'Johannesburg Stock Exchange (JSE)', region: 'Africa',
        lat: -26.20, lng: 28.05, utcOffset: 2, openHour: 9, closeHour: 17, currency: 'ZAR', fxPair: 'USD/ZAR', fxRate: 17.88,
        idxSym: 'JTOPI', idxName: 'FTSE/JSE Top 40', idxPrice: 77840.0, centralBank: 'SARB', policyRate: 7.75, cpi: 3.8,
        gdpGrowth: 1.5, gdpBn: 403, unemp: 32.1, debtGdp: 74.1, tradeBn: 11.4, reservesBn: 63, rating: 'BB-', y10: 9.24, mktCapBn: 1040,
        fdiProfile: 'energy', isFlagship: true,
        stocks: [
            { symbol: 'NPN.JO', name: 'Naspers Ltd.', sector: 'Tech & Venture', basePrice: 224.5, marketCapBn: 41.2 },
            { symbol: 'FSR.JO', name: 'FirstRand Ltd.', sector: 'Finanza', basePrice: 4.35, marketCapBn: 24.4 },
            { symbol: 'GFI', name: 'Gold Fields', sector: 'Oro & Mining', basePrice: 15.8, marketCapBn: 14.1 }
        ]
    },
    {
        id: 'ng-los', iso2: 'NG', iso3: 'NGA', countryName: 'Nigeria', countryNameEn: 'Nigeria',
        flag: '🇳🇬', city: 'Lagos', exchangeName: 'Nigerian Exchange (NGX)', region: 'Africa',
        lat: 6.52, lng: 3.38, utcOffset: 1, openHour: 10, closeHour: 14, currency: 'NGN', fxPair: 'USD/NGN', fxRate: 1645.0,
        idxSym: 'NGXASI', idxName: 'NGX All-Share', idxPrice: 98420.0, centralBank: 'Central Bank of Nigeria', policyRate: 27.25, cpi: 31.4,
        gdpGrowth: 3.2, gdpBn: 254, unemp: 5.3, debtGdp: 46.8, tradeBn: 8.2, reservesBn: 40.2, rating: 'B-', y10: 19.4, mktCapBn: 38, fdiProfile: 'energy'
    },
    {
        id: 'ke-nbo', iso2: 'KE', iso3: 'KEN', countryName: 'Kenya', countryNameEn: 'Kenya',
        flag: '🇰🇪', city: 'Nairobi', exchangeName: 'Nairobi Securities Exchange', region: 'Africa',
        lat: -1.29, lng: 36.82, utcOffset: 3, currency: 'KES', fxPair: 'USD/KES', fxRate: 129.2,
        idxSym: 'NSE20', idxName: 'NSE 20 Share', idxPrice: 1865.4, centralBank: 'CBK Kenya', policyRate: 12.0, cpi: 3.6,
        gdpGrowth: 5.1, gdpBn: 116, unemp: 5.6, debtGdp: 69.8, tradeBn: -10.8, reservesBn: 8.6, rating: 'B-', y10: 14.8, mktCapBn: 14.2, fdiProfile: 'tech'
    },
    {
        id: 'ma-cas', iso2: 'MA', iso3: 'MAR', countryName: 'Marocco', countryNameEn: 'Morocco',
        flag: '🇲🇦', city: 'Casablanca', exchangeName: 'Bourse de Casablanca', region: 'Africa',
        lat: 33.57, lng: -7.59, utcOffset: 1, currency: 'MAD', fxPair: 'USD/MAD', fxRate: 9.86,
        idxSym: 'MASI', idxName: 'MASI Casablanca', idxPrice: 14580.0, centralBank: 'Bank Al-Maghrib', policyRate: 2.75, cpi: 1.4,
        gdpGrowth: 3.4, gdpBn: 154, unemp: 13.1, debtGdp: 70.2, tradeBn: -24.5, reservesBn: 37.2, rating: 'BB+', y10: 3.72, mktCapBn: 74, fdiProfile: 'industrial'
    },
    {
        id: 'tn-tun', iso2: 'TN', iso3: 'TUN', countryName: 'Tunisia', countryNameEn: 'Tunisia',
        flag: '🇹🇳', city: 'Tunisi', exchangeName: 'Bourse de Tunis (BVMT)', region: 'Africa',
        lat: 36.81, lng: 10.18, utcOffset: 1, currency: 'TND', fxPair: 'USD/TND', fxRate: 3.11,
        idxSym: 'TUNINDEX', idxName: 'TUNINDEX', idxPrice: 9845.0, centralBank: 'BCT', policyRate: 8.0, cpi: 6.7,
        gdpGrowth: 1.6, gdpBn: 52, unemp: 16.0, debtGdp: 81.4, tradeBn: -5.8, reservesBn: 8.1, rating: 'CCC-', y10: 9.8, mktCapBn: 8.2, fdiProfile: 'emerging'
    },
    {
        id: 'gh-acc', iso2: 'GH', iso3: 'GHA', countryName: 'Ghana', countryNameEn: 'Ghana',
        flag: '🇬🇭', city: 'Accra', exchangeName: 'Ghana Stock Exchange', region: 'Africa',
        lat: 5.60, lng: -0.19, utcOffset: 0, currency: 'GHS', fxPair: 'USD/GHS', fxRate: 15.85,
        idxSym: 'GSECI', idxName: 'GSE Composite', idxPrice: 4380.0, centralBank: 'Bank of Ghana', policyRate: 27.0, cpi: 21.5,
        gdpGrowth: 4.1, gdpBn: 76, unemp: 3.9, debtGdp: 79.6, tradeBn: 2.8, reservesBn: 7.5, rating: 'CCC+', y10: 18.2, mktCapBn: 6.2, fdiProfile: 'energy'
    },
    {
        id: 'ci-abj', iso2: 'CI', iso3: 'CIV', countryName: 'Costa d\'Avorio', countryNameEn: 'Ivory Coast',
        flag: '🇨🇮', city: 'Abidjan', exchangeName: 'BRVM West Africa', region: 'Africa',
        lat: 5.36, lng: -4.01, utcOffset: 0, currency: 'XOF', fxPair: 'USD/XOF', fxRate: 608.0,
        idxSym: 'BRVMCI', idxName: 'BRVM Composite', idxPrice: 268.4, centralBank: 'BCEAO', policyRate: 3.5, cpi: 3.8,
        gdpGrowth: 6.4, gdpBn: 86, unemp: 2.6, debtGdp: 58.2, tradeBn: 1.9, reservesBn: 19.4, rating: 'BB-', y10: 7.45, mktCapBn: 15.8, fdiProfile: 'emerging'
    },
    {
        id: 'sn-dkr', iso2: 'SN', iso3: 'SEN', countryName: 'Senegal', countryNameEn: 'Senegal',
        flag: '🇸🇳', city: 'Dakar', exchangeName: 'BRVM Dakar Desk', region: 'Africa',
        lat: 14.72, lng: -17.47, utcOffset: 0, currency: 'XOF', fxPair: 'USD/XOF', fxRate: 608.0,
        idxSym: 'BRVMSN', idxName: 'BRVM Prestige', idxPrice: 112.5, centralBank: 'BCEAO', policyRate: 3.5, cpi: 2.4,
        gdpGrowth: 6.8, gdpBn: 34, unemp: 3.2, debtGdp: 74.5, tradeBn: -4.1, reservesBn: 4.8, rating: 'B+', y10: 7.9, mktCapBn: 4.1, fdiProfile: 'energy'
    },
    {
        id: 'et-add', iso2: 'ET', iso3: 'ETH', countryName: 'Etiopia', countryNameEn: 'Ethiopia',
        flag: '🇪🇹', city: 'Addis Abeba', exchangeName: 'Ethiopian Securities Exchange', region: 'Africa',
        lat: 9.01, lng: 38.76, utcOffset: 3, currency: 'ETB', fxPair: 'USD/ETB', fxRate: 121.4,
        idxSym: 'ESX', idxName: 'ESX Composite', idxPrice: 1045.0, centralBank: 'NBE', policyRate: 15.0, cpi: 17.8,
        gdpGrowth: 6.5, gdpBn: 145, unemp: 3.5, debtGdp: 38.4, tradeBn: -12.4, reservesBn: 3.6, rating: 'CCC-', y10: 14.5, mktCapBn: 9.4, fdiProfile: 'emerging'
    },
    {
        id: 'tz-dar', iso2: 'TZ', iso3: 'TZA', countryName: 'Tanzania', countryNameEn: 'Tanzania',
        flag: '🇹🇿', city: 'Dar es Salaam', exchangeName: 'Dar es Salaam Stock Exchange', region: 'Africa',
        lat: -6.79, lng: 39.21, utcOffset: 3, currency: 'TZS', fxPair: 'USD/TZS', fxRate: 2685.0,
        idxSym: 'DSEI', idxName: 'DSE All Share', idxPrice: 2148.0, centralBank: 'Bank of Tanzania', policyRate: 6.0, cpi: 3.1,
        gdpGrowth: 5.6, gdpBn: 81, unemp: 2.8, debtGdp: 46.2, tradeBn: -6.4, reservesBn: 5.4, rating: 'B+', y10: 12.1, mktCapBn: 6.8, fdiProfile: 'emerging'
    },
    {
        id: 'ug-kla', iso2: 'UG', iso3: 'UGA', countryName: 'Uganda', countryNameEn: 'Uganda',
        flag: '🇺🇬', city: 'Kampala', exchangeName: 'Uganda Securities Exchange', region: 'Africa',
        lat: 0.35, lng: 32.58, utcOffset: 3, currency: 'UGX', fxPair: 'USD/UGX', fxRate: 3685.0,
        idxSym: 'USEALSI', idxName: 'USE All Share', idxPrice: 1142.0, centralBank: 'Bank of Uganda', policyRate: 9.75, cpi: 3.0,
        gdpGrowth: 6.0, gdpBn: 55, unemp: 2.9, debtGdp: 51.4, tradeBn: -3.2, reservesBn: 3.8, rating: 'B', y10: 15.4, mktCapBn: 5.2, fdiProfile: 'energy'
    },
    {
        id: 'rw-kgl', iso2: 'RW', iso3: 'RWA', countryName: 'Ruanda', countryNameEn: 'Rwanda',
        flag: '🇷🇼', city: 'Kigali', exchangeName: 'Rwanda Stock Exchange', region: 'Africa',
        lat: -1.94, lng: 30.06, utcOffset: 2, currency: 'RWF', fxPair: 'USD/RWF', fxRate: 1368.0,
        idxSym: 'RSEASI', idxName: 'RSE All Share', idxPrice: 146.2, centralBank: 'BNR Rwanda', policyRate: 6.5, cpi: 4.1,
        gdpGrowth: 7.4, gdpBn: 15, unemp: 16.8, debtGdp: 72.1, tradeBn: -2.4, reservesBn: 2.2, rating: 'B+', y10: 12.6, mktCapBn: 3.1, fdiProfile: 'tech'
    },
    {
        id: 'mu-plu', iso2: 'MU', iso3: 'MUS', countryName: 'Mauritius', countryNameEn: 'Mauritius',
        flag: '🇲🇺', city: 'Port Louis', exchangeName: 'Stock Exchange of Mauritius', region: 'Africa',
        lat: -20.16, lng: 57.50, utcOffset: 4, currency: 'MUR', fxPair: 'USD/MUR', fxRate: 46.2,
        idxSym: 'SEMDEX', idxName: 'SEMDEX', idxPrice: 2385.0, centralBank: 'Bank of Mauritius', policyRate: 4.0, cpi: 3.2,
        gdpGrowth: 5.1, gdpBn: 16, unemp: 6.1, debtGdp: 78.4, tradeBn: -3.8, reservesBn: 8.1, rating: 'BBB-', y10: 5.12, mktCapBn: 8.4, fdiProfile: 'finance'
    },
    {
        id: 'bw-gbe', iso2: 'BW', iso3: 'BWA', countryName: 'Botswana', countryNameEn: 'Botswana',
        flag: '🇧🇼', city: 'Gaborone', exchangeName: 'Botswana Stock Exchange', region: 'Africa',
        lat: -24.63, lng: 25.91, utcOffset: 2, currency: 'BWP', fxPair: 'USD/BWP', fxRate: 13.45,
        idxSym: 'DCIBT', idxName: 'BSE DCI', idxPrice: 9840.0, centralBank: 'Bank of Botswana', policyRate: 1.9, cpi: 2.8,
        gdpGrowth: 2.9, gdpBn: 20, unemp: 25.4, debtGdp: 22.8, tradeBn: -0.4, reservesBn: 4.6, rating: 'BBB+', y10: 6.9, mktCapBn: 4.2, fdiProfile: 'energy'
    },
    {
        id: 'na-wdh', iso2: 'NA', iso3: 'NAM', countryName: 'Namibia', countryNameEn: 'Namibia',
        flag: '🇳🇦', city: 'Windhoek', exchangeName: 'Namibian Stock Exchange', region: 'Africa',
        lat: -22.56, lng: 17.07, utcOffset: 2, currency: 'NAD', fxPair: 'USD/NAD', fxRate: 17.88,
        idxSym: 'NSX', idxName: 'NSX Overall', idxPrice: 1842.0, centralBank: 'Bank of Namibia', policyRate: 7.25, cpi: 3.4,
        gdpGrowth: 3.6, gdpBn: 14, unemp: 19.8, debtGdp: 66.2, tradeBn: -1.8, reservesBn: 3.2, rating: 'B+', y10: 10.1, mktCapBn: 3.5, fdiProfile: 'energy'
    },
    {
        id: 'ao-lad', iso2: 'AO', iso3: 'AGO', countryName: 'Angola', countryNameEn: 'Angola',
        flag: '🇦🇴', city: 'Luanda', exchangeName: 'BODIVA Angola', region: 'Africa',
        lat: -8.84, lng: 13.23, utcOffset: 1, currency: 'AOA', fxPair: 'USD/AOA', fxRate: 912.0,
        idxSym: 'BODIVA', idxName: 'BODIVA Index', idxPrice: 1245.0, centralBank: 'BNA Angola', policyRate: 19.5, cpi: 26.8,
        gdpGrowth: 2.8, gdpBn: 113, unemp: 31.8, debtGdp: 69.2, tradeBn: 18.4, reservesBn: 14.8, rating: 'B-', y10: 11.8, mktCapBn: 5.8, fdiProfile: 'energy'
    },
    {
        id: 'dz-alg', iso2: 'DZ', iso3: 'DZA', countryName: 'Algeria', countryNameEn: 'Algeria',
        flag: '🇩🇿', city: 'Algeri', exchangeName: 'Bourse d\'Alger', region: 'Africa',
        lat: 36.75, lng: 3.06, utcOffset: 1, currency: 'DZD', fxPair: 'USD/DZD', fxRate: 133.4,
        idxSym: 'DZAIR', idxName: 'DZAIR Index', idxPrice: 3640.0, centralBank: 'Bank of Algeria', policyRate: 3.0, cpi: 4.5,
        gdpGrowth: 3.7, gdpBn: 264, unemp: 11.4, debtGdp: 49.6, tradeBn: 14.2, reservesBn: 71.0, rating: 'B+', y10: 5.8, mktCapBn: 4.4, fdiProfile: 'energy'
    },

    // ======================= ASIA (23 HUBS / 21 PAESI) =======================
    {
        id: 'jp-tyo', iso2: 'JP', iso3: 'JPN', countryName: 'Giappone', countryNameEn: 'Japan',
        flag: '🇯🇵', city: 'Tokyo', exchangeName: 'Tokyo Stock Exchange (TSE)', region: 'Asia',
        lat: 35.68, lng: 139.69, utcOffset: 9, openHour: 9, closeHour: 15, currency: 'JPY', fxPair: 'USD/JPY', fxRate: 153.4,
        idxSym: 'N225', idxName: 'Nikkei 225', idxPrice: 39480.0, centralBank: 'Bank of Japan (BoJ)', policyRate: 0.25, cpi: 2.5,
        gdpGrowth: 0.9, gdpBn: 4070, unemp: 2.5, debtGdp: 251.2, tradeBn: -38.4, reservesBn: 1245, rating: 'A+', y10: 1.02, mktCapBn: 6420,
        fdiProfile: 'industrial', isFlagship: true,
        stocks: [
            { symbol: 'TM', name: 'Toyota Motor Corp.', sector: 'Automotive', basePrice: 178.4, marketCapBn: 242.0 },
            { symbol: 'SONY', name: 'Sony Group Corp.', sector: 'Tech & Media', basePrice: 19.8, marketCapBn: 121.0 },
            { symbol: 'MUFG', name: 'Mitsubishi UFJ Financial', sector: 'Finanza', basePrice: 11.4, marketCapBn: 136.0 }
        ]
    },
    {
        id: 'cn-sha', iso2: 'CN', iso3: 'CHN', countryName: 'Cina (Shanghai)', countryNameEn: 'China',
        flag: '🇨🇳', city: 'Shanghai', exchangeName: 'Shanghai Stock Exchange (SSE)', region: 'Asia',
        lat: 31.23, lng: 121.47, utcOffset: 8, openHour: 9, closeHour: 15, currency: 'CNY', fxPair: 'USD/CNY', fxRate: 7.21,
        idxSym: 'CSI300', idxName: 'CSI 300', idxPrice: 3985.6, centralBank: 'PBoC', policyRate: 3.1, cpi: 0.4,
        gdpGrowth: 4.8, gdpBn: 18530, unemp: 5.1, debtGdp: 88.6, tradeBn: 845.0, reservesBn: 3260, rating: 'A+', y10: 2.11, mktCapBn: 10850,
        fdiProfile: 'industrial', isFlagship: true,
        stocks: [
            { symbol: 'BABA', name: 'Alibaba Group', sector: 'Cloud & E-Commerce', basePrice: 94.6, marketCapBn: 224.0 },
            { symbol: 'BYDDY', name: 'BYD Co. Ltd.', sector: 'EV & Batterie', basePrice: 72.4, marketCapBn: 105.0 },
            { symbol: 'ICBC', name: 'ICBC Bank', sector: 'Finanza', basePrice: 12.1, marketCapBn: 268.0 }
        ]
    },
    {
        id: 'cn-szx', iso2: 'CN', iso3: 'CHN', countryName: 'Cina (Shenzhen Tech)', countryNameEn: 'China Shenzhen',
        flag: '🇨🇳', city: 'Shenzhen', exchangeName: 'Shenzhen Stock Exchange (SZSE)', region: 'Asia',
        lat: 22.54, lng: 114.06, utcOffset: 8, openHour: 9, closeHour: 15, currency: 'CNY', fxPair: 'USD/CNY', fxRate: 7.21,
        idxSym: 'SZSE', idxName: 'SZSE Component', idxPrice: 10840.2, centralBank: 'PBoC', policyRate: 3.1, cpi: 0.4,
        gdpGrowth: 4.8, gdpBn: 18530, unemp: 5.1, debtGdp: 88.6, tradeBn: 845.0, reservesBn: 3260, rating: 'A+', y10: 2.11, mktCapBn: 4650,
        fdiProfile: 'tech',
        stocks: [
            { symbol: 'CATL', name: 'Contemporary Amperex', sector: 'Batterie EV', basePrice: 36.2, marketCapBn: 158.0 },
            { symbol: 'MIDEA', name: 'Midea Group', sector: 'Robotica & Industria', basePrice: 10.4, marketCapBn: 74.0 },
            { symbol: 'PINGAN', name: 'Ping An Insurance', sector: 'Finanza', basePrice: 7.8, marketCapBn: 138.0 }
        ]
    },
    {
        id: 'hk-hkg', iso2: 'HK', iso3: 'HKG', countryName: 'Hong Kong', countryNameEn: 'Hong Kong',
        flag: '🇭🇰', city: 'Hong Kong', exchangeName: 'Hong Kong Exchanges (HKEX)', region: 'Asia',
        lat: 22.32, lng: 114.17, utcOffset: 8, openHour: 9, closeHour: 16, currency: 'HKD', fxPair: 'USD/HKD', fxRate: 7.77,
        idxSym: 'HSI', idxName: 'Hang Seng Index', idxPrice: 20640.5, centralBank: 'HKMA', policyRate: 5.0, cpi: 2.1,
        gdpGrowth: 2.9, gdpBn: 406, unemp: 3.0, debtGdp: 8.5, tradeBn: -48.2, reservesBn: 421, rating: 'AA+', y10: 3.74, mktCapBn: 4520,
        fdiProfile: 'finance', isFlagship: true,
        stocks: [
            { symbol: '0700.HK', name: 'Tencent Holdings', sector: 'Tech & AI', basePrice: 54.2, marketCapBn: 502.0 },
            { symbol: '1299.HK', name: 'AIA Group', sector: 'Assicurazioni', basePrice: 8.1, marketCapBn: 89.0 },
            { symbol: '0388.HK', name: 'HKEX Group', sector: 'Exchange', basePrice: 41.5, marketCapBn: 52.6 }
        ]
    },
    {
        id: 'sg-sin', iso2: 'SG', iso3: 'SGP', countryName: 'Singapore', countryNameEn: 'Singapore',
        flag: '🇸🇬', city: 'Singapore', exchangeName: 'Singapore Exchange (SGX)', region: 'Asia',
        lat: 1.35, lng: 103.82, utcOffset: 8, openHour: 9, closeHour: 17, currency: 'SGD', fxPair: 'USD/SGD', fxRate: 1.334,
        idxSym: 'STI', idxName: 'Straits Times Index', idxPrice: 3742.8, centralBank: 'MAS', policyRate: 3.55, cpi: 2.0,
        gdpGrowth: 2.8, gdpBn: 530, unemp: 2.0, debtGdp: 168.0, tradeBn: 132.0, reservesBn: 388, rating: 'AAA', y10: 2.88, mktCapBn: 645,
        fdiProfile: 'finance', isFlagship: true,
        stocks: [
            { symbol: 'D05.SI', name: 'DBS Group Holdings', sector: 'Finanza', basePrice: 31.8, marketCapBn: 90.4 },
            { symbol: 'O39.SI', name: 'OCBC Bank', sector: 'Finanza', basePrice: 12.1, marketCapBn: 54.6 },
            { symbol: 'SE', name: 'Sea Limited', sector: 'Fintech & Gaming', basePrice: 104.2, marketCapBn: 59.8 }
        ]
    },
    {
        id: 'kr-sel', iso2: 'KR', iso3: 'KOR', countryName: 'Corea del Sud', countryNameEn: 'South Korea',
        flag: '🇰🇷', city: 'Seul', exchangeName: 'Korea Exchange (KRX)', region: 'Asia',
        lat: 37.57, lng: 126.98, utcOffset: 9, openHour: 9, closeHour: 15, currency: 'KRW', fxPair: 'USD/KRW', fxRate: 1392.0,
        idxSym: 'KOSPI', idxName: 'KOSPI Composite', idxPrice: 2565.4, centralBank: 'Bank of Korea', policyRate: 3.25, cpi: 1.6,
        gdpGrowth: 2.4, gdpBn: 1870, unemp: 2.6, debtGdp: 51.8, tradeBn: 46.5, reservesBn: 416, rating: 'AA', y10: 3.06, mktCapBn: 1840,
        fdiProfile: 'tech', isFlagship: true,
        stocks: [
            { symbol: '005930.KS', name: 'Samsung Electronics', sector: 'Semiconduttori', basePrice: 43.2, marketCapBn: 262.0 },
            { symbol: '000660.KS', name: 'SK Hynix', sector: 'AI Memory HBM', basePrice: 139.5, marketCapBn: 101.0 },
            { symbol: '005380.KS', name: 'Hyundai Motor', sector: 'Automotive', basePrice: 162.0, marketCapBn: 38.4 }
        ]
    },
    {
        id: 'in-bom', iso2: 'IN', iso3: 'IND', countryName: 'India', countryNameEn: 'India',
        flag: '🇮🇳', city: 'Mumbai', exchangeName: 'NSE / BSE India', region: 'Asia',
        lat: 19.08, lng: 72.88, utcOffset: 5.5, openHour: 9, closeHour: 15, currency: 'INR', fxPair: 'USD/INR', fxRate: 84.35,
        idxSym: 'NIFTY50', idxName: 'NIFTY 50', idxPrice: 24380.5, centralBank: 'Reserve Bank of India (RBI)', policyRate: 6.5, cpi: 5.2,
        gdpGrowth: 7.0, gdpBn: 3940, unemp: 7.4, debtGdp: 81.9, tradeBn: -242.0, reservesBn: 692, rating: 'BBB-', y10: 6.84, mktCapBn: 5120,
        fdiProfile: 'tech', isFlagship: true,
        stocks: [
            { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Energia & Digital', basePrice: 15.8, marketCapBn: 214.0 },
            { symbol: 'TCS', name: 'Tata Consultancy', sector: 'IT & AI', basePrice: 49.4, marketCapBn: 179.0 },
            { symbol: 'HDB', name: 'HDFC Bank', sector: 'Finanza', basePrice: 64.2, marketCapBn: 162.0 }
        ]
    },
    {
        id: 'tw-tpe', iso2: 'TW', iso3: 'TWN', countryName: 'Taiwan', countryNameEn: 'Taiwan',
        flag: '🇹🇼', city: 'Taipei', exchangeName: 'Taiwan Stock Exchange (TWSE)', region: 'Asia',
        lat: 25.03, lng: 121.57, utcOffset: 8, openHour: 9, closeHour: 13, currency: 'TWD', fxPair: 'USD/TWD', fxRate: 32.35,
        idxSym: 'TWII', idxName: 'TAIEX Weighted', idxPrice: 23180.4, centralBank: 'CBC Taiwan', policyRate: 2.0, cpi: 1.8,
        gdpGrowth: 3.9, gdpBn: 802, unemp: 3.4, debtGdp: 27.6, tradeBn: 88.4, reservesBn: 577, rating: 'AA+', y10: 1.56, mktCapBn: 2380,
        fdiProfile: 'tech', isFlagship: true,
        stocks: [
            { symbol: 'TSM', name: 'TSMC (Taiwan Semi)', sector: 'Semiconduttori AI', basePrice: 194.2, marketCapBn: 1005 },
            { symbol: '2317.TW', name: 'Foxconn (Hon Hai)', sector: 'Hardware AI', basePrice: 6.75, marketCapBn: 93.4 },
            { symbol: '2454.TW', name: 'MediaTek', sector: 'Chipset', basePrice: 41.2, marketCapBn: 65.8 }
        ]
    },
    {
        id: 'id-jkt', iso2: 'ID', iso3: 'IDN', countryName: 'Indonesia', countryNameEn: 'Indonesia',
        flag: '🇮🇩', city: 'Giacarta', exchangeName: 'Indonesia Stock Exchange (IDX)', region: 'Asia',
        lat: -6.21, lng: 106.85, utcOffset: 7, openHour: 9, closeHour: 16, currency: 'IDR', fxPair: 'USD/IDR', fxRate: 15780.0,
        idxSym: 'JKSE', idxName: 'IDX Composite', idxPrice: 7420.6, centralBank: 'Bank Indonesia', policyRate: 6.0, cpi: 1.9,
        gdpGrowth: 5.1, gdpBn: 1475, unemp: 4.9, debtGdp: 39.4, tradeBn: 34.2, reservesBn: 151, rating: 'BBB', y10: 6.78, mktCapBn: 785, fdiProfile: 'energy', isFlagship: true
    },
    {
        id: 'th-bkk', iso2: 'TH', iso3: 'THA', countryName: 'Thailandia', countryNameEn: 'Thailand',
        flag: '🇹🇭', city: 'Bangkok', exchangeName: 'Stock Exchange of Thailand (SET)', region: 'Asia',
        lat: 13.76, lng: 100.50, utcOffset: 7, currency: 'THB', fxPair: 'USD/THB', fxRate: 34.45,
        idxSym: 'SET', idxName: 'SET Index', idxPrice: 1465.2, centralBank: 'Bank of Thailand', policyRate: 2.25, cpi: 0.8,
        gdpGrowth: 2.7, gdpBn: 528, unemp: 1.1, debtGdp: 63.8, tradeBn: 12.4, reservesBn: 238, rating: 'BBB+', y10: 2.44, mktCapBn: 515, fdiProfile: 'industrial'
    },
    {
        id: 'my-kul', iso2: 'MY', iso3: 'MYS', countryName: 'Malesia', countryNameEn: 'Malaysia',
        flag: '🇲🇾', city: 'Kuala Lumpur', exchangeName: 'Bursa Malaysia', region: 'Asia',
        lat: 3.14, lng: 101.69, utcOffset: 8, currency: 'MYR', fxPair: 'USD/MYR', fxRate: 4.44,
        idxSym: 'KLCI', idxName: 'FTSE Bursa KLCI', idxPrice: 1618.4, centralBank: 'Bank Negara Malaysia', policyRate: 3.0, cpi: 1.9,
        gdpGrowth: 5.0, gdpBn: 445, unemp: 3.2, debtGdp: 64.2, tradeBn: 36.8, reservesBn: 118, rating: 'A-', y10: 3.88, mktCapBn: 432, fdiProfile: 'tech'
    },
    {
        id: 'vn-sgn', iso2: 'VN', iso3: 'VNM', countryName: 'Vietnam', countryNameEn: 'Vietnam',
        flag: '🇻🇳', city: 'Ho Chi Minh', exchangeName: 'Ho Chi Minh Exchange (HOSE)', region: 'Asia',
        lat: 10.82, lng: 106.63, utcOffset: 7, currency: 'VND', fxPair: 'USD/VND', fxRate: 25360.0,
        idxSym: 'VNINDEX', idxName: 'VN-Index', idxPrice: 1264.8, centralBank: 'SBV', policyRate: 4.5, cpi: 3.4,
        gdpGrowth: 6.4, gdpBn: 465, unemp: 2.2, debtGdp: 34.8, tradeBn: 24.6, reservesBn: 88, rating: 'BB+', y10: 2.72, mktCapBn: 215, fdiProfile: 'industrial'
    },
    {
        id: 'ph-mnl', iso2: 'PH', iso3: 'PHL', countryName: 'Filippine', countryNameEn: 'Philippines',
        flag: '🇵🇭', city: 'Manila', exchangeName: 'Philippine Stock Exchange (PSE)', region: 'Asia',
        lat: 14.60, lng: 120.98, utcOffset: 8, currency: 'PHP', fxPair: 'USD/PHP', fxRate: 58.65,
        idxSym: 'PSEI', idxName: 'PSEi Composite', idxPrice: 7185.0, centralBank: 'BSP', policyRate: 6.0, cpi: 2.4,
        gdpGrowth: 5.8, gdpBn: 472, unemp: 3.9, debtGdp: 60.4, tradeBn: -52.1, reservesBn: 112, rating: 'BBB+', y10: 5.92, mktCapBn: 258, fdiProfile: 'balanced'
    },
    {
        id: 'pk-khi', iso2: 'PK', iso3: 'PAK', countryName: 'Pakistan', countryNameEn: 'Pakistan',
        flag: '🇵🇰', city: 'Karachi', exchangeName: 'Pakistan Stock Exchange (PSX)', region: 'Asia',
        lat: 24.86, lng: 67.01, utcOffset: 5, currency: 'PKR', fxPair: 'USD/PKR', fxRate: 277.8,
        idxSym: 'KSE100', idxName: 'KSE 100', idxPrice: 94280.0, centralBank: 'State Bank of Pakistan', policyRate: 15.0, cpi: 7.2,
        gdpGrowth: 3.1, gdpBn: 374, unemp: 6.2, debtGdp: 71.5, tradeBn: -24.1, reservesBn: 16.0, rating: 'CCC+', y10: 12.1, mktCapBn: 44, fdiProfile: 'emerging'
    },
    {
        id: 'bd-dac', iso2: 'BD', iso3: 'BGD', countryName: 'Bangladesh', countryNameEn: 'Bangladesh',
        flag: '🇧🇩', city: 'Dacca', exchangeName: 'Dhaka Stock Exchange', region: 'Asia',
        lat: 23.81, lng: 90.41, utcOffset: 6, currency: 'BDT', fxPair: 'USD/BDT', fxRate: 119.5,
        idxSym: 'DSEX', idxName: 'DSEX Broad', idxPrice: 5340.0, centralBank: 'Bangladesh Bank', policyRate: 10.0, cpi: 9.8,
        gdpGrowth: 4.9, gdpBn: 451, unemp: 4.7, debtGdp: 39.2, tradeBn: -22.4, reservesBn: 24.8, rating: 'B+', y10: 12.4, mktCapBn: 56, fdiProfile: 'industrial'
    },
    {
        id: 'lk-cmb', iso2: 'LK', iso3: 'LKA', countryName: 'Sri Lanka', countryNameEn: 'Sri Lanka',
        flag: '🇱🇰', city: 'Colombo', exchangeName: 'Colombo Stock Exchange', region: 'Asia',
        lat: 6.93, lng: 79.86, utcOffset: 5.5, currency: 'LKR', fxPair: 'USD/LKR', fxRate: 292.4,
        idxSym: 'ASPI', idxName: 'CSE All Share', idxPrice: 12980.0, centralBank: 'CBSL', policyRate: 8.25, cpi: 1.2,
        gdpGrowth: 4.4, gdpBn: 88, unemp: 4.5, debtGdp: 104.2, tradeBn: -5.2, reservesBn: 6.4, rating: 'CCC', y10: 11.9, mktCapBn: 16.4, fdiProfile: 'emerging'
    },
    {
        id: 'uz-tas', iso2: 'UZ', iso3: 'UZB', countryName: 'Uzbekistan', countryNameEn: 'Uzbekistan',
        flag: '🇺🇿', city: 'Tashkent', exchangeName: 'Tashkent Stock Exchange', region: 'Asia',
        lat: 41.30, lng: 69.24, utcOffset: 5, currency: 'UZS', fxPair: 'USD/UZS', fxRate: 12810.0,
        idxSym: 'UCI', idxName: 'UZSE Composite', idxPrice: 685.0, centralBank: 'CBU Uzbekistan', policyRate: 13.5, cpi: 10.2,
        gdpGrowth: 5.8, gdpBn: 112, unemp: 6.8, debtGdp: 34.4, tradeBn: -12.6, reservesBn: 41.2, rating: 'BB-', y10: 13.8, mktCapBn: 18.2, fdiProfile: 'energy'
    },
    {
        id: 'mn-uln', iso2: 'MN', iso3: 'MNG', countryName: 'Mongolia', countryNameEn: 'Mongolia',
        flag: '🇲🇳', city: 'Ulaanbaatar', exchangeName: 'Mongolian Stock Exchange', region: 'Asia',
        lat: 47.92, lng: 106.91, utcOffset: 8, currency: 'MNT', fxPair: 'USD/MNT', fxRate: 3405.0,
        idxSym: 'MTOP20', idxName: 'MSE Top 20', idxPrice: 46820.0, centralBank: 'Bank of Mongolia', policyRate: 10.0, cpi: 6.8,
        gdpGrowth: 5.4, gdpBn: 23, unemp: 5.8, debtGdp: 46.1, tradeBn: 4.2, reservesBn: 4.9, rating: 'B+', y10: 11.4, mktCapBn: 3.4, fdiProfile: 'energy'
    },
    {
        id: 'kh-pnh', iso2: 'KH', iso3: 'KHM', countryName: 'Cambogia', countryNameEn: 'Cambodia',
        flag: '🇰🇭', city: 'Phnom Penh', exchangeName: 'Cambodia Securities Exchange', region: 'Asia',
        lat: 11.56, lng: 104.92, utcOffset: 7, currency: 'KHR', fxPair: 'USD/KHR', fxRate: 4065.0,
        idxSym: 'CSX', idxName: 'CSX Index', idxPrice: 412.6, centralBank: 'NBC Cambodia', policyRate: 4.5, cpi: 2.2,
        gdpGrowth: 5.9, gdpBn: 46, unemp: 0.4, debtGdp: 35.8, tradeBn: -3.2, reservesBn: 20.4, rating: 'B+', y10: 7.2, mktCapBn: 2.9, fdiProfile: 'industrial'
    },
    {
        id: 'np-ktm', iso2: 'NP', iso3: 'NPL', countryName: 'Nepal', countryNameEn: 'Nepal',
        flag: '🇳🇵', city: 'Kathmandu', exchangeName: 'Nepal Stock Exchange (NEPSE)', region: 'Asia',
        lat: 27.72, lng: 85.32, utcOffset: 5.75, currency: 'NPR', fxPair: 'USD/NPR', fxRate: 134.9,
        idxSym: 'NEPSE', idxName: 'NEPSE Index', idxPrice: 2715.0, centralBank: 'Nepal Rastra Bank', policyRate: 5.5, cpi: 4.8,
        gdpGrowth: 4.6, gdpBn: 44, unemp: 10.8, debtGdp: 43.2, tradeBn: -10.8, reservesBn: 15.2, rating: 'BB-', y10: 6.4, mktCapBn: 31.4, fdiProfile: 'emerging'
    },
    {
        id: 'az-bak', iso2: 'AZ', iso3: 'AZE', countryName: 'Azerbaigian', countryNameEn: 'Azerbaijan',
        flag: '🇦🇿', city: 'Baku', exchangeName: 'Baku Stock Exchange', region: 'Asia',
        lat: 40.41, lng: 49.87, utcOffset: 4, currency: 'AZN', fxPair: 'USD/AZN', fxRate: 1.7,
        idxSym: 'BSEAZ', idxName: 'BSE Baku', idxPrice: 1210.0, centralBank: 'CBA Azerbaijan', policyRate: 7.25, cpi: 2.9,
        gdpGrowth: 3.4, gdpBn: 76, unemp: 5.4, debtGdp: 21.8, tradeBn: 14.6, reservesBn: 11.8, rating: 'BBB-', y10: 6.45, mktCapBn: 4.2, fdiProfile: 'energy'
    },
    {
        id: 'am-evn', iso2: 'AM', iso3: 'ARM', countryName: 'Armenia', countryNameEn: 'Armenia',
        flag: '🇦🇲', city: 'Yerevan', exchangeName: 'Armenia Securities Exchange', region: 'Asia',
        lat: 40.18, lng: 44.51, utcOffset: 4, currency: 'AMD', fxPair: 'USD/AMD', fxRate: 388.0,
        idxSym: 'AMX', idxName: 'AMX Composite', idxPrice: 540.0, centralBank: 'CBA Armenia', policyRate: 7.25, cpi: 1.2,
        gdpGrowth: 5.8, gdpBn: 26, unemp: 12.6, debtGdp: 49.2, tradeBn: -2.9, reservesBn: 3.6, rating: 'BB-', y10: 9.8, mktCapBn: 1.8, fdiProfile: 'tech'
    },

    // ======================= OCEANIA (4) =======================
    {
        id: 'au-syd', iso2: 'AU', iso3: 'AUS', countryName: 'Australia', countryNameEn: 'Australia',
        flag: '🇦🇺', city: 'Sydney', exchangeName: 'Australian Securities Exchange (ASX)', region: 'Oceania',
        lat: -33.87, lng: 151.21, utcOffset: 10, openHour: 10, closeHour: 16, currency: 'AUD', fxPair: 'AUD/USD', fxRate: 0.654,
        idxSym: 'AS51', idxName: 'S&P/ASX 200', idxPrice: 8312.4, centralBank: 'Reserve Bank of Australia (RBA)', policyRate: 4.35, cpi: 2.8,
        gdpGrowth: 1.5, gdpBn: 1790, unemp: 4.1, debtGdp: 49.4, tradeBn: 58.2, reservesBn: 64, rating: 'AAA', y10: 4.48, mktCapBn: 1840,
        fdiProfile: 'energy', isFlagship: true,
        stocks: [
            { symbol: 'BHP', name: 'BHP Group', sector: 'Mining & Metalli', basePrice: 54.8, marketCapBn: 139.0 },
            { symbol: 'CBA.AX', name: 'Commonwealth Bank', sector: 'Finanza', basePrice: 98.4, marketCapBn: 165.0 },
            { symbol: 'CSL.AX', name: 'CSL Limited', sector: 'Biotecnologia', basePrice: 189.2, marketCapBn: 91.4 }
        ]
    },
    {
        id: 'nz-akl', iso2: 'NZ', iso3: 'NZL', countryName: 'Nuova Zelanda', countryNameEn: 'New Zealand',
        flag: '🇳🇿', city: 'Auckland', exchangeName: 'NZX Limited', region: 'Oceania',
        lat: -36.85, lng: 174.76, utcOffset: 12, openHour: 10, closeHour: 17, currency: 'NZD', fxPair: 'NZD/USD', fxRate: 0.594,
        idxSym: 'NZ50', idxName: 'S&P/NZX 50', idxPrice: 12740.0, centralBank: 'RBNZ', policyRate: 4.75, cpi: 2.2,
        gdpGrowth: 0.8, gdpBn: 258, unemp: 4.8, debtGdp: 45.6, tradeBn: -5.4, reservesBn: 16.4, rating: 'AAA', y10: 4.54, mktCapBn: 104, fdiProfile: 'balanced'
    },
    {
        id: 'pg-pom', iso2: 'PG', iso3: 'PNG', countryName: 'Papua Nuova Guinea', countryNameEn: 'Papua New Guinea',
        flag: '🇵🇬', city: 'Port Moresby', exchangeName: 'PNGX Markets', region: 'Oceania',
        lat: -9.44, lng: 147.18, utcOffset: 10, currency: 'PGK', fxPair: 'USD/PGK', fxRate: 3.96,
        idxSym: 'KSi', idxName: 'Kina Securities Index', idxPrice: 6420.0, centralBank: 'Bank of PNG', policyRate: 3.0, cpi: 2.6,
        gdpGrowth: 4.4, gdpBn: 32, unemp: 2.8, debtGdp: 51.8, tradeBn: 6.4, reservesBn: 3.4, rating: 'B-', y10: 9.2, mktCapBn: 7.4, fdiProfile: 'energy'
    },
    {
        id: 'fj-suv', iso2: 'FJ', iso3: 'FJI', countryName: 'Figi', countryNameEn: 'Fiji',
        flag: '🇫🇯', city: 'Suva', exchangeName: 'South Pacific Stock Exchange', region: 'Oceania',
        lat: -18.14, lng: 178.44, utcOffset: 12, currency: 'FJD', fxPair: 'USD/FJD', fxRate: 2.26,
        idxSym: 'STRI', idxName: 'SPX Total Return', idxPrice: 9120.0, centralBank: 'Reserve Bank of Fiji', policyRate: 0.25, cpi: 4.2,
        gdpGrowth: 3.5, gdpBn: 6.1, unemp: 4.3, debtGdp: 79.4, tradeBn: -1.6, reservesBn: 1.6, rating: 'B+', y10: 5.4, mktCapBn: 1.6, fdiProfile: 'balanced'
    },

    // ======================= ULTERIORI ECONOMIE GLOBALI (15+ PER SUPERARE 112 PAESI) =======================
    {
        id: 'sv-sal', iso2: 'SV', iso3: 'SLV', countryName: 'El Salvador', countryNameEn: 'El Salvador',
        flag: '🇸🇻', city: 'San Salvador', exchangeName: 'Bolsa de Valores El Salvador', region: 'Nord America',
        lat: 13.69, lng: -89.22, utcOffset: -6, currency: 'USD', fxPair: 'BTC/USD', fxRate: 92400.0,
        idxSym: 'BVES', idxName: 'BVES Index', idxPrice: 482.0, centralBank: 'BCR El Salvador', policyRate: 4.5, cpi: 1.4,
        gdpGrowth: 3.0, gdpBn: 36, unemp: 4.1, debtGdp: 84.2, tradeBn: -9.1, reservesBn: 3.4, rating: 'B-', y10: 8.95, mktCapBn: 4.2, fdiProfile: 'tech'
    },
    {
        id: 'hn-tgu', iso2: 'HN', iso3: 'HND', countryName: 'Honduras', countryNameEn: 'Honduras',
        flag: '🇭🇳', city: 'Tegucigalpa', exchangeName: 'BCV Honduras', region: 'Nord America',
        lat: 14.07, lng: -87.19, utcOffset: -6, currency: 'HNL', fxPair: 'USD/HNL', fxRate: 25.1,
        idxSym: 'BCVH', idxName: 'BCV Index', idxPrice: 398.0, centralBank: 'BCH Honduras', policyRate: 5.75, cpi: 4.6,
        gdpGrowth: 3.5, gdpBn: 37, unemp: 6.2, debtGdp: 46.8, tradeBn: -6.8, reservesBn: 7.4, rating: 'BB-', y10: 7.8, mktCapBn: 2.6, fdiProfile: 'emerging'
    },
    {
        id: 'bb-bgi', iso2: 'BB', iso3: 'BRB', countryName: 'Barbados', countryNameEn: 'Barbados',
        flag: '🇧🇧', city: 'Bridgetown', exchangeName: 'Barbados Stock Exchange', region: 'Nord America',
        lat: 13.10, lng: -59.61, utcOffset: -4, currency: 'BBD', fxPair: 'USD/BBD', fxRate: 2.0,
        idxSym: 'BSEBB', idxName: 'BSE Composite', idxPrice: 758.0, centralBank: 'Central Bank Barbados', policyRate: 2.0, cpi: 2.4,
        gdpGrowth: 3.8, gdpBn: 6.9, unemp: 7.6, debtGdp: 109.2, tradeBn: -1.4, reservesBn: 1.6, rating: 'B', y10: 7.1, mktCapBn: 2.8, fdiProfile: 'finance'
    },
    {
        id: 'al-tia', iso2: 'AL', iso3: 'ALB', countryName: 'Albania', countryNameEn: 'Albania',
        flag: '🇦🇱', city: 'Tirana', exchangeName: 'ALSE Tirana', region: 'Europa',
        lat: 41.33, lng: 19.82, utcOffset: 1, currency: 'ALL', fxPair: 'USD/ALL', fxRate: 91.5,
        idxSym: 'ALSE', idxName: 'ALSE Composite', idxPrice: 625.0, centralBank: 'Bank of Albania', policyRate: 2.75, cpi: 2.1,
        gdpGrowth: 3.6, gdpBn: 26, unemp: 10.6, debtGdp: 57.4, tradeBn: -4.6, reservesBn: 6.2, rating: 'BB-', y10: 5.65, mktCapBn: 1.9, fdiProfile: 'balanced'
    },
    {
        id: 'mk-skp', iso2: 'MK', iso3: 'MKD', countryName: 'Macedonia del Nord', countryNameEn: 'North Macedonia',
        flag: '🇲🇰', city: 'Skopje', exchangeName: 'Macedonian Stock Exchange', region: 'Europa',
        lat: 41.99, lng: 21.43, utcOffset: 1, currency: 'MKD', fxPair: 'USD/MKD', fxRate: 57.1,
        idxSym: 'MBI10', idxName: 'MBI 10', idxPrice: 8840.0, centralBank: 'NBRM', policyRate: 5.8, cpi: 3.1,
        gdpGrowth: 2.4, gdpBn: 16, unemp: 12.8, debtGdp: 54.6, tradeBn: -3.1, reservesBn: 4.5, rating: 'BB-', y10: 5.8, mktCapBn: 4.2, fdiProfile: 'industrial'
    },
    {
        id: 'ba-sjj', iso2: 'BA', iso3: 'BIH', countryName: 'Bosnia ed Erzegovina', countryNameEn: 'Bosnia and Herzegovina',
        flag: '🇧🇦', city: 'Sarajevo', exchangeName: 'Sarajevo Stock Exchange', region: 'Europa',
        lat: 43.86, lng: 18.41, utcOffset: 1, currency: 'BAM', fxPair: 'USD/BAM', fxRate: 1.81,
        idxSym: 'SASX10', idxName: 'SASX-10', idxPrice: 1184.0, centralBank: 'CBBH', policyRate: 3.25, cpi: 1.8,
        gdpGrowth: 2.6, gdpBn: 28, unemp: 13.4, debtGdp: 29.8, tradeBn: -5.4, reservesBn: 8.9, rating: 'B+', y10: 5.9, mktCapBn: 3.2, fdiProfile: 'industrial'
    },
    {
        id: 'me-tgd', iso2: 'ME', iso3: 'MNE', countryName: 'Montenegro', countryNameEn: 'Montenegro',
        flag: '🇲🇪', city: 'Podgorica', exchangeName: 'Montenegro Stock Exchange', region: 'Europa',
        lat: 42.44, lng: 19.26, utcOffset: 1, currency: 'EUR', fxPair: 'EUR/USD', fxRate: 1.0785,
        idxSym: 'MNSE10', idxName: 'MNSE 10', idxPrice: 1024.0, centralBank: 'CBCG', policyRate: 3.25, cpi: 2.8,
        gdpGrowth: 3.7, gdpBn: 8.1, unemp: 11.4, debtGdp: 61.2, tradeBn: -3.2, reservesBn: 1.6, rating: 'B+', y10: 5.95, mktCapBn: 2.4, fdiProfile: 'balanced'
    },
    {
        id: 'md-kiv', iso2: 'MD', iso3: 'MDA', countryName: 'Moldavia', countryNameEn: 'Moldova',
        flag: '🇲🇩', city: 'Chișinău', exchangeName: 'Moldova Stock Exchange', region: 'Europa',
        lat: 47.01, lng: 28.86, utcOffset: 2, currency: 'MDL', fxPair: 'USD/MDL', fxRate: 17.95,
        idxSym: 'MSX', idxName: 'MSE Index', idxPrice: 742.0, centralBank: 'NBM', policyRate: 3.6, cpi: 4.8,
        gdpGrowth: 2.8, gdpBn: 18, unemp: 4.1, debtGdp: 34.8, tradeBn: -4.4, reservesBn: 5.5, rating: 'B+', y10: 7.4, mktCapBn: 1.2, fdiProfile: 'emerging'
    },
    {
        id: 'zm-lun', iso2: 'ZM', iso3: 'ZMB', countryName: 'Zambia', countryNameEn: 'Zambia',
        flag: '🇿🇲', city: 'Lusaka', exchangeName: 'Lusaka Securities Exchange', region: 'Africa',
        lat: -15.39, lng: 28.32, utcOffset: 2, currency: 'ZMW', fxPair: 'USD/ZMW', fxRate: 26.8,
        idxSym: 'LASI', idxName: 'LuSE All Share', idxPrice: 15240.0, centralBank: 'Bank of Zambia', policyRate: 13.5, cpi: 15.2,
        gdpGrowth: 3.8, gdpBn: 29, unemp: 6.1, debtGdp: 106.0, tradeBn: 1.2, reservesBn: 4.1, rating: 'CCC+', y10: 19.2, mktCapBn: 5.4, fdiProfile: 'energy'
    },
    {
        id: 'mz-mpm', iso2: 'MZ', iso3: 'MOZ', countryName: 'Mozambico', countryNameEn: 'Mozambique',
        flag: '🇲🇿', city: 'Maputo', exchangeName: 'Bolsa de Valores Moçambique', region: 'Africa',
        lat: -25.97, lng: 32.57, utcOffset: 2, currency: 'MZN', fxPair: 'USD/MZN', fxRate: 63.9,
        idxSym: 'BVMZ', idxName: 'BVM Index', idxPrice: 825.0, centralBank: 'Banco de Moçambique', policyRate: 13.5, cpi: 3.2,
        gdpGrowth: 4.4, gdpBn: 22, unemp: 3.6, debtGdp: 94.5, tradeBn: -1.8, reservesBn: 3.7, rating: 'CCC+', y10: 14.4, mktCapBn: 3.1, fdiProfile: 'energy'
    },
    {
        id: 'cm-dla', iso2: 'CM', iso3: 'CMR', countryName: 'Camerun', countryNameEn: 'Cameroon',
        flag: '🇨🇲', city: 'Douala', exchangeName: 'BVMAC Central Africa', region: 'Africa',
        lat: 4.05, lng: 9.77, utcOffset: 1, currency: 'XAF', fxPair: 'USD/XAF', fxRate: 608.0,
        idxSym: 'BVMAC', idxName: 'BVMAC Index', idxPrice: 1024.0, centralBank: 'BEAC', policyRate: 5.0, cpi: 4.9,
        gdpGrowth: 4.0, gdpBn: 53, unemp: 3.8, debtGdp: 41.8, tradeBn: -1.4, reservesBn: 5.1, rating: 'B-', y10: 8.6, mktCapBn: 2.2, fdiProfile: 'energy'
    },
    {
        id: 'zw-hre', iso2: 'ZW', iso3: 'ZWE', countryName: 'Zimbabwe', countryNameEn: 'Zimbabwe',
        flag: '🇿🇼', city: 'Harare', exchangeName: 'Zimbabwe Stock Exchange / VFEX', region: 'Africa',
        lat: -17.83, lng: 31.05, utcOffset: 2, currency: 'ZiG', fxPair: 'USD/ZiG', fxRate: 25.4,
        idxSym: 'ZSEASI', idxName: 'ZSE All Share', idxPrice: 248.6, centralBank: 'RBZ', policyRate: 35.0, cpi: 24.5,
        gdpGrowth: 2.8, gdpBn: 35, unemp: 8.6, debtGdp: 88.2, tradeBn: -1.9, reservesBn: 0.4, rating: 'CC', y10: 16.5, mktCapBn: 4.6, fdiProfile: 'energy'
    },
    {
        id: 'mw-blz', iso2: 'MW', iso3: 'MWI', countryName: 'Malawi', countryNameEn: 'Malawi',
        flag: '🇲🇼', city: 'Blantyre', exchangeName: 'Malawi Stock Exchange', region: 'Africa',
        lat: -15.79, lng: 35.01, utcOffset: 2, currency: 'MWK', fxPair: 'USD/MWK', fxRate: 1734.0,
        idxSym: 'MASI_MW', idxName: 'MSE All Share', idxPrice: 142500, centralBank: 'RBM', policyRate: 26.0, cpi: 29.4,
        gdpGrowth: 2.6, gdpBn: 13, unemp: 5.4, debtGdp: 79.4, tradeBn: -2.1, reservesBn: 0.6, rating: 'CCC-', y10: 21.8, mktCapBn: 4.2, fdiProfile: 'emerging'
    },
    {
        id: 'ly-tip', iso2: 'LY', iso3: 'LBY', countryName: 'Libia', countryNameEn: 'Libya',
        flag: '🇱🇾', city: 'Tripoli', exchangeName: 'Libyan Stock Market', region: 'Africa',
        lat: 32.89, lng: 13.19, utcOffset: 2, currency: 'LYD', fxPair: 'USD/LYD', fxRate: 4.82,
        idxSym: 'LSM', idxName: 'LSM Index', idxPrice: 1142.0, centralBank: 'CBL Libya', policyRate: 3.0, cpi: 2.4,
        gdpGrowth: 5.2, gdpBn: 48, unemp: 18.6, debtGdp: 4.2, tradeBn: 14.5, reservesBn: 84.0, rating: 'NR', y10: 6.2, mktCapBn: 3.8, fdiProfile: 'energy'
    },
    {
        id: 'kg-fru', iso2: 'KG', iso3: 'KGZ', countryName: 'Kirghizistan', countryNameEn: 'Kyrgyzstan',
        flag: '🇰🇬', city: 'Bishkek', exchangeName: 'Kyrgyz Stock Exchange', region: 'Asia',
        lat: 42.87, lng: 74.57, utcOffset: 6, currency: 'KGS', fxPair: 'USD/KGS', fxRate: 86.2,
        idxSym: 'KSE_KG', idxName: 'KSE Index', idxPrice: 3120.0, centralBank: 'NBKR', policyRate: 9.0, cpi: 4.6,
        gdpGrowth: 6.4, gdpBn: 16, unemp: 4.2, debtGdp: 44.1, tradeBn: -6.2, reservesBn: 4.2, rating: 'B', y10: 11.6, mktCapBn: 1.5, fdiProfile: 'energy'
    },
    {
        id: 'bn-bwn', iso2: 'BN', iso3: 'BRN', countryName: 'Brunei', countryNameEn: 'Brunei',
        flag: '🇧🇳', city: 'Bandar Seri Begawan', exchangeName: 'Brunei Securities Hub', region: 'Asia',
        lat: 4.90, lng: 114.94, utcOffset: 8, currency: 'BND', fxPair: 'USD/BND', fxRate: 1.334,
        idxSym: 'BSH', idxName: 'Brunei Energy Index', idxPrice: 1264.0, centralBank: 'BDCB', policyRate: 3.5, cpi: 0.6,
        gdpGrowth: 2.4, gdpBn: 16, unemp: 5.1, debtGdp: 2.4, tradeBn: 4.2, reservesBn: 4.6, rating: 'AA', y10: 3.1, mktCapBn: 3.8, fdiProfile: 'energy'
    },

    // ======================= 23 HUB FINANZIARI STRATEGICI SECONDARI (TOTALE: 110 PAESI / 137 HUB) =======================
    {
        id: 'us-lax', iso2: 'US', iso3: 'USA', countryName: 'Stati Uniti (Los Angeles)', countryNameEn: 'United States Los Angeles',
        flag: '🇺🇸', city: 'Los Angeles', exchangeName: 'Pacific Capital Desk (NYSE)', region: 'Nord America',
        lat: 34.05, lng: -118.24, utcOffset: -8, openHour: 6, closeHour: 13, currency: 'USD', fxPair: 'DXY', fxRate: 104.25,
        idxSym: 'SPX', idxName: 'S&P 500', idxPrice: 5985.4, centralBank: 'Federal Reserve', policyRate: 4.5, cpi: 2.6,
        gdpGrowth: 2.7, gdpBn: 29180, unemp: 4.1, debtGdp: 122.3, tradeBn: -785, reservesBn: 245, rating: 'AA+', y10: 4.28, mktCapBn: 55200,
        fdiProfile: 'tech', isFlagship: true,
        stocks: [
            { symbol: 'DIS', name: 'Walt Disney Co.', sector: 'Media & Streaming', basePrice: 112.4, marketCapBn: 204.0 },
            { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Streaming & AI', basePrice: 874.2, marketCapBn: 374.0 },
            { symbol: 'AMGN', name: 'Amgen Inc.', sector: 'Biotecnologia', basePrice: 296.8, marketCapBn: 159.0 }
        ]
    },
    {
        id: 'us-hou', iso2: 'US', iso3: 'USA', countryName: 'Stati Uniti (Houston Energy)', countryNameEn: 'United States Houston',
        flag: '🇺🇸', city: 'Houston', exchangeName: 'NYMEX Energy Desk (ICE)', region: 'Nord America',
        lat: 29.76, lng: -95.37, utcOffset: -6, openHour: 8, closeHour: 16, currency: 'USD', fxPair: 'DXY', fxRate: 104.25,
        idxSym: 'XLE', idxName: 'US Energy Sector', idxPrice: 95.8, centralBank: 'Federal Reserve', policyRate: 4.5, cpi: 2.6,
        gdpGrowth: 2.7, gdpBn: 29180, unemp: 4.1, debtGdp: 122.3, tradeBn: -785, reservesBn: 245, rating: 'AA+', y10: 4.28, mktCapBn: 55200,
        fdiProfile: 'energy', isFlagship: true,
        stocks: [
            { symbol: 'XOM', name: 'Exxon Mobil Corp.', sector: 'Energia', basePrice: 119.4, marketCapBn: 526.0 },
            { symbol: 'CVX', name: 'Chevron Corp.', sector: 'Energia', basePrice: 161.2, marketCapBn: 292.0 },
            { symbol: 'COP', name: 'ConocoPhillips', sector: 'Oil & Gas', basePrice: 108.6, marketCapBn: 126.0 }
        ]
    },
    {
        id: 'us-sea', iso2: 'US', iso3: 'USA', countryName: 'Stati Uniti (Seattle Cloud)', countryNameEn: 'United States Seattle',
        flag: '🇺🇸', city: 'Seattle', exchangeName: 'NASDAQ Pacific Tech (NDAQ)', region: 'Nord America',
        lat: 47.61, lng: -122.33, utcOffset: -8, openHour: 6, closeHour: 13, currency: 'USD', fxPair: 'DXY', fxRate: 104.25,
        idxSym: 'NDX', idxName: 'NASDAQ 100', idxPrice: 21080.5, centralBank: 'Federal Reserve', policyRate: 4.5, cpi: 2.6,
        gdpGrowth: 2.7, gdpBn: 29180, unemp: 4.1, debtGdp: 122.3, tradeBn: -785, reservesBn: 245, rating: 'AA+', y10: 4.28, mktCapBn: 55200,
        fdiProfile: 'tech', isFlagship: true,
        stocks: [
            { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Cloud AWS & Retail', basePrice: 208.4, marketCapBn: 2190 },
            { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'AI & Cloud', basePrice: 438.2, marketCapBn: 3250 },
            { symbol: 'COST', name: 'Costco Wholesale', sector: 'Retail', basePrice: 928.5, marketCapBn: 412.0 }
        ]
    },
    {
        id: 'us-bos', iso2: 'US', iso3: 'USA', countryName: 'Stati Uniti (Boston Quant)', countryNameEn: 'United States Boston',
        flag: '🇺🇸', city: 'Boston', exchangeName: 'Boston Asset Mgmt (BOX)', region: 'Nord America',
        lat: 42.36, lng: -71.06, utcOffset: -5, openHour: 9, closeHour: 16, currency: 'USD', fxPair: 'DXY', fxRate: 104.25,
        idxSym: 'RUT', idxName: 'Russell 2000', idxPrice: 2385.4, centralBank: 'Federal Reserve', policyRate: 4.5, cpi: 2.6,
        gdpGrowth: 2.7, gdpBn: 29180, unemp: 4.1, debtGdp: 122.3, tradeBn: -785, reservesBn: 245, rating: 'AA+', y10: 4.28, mktCapBn: 55200,
        fdiProfile: 'finance',
        stocks: [
            { symbol: 'STT', name: 'State Street Corp.', sector: 'Asset Management', basePrice: 96.4, marketCapBn: 28.6 },
            { symbol: 'VRTX', name: 'Vertex Pharma', sector: 'Biotecnologia', basePrice: 468.2, marketCapBn: 121.0 },
            { symbol: 'GE', name: 'GE Aerospace', sector: 'Aerospazio', basePrice: 182.6, marketCapBn: 198.0 }
        ]
    },
    {
        id: 'us-dal', iso2: 'US', iso3: 'USA', countryName: 'Stati Uniti (Dallas TXSE)', countryNameEn: 'United States Dallas',
        flag: '🇺🇸', city: 'Dallas', exchangeName: 'Texas Stock Exchange (TXSE)', region: 'Nord America',
        lat: 32.78, lng: -96.80, utcOffset: -6, openHour: 8, closeHour: 15, currency: 'USD', fxPair: 'DXY', fxRate: 104.25,
        idxSym: 'DJI', idxName: 'Dow Jones 30', idxPrice: 44120.0, centralBank: 'Federal Reserve', policyRate: 4.5, cpi: 2.6,
        gdpGrowth: 2.7, gdpBn: 29180, unemp: 4.1, debtGdp: 122.3, tradeBn: -785, reservesBn: 245, rating: 'AA+', y10: 4.28, mktCapBn: 55200,
        fdiProfile: 'finance'
    },
    {
        id: 'ca-van', iso2: 'CA', iso3: 'CAN', countryName: 'Canada (Vancouver Mining)', countryNameEn: 'Canada Vancouver',
        flag: '🇨🇦', city: 'Vancouver', exchangeName: 'TSX Venture Exchange (TSXV)', region: 'Nord America',
        lat: 49.28, lng: -123.12, utcOffset: -8, openHour: 6, closeHour: 13, currency: 'CAD', fxPair: 'USD/CAD', fxRate: 1.394,
        idxSym: 'TSXV', idxName: 'S&P/TSX Venture', idxPrice: 612.4, centralBank: 'Bank of Canada', policyRate: 3.75, cpi: 2.0,
        gdpGrowth: 1.4, gdpBn: 2240, unemp: 6.5, debtGdp: 107.1, tradeBn: 12.4, reservesBn: 124, rating: 'AAA', y10: 3.31, mktCapBn: 3310, fdiProfile: 'energy'
    },
    {
        id: 'ca-mtl', iso2: 'CA', iso3: 'CAN', countryName: 'Canada (Montréal Derivati)', countryNameEn: 'Canada Montreal',
        flag: '🇨🇦', city: 'Montréal', exchangeName: 'Montréal Exchange (MX)', region: 'Nord America',
        lat: 45.50, lng: -73.57, utcOffset: -5, openHour: 9, closeHour: 16, currency: 'CAD', fxPair: 'USD/CAD', fxRate: 1.394,
        idxSym: 'TSX60', idxName: 'S&P/TSX 60', idxPrice: 1514.2, centralBank: 'Bank of Canada', policyRate: 3.75, cpi: 2.0,
        gdpGrowth: 1.4, gdpBn: 2240, unemp: 6.5, debtGdp: 107.1, tradeBn: 12.4, reservesBn: 124, rating: 'AAA', y10: 3.31, mktCapBn: 3310, fdiProfile: 'finance'
    },
    {
        id: 'mx-mty', iso2: 'MX', iso3: 'MEX', countryName: 'Messico (Monterrey Industria)', countryNameEn: 'Mexico Monterrey',
        flag: '🇲🇽', city: 'Monterrey', exchangeName: 'BIVA / Nearshoring Hub (BIVA)', region: 'Nord America',
        lat: 25.69, lng: -100.32, utcOffset: -6, openHour: 8, closeHour: 15, currency: 'MXN', fxPair: 'USD/MXN', fxRate: 20.18,
        idxSym: 'FTSEBIVA', idxName: 'FTSE BIVA', idxPrice: 1052.8, centralBank: 'Banxico', policyRate: 10.25, cpi: 4.5,
        gdpGrowth: 1.8, gdpBn: 1850, unemp: 2.9, debtGdp: 54.2, tradeBn: -8.5, reservesBn: 228, rating: 'BBB', y10: 9.85, mktCapBn: 540, fdiProfile: 'industrial'
    },
    {
        id: 'br-rio', iso2: 'BR', iso3: 'BRA', countryName: 'Brasile (Rio Energy)', countryNameEn: 'Brazil Rio de Janeiro',
        flag: '🇧🇷', city: 'Rio de Janeiro', exchangeName: 'B3 Energy & BNDES (B3)', region: 'Sud America',
        lat: -22.91, lng: -43.17, utcOffset: -3, openHour: 10, closeHour: 17, currency: 'BRL', fxPair: 'USD/BRL', fxRate: 5.76,
        idxSym: 'IBRX100', idxName: 'IBrX 100', idxPrice: 54820.0, centralBank: 'Banco Central do Brasil', policyRate: 11.25, cpi: 4.6,
        gdpGrowth: 3.0, gdpBn: 2290, unemp: 6.6, debtGdp: 87.6, tradeBn: 82.4, reservesBn: 368, rating: 'BB', y10: 12.65, mktCapBn: 910, fdiProfile: 'energy'
    },
    {
        id: 'it-rom', iso2: 'IT', iso3: 'ITA', countryName: 'Italia (Roma Tesoro)', countryNameEn: 'Italy Rome',
        flag: '🇮🇹', city: 'Roma', exchangeName: 'MTS Bond & Tesoro (MTS)', region: 'Europa',
        lat: 41.90, lng: 12.50, utcOffset: 1, openHour: 9, closeHour: 17, currency: 'EUR', fxPair: 'EUR/USD', fxRate: 1.0785,
        idxSym: 'FTSEMIB', idxName: 'FTSE MIB / BTP Desk', idxPrice: 34280.5, centralBank: 'Banca d\'Italia / BCE', policyRate: 3.25, cpi: 1.3,
        gdpGrowth: 0.8, gdpBn: 2370, unemp: 6.2, debtGdp: 136.8, tradeBn: 54.2, reservesBn: 268, rating: 'BBB', y10: 3.58, mktCapBn: 845,
        fdiProfile: 'balanced',
        stocks: [
            { symbol: 'ENEL.MI', name: 'Enel S.p.A.', sector: 'Energia & Utility', basePrice: 6.94, marketCapBn: 70.5 },
            { symbol: 'LDO.MI', name: 'Leonardo S.p.A.', sector: 'Aerospazio & Difesa', basePrice: 25.8, marketCapBn: 14.9 },
            { symbol: 'PST.MI', name: 'Poste Italiane', sector: 'Finanza & Logistica', basePrice: 13.4, marketCapBn: 17.4 }
        ]
    },
    {
        id: 'gb-edi', iso2: 'GB', iso3: 'GBR', countryName: 'Regno Unito (Edimburgo)', countryNameEn: 'United Kingdom Edinburgh',
        flag: '🇬🇧', city: 'Edimburgo', exchangeName: 'Scottish Asset Mgmt Hub (LSE)', region: 'Europa',
        lat: 55.95, lng: -3.19, utcOffset: 0, openHour: 8, closeHour: 16, currency: 'GBP', fxPair: 'GBP/USD', fxRate: 1.289,
        idxSym: 'FTMC', idxName: 'FTSE 250', idxPrice: 20840.0, centralBank: 'Bank of England', policyRate: 4.75, cpi: 2.3,
        gdpGrowth: 1.1, gdpBn: 3590, unemp: 4.3, debtGdp: 101.8, tradeBn: -52.1, reservesBn: 184, rating: 'AA', y10: 4.38, mktCapBn: 3240, fdiProfile: 'finance'
    },
    {
        id: 'de-muc', iso2: 'DE', iso3: 'DEU', countryName: 'Germania (Monaco)', countryNameEn: 'Germany Munich',
        flag: '🇩🇪', city: 'Monaco di Baviera', exchangeName: 'Börse München (GETTEX)', region: 'Europa',
        lat: 48.14, lng: 11.58, utcOffset: 1, openHour: 9, closeHour: 17, currency: 'EUR', fxPair: 'EUR/USD', fxRate: 1.0785,
        idxSym: 'MDAX', idxName: 'MDAX Germany', idxPrice: 26840.0, centralBank: 'BCE / Bundesbank', policyRate: 3.25, cpi: 2.0,
        gdpGrowth: 0.4, gdpBn: 4680, unemp: 6.0, debtGdp: 62.7, tradeBn: 242.0, reservesBn: 342, rating: 'AAA', y10: 2.34, mktCapBn: 2480, fdiProfile: 'industrial'
    },
    {
        id: 'ch-gva', iso2: 'CH', iso3: 'CHE', countryName: 'Svizzera (Ginevra Wealth)', countryNameEn: 'Switzerland Geneva',
        flag: '🇨🇭', city: 'Ginevra', exchangeName: 'Geneva Private Banking (SIX)', region: 'Europa',
        lat: 46.20, lng: 6.14, utcOffset: 1, openHour: 9, closeHour: 17, currency: 'CHF', fxPair: 'USD/CHF', fxRate: 0.874,
        idxSym: 'SPI', idxName: 'Swiss Performance Index', idxPrice: 15840.2, centralBank: 'SNB', policyRate: 1.0, cpi: 0.8,
        gdpGrowth: 1.5, gdpBn: 942, unemp: 2.5, debtGdp: 38.2, tradeBn: 58.6, reservesBn: 912, rating: 'AAA', y10: 0.44, mktCapBn: 2180, fdiProfile: 'finance'
    },
    {
        id: 'es-bcn', iso2: 'ES', iso3: 'ESP', countryName: 'Spagna (Barcellona)', countryNameEn: 'Spain Barcelona',
        flag: '🇪🇸', city: 'Barcellona', exchangeName: 'Bolsa de Barcelona (BME)', region: 'Europa',
        lat: 41.39, lng: 2.17, utcOffset: 1, openHour: 9, closeHour: 17, currency: 'EUR', fxPair: 'EUR/USD', fxRate: 1.0785,
        idxSym: 'BCN100', idxName: 'BCN Global 100', idxPrice: 1248.4, centralBank: 'BCE / Banco de España', policyRate: 3.25, cpi: 1.9,
        gdpGrowth: 2.8, gdpBn: 1730, unemp: 11.2, debtGdp: 105.1, tradeBn: -36.5, reservesBn: 104, rating: 'A', y10: 3.04, mktCapBn: 785, fdiProfile: 'tech'
    },
    {
        id: 'ae-auh', iso2: 'AE', iso3: 'ARE', countryName: 'Emirati Arabi (Abu Dhabi)', countryNameEn: 'United Arab Emirates Abu Dhabi',
        flag: '🇦🇪', city: 'Abu Dhabi', exchangeName: 'Abu Dhabi Securities Exchange (ADX)', region: 'Medio Oriente',
        lat: 24.45, lng: 54.38, utcOffset: 4, openHour: 10, closeHour: 15, currency: 'AED', fxPair: 'USD/AED', fxRate: 3.6725,
        idxSym: 'FADGI', idxName: 'FTSE ADX General', idxPrice: 9420.5, centralBank: 'CBUAE', policyRate: 4.65, cpi: 2.3,
        gdpGrowth: 4.2, gdpBn: 545, unemp: 2.7, debtGdp: 30.8, tradeBn: 112.0, reservesBn: 218, rating: 'AA', y10: 4.62, mktCapBn: 985,
        fdiProfile: 'energy', isFlagship: true
    },
    {
        id: 'sa-jed', iso2: 'SA', iso3: 'SAU', countryName: 'Arabia Saudita (Gedda)', countryNameEn: 'Saudi Arabia Jeddah',
        flag: '🇸🇦', city: 'Gedda', exchangeName: 'Red Sea Trade & Islamic Fin. (TADAWUL)', region: 'Medio Oriente',
        lat: 21.49, lng: 39.19, utcOffset: 3, openHour: 10, closeHour: 15, currency: 'SAR', fxPair: 'USD/SAR', fxRate: 3.75,
        idxSym: 'MT30', idxName: 'MSCI Tadawul 30', idxPrice: 1512.4, centralBank: 'SAMA', policyRate: 5.25, cpi: 1.7,
        gdpGrowth: 2.6, gdpBn: 1110, unemp: 3.3, debtGdp: 27.4, tradeBn: 118.5, reservesBn: 456, rating: 'A+', y10: 4.92, mktCapBn: 2760, fdiProfile: 'finance'
    },
    {
        id: 'jp-osa', iso2: 'JP', iso3: 'JPN', countryName: 'Giappone (Osaka Derivati)', countryNameEn: 'Japan Osaka',
        flag: '🇯🇵', city: 'Osaka', exchangeName: 'Osaka Exchange Derivatives (OSE)', region: 'Asia',
        lat: 34.69, lng: 135.50, utcOffset: 9, openHour: 9, closeHour: 15, currency: 'JPY', fxPair: 'USD/JPY', fxRate: 153.4,
        idxSym: 'TOPIX', idxName: 'TOPIX Japan', idxPrice: 2742.5, centralBank: 'Bank of Japan (BoJ)', policyRate: 0.25, cpi: 2.5,
        gdpGrowth: 0.9, gdpBn: 4070, unemp: 2.5, debtGdp: 251.2, tradeBn: -38.4, reservesBn: 1245, rating: 'A+', y10: 1.02, mktCapBn: 6420, fdiProfile: 'industrial'
    },
    {
        id: 'cn-bjs', iso2: 'CN', iso3: 'CHN', countryName: 'Cina (Pechino BSE)', countryNameEn: 'China Beijing',
        flag: '🇨🇳', city: 'Pechino', exchangeName: 'Beijing Stock Exchange (BSE)', region: 'Asia',
        lat: 39.90, lng: 116.41, utcOffset: 8, openHour: 9, closeHour: 15, currency: 'CNY', fxPair: 'USD/CNY', fxRate: 7.21,
        idxSym: 'BSE50', idxName: 'BSE 50 Index', idxPrice: 1285.6, centralBank: 'PBoC', policyRate: 3.1, cpi: 0.4,
        gdpGrowth: 4.8, gdpBn: 18530, unemp: 5.1, debtGdp: 88.6, tradeBn: 845.0, reservesBn: 3260, rating: 'A+', y10: 2.11, mktCapBn: 10850,
        fdiProfile: 'tech', isFlagship: true
    },
    {
        id: 'in-del', iso2: 'IN', iso3: 'IND', countryName: 'India (Nuova Delhi)', countryNameEn: 'India New Delhi',
        flag: '🇮🇳', city: 'Nuova Delhi', exchangeName: 'NSE North Capital Desk (NSE)', region: 'Asia',
        lat: 28.61, lng: 77.21, utcOffset: 5.5, openHour: 9, closeHour: 15, currency: 'INR', fxPair: 'USD/INR', fxRate: 84.35,
        idxSym: 'SENSEX', idxName: 'BSE SENSEX 30', idxPrice: 80120.4, centralBank: 'Reserve Bank of India (RBI)', policyRate: 6.5, cpi: 5.2,
        gdpGrowth: 7.0, gdpBn: 3940, unemp: 7.4, debtGdp: 81.9, tradeBn: -242.0, reservesBn: 692, rating: 'BBB-', y10: 6.84, mktCapBn: 5120,
        fdiProfile: 'balanced', isFlagship: true
    },
    {
        id: 'in-blr', iso2: 'IN', iso3: 'IND', countryName: 'India (Bengaluru Tech)', countryNameEn: 'India Bengaluru',
        flag: '🇮🇳', city: 'Bengaluru', exchangeName: 'India Tech & Venture Hub (NSEIT)', region: 'Asia',
        lat: 12.97, lng: 77.59, utcOffset: 5.5, openHour: 9, closeHour: 15, currency: 'INR', fxPair: 'USD/INR', fxRate: 84.35,
        idxSym: 'CNXIT', idxName: 'NIFTY IT Index', idxPrice: 42480.0, centralBank: 'Reserve Bank of India (RBI)', policyRate: 6.5, cpi: 5.2,
        gdpGrowth: 7.0, gdpBn: 3940, unemp: 7.4, debtGdp: 81.9, tradeBn: -242.0, reservesBn: 692, rating: 'BBB-', y10: 6.84, mktCapBn: 5120, fdiProfile: 'tech'
    },
    {
        id: 'kr-pus', iso2: 'KR', iso3: 'KOR', countryName: 'Corea del Sud (Busan)', countryNameEn: 'South Korea Busan',
        flag: '🇰🇷', city: 'Busan', exchangeName: 'KRX Derivatives & Maritime (KRX)', region: 'Asia',
        lat: 35.18, lng: 129.08, utcOffset: 9, openHour: 9, closeHour: 15, currency: 'KRW', fxPair: 'USD/KRW', fxRate: 1392.0,
        idxSym: 'KOSDAQ', idxName: 'KOSDAQ Composite', idxPrice: 742.8, centralBank: 'Bank of Korea', policyRate: 3.25, cpi: 1.6,
        gdpGrowth: 2.4, gdpBn: 1870, unemp: 2.6, debtGdp: 51.8, tradeBn: 46.5, reservesBn: 416, rating: 'AA', y10: 3.06, mktCapBn: 1840, fdiProfile: 'industrial'
    },
    {
        id: 'au-mel', iso2: 'AU', iso3: 'AUS', countryName: 'Australia (Melbourne)', countryNameEn: 'Australia Melbourne',
        flag: '🇦🇺', city: 'Melbourne', exchangeName: 'ASX Institutional & Super (ASX)', region: 'Oceania',
        lat: -37.81, lng: 144.96, utcOffset: 10, openHour: 10, closeHour: 16, currency: 'AUD', fxPair: 'AUD/USD', fxRate: 0.654,
        idxSym: 'XAO', idxName: 'All Ordinaries', idxPrice: 8565.2, centralBank: 'Reserve Bank of Australia (RBA)', policyRate: 4.35, cpi: 2.8,
        gdpGrowth: 1.5, gdpBn: 1790, unemp: 4.1, debtGdp: 49.4, tradeBn: 58.2, reservesBn: 64, rating: 'AAA', y10: 4.48, mktCapBn: 1840, fdiProfile: 'finance'
    },
    {
        id: 'za-cpt', iso2: 'ZA', iso3: 'ZAF', countryName: 'Sudafrica (Città del Capo)', countryNameEn: 'South Africa Cape Town',
        flag: '🇿🇦', city: 'Città del Capo', exchangeName: 'Cape Town Asset Mgmt (CTSE)', region: 'Africa',
        lat: -33.92, lng: 18.42, utcOffset: 2, openHour: 9, closeHour: 17, currency: 'ZAR', fxPair: 'USD/ZAR', fxRate: 17.88,
        idxSym: 'JALSH', idxName: 'FTSE/JSE All Share', idxPrice: 85420.0, centralBank: 'SARB', policyRate: 7.75, cpi: 3.8,
        gdpGrowth: 1.5, gdpBn: 403, unemp: 32.1, debtGdp: 74.1, tradeBn: 11.4, reservesBn: 63, rating: 'BB-', y10: 9.24, mktCapBn: 1040, fdiProfile: 'finance'
    }
];

export const GLOBAL_HUBS: GlobalHub[] = HUB_SEEDS.map(buildHub);

export const UNIQUE_COUNTRIES_COUNT = new Set(GLOBAL_HUBS.map((h) => h.iso2)).size;

/**
 * Computes real-time exchange status (APERTO / CHIUSO) based on current UTC time,
 * hub UTC offset, weekday check (Mon-Fri, or Sun-Thu for Gulf exchanges), and hours.
 */
export function getExchangeStatus(hub: GlobalHub, now: Date = new Date()): {
    isOpen: boolean;
    localTimeStr: string;
    label: 'APERTO' | 'CHIUSO';
} {
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const localDate = new Date(utcMs + hub.utcOffset * 3600000);
    const day = localDate.getDay(); // 0=Sun, 6=Sat
    const hour = localDate.getHours();
    const min = localDate.getMinutes();

    const isGulfSundayToThursday = ['SA', 'QA', 'KW', 'BH', 'OM', 'EG', 'IL', 'JO', 'IQ'].includes(hub.iso2);
    const isTradingDay = isGulfSundayToThursday
        ? day >= 0 && day <= 4
        : day >= 1 && day <= 5;

    const isWithinHours = hour >= hub.openHour && hour < hub.closeHour;
    const isOpen = isTradingDay && isWithinHours;

    const hh = String(hour).padStart(2, '0');
    const mm = String(min).padStart(2, '0');

    return {
        isOpen,
        localTimeStr: `${hh}:${mm}`,
        label: isOpen ? 'APERTO' : 'CHIUSO'
    };
}
