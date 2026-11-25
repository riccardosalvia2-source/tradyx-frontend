// ============================================================================
// TRADYX ATLAS — ISOLATED 1s LIVE MARKETS & BROKER TABLE (MEMOIZED LEAF)
// (src/components/atlas/LiveMarketsTable.tsx)
// Owns its own 1000ms tick interval, Binance WS overrides & CoinGecko/FX quotes
// so neither CountryDrilldownDrawer nor Recharts Macro charts re-render at 1Hz!
// ============================================================================

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Play,
    Pause,
    Search,
    TrendingUp,
    TrendingDown,
    CandlestickChart
} from 'lucide-react';
import { GlobalHub, AtlasLiveAsset, AtlasAssetCategory } from '../../types/atlas';
import {
    buildGlobalBaselineAssets,
    buildCountryLocalAssets,
    fetchPublicLiveQuotes,
    applyOneSecondTick
} from '../../services/atlasMarketService';
import { marketWebSocketService, MarketTick } from '../../services/marketWebSocketService';

interface LiveMarketsTableProps {
    hub: GlobalHub;
    onOpenAssetChart: (asset: AtlasLiveAsset) => void;
}

const MARKET_SUB_FILTERS: Array<{ id: AtlasAssetCategory; label: string }> = [
    { id: 'COUNTRY', label: 'Mercati del Paese' },
    { id: 'INDICES', label: 'Indici' },
    { id: 'STOCKS', label: 'Azioni' },
    { id: 'FOREX', label: 'Forex' },
    { id: 'BONDS', label: 'Bond' },
    { id: 'COMMODITIES', label: 'Commodities' },
    { id: 'CRYPTO', label: 'Crypto' },
    { id: 'ETF', label: 'ETF' }
];

const MiniSparkline: React.FC<{ data: number[]; isPositive: boolean }> = React.memo(
    ({ data, isPositive }) => {
        if (!data || data.length < 2) return null;
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        const width = 62;
        const height = 22;

        const points = data
            .map((v, i) => {
                const px = (i / (data.length - 1)) * width;
                const py = height - ((v - min) / range) * (height - 4) - 2;
                return `${px.toFixed(1)},${py.toFixed(1)}`;
            })
            .join(' ');

        return (
            <svg width={width} height={height} className="overflow-visible shrink-0">
                <polyline
                    fill="none"
                    stroke={isPositive ? '#10B981' : '#DC2626'}
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                />
            </svg>
        );
    }
);
MiniSparkline.displayName = 'MiniSparkline';

