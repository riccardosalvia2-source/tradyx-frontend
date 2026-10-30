// ============================================================================
// TRADYX GLOBAL MARKET WATCH HUB (src/components/GlobalMarketWatchHub.tsx)
// Live Market Monitoring & Institutional Real-Time Terminal
// Continuous WebSocket Tick-by-Tick Stream (Binance + Macro Streamer)
// 300ms Tick Flash Animation, Interactive TradingView Chart Modal,
// In-Chart Trade Execution & Real-Time Price Alerts
// ============================================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Search, 
    RefreshCw, 
    TrendingUp, 
    TrendingDown, 
    Globe, 
    Sparkles, 
    X, 
    Layers, 
    BarChart3, 
    Activity, 
    ArrowUpRight, 
    ArrowDownRight, 
    ShieldCheck, 
    ChevronRight,
    ExternalLink,
    Zap,
    Clock,
    PlusCircle,
    Bell,
    CheckCircle2
} from 'lucide-react';
import { 
    WatchlistAsset, 
    MarketCategoryFilter 
} from '../types/market';
import { 
    fetchGlobalMarketWatch, 
    formatPrice, 
    formatChangePercent, 
    formatCompactNumber, 
    generateSvgSparkline 
} from '../services/marketWatchService';
import { marketWebSocketService, MarketTick } from '../services/marketWebSocketService';
import { evaluatePriceAlerts, PriceAlert } from '../services/priceAlertService';
import { TradingViewChartModal } from './TradingViewChartModal';
import { PriceAlertModal } from './PriceAlertModal';
import { useTradeStore } from '../store/useTradeStore';
import { triggerHaptic } from '../services/circuitBreakerService';

interface GlobalMarketWatchHubProps {
    onNavigateToTrade?: (symbol: string) => void;
    className?: string;
}

