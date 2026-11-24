// ============================================================================
// TRADYX ATLAS — GLOBAL 3D MACRO & MARKET INTELLIGENCE TERMINAL VIEW
// (src/components/atlas/AtlasTerminalView.tsx)
// Photorealistic 3D Night-Earth Globe (110 Countries / 137 Golden Hubs),
// Top Live 1s Scrolling Ticker Bar, Quick Search & Continent Pill Filters,
// Camera Fly-To & Full Institutional 3-Tab Country Drill-Down Drawer.
// ============================================================================

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Globe, Search, X, Radio, MapPin, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { GLOBAL_HUBS, getExchangeStatus } from '../../data/globalHubs';
import { GlobalHub, WorldRegion, AtlasLiveAsset } from '../../types/atlas';
import { WatchlistAsset } from '../../types/market';
import {
    buildGlobalBaselineAssets,
    buildCountryLocalAssets,
    fetchPublicLiveQuotes,
    applyOneSecondTick,
    toTradyxWatchlistAsset
} from '../../services/atlasMarketService';
import { marketWebSocketService, MarketTick } from '../../services/marketWebSocketService';
import { PhotorealisticEarthGlobe } from './PhotorealisticEarthGlobe';
import { CountryDrilldownDrawer } from './CountryDrilldownDrawer';
import { TradingViewChartModal } from '../TradingViewChartModal';

interface AtlasTerminalViewProps {
    onNavigateToTrade?: (symbol?: string) => void;
}

const CONTINENT_PILLS: Array<{ id: 'ALL' | WorldRegion; label: string }> = [
    { id: 'ALL', label: `ALL (${GLOBAL_HUBS.length})` },
    { id: 'Nord America', label: 'NORTH AMERICA' },
    { id: 'Sud America', label: 'SOUTH AMERICA' },
    { id: 'Europa', label: 'EUROPE' },
    { id: 'Medio Oriente', label: 'MIDDLE EAST' },
    { id: 'Africa', label: 'AFRICA' },
    { id: 'Asia', label: 'ASIA' },
    { id: 'Oceania', label: 'OCEANIA' }
];

const TICKER_TAPE_SYMBOLS: Array<{ symbol: string; display: string }> = [
    { symbol: 'SPX', display: 'S&P 500' },
    { symbol: 'NDX', display: 'NASDAQ' },
    { symbol: 'FTSEMIB', display: 'FTSE MIB' },
    { symbol: 'DAX', display: 'DAX 40' },
    { symbol: 'N225', display: 'NIKKEI 225' },
    { symbol: 'EUR/USD', display: 'EUR/USD' },
    { symbol: 'XAU/USD', display: 'GOLD' },
    { symbol: 'WTI', display: 'WTI OIL' },
    { symbol: 'BTC', display: 'BTC/USD' },
    { symbol: 'ETH', display: 'ETH/USD' }
];

