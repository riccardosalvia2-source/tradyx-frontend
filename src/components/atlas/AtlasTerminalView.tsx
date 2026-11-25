// ============================================================================
// TRADYX ATLAS — 60FPS MAPBOX 3D TERMINAL ORCHESTRATOR
// (src/components/atlas/AtlasTerminalView.tsx)
// ZERO 1-second setInterval in this parent component!
// - 1s ticks are strictly isolated inside memoized TopGlobalTickerBar & LiveMarketsTable.
// - Mapbox3DGlobe stays mounted at 60fps and hides cleanly (display: none) when
//   selectedHub !== null, resizing smoothly on return -> ZERO overlap, ZERO lag.
// ============================================================================

import React, { useState, useMemo, useCallback } from 'react';
import { Globe, Search, X, MapPin, ChevronRight } from 'lucide-react';
import { GLOBAL_HUBS, getExchangeStatus } from '../../data/globalHubs';
import { GlobalHub, WorldRegion, AtlasLiveAsset } from '../../types/atlas';
import { WatchlistAsset } from '../../types/market';
import {
    buildGlobalBaselineAssets,
    buildCountryLocalAssets,
    toTradyxWatchlistAsset
} from '../../services/atlasMarketService';
import { Mapbox3DGlobe } from './Mapbox3DGlobe';
import { TopGlobalTickerBar } from './TopGlobalTickerBar';
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

const STATIC_GLOBAL_LOOKUP = buildGlobalBaselineAssets();

export const AtlasTerminalView: React.FC<AtlasTerminalViewProps> = ({ onNavigateToTrade }) => {
    const [selectedHub, setSelectedHub] = useState<GlobalHub | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
    const [regionFilter, setRegionFilter] = useState<'ALL' | WorldRegion>('ALL');
    const [chartAsset, setChartAsset] = useState<WatchlistAsset | null>(null);

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

    const handleSelectHub = useCallback((hub: GlobalHub) => {
        setSelectedHub(hub);
        setIsSearchFocused(false);
        setSearchQuery('');
    }, []);

    const handleCloseHub = useCallback(() => {
        setSelectedHub(null);
    }, []);

    const handleOpenAssetChart = useCallback((asset: AtlasLiveAsset) => {
        setChartAsset(toTradyxWatchlistAsset(asset));
    }, []);

    const handleTickerClick = useCallback(
        (tickerSymbol: string) => {
            const clean = tickerSymbol.trim().toUpperCase();
            const localPool = selectedHub ? buildCountryLocalAssets(selectedHub) : [];
            const match =
                localPool.find((a) => a.symbol.toUpperCase() === clean) ||
                STATIC_GLOBAL_LOOKUP.find(
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
                name: `${clean} · Global Market Quote`,
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
        [selectedHub]
    );

    const isCountryOpen = selectedHub !== null;

    return (
        <div className="relative w-full h-[100dvh] bg-[#03060E] overflow-hidden select-none">
            {/* 1. 60FPS MAPBOX GL JS 3D VECTOR GLOBE (COMPLETELY HIDDEN WHEN COUNTRY IS OPEN) */}
            <Mapbox3DGlobe
                hubs={visibleHubs}
                onSelectHub={handleSelectHub}
                isHidden={isCountryOpen}
            />

            {/* 2. TOP ISOLATED 1s TICKER BAR + SEARCH + CONTINENT FILTERS (HIDDEN WHEN COUNTRY IS OPEN) */}
            {!isCountryOpen && (
                <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
                    {/* Memoized Leaf 1s Ticker Tape */}
                    <TopGlobalTickerBar onSelectAsset={handleOpenAssetChart} />

                    {/* Floating Search & Continent Pills */}
                    <div className="px-3 sm:px-5 pt-2.5">
                        <div className="w-full max-w-2xl mx-auto space-y-2 pointer-events-auto">
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

                                    {/* Instant Search Results Dropdown */}
                                    {isSearchFocused && (
                                        <div className="absolute left-0 right-0 mt-1.5 max-h-72 overflow-y-auto rounded-2xl bg-[#08090C]/95 border border-white/[0.14] backdrop-blur-2xl shadow-2xl divide-y divide-white/[0.06] z-50">
                                            <div className="px-3.5 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                                                <span>
                                                    {searchQuery.trim()
                                                        ? `Risultati (${searchResults.length})`
                                                        : 'Principali Hub Finanziari Globali'}
                                                </span>
                                                <span className="text-[#FDE047]">
                                                    Tocca per aprire
                                                </span>
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
                                                                        <MapPin className="w-2.5 h-2.5 text-[#FDE047] shrink-0" />
                                                                        <span>
                                                                            {hub.city} (
                                                                            {hub.exchangeCode}) ·{' '}
                                                                            {hub.primaryIndex.symbol}
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
                                                    : 'bg-[#08090C]/80 text-slate-300 border-white/[0.12] hover:border-[#FDE047]/60 hover:text-white'
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

            {/* 3. DEDICATED FULL-ISOLATION COUNTRY DETAIL PANEL (z-[100], ZERO OVERLAP) */}
            {selectedHub && (
                <CountryDrilldownDrawer
                    hub={selectedHub}
                    onClose={handleCloseHub}
                    onOpenAssetChart={handleOpenAssetChart}
                    onTickerClick={handleTickerClick}
                />
            )}

            {/* 4. DIRECT TRADINGVIEW CHART & TRADE EXECUTION MODAL (TRADYX HISTORY) */}
            {chartAsset && (
                <TradingViewChartModal
                    asset={chartAsset}
                    isOpen={Boolean(chartAsset)}
                    onClose={() => setChartAsset(null)}
                    onNavigateToTrade={(sym) => {
                        setChartAsset(null);
                        setSelectedHub(null);
                        if (onNavigateToTrade) onNavigateToTrade(sym);
                    }}
                />
            )}
        </div>
    );
};

export default AtlasTerminalView;
