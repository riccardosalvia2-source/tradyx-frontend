// ============================================================================
// TRADYX ATLAS — ISOLATED 1s LIVE GLOBAL TICKER BAR (MEMOIZED LEAF)
// (src/components/atlas/TopGlobalTickerBar.tsx)
// Owns its own 1000ms tick interval & Binance WS stream so parent AtlasTerminalView
// and Mapbox3DGlobe NEVER re-render on 1-second price ticks!
// ============================================================================

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Radio, TrendingUp, TrendingDown } from 'lucide-react';
import { AtlasLiveAsset } from '../../types/atlas';
import {
    buildGlobalBaselineAssets,
    fetchPublicLiveQuotes,
    applyOneSecondTick
} from '../../services/atlasMarketService';
import { marketWebSocketService, MarketTick } from '../../services/marketWebSocketService';

interface TopGlobalTickerBarProps {
    onSelectAsset: (asset: AtlasLiveAsset) => void;
}

const TAPE_SYMBOLS: Array<{ symbol: string; display: string }> = [
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

const TAPE_SYMBOL_SET = new Set(TAPE_SYMBOLS.map((t) => t.symbol));

export const TopGlobalTickerBar: React.FC<TopGlobalTickerBarProps> = React.memo(
    ({ onSelectAsset }) => {
        const [tapeAssets, setTapeAssets] = useState<AtlasLiveAsset[]>(() =>
            buildGlobalBaselineAssets().filter((a) => TAPE_SYMBOL_SET.has(a.symbol))
        );
        const wsOverridesRef = useRef<Record<string, { price: number; change24h: number }>>({});

        useEffect(() => {
            marketWebSocketService.start();
            const unsub = marketWebSocketService.subscribe((tick: MarketTick) => {
                if (tick.symbol && tick.price > 0 && TAPE_SYMBOL_SET.has(tick.symbol)) {
                    wsOverridesRef.current[tick.symbol] = {
                        price: tick.price,
                        change24h: Number(tick.change24h.toFixed(2))
                    };
                }
            });

            fetchPublicLiveQuotes().then(({ crypto, fx }) => {
                setTapeAssets((prev) =>
                    prev.map((asset) => {
                        if (asset.category === 'CRYPTO' && crypto[asset.symbol]) {
                            return {
                                ...asset,
                                price: crypto[asset.symbol].price,
                                prevPrice: crypto[asset.symbol].price,
                                changePct: crypto[asset.symbol].change24h
                            };
                        }
                        if (asset.symbol === 'EUR/USD' && fx.EUR) {
                            const rate = Number((1 / fx.EUR).toFixed(4));
                            return { ...asset, price: rate, prevPrice: rate };
                        }
                        return asset;
                    })
                );
            });

            const timer = setInterval(() => {
                setTapeAssets((prev) => applyOneSecondTick(prev, wsOverridesRef.current));
            }, 1000);

            return () => {
                unsub();
                clearInterval(timer);
            };
        }, []);

        const orderedItems = useMemo(() => {
            return TAPE_SYMBOLS.map((t) => {
                const asset = tapeAssets.find((a) => a.symbol === t.symbol);
                return asset ? { display: t.display, asset } : null;
            }).filter(Boolean) as Array<{ display: string; asset: AtlasLiveAsset }>;
        }, [tapeAssets]);

        return (
            <div className="w-full bg-[#060911]/90 border-b border-white/[0.08] backdrop-blur-xl pt-[env(safe-area-inset-top,0px)] pointer-events-auto">
                <div className="flex items-center h-9 overflow-hidden">
                    {/* Fixed LIVE 1s Indicator */}
                    <div className="shrink-0 h-full px-3 bg-[#08090C] border-r border-white/[0.08] flex items-center gap-1.5 z-10">
                        <Radio className="w-3 h-3 text-[#10B981] animate-pulse" />
                        <span className="text-[10px] font-mono font-black text-[#10B981] tracking-wider">
                            LIVE 1s
                        </span>
                    </div>

                    {/* Seamless Infinite Marquee */}
                    <div className="flex-1 overflow-hidden">
                        <div className="animate-atlas-ticker items-center">
                            {[...orderedItems, ...orderedItems].map(({ display, asset }, idx) => {
                                const isPos = asset.changePct >= 0;
                                const dec = asset.decimals ?? 2;
                                return (
                                    <button
                                        key={`${asset.symbol}-${idx}`}
                                        type="button"
                                        onClick={() => onSelectAsset(asset)}
                                        className="inline-flex items-center gap-2 px-3.5 h-9 border-r border-white/[0.05] hover:bg-white/[0.06] transition cursor-pointer font-mono text-[11px] shrink-0"
                                    >
                                        <span className="font-bold text-slate-300">{display}</span>
                                        <span
                                            className={`font-black tabular-nums transition-colors ${
                                                asset.flash === 'up'
                                                    ? 'text-[#10B981]'
                                                    : asset.flash === 'down'
                                                    ? 'text-[#DC2626]'
                                                    : 'text-white'
                                            }`}
                                        >
                                            {asset.price.toLocaleString('it-IT', {
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
                                            {asset.changePct.toFixed(2)}%
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);

TopGlobalTickerBar.displayName = 'TopGlobalTickerBar';
export default TopGlobalTickerBar;