export const AtlasTerminalView: React.FC<AtlasTerminalViewProps> = ({ onNavigateToTrade }) => {
    const [selectedCountry, setSelectedCountry] = useState<GlobalHub | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
    const [regionFilter, setRegionFilter] = useState<'ALL' | WorldRegion>('ALL');

    // Live 1-second (1000ms) real-time markets state
    const [globalAssets, setGlobalAssets] = useState<AtlasLiveAsset[]>(() =>
        buildGlobalBaselineAssets()
    );
    const [localAssets, setLocalAssets] = useState<AtlasLiveAsset[]>([]);
    const [isLiveRunning, setIsLiveRunning] = useState<boolean>(true);
    const [lastTickTime, setLastTickTime] = useState<string>(() =>
        new Date().toLocaleTimeString('it-IT', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    );

    const [chartAsset, setChartAsset] = useState<WatchlistAsset | null>(null);
    const wsOverridesRef = useRef<Record<string, { price: number; change24h: number }>>({});

    // Connect Binance WS & hydrate CoinGecko + FX public quotes
    useEffect(() => {
        marketWebSocketService.start();
        const unsubscribe = marketWebSocketService.subscribe((tick: MarketTick) => {
            if (tick.symbol && tick.price > 0) {
                wsOverridesRef.current[tick.symbol] = {
                    price: tick.price,
                    change24h: Number(tick.change24h.toFixed(2))
                };
            }
        });

        fetchPublicLiveQuotes().then(({ crypto, fx }) => {
            setGlobalAssets((prev) =>
                prev.map((asset) => {
                    if (asset.category === 'CRYPTO' && crypto[asset.symbol]) {
                        return {
                            ...asset,
                            price: crypto[asset.symbol].price,
                            prevPrice: crypto[asset.symbol].price,
                            changePct: crypto[asset.symbol].change24h,
                            source: 'coingecko'
                        };
                    }
                    if (asset.category === 'FOREX') {
                        if (asset.symbol === 'EUR/USD' && fx.EUR) {
                            const rate = Number((1 / fx.EUR).toFixed(4));
                            return { ...asset, price: rate, prevPrice: rate, source: 'fx_api' };
                        }
                        if (asset.symbol === 'GBP/USD' && fx.GBP) {
                            const rate = Number((1 / fx.GBP).toFixed(4));
                            return { ...asset, price: rate, prevPrice: rate, source: 'fx_api' };
                        }
                        if (asset.symbol === 'USD/JPY' && fx.JPY) {
                            const rate = Number(fx.JPY.toFixed(2));
                            return { ...asset, price: rate, prevPrice: rate, source: 'fx_api' };
                        }
                        if (asset.symbol === 'USD/CHF' && fx.CHF) {
                            const rate = Number(fx.CHF.toFixed(4));
                            return { ...asset, price: rate, prevPrice: rate, source: 'fx_api' };
                        }
                        if (asset.symbol === 'AUD/USD' && fx.AUD) {
                            const rate = Number((1 / fx.AUD).toFixed(4));
                            return { ...asset, price: rate, prevPrice: rate, source: 'fx_api' };
                        }
                        if (asset.symbol === 'USD/CAD' && fx.CAD) {
                            const rate = Number(fx.CAD.toFixed(4));
                            return { ...asset, price: rate, prevPrice: rate, source: 'fx_api' };
                        }
                        if (asset.symbol === 'USD/CNY' && fx.CNY) {
                            const rate = Number(fx.CNY.toFixed(4));
                            return { ...asset, price: rate, prevPrice: rate, source: 'fx_api' };
                        }
                    }
                    return asset;
                })
            );
        });

        return () => {
            unsubscribe();
        };
    }, []);

    // Rebuild local country instruments when hub changes
    useEffect(() => {
        if (selectedCountry) {
            setLocalAssets(buildCountryLocalAssets(selectedCountry));
        } else {
            setLocalAssets([]);
        }
    }, [selectedCountry]);

    // 1-second (1000ms) live tick engine
    useEffect(() => {
        if (!isLiveRunning) return;
        const timer = setInterval(() => {
            const wsSnapshot = wsOverridesRef.current;
            setGlobalAssets((prev) => applyOneSecondTick(prev, wsSnapshot));
            setLocalAssets((prev) => (prev.length > 0 ? applyOneSecondTick(prev, wsSnapshot) : prev));
            setLastTickTime(
                new Date().toLocaleTimeString('it-IT', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                })
            );
        }, 1000);
        return () => clearInterval(timer);
    }, [isLiveRunning]);

    const visibleHubs = useMemo(() => {
        if (regionFilter === 'ALL') return GLOBAL_HUBS;
        return GLOBAL_HUBS.filter((h) => h.region === regionFilter);
    }, [regionFilter]);

    const searchResults = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) {
            return GLOBAL_HUBS.filter((h) => h.isFlagship).slice(0, 12);
        }
        return GLOBAL_HUBS.filter(
            (h) =>
                h.countryName.toLowerCase().includes(q) ||
                h.countryNameEn.toLowerCase().includes(q) ||
                h.city.toLowerCase().includes(q) ||
                h.iso2.toLowerCase() === q ||
                h.iso3.toLowerCase() === q ||
                h.exchangeName.toLowerCase().includes(q) ||
                h.exchangeCode.toLowerCase().includes(q) ||
                h.primaryIndex.symbol.toLowerCase().includes(q)
        ).slice(0, 16);
    }, [searchQuery]);

    const tickerTapeItems = useMemo(() => {
        return TICKER_TAPE_SYMBOLS.map((t) => {
            const asset = globalAssets.find((a) => a.symbol === t.symbol);
            return {
                display: t.display,
                symbol: t.symbol,
                asset
            };
        }).filter((x) => Boolean(x.asset)) as Array<{
            display: string;
            symbol: string;
            asset: AtlasLiveAsset;
        }>;
    }, [globalAssets]);

    const handleSelectHub = useCallback((hub: GlobalHub) => {
        setSelectedCountry(hub);
        setIsSearchFocused(false);
        setSearchQuery('');
    }, []);

    const handleOpenAssetChart = useCallback((asset: AtlasLiveAsset) => {
        setChartAsset(toTradyxWatchlistAsset(asset));
    }, []);

    const handleTickerClick = useCallback(
        (tickerSymbol: string) => {
            const clean = tickerSymbol.trim().toUpperCase();
            const match =
                localAssets.find((a) => a.symbol.toUpperCase() === clean) ||
                globalAssets.find(
                    (a) =>
                        a.symbol.toUpperCase() === clean ||
                        a.symbol.toUpperCase().replace('/', '') === clean.replace('/', '')
                );

            if (match) {
                setChartAsset(toTradyxWatchlistAsset(match));
                return;
            }

            const synthetic: AtlasLiveAsset = {
                id: `sym-${clean}`,
                symbol: clean,
                name: `${clean} • Global Market Quote`,
                category: clean.includes('/') ? 'FOREX' : 'STOCKS',
                price: 100.0,
                prevPrice: 99.6,
                bid: 99.97,
                ask: 100.03,
                dayLow: 98.8,
                dayHigh: 101.2,
                changePct: 0.4,
                changePts: 0.4,
                flash: null,
                decimals: 2,
                sparkline: [98.4, 98.9, 99.1, 99.5, 99.3, 99.8, 100.0],
                source: 'live_engine'
            };
            setChartAsset(toTradyxWatchlistAsset(synthetic));
        },
        [localAssets, globalAssets]
    );

    const isDrawerOpen = selectedCountry !== null;

    return (
        <div className="relative w-full h-[100dvh] bg-[#02040A] overflow-hidden select-none">
            {/* 1. PHOTOREALISTIC 3D NIGHT-EARTH WEBGL GLOBE */}
            <PhotorealisticEarthGlobe
                hubs={visibleHubs}
                selectedHub={selectedCountry}
                onSelectHub={handleSelectHub}
                hideFloatingControls={isDrawerOpen}
            />

            {/* 2. TOP LIVE 1s TICKER BAR + SEARCH + CONTINENT FILTERS (AUTO-HIDDEN WHEN COUNTRY IS OPEN) */}
            {!isDrawerOpen && (
                <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
                    {/* Top Live 1s Scrolling Ticker Tape */}
                    <div className="w-full bg-[#060911]/90 border-b border-white/[0.08] backdrop-blur-xl pt-[env(safe-area-inset-top,0px)] pointer-events-auto">
                        <div className="flex items-center h-9 overflow-hidden">
                            {/* Fixed LIVE 1s Pill */}
                            <div className="shrink-0 h-full px-3 bg-[#08090C] border-r border-white/[0.08] flex items-center gap-1.5 z-10">
                                <Radio className="w-3 h-3 text-[#10B981] animate-pulse" />
                                <span className="text-[10px] font-mono font-black text-[#10B981] tracking-wider">
                                    LIVE 1s
                                </span>
                            </div>

                            {/* Scrolling Ticker Tape (duplicated for seamless loop) */}
                            <div className="flex-1 overflow-hidden">
                                <div className="animate-atlas-ticker items-center">
                                    {[...tickerTapeItems, ...tickerTapeItems].map((item, idx) => {
                                        const isPos = item.asset.changePct >= 0;
                                        const dec = item.asset.decimals ?? 2;
                                        return (
                                            <button
                                                key={`${item.symbol}-${idx}`}
                                                type="button"
                                                onClick={() => handleOpenAssetChart(item.asset)}
                                                className="inline-flex items-center gap-2 px-3.5 h-9 border-r border-white/[0.05] hover:bg-white/[0.05] transition cursor-pointer font-mono text-[11px] shrink-0"
                                            >
                                                <span className="font-bold text-slate-300">
                                                    {item.display}
                                                </span>
                                                <span
                                                    className={`font-black tabular-nums transition-colors ${
                                                        item.asset.flash === 'up'
                                                            ? 'text-[#10B981]'
                                                            : item.asset.flash === 'down'
                                                            ? 'text-[#DC2626]'
                                                            : 'text-white'
                                                    }`}
                                                >
                                                    {item.asset.price.toLocaleString('it-IT', {
                                                        minimumFractionDigits: dec,
                                                        maximumFractionDigits: dec
                                                    })}
                                                </span>
                                                <span
                                                    className={`inline-flex items-center gap-0.5 text-[10px] font-bold tabular-nums ${
                                                        isPos ? 'text-[#10B981]' : 'text-[#DC2626]'
                                                    }`}
                                                >
                                                    {isPos ? (
                                                        <TrendingUp className="w-2.5 h-2.5" />
                                                    ) : (
                                                        <TrendingDown className="w-2.5 h-2.5" />
                                                    )}
                                                    {isPos ? '+' : ''}
                                                    {item.asset.changePct.toFixed(2)}%
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Floating Search Bar & Continent Pill Filters */}
                    <div className="px-3 sm:px-5 pt-2.5">
                        <div className="w-full max-w-2xl mx-auto space-y-2 pointer-events-auto">
                            {/* Search Input Row */}
                            <div className="relative flex items-center gap-2">
                                <div className="hidden sm:flex items-center gap-2 px-3 h-11 rounded-2xl bg-[#08090C]/85 border border-white/[0.12] backdrop-blur-xl shrink-0">
                                    <Globe className="w-4 h-4 text-[#10B981]" />
                                    <span className="text-xs font-mono font-black tracking-wider text-white">
                                        ATLAS
                                    </span>
                                </div>

                                <div className="relative flex-1">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onFocus={() => setIsSearchFocused(true)}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setIsSearchFocused(true);
                                        }}
                                        placeholder="Cerca paese, capitale, ISO (es. IT, US)..."
                                        className="w-full h-11 pl-10 pr-9 rounded-2xl bg-[#08090C]/90 border border-white/[0.14] focus:border-[#10B981] text-xs text-white placeholder-slate-400 outline-none backdrop-blur-xl shadow-2xl font-sans"
                                    />
                                    {(searchQuery || isSearchFocused) && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearchQuery('');
                                                setIsSearchFocused(false);
                                            }}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                                            aria-label="Chiudi ricerca"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}

                                    {/* Instant Search Dropdown */}
                                    {isSearchFocused && (
                                        <div className="absolute left-0 right-0 mt-1.5 max-h-72 overflow-y-auto rounded-2xl bg-[#08090C]/95 border border-white/[0.14] backdrop-blur-2xl shadow-2xl divide-y divide-white/[0.06] z-50">
                                            <div className="px-3.5 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                                                <span>
                                                    {searchQuery.trim()
                                                        ? `Risultati (${searchResults.length})`
                                                        : 'Principali Hub Finanziari Globali'}
                                                </span>
                                                <span className="text-[#FACC15]">Tocca per volare</span>
                                            </div>

                                            {searchResults.length === 0 ? (
                                                <div className="px-4 py-5 text-center text-xs font-mono text-slate-400">
                                                    Nessun paese o hub trovato per &quot;{searchQuery}&quot;
                                                </div>
                                            ) : (
                                                searchResults.map((hub) => {
                                                    const st = getExchangeStatus(hub);
                                                    return (
                                                        <button
                                                            key={hub.id}
                                                            type="button"
                                                            onClick={() => handleSelectHub(hub)}
                                                            className="w-full px-3.5 py-2.5 hover:bg-white/[0.07] transition flex items-center justify-between gap-2 text-left cursor-pointer"
                                                        >
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <span className="text-lg shrink-0">
                                                                    {hub.flag}
                                                                </span>
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-xs font-extrabold text-white truncate">
                                                                            {hub.countryName}
                                                                        </span>
                                                                        <span className="text-[9px] font-mono text-slate-400">
                                                                            {hub.iso2}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-[10px] font-mono text-slate-400 truncate flex items-center gap-1">
                                                                        <MapPin className="w-2.5 h-2.5 text-[#FACC15] shrink-0" />
                                                                        <span>
                                                                            {hub.city} ({hub.exchangeCode}) · {hub.primaryIndex.symbol}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span
                                                                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                                                                        st.isOpen
                                                                            ? 'bg-emerald-500/15 text-[#10B981]'
                                                                            : 'bg-slate-800 text-slate-400'
                                                                    }`}
                                                                >
                                                                    {st.label}
                                                                </span>
                                                                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                                                            </div>
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Continent Pill Filters */}
                            {!isSearchFocused && (
                                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                                    {CONTINENT_PILLS.map((pill) => (
                                        <button
                                            key={pill.id}
                                            type="button"
                                            onClick={() => setRegionFilter(pill.id)}
                                            className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold tracking-wide shrink-0 border backdrop-blur-md transition cursor-pointer ${
                                                regionFilter === pill.id
                                                    ? 'bg-[#10B981] text-[#050A08] border-[#10B981] shadow-md shadow-emerald-500/25'
                                                    : 'bg-[#08090C]/80 text-slate-300 border-white/[0.12] hover:border-[#FACC15]/60 hover:text-white'
                                            }`}
                                        >
                                            {pill.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 3. INSTITUTIONAL 3-TAB COUNTRY DRILL-DOWN PANEL */}
            {selectedCountry && (
                <CountryDrilldownDrawer
                    hub={selectedCountry}
                    localAssets={localAssets}
                    globalAssets={globalAssets}
                    isLiveRunning={isLiveRunning}
                    onToggleLive={() => setIsLiveRunning((prev) => !prev)}
                    lastTickTime={lastTickTime}
                    onClose={() => setSelectedCountry(null)}
                    onOpenAssetChart={handleOpenAssetChart}
                    onTickerClick={handleTickerClick}
                />
            )}

            {/* 4. DIRECT TRADINGVIEW CHART & ORDER EXECUTION MODAL (TRADYX HISTORY) */}
            {chartAsset && (
                <div className="relative z-[95]">
                    <TradingViewChartModal
                        asset={chartAsset}
                        isOpen={Boolean(chartAsset)}
                        onClose={() => setChartAsset(null)}
                        onNavigateToTrade={(sym) => {
                            setChartAsset(null);
                            setSelectedCountry(null);
                            if (onNavigateToTrade) onNavigateToTrade(sym);
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default AtlasTerminalView;