export const LiveMarketsTable: React.FC<LiveMarketsTableProps> = React.memo(
    ({ hub, onOpenAssetChart }) => {
        const [assetCategory, setAssetCategory] = useState<AtlasAssetCategory>('COUNTRY');
        const [assetSearch, setAssetSearch] = useState<string>('');
        const [isLiveRunning, setIsLiveRunning] = useState<boolean>(true);
        const [lastTickTime, setLastTickTime] = useState<string>(() =>
            new Date().toLocaleTimeString('it-IT', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })
        );

        const [globalAssets, setGlobalAssets] = useState<AtlasLiveAsset[]>(() =>
            buildGlobalBaselineAssets()
        );
        const [localAssets, setLocalAssets] = useState<AtlasLiveAsset[]>(() =>
            buildCountryLocalAssets(hub)
        );
        const wsOverridesRef = useRef<Record<string, { price: number; change24h: number }>>({});

        // Rebuild country local assets when hub changes
        useEffect(() => {
            setAssetCategory('COUNTRY');
            setAssetSearch('');
            setLocalAssets(buildCountryLocalAssets(hub));
        }, [hub]);

        // Subscribe to Binance WS & hydrate CoinGecko/FX quotes
        useEffect(() => {
            marketWebSocketService.start();
            const unsub = marketWebSocketService.subscribe((tick: MarketTick) => {
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
                unsub();
            };
        }, []);

        // Isolated 1-second (1000ms) tick interval — ONLY re-renders this leaf component
        useEffect(() => {
            if (!isLiveRunning) return;
            const timer = setInterval(() => {
                const wsSnap = wsOverridesRef.current;
                setLocalAssets((prev) => applyOneSecondTick(prev, wsSnap));
                setGlobalAssets((prev) => applyOneSecondTick(prev, wsSnap));
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

        const displayedAssets = useMemo(() => {
            const pool =
                assetCategory === 'COUNTRY'
                    ? localAssets
                    : globalAssets.filter((a) => a.category === assetCategory);

            const q = assetSearch.trim().toLowerCase();
            if (!q) return pool;
            return pool.filter(
                (a) => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
            );
        }, [assetCategory, localAssets, globalAssets, assetSearch]);

        const formatNum = (val: number, decimals = 2, unit?: string) => {
            const str = val.toLocaleString('it-IT', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
            if (unit === '%') return `${str}%`;
            if (unit === '$' || unit === '€') return `${unit}${str}`;
            return str;
        };

        return (
            <div className="space-y-3.5">
                {/* LIVE 1s Controls + Ticker Filter */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                    <div className="flex items-center justify-between sm:justify-start gap-2.5">
                        <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-black border ${
                                isLiveRunning
                                    ? 'bg-emerald-500/15 text-[#10B981] border-emerald-500/40'
                                    : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                            }`}
                        >
                            <span
                                className={`w-2 h-2 rounded-full ${
                                    isLiveRunning ? 'bg-[#10B981] animate-pulse' : 'bg-amber-400'
                                }`}
                            />
                            <span>{isLiveRunning ? 'LIVE 1s' : 'IN PAUSA'}</span>
                        </span>

                        <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                            {lastTickTime}
                        </span>

                        <button
                            type="button"
                            onClick={() => setIsLiveRunning((prev) => !prev)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-[10px] font-mono font-bold text-slate-200 cursor-pointer"
                        >
                            {isLiveRunning ? (
                                <>
                                    <Pause className="w-3 h-3 text-amber-400" />
                                    <span>Pausa</span>
                                </>
                            ) : (
                                <>
                                    <Play className="w-3 h-3 text-[#10B981]" />
                                    <span>Play</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="relative sm:w-56">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={assetSearch}
                            onChange={(e) => setAssetSearch(e.target.value)}
                            placeholder="Filtra ticker o nome..."
                            className="w-full h-9 pl-8 pr-3 rounded-xl bg-[#08090C] border border-white/[0.1] text-xs font-mono text-white placeholder-slate-500 focus:border-[#10B981] outline-none"
                        />
                    </div>
                </div>

                {/* Sub-Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {MARKET_SUB_FILTERS.map((cat) => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setAssetCategory(cat.id)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold shrink-0 border transition cursor-pointer ${
                                assetCategory === cat.id
                                    ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]'
                                    : 'bg-white/[0.03] text-slate-400 border-white/[0.08] hover:text-white'
                            }`}
                        >
                            {cat.id === 'COUNTRY' ? `${hub.flag} ${cat.label}` : cat.label}
                        </button>
                    ))}
                </div>

                {/* Broker-Grade Terminal Table */}
                <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-white/[0.02]">
                    <div className="grid grid-cols-12 gap-2 px-3.5 py-2.5 bg-white/[0.04] border-b border-white/[0.08] text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                        <div className="col-span-5 sm:col-span-4">STRUMENTO</div>
                        <div className="col-span-4 sm:col-span-3 text-right">LAST · BID/ASK</div>
                        <div className="col-span-3 sm:col-span-2 text-right">VAR. 24H</div>
                        <div className="hidden sm:block sm:col-span-2 text-center">
                            MIN / MAX GIORNO
                        </div>
                        <div className="hidden sm:block sm:col-span-1 text-right">TREND</div>
                    </div>

                    <div className="divide-y divide-white/[0.06]">
                        {displayedAssets.map((asset) => {
                            const isPos = asset.changePct >= 0;
                            const dec = asset.decimals ?? (asset.price < 5 ? 4 : 2);
                            const rangeSpan = Math.max(0.0001, asset.dayHigh - asset.dayLow);
                            const posPct = Math.max(
                                4,
                                Math.min(96, ((asset.price - asset.dayLow) / rangeSpan) * 100)
                            );
                            const rowFlash =
                                asset.flash === 'up'
                                    ? 'bg-emerald-500/[0.12]'
                                    : asset.flash === 'down'
                                    ? 'bg-rose-500/[0.12]'
                                    : 'hover:bg-white/[0.04]';

                            return (
                                <div
                                    key={asset.id}
                                    onClick={() => onOpenAssetChart(asset)}
                                    className={`grid grid-cols-12 gap-2 items-center px-3.5 py-3 transition-colors duration-300 cursor-pointer ${rowFlash}`}
                                >
                                    <div className="col-span-5 sm:col-span-4 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-black font-mono text-white truncate">
                                                {asset.symbol}
                                            </span>
                                            <span className="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase bg-white/[0.07] text-slate-400 shrink-0">
                                                {asset.category}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                            {asset.name}
                                        </p>
                                    </div>

                                    <div className="col-span-4 sm:col-span-3 text-right font-mono">
                                        <div
                                            className={`text-xs font-black tabular-nums ${
                                                asset.flash === 'up'
                                                    ? 'text-[#10B981]'
                                                    : asset.flash === 'down'
                                                    ? 'text-[#DC2626]'
                                                    : 'text-white'
                                            }`}
                                        >
                                            {formatNum(asset.price, dec, asset.unit)}
                                        </div>
                                        <div className="text-[9px] text-slate-500 tabular-nums">
                                            {asset.bid.toLocaleString('it-IT', {
                                                maximumFractionDigits: dec
                                            })}{' '}
                                            /{' '}
                                            {asset.ask.toLocaleString('it-IT', {
                                                maximumFractionDigits: dec
                                            })}
                                        </div>
                                    </div>

                                    <div className="col-span-3 sm:col-span-2 text-right font-mono">
                                        <div
                                            className={`text-xs font-black tabular-nums inline-flex items-center justify-end gap-0.5 ${
                                                isPos ? 'text-[#10B981]' : 'text-[#DC2626]'
                                            }`}
                                        >
                                            {isPos ? (
                                                <TrendingUp className="w-3 h-3 shrink-0" />
                                            ) : (
                                                <TrendingDown className="w-3 h-3 shrink-0" />
                                            )}
                                            <span>
                                                {isPos ? '+' : ''}
                                                {asset.changePct.toFixed(2)}%
                                            </span>
                                        </div>
                                        <div className="text-[9px] text-slate-400 tabular-nums">
                                            {asset.changePts >= 0 ? '+' : ''}
                                            {asset.changePts.toLocaleString('it-IT', {
                                                maximumFractionDigits: dec
                                            })}
                                        </div>
                                    </div>

                                    <div className="hidden sm:flex sm:col-span-2 flex-col gap-1 px-1 font-mono">
                                        <div className="w-full h-1.5 rounded-full bg-white/[0.08] relative">
                                            <div
                                                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#FDE047] shadow-[0_0_6px_#FDE047]"
                                                style={{ left: `calc(${posPct}% - 4px)` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[8px] text-slate-500 tabular-nums">
                                            <span>
                                                {asset.dayLow.toLocaleString('it-IT', {
                                                    maximumFractionDigits: dec > 2 ? 3 : 1
                                                })}
                                            </span>
                                            <span>
                                                {asset.dayHigh.toLocaleString('it-IT', {
                                                    maximumFractionDigits: dec > 2 ? 3 : 1
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="hidden sm:flex sm:col-span-1 justify-end">
                                        <MiniSparkline
                                            data={asset.sparkline}
                                            isPositive={isPos}
                                        />
                                    </div>
                                </div>
                            );
                        })}

                        {displayedAssets.length === 0 && (
                            <div className="p-6 text-center text-xs font-mono text-slate-400">
                                Nessuno strumento trovato per &quot;{assetSearch}&quot;.
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center text-[10px] font-mono text-slate-500 px-1">
                    <span className="inline-flex items-center gap-1.5">
                        <CandlestickChart className="w-3.5 h-3.5 text-[#10B981]" />
                        <span>
                            Tocca qualsiasi strumento per aprire il grafico live e registrare un trade in Tradyx History
                        </span>
                    </span>
                </div>
            </div>
        );
    }
);

LiveMarketsTable.displayName = 'LiveMarketsTable';
export default LiveMarketsTable;
