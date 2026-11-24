// ============================================================================
// TRADYX ATLAS — GLOBAL MACRO & MARKET INTELLIGENCE TERMINAL VIEW
// (src/components/atlas/AtlasTerminalView.tsx)
// Full-screen Night-Earth Orbital Map (115 hubs / 111 countries), Quick Search,
// 1-second Real-Time Market Engine, Country Drill-Down Drawer (Zero Overlap),
// and Direct TradingView Chart + Tradyx Trade Journal Execution.
// ============================================================================

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Globe, Search, X, Radio, MapPin, ChevronRight } from 'lucide-react';
import { GLOBAL_HUBS, UNIQUE_COUNTRIES_COUNT, getExchangeStatus } from '../../data/globalHubs';
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
import { NightEarthMap } from './NightEarthMap';
import { CountryDrilldownDrawer } from './CountryDrilldownDrawer';
import { TradingViewChartModal } from '../TradingViewChartModal';

interface AtlasTerminalViewProps {
    onNavigateToTrade?: (symbol?: string) => void;
}

const REGION_FILTERS: Array<'TUTTI' | WorldRegion> = [
    'TUTTI',
    'Europa',
    'Nord America',
    'Asia',
    'Medio Oriente',
    'Sud America',
    'Africa',
    'Oceania'
];