export const GlobalMarketWatchHub: React.FC<GlobalMarketWatchHubProps> = ({
    onNavigateToTrade,
    className = ''
}) => {
    const { setDraftTradeAsset } = useTradeStore();

    // Data state
    const [assets, setAssets] = useState<WatchlistAsset[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('Caricamento...');
    const [activeSource, setActiveSource] = useState<string>('Binance WebSocket Stream');

    // Filter & Search state
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<MarketCategoryFilter>('ALL');

    // Selected Asset for TradingView Chart Modal
    const [chartAsset, setChartAsset] = useState<WatchlistAsset | null>(null);

    // Selected Asset for Quick Price Alert Modal
    const [alertAsset, setAlertAsset] = useState<WatchlistAsset | null>(null);

    // Real-time Tick Flashes state: Record<symbol, 'UP' | 'DOWN'>
    const [tickFlashes, setTickFlashes] = useState<Record<string, 'UP' | 'DOWN'>>({});

    // Triggered Price Alert Toast
    const [triggeredToast, setTriggeredToast] = useState<{
        symbol: string;
        targetPrice: number;
        condition: string;
    } | null>(null);

    // Initial Load & Fallback Cache
    const loadMarketData = async (forceRefresh = false) => {
        if (forceRefresh) {
            setIsRefreshing(true);
            triggerHaptic('click');
        }
        try {
            const result = await fetchGlobalMarketWatch(forceRefresh);
            setAssets(result.assets);

            const sourceLabels: Record<string, string> = {
                coingecko: 'CoinGecko + Binance WebSocket',
                binance_fallback: 'Binance Live Feed',
                resilient_feed: 'Resilient Terminal Feed'
            };
            setActiveSource(sourceLabels[result.source] || 'WebSocket Live Stream');

            const date = new Date(result.lastUpdated);
            const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
            setLastUpdatedTime(timeStr);
        } catch (err) {
            console.warn('[MarketWatchHub] Load error:', err);
        } finally {
            setIsLoading(false);
            if (forceRefresh) {
                setTimeout(() => setIsRefreshing(false), 500);
            }
        }
    };

    // Initial Mount
    useEffect(() => {
        loadMarketData(false);
    }, []);

    /**
     * Continuous WebSocket Tick-by-Tick Stream Subscription
     */
    useEffect(() => {
        const unsubscribe = marketWebSocketService.subscribe((tick: MarketTick) => {
            setAssets(prevAssets => {
                let hasChanged = false;
                const updated = prevAssets.map(asset => {
                    const clean = asset.symbol.replace('/USD', '').replace('USDT', '').toUpperCase();
                    if (clean === tick.symbol) {
                        hasChanged = true;

                        // Calculate flash direction if price differed
                        if (asset.current_price !== tick.price) {
                            const dir = tick.price > asset.current_price ? 'UP' : 'DOWN';
                            setTickFlashes(f => ({ ...f, [asset.symbol]: dir }));
                            setTimeout(() => {
                                setTickFlashes(f => {
                                    const next = { ...f };
                                    delete next[asset.symbol];
                                    return next;
                                });
                            }, 300);
                        }

                        // Also update sparkline tail
                        let newSparkline = asset.sparkline_7d;
                        if (newSparkline && newSparkline.length > 0) {
                            newSparkline = [...newSparkline.slice(1), tick.price];
                        }

                        return {
                            ...asset,
                            current_price: tick.price,
                            price_change_percentage_24h: tick.change24h,
                            high_24h: Math.max(asset.high_24h, tick.high24h || tick.price),
                            low_24h: Math.min(asset.low_24h, tick.low24h || tick.price),
                            sparkline_7d: newSparkline
                        };
                    }
                    return asset;
                });

                return hasChanged ? updated : prevAssets;
            });

            // Evaluate background price alerts
            const triggered = evaluatePriceAlerts(tick.symbol, tick.price);
            if (triggered && triggered.length > 0) {
                const first = triggered[0];
                setTriggeredToast({
                    symbol: first.symbol,
                    targetPrice: first.targetPrice,
                    condition: first.condition
                });
                setTimeout(() => setTriggeredToast(null), 4500);
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);

    // Filter logic
    const filteredAssets = useMemo(() => {
        return assets.filter(item => {
            // Category filter
            let matchesCategory = true;
            if (selectedCategory === 'TOP_10') {
                matchesCategory = (item.rank !== undefined && item.rank <= 10) || (item.category === 'crypto_top');
            } else if (selectedCategory === 'LAYER_1') {
                matchesCategory = item.category === 'crypto_l1' || (item.type === 'crypto' && ['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'AVAX', 'SUI', 'NEAR', 'DOT'].includes(item.symbol));
            } else if (selectedCategory === 'MACRO') {
                matchesCategory = item.type === 'macro_index' || item.type === 'commodity';
            }

            // Search query filter
            const query = searchQuery.trim().toLowerCase();
            let matchesQuery = true;
            if (query) {
                matchesQuery = item.symbol.toLowerCase().includes(query) ||
                    item.name.toLowerCase().includes(query) ||
                    (item.description && item.description.toLowerCase().includes(query));
            }

            return matchesCategory && matchesQuery;
        });
    }, [assets, selectedCategory, searchQuery]);

    return (
        <div className={`w-full flex flex-col space-y-3 font-sans select-none ${className}`}>
            
            {/* REAL-TIME TRIGGERED PRICE ALERT TOAST */}
            {triggeredToast && (
                <div className="w-full p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-amber-500/20 border border-amber-500/40 backdrop-blur-xl flex items-center justify-between shadow-[0_0_25px_rgba(245,158,11,0.3)] animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/25 border border-amber-400/40 flex items-center justify-center shrink-0">
                            <Bell className="w-4 h-4 text-amber-300 animate-bounce" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-mono font-black text-amber-300 uppercase">
                                    ALLARME PREZZO ATTIVATO!
                                </span>
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-400/20 text-white font-bold">
                                    {triggeredToast.symbol}
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-200 font-mono">
                                La soglia di <strong>${triggeredToast.targetPrice.toLocaleString()}</strong> ({triggeredToast.condition === 'ABOVE' ? '>=' : '<='}) è stata raggiunta.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setTriggeredToast(null)}
                        className="text-slate-400 hover:text-white p-1"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* 1. TOP HEADER WITH STATS & ROTATING REFRESH BUTTON */}
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-2xl bg-[#0D111A]/80 backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#10B981]/20 to-[#2563EB]/20 border border-[#10B981]/30 flex items-center justify-center shrink-0 shadow-inner">
                        <Activity className="w-4 h-4 text-[#10B981] animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xs sm:text-sm font-black text-white font-mono tracking-tight uppercase">
                                GLOBAL MARKET WATCH
                            </h2>
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25 uppercase flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                                <span>WEBSOCKET REAL-TIME</span>
                            </span>
                        </div>
                        <p className="text-[10px] font-mono text-[#9CA3AF]">
                            Stream: <span className="text-slate-300 font-semibold">{activeSource}</span> • Tick-by-Tick
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 text-xs font-mono">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[10px] text-[#9CA3AF]">
                        <Clock className="w-3 h-3 text-[#10B981]" />
                        <span>Tick: <strong className="text-white font-bold">{lastUpdatedTime}</strong></span>
                    </div>

                    <button
                        type="button"
                        onClick={() => loadMarketData(true)}
                        disabled={isRefreshing}
                        className="px-3 py-1 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:scale-95 border border-white/10 text-white font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm group"
                        title="Riconnetti e Sincronizza Ticker"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 text-[#10B981] transition-transform duration-700 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                        <span className="text-[11px]">Sync</span>
                    </button>
                </div>
            </div>

            {/* 2. SEARCH BAR & HORIZONTAL FILTER PILLS */}
            <div className="space-y-2.5">
                {/* Search Input Bar */}
                <div className="relative w-full">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cerca asset o ticker (es. BTC, SOL, SPX, Gold)..."
                        className="w-full bg-[#121620]/90 backdrop-blur-xl border border-white/[0.08] focus:border-[#10B981]/60 focus:ring-1 focus:ring-[#10B981]/40 rounded-xl py-2.5 pl-10 pr-9 text-xs text-white placeholder-[#9CA3AF] font-mono outline-none transition shadow-inner"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Horizontal Scrolling Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none font-mono text-xs">
                    {[
                        { id: 'ALL' as MarketCategoryFilter, label: 'Tutti', count: assets.length },
                        { id: 'TOP_10' as MarketCategoryFilter, label: 'Top 10', count: 10 },
                        { id: 'LAYER_1' as MarketCategoryFilter, label: 'Layer 1 Crypto', count: assets.filter(a => a.category === 'crypto_l1' || ['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'AVAX'].includes(a.symbol)).length },
                        { id: 'MACRO' as MarketCategoryFilter, label: 'Indici & Macro', count: assets.filter(a => a.type === 'macro_index' || a.type === 'commodity').length }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                                triggerHaptic('click');
                                setSelectedCategory(tab.id);
                            }}
                            className={`px-3 py-1.5 rounded-xl border transition-all duration-200 shrink-0 font-bold flex items-center gap-1.5 cursor-pointer text-[11px] ${
                                selectedCategory === tab.id
                                    ? 'bg-[#10B981] text-slate-950 border-[#10B981] shadow-lg shadow-[#10B981]/20 font-black'
                                    : 'bg-[#121620]/60 text-[#9CA3AF] hover:text-white border-white/[0.06] hover:bg-white/[0.04]'
                            }`}
                        >
                            <span>{tab.label}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                                selectedCategory === tab.id 
                                    ? 'bg-slate-950/20 text-slate-950 font-black' 
                                    : 'bg-white/10 text-slate-300'
                            }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. ASSET CARDS LIST (MOBILE TOUCH-FIRST ROWS WITH 300MS TICK FLASH) */}
            <div className="space-y-2">
                {isLoading ? (
                    // Skeleton Loaders
                    Array.from({ length: 6 }).map((_, i) => (
                        <div 
                            key={i} 
                            className="w-full h-18 rounded-2xl bg-[#121620]/50 border border-white/[0.05] animate-pulse flex items-center justify-between px-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/5" />
                                <div className="space-y-1.5">
                                    <div className="w-16 h-3.5 bg-white/10 rounded" />
                                    <div className="w-24 h-2.5 bg-white/5 rounded" />
                                </div>
                            </div>
                            <div className="w-20 h-6 bg-white/5 rounded" />
                            <div className="space-y-1.5 text-right">
                                <div className="w-20 h-3.5 bg-white/10 rounded ml-auto" />
                                <div className="w-14 h-4 bg-white/5 rounded ml-auto" />
                            </div>
                        </div>
                    ))
                ) : filteredAssets.length === 0 ? (
                    <div className="w-full p-8 rounded-2xl bg-[#121620]/60 border border-white/[0.08] text-center font-mono space-y-2">
                        <Activity className="w-8 h-8 text-[#9CA3AF] mx-auto opacity-50" />
                        <p className="text-xs text-white font-bold">Nessun asset corrispondente</p>
                        <p className="text-[11px] text-[#9CA3AF]">
                            Prova a modificare la ricerca o seleziona la pillola "Tutti".
                        </p>
                    </div>
                ) : (
                    filteredAssets.map((asset) => {
                        const isUp = asset.price_change_percentage_24h >= 0;
                        const sparklineData = generateSvgSparkline(asset.sparkline_7d, 90, 32);
                        const flash = tickFlashes[asset.symbol];

                        return (
                            <div
                                key={asset.id}
                                onClick={() => {
                                    triggerHaptic('click');
                                    // Open TradingView Chart Modal directly
                                    setChartAsset(asset);
                                }}
                                className="w-full p-3 sm:p-3.5 rounded-2xl bg-[#121620]/70 hover:bg-[#161B28]/95 active:scale-[0.99] backdrop-blur-xl border border-white/[0.08] border-t-white/[0.14] transition-all duration-200 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex items-center justify-between gap-2 group hover:border-[#10B981]/40"
                            >
                                {/* BLOCCO 1: SINISTRA (IDENTITÀ ASSET) */}
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#181D2A] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-inner group-hover:border-[#10B981]/50 transition">
                                        {asset.image ? (
                                            <img 
                                                src={asset.image} 
                                                alt={asset.symbol} 
                                                className="w-full h-full object-cover" 
                                                onError={(e) => {
                                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <span className="font-mono font-black text-xs text-[#10B981]">
                                                {asset.symbol.slice(0, 3)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs sm:text-sm font-black text-white font-mono tracking-tight uppercase group-hover:text-[#10B981] transition">
                                                {asset.symbol}
                                            </span>
                                            {asset.type !== 'crypto' ? (
                                                <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800 uppercase">
                                                    {asset.type === 'commodity' ? 'COMMODITY' : 'INDEX'}
                                                </span>
                                            ) : asset.rank ? (
                                                <span className="text-[8px] font-mono text-[#9CA3AF] opacity-80">
                                                    #{asset.rank}
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="text-[11px] text-[#9CA3AF] font-sans truncate pr-1">
                                            {asset.name}
                                        </p>
                                    </div>
                                </div>

                                {/* BLOCCO 2: CENTRO (MINI-GRAFICO SPARKLINE SVG VETTORIALE FLUIDO A ONDA) */}
                                <div className="hidden xs:flex sm:flex items-center justify-center px-1 shrink-0 w-[90px] h-[32px]">
                                    <svg 
                                        viewBox="0 0 90 32" 
                                        className="w-full h-full overflow-visible"
                                        preserveAspectRatio="none"
                                    >
                                        <defs>
                                            <linearGradient id={`grad-${asset.id}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop 
                                                    offset="0%" 
                                                    stopColor={sparklineData.isPositive ? '#10B981' : '#DC2626'} 
                                                    stopOpacity="0.30" 
                                                />
                                                <stop 
                                                    offset="100%" 
                                                    stopColor={sparklineData.isPositive ? '#10B981' : '#DC2626'} 
                                                    stopOpacity="0.0" 
                                                />
                                            </linearGradient>
                                        </defs>

                                        {/* Shaded Area Below Sparkline Curve */}
                                        <path 
                                            d={sparklineData.areaD} 
                                            fill={`url(#grad-${asset.id})`} 
                                        />

                                        {/* Main Fluid Wave Stroke Line */}
                                        <path 
                                            d={sparklineData.pathD} 
                                            fill="none" 
                                            stroke={sparklineData.isPositive ? '#10B981' : '#DC2626'} 
                                            strokeWidth="1.8" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                        />
                                    </svg>
                                </div>

                                {/* BLOCCO 3: DESTRA (QUOTAZIONE CON FLASH 300MS + ALLARME + 24H PILL) */}
                                <div className="flex items-center gap-2 shrink-0 pl-1">
                                    <div className="flex flex-col items-end">
                                        <span 
                                            className={`text-xs sm:text-sm font-mono font-bold tracking-tight transition-colors duration-300 px-1 py-0.5 rounded ${
                                                flash === 'UP' 
                                                    ? 'text-emerald-400 bg-emerald-500/15' 
                                                    : flash === 'DOWN' 
                                                        ? 'text-rose-400 bg-rose-500/15' 
                                                        : 'text-white'
                                            }`}
                                        >
                                            {formatPrice(asset.current_price)}
                                        </span>

                                        <div className={`mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold flex items-center gap-0.5 border ${
                                            isUp 
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                        }`}>
                                            {isUp ? (
                                                <ArrowUpRight className="w-2.5 h-2.5 stroke-[2.5]" />
                                            ) : (
                                                <ArrowDownRight className="w-2.5 h-2.5 stroke-[2.5]" />
                                            )}
                                            <span>{formatChangePercent(asset.price_change_percentage_24h)}</span>
                                        </div>
                                    </div>

                                    {/* Quick Price Alert Button */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            triggerHaptic('click');
                                            setAlertAsset(asset);
                                        }}
                                        className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-amber-500/20 text-[#9CA3AF] hover:text-amber-400 border border-white/[0.06] transition shrink-0"
                                        title="Imposta allarme prezzo"
                                    >
                                        <Bell className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ============================================================================ */}
            {/* 4. TRADINGVIEW MULTI-TIMEFRAME INTERACTIVE CHART MODAL                         */}
            {/* ============================================================================ */}
            {chartAsset && (
                <TradingViewChartModal
                    asset={chartAsset}
                    isOpen={Boolean(chartAsset)}
                    onClose={() => setChartAsset(null)}
                    onNavigateToTrade={onNavigateToTrade}
                />
            )}

            {/* ============================================================================ */}
            {/* 5. PRICE ALERT MODAL (TRIGGERED FROM ROW BELL)                                */}
            {/* ============================================================================ */}
            {alertAsset && (
                <PriceAlertModal
                    symbol={alertAsset.symbol}
                    currentPrice={alertAsset.current_price}
                    isOpen={Boolean(alertAsset)}
                    onClose={() => setAlertAsset(null)}
                />
            )}

        </div>
    );
};

export default GlobalMarketWatchHub;