export const AtlasTerminalView: React.FC<AtlasTerminalViewProps> = ({ onNavigateToTrade }) => {
    // Selected country/hub for Drill-Down Drawer
    const [selectedCountry, setSelectedCountry] = useState<GlobalHub | null>(null);

    // Search & region filters (auto-hidden whenever selectedCountry !== null)
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
    const [regionFilter, setRegionFilter] = useState<'TUTTI' | WorldRegion>('TUTTI');

    // Live 1-second (1000ms) market state
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

    // Active TradingView chart + order execution modal asset
    const [chartAsset, setChartAsset] = useState<WatchlistAsset | null>(null);

    // Live Binance WebSocket crypto price overrides
    const wsOverridesRef = useRef<Record<string, { price: number; change24h: number }>>({});

    // Connect Binance WS & hydrate CoinGecko + FX public APIs once on mount
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

    // Rebuild local country markets whenever selectedCountry changes
    useEffect(() => {
        if (selectedCountry) {
            setLocalAssets(buildCountryLocalAssets(selectedCountry));
        } else {
            setLocalAssets([]);
        }
    }, [selectedCountry]);

    // 1-second (1000ms) client-side real-time engine
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

    // Filtered hubs for map and quick search dropdown
    const visibleMapHubs = useMemo(() => {
        if (regionFilter === 'TUTTI') return GLOBAL_HUBS;
        return GLOBAL_HUBS.filter((h) => h.region === regionFilter);
    }, [regionFilter]);

    const searchResults = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) {
            // Show top flagship hubs when focused with empty query
            return GLOBAL_HUBS.filter((h) => h.isFlagship).slice(0, 10);
        }
        return GLOBAL_HUBS.filter(
            (h) =>
                h.countryName.toLowerCase().includes(q) ||
                h.countryNameEn.toLowerCase().includes(q) ||
                h.city.toLowerCase().includes(q) ||
                h.iso2.toLowerCase() === q ||
                h.iso3.toLowerCase() === q ||
                h.exchangeName.toLowerCase().includes(q) ||
                h.primaryIndex.symbol.toLowerCase().includes(q)
        ).slice(0, 14);
    }, [searchQuery]);

    const handleSelectHub = useCallback((hub: GlobalHub) => {
        setSelectedCountry(hub);
        setIsSearchFocused(false);
        setSearchQuery('');
    }, []);

    const handleOpenAssetChart = useCallback((asset: AtlasLiveAsset) => {
        setChartAsset(toTradyxWatchlistAsset(asset));
    }, []);

    // Resolve any clicked ticker badge (from News AI Impact or Top Corporations) into a live Chart Modal
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

            // Synthesize a live WatchlistAsset on the fly for any ticker not in current list
            const synthetic: AtlasLiveAsset = {
                id: `sym-${clean}`,
                symbol: clean,
                name: `${clean} • Global Market Quote`,
                category: clean.includes('/') ? 'FOREX' : 'STOCKS',
                price: 100.0,
                prevPrice: 99.6,
                changePct: 0.4,
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
        <div className="relative w-full h-[100dvh] bg-[#030612] overflow-hidden select-none">
            {/* 1. FULL-SCREEN NIGHT-EARTH ORBITAL MAP */}
            <NightEarthMap
                hubs={visibleMapHubs}
                selectedHubId={selectedCountry?.id ?? null}
                onSelectHub={handleSelectHub}
                hideFloatingControls={isDrawerOpen}
            />

            {/* 2. TOP FLOATING ATLAS HEADER & QUICK SEARCH BAR (AUTO-HIDDEN WHEN COUNTRY DRAWER IS OPEN) */}
            {!isDrawerOpen && (
                <div className="fixed top-0 left-0 right-0 z-40 px-3 sm:px-5 pt-[max(env(safe-area-inset-top,14px),14px)] pointer-events-none">
                    <div className="w-full max-w-xl mx-auto space-y-2 pointer-events-auto">
                        {/* Compact Brand + Live Telemetry Bar */}
                        <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-[#08090C]/85 border border-white/[0.1] backdrop-blur-xl shadow-xl">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-[#10B981]/15 border border-[#10B981]/40 flex items-center justify-center">
                                    <Globe className="w-4 h-4 text-[#10B981]" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs sm:text-sm font-black tracking-wider text-white font-mono">
                                            TRADYX ATLAS
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/35">
                                            {UNIQUE_COUNTRIES_COUNT}+ PAESI
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400 block leading-none mt-0.5">
                                        Global Macro &amp; Live Market Intelligence
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-[10px] font-mono font-black text-[#10B981]">
                                <Radio className="w-3 h-3 animate-pulse" />
                                <span>LIVE 1s</span>
                            </div>
                        </div>

                        {/* Quick Search Input */}
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onFocus={() => setIsSearchFocused(true)}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setIsSearchFocused(true);
                                }}
                                placeholder="Cerca paese, città, borsa o ISO (es. Italia, Milano, US, JP)..."
                                className="w-full h-11 pl-10 pr-9 rounded-2xl bg-[#08090C]/90 border border-white/[0.12] focus:border-[#10B981] text-xs text-white placeholder-slate-400 outline-none backdrop-blur-xl shadow-2xl font-sans"
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

                            {/* Instant Search Results Dropdown */}
                            {isSearchFocused && (
                                <div className="mt-1.5 max-h-72 overflow-y-auto rounded-2xl bg-[#08090C]/95 border border-white/[0.12] backdrop-blur-2xl shadow-2xl divide-y divide-white/[0.06]">
                                    <div className="px-3.5 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                                        <span>
                                            {searchQuery.trim()
                                                ? `Risultati (${searchResults.length})`
                                                : 'Principali Hub Finanziari Globali'}
                                        </span>
                                        <span className="text-[#FACC15]">Tocca per aprire</span>
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
                                                    className="w-full px-3.5 py-2.5 hover:bg-white/[0.06] transition flex items-center justify-between gap-2 text-left cursor-pointer"
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
                                                                    {hub.city} • {hub.primaryIndex.symbol}
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

                        {/* Continent Quick Filters */}
                        {!isSearchFocused && (
                            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                                {REGION_FILTERS.map((reg) => (
                                    <button
                                        key={reg}
                                        type="button"
                                        onClick={() => setRegionFilter(reg)}
                                        className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold shrink-0 border backdrop-blur-md transition cursor-pointer ${
                                            regionFilter === reg
                                                ? 'bg-[#10B981] text-[#050A08] border-[#10B981] shadow-md shadow-emerald-500/25'
                                                : 'bg-[#08090C]/75 text-slate-300 border-white/[0.1] hover:border-emerald-500/50'
                                        }`}
                                    >
                                        {reg}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 3. COUNTRY DRILL-DOWN PANEL (FULL-SCREEN ON MOBILE, WIDE DRAWER ON DESKTOP) */}
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

            {/* 4. DIRECT TRADINGVIEW CHART & TRADE EXECUTION MODAL (LOGS TO TRADYX HISTORY) */}
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
