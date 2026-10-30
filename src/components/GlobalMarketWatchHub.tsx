// ============================================================================
// TRADYX GLOBAL MARKET WATCH HUB (src/components/GlobalMarketWatchHub.tsx)
// Live Market Monitoring (CoinMarketCap / Bloomberg Terminal Mobile style)
// Zero-Cost Free Public APIs Aggregation (CoinGecko v3 + Binance 24hr Fallback + Macro)
// Dark Fintech Glassmorphism Aesthetic (#08090C deep black, #10B981 Emerald, #DC2626 Carmine)
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
    PlusCircle
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
    const [activeSource, setActiveSource] = useState<string>('CoinGecko Live API');

    // Filter & Search state
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<MarketCategoryFilter>('ALL');

    // Selected Asset Drawer State (iOS Bottom Sheet)
    const [selectedAsset, setSelectedAsset] = useState<WatchlistAsset | null>(null);

    // Silent background polling: 3 minutes (180 seconds)
    const AUTO_POLL_INTERVAL_MS = 180 * 1000;
    const pollingTimerRef = useRef<any>(null);

    const loadMarketData = async (forceRefresh = false) => {
        if (forceRefresh) {
            setIsRefreshing(true);
            triggerHaptic('click');
        }
        try {
            const result = await fetchGlobalMarketWatch(forceRefresh);
            setAssets(result.assets);

            const sourceLabels: Record<string, string> = {
                coingecko: 'CoinGecko Live Feed',
                binance_fallback: 'Binance 24hr Fallback',
                resilient_feed: 'Resilient Market Feed'
            };
            setActiveSource(sourceLabels[result.source] || 'Free Public Feed');

            const date = new Date(result.lastUpdated);
            const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            setLastUpdatedTime(timeStr);
        } catch (err) {
            console.warn('[MarketWatchHub] Load error:', err);
        } finally {
            setIsLoading(false);
            if (forceRefresh) {
                setTimeout(() => setIsRefreshing(false), 600);
            }
        }
    };

    // Initial mount load
    useEffect(() => {
        loadMarketData(false);

        // Silent 3-minute background polling
        pollingTimerRef.current = setInterval(() => {
            loadMarketData(false);
        }, AUTO_POLL_INTERVAL_MS);

        return () => {
            if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
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

    // Handle Quick Action: Register Trade on this Asset
    const handleRegisterTrade = (asset: WatchlistAsset) => {
        triggerHaptic('success');
        // Format clean asset pair: e.g. "BTC/USD", "SOL/USD", or "SPX/USD"
        const formattedSymbol = asset.symbol.includes('/') 
            ? asset.symbol 
            : `${asset.symbol}/USD`;

        setDraftTradeAsset(formattedSymbol);
        setSelectedAsset(null);

        if (onNavigateToTrade) {
            onNavigateToTrade(formattedSymbol);
        }
    };

    return (
        <div className={`w-full flex flex-col space-y-3 font-sans select-none ${className}`}>
            
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
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25 uppercase">
                                LIVE 100% FREE
                            </span>
                        </div>
                        <p className="text-[10px] font-mono text-[#9CA3AF]">
                            Feed: <span className="text-slate-300 font-semibold">{activeSource}</span> • Cache: 90s
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 text-xs font-mono">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[10px] text-[#9CA3AF]">
                        <Clock className="w-3 h-3 text-[#10B981]" />
                        <span>Aggiornato: <strong className="text-white font-bold">{lastUpdatedTime}</strong></span>
                    </div>

                    <button
                        type="button"
                        onClick={() => loadMarketData(true)}
                        disabled={isRefreshing}
                        className="px-3 py-1 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:scale-95 border border-white/10 text-white font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm group"
                        title="Aggiorna Quotazioni in Tempo Reale"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 text-[#10B981] transition-transform duration-700 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                        <span className="text-[11px]">Aggiorna</span>
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

            {/* 3. ASSET CARDS LIST (MOBILE TOUCH-FIRST ROWS) */}
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

                        return (
                            <div
                                key={asset.id}
                                onClick={() => {
                                    triggerHaptic('click');
                                    setSelectedAsset(asset);
                                }}
                                className="w-full p-3 sm:p-3.5 rounded-2xl bg-[#121620]/70 hover:bg-[#161B28]/90 active:scale-[0.99] backdrop-blur-xl border border-white/[0.08] border-t-white/[0.14] transition-all duration-200 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex items-center justify-between gap-2 group"
                            >
                                {/* BLOCCO 1: SINISTRA (IDENTITÀ ASSET) */}
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#181D2A] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-inner group-hover:border-white/20 transition">
                                        {asset.image ? (
                                            <img 
                                                src={asset.image} 
                                                alt={asset.symbol} 
                                                className="w-full h-full object-cover" 
                                                onError={(e) => {
                                                    // Fallback to text initials on image error
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

                                {/* BLOCCO 3: DESTRA (QUOTAZIONE & PILLOLA VARIAZIONE 24H) */}
                                <div className="flex flex-col items-end shrink-0 pl-1">
                                    <span className="text-xs sm:text-sm font-mono font-bold text-white tracking-tight">
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
                            </div>
                        );
                    })
                )}
            </div>

            {/* ============================================================================ */}
            {/* 4. ASSET DETAIL DRAWER / BOTTOM SHEET (iOS STYLE)                             */}
            {/* Zero Broker, Consultative Only, Link to Trade Logging                           */}
            {/* ============================================================================ */}
            {selectedAsset && (
                <div 
                    className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center animate-in fade-in duration-200"
                    onClick={() => setSelectedAsset(null)}
                >
                    <div 
                        className="w-full max-w-lg bg-[#0E121B] rounded-t-3xl sm:rounded-3xl border border-white/[0.12] p-5 shadow-[0_-12px_40px_rgba(0,0,0,0.8)] max-h-[90vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom duration-300 font-sans"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* iOS Drawer Grabber Handle */}
                        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto -mt-1 mb-2 sm:hidden" />

                        {/* Drawer Header */}
                        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-[#161B28] border border-white/15 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                                    {selectedAsset.image ? (
                                        <img src={selectedAsset.image} alt={selectedAsset.symbol} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="font-mono font-black text-sm text-[#10B981]">{selectedAsset.symbol.slice(0, 3)}</span>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-extrabold text-white font-mono tracking-tight">
                                            {selectedAsset.symbol}
                                        </h3>
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                                            {selectedAsset.type.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#9CA3AF]">
                                        {selectedAsset.name}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedAsset(null)}
                                className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/[0.05] hover:bg-white/10 transition cursor-pointer"
                                title="Chiudi Scheda"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Current Price Banner */}
                        <div className="p-3.5 rounded-2xl bg-[#121622]/90 border border-white/[0.08] flex items-center justify-between shadow-inner">
                            <div>
                                <span className="text-[10px] font-mono uppercase text-[#9CA3AF] tracking-wider block">
                                    Prezzo Attuale (USD)
                                </span>
                                <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight mt-0.5">
                                    {formatPrice(selectedAsset.current_price)}
                                </div>
                            </div>

                            <div className={`px-3 py-1.5 rounded-xl font-mono text-xs font-black flex items-center gap-1 border ${
                                selectedAsset.price_change_percentage_24h >= 0
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                            }`}>
                                {selectedAsset.price_change_percentage_24h >= 0 ? (
                                    <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                                ) : (
                                    <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
                                )}
                                <span>24h: {formatChangePercent(selectedAsset.price_change_percentage_24h)}</span>
                            </div>
                        </div>

                        {/* ENLARGED 7-DAY MINI-CHART WITH AREA FILL & STATS */}
                        <div className="p-4 rounded-2xl bg-[#121622]/70 border border-white/[0.08] space-y-2">
                            <div className="flex items-center justify-between text-xs font-mono">
                                <span className="text-[#9CA3AF] flex items-center gap-1.5 font-bold">
                                    <TrendingUp className="w-3.5 h-3.5 text-[#10B981]" />
                                    TREND 7 GIORNI
                                </span>
                                <span className="text-[10px] text-slate-400">
                                    {selectedAsset.sparkline_7d.length} PUNTI DI CAMPIONAMENTO
                                </span>
                            </div>

                            {/* SVG Chart Container */}
                            <div className="w-full h-28 relative">
                                {(() => {
                                    const enlarged = generateSvgSparkline(selectedAsset.sparkline_7d, 320, 100);
                                    return (
                                        <svg 
                                            viewBox="0 0 320 100" 
                                            className="w-full h-full overflow-visible"
                                            preserveAspectRatio="none"
                                        >
                                            <defs>
                                                <linearGradient id="drawer-chart-grad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop 
                                                        offset="0%" 
                                                        stopColor={enlarged.isPositive ? '#10B981' : '#DC2626'} 
                                                        stopOpacity="0.35" 
                                                    />
                                                    <stop 
                                                        offset="100%" 
                                                        stopColor={enlarged.isPositive ? '#10B981' : '#DC2626'} 
                                                        stopOpacity="0.0" 
                                                    />
                                                </linearGradient>
                                            </defs>

                                            {/* Area */}
                                            <path d={enlarged.areaD} fill="url(#drawer-chart-grad)" />

                                            {/* Curve */}
                                            <path 
                                                d={enlarged.pathD} 
                                                fill="none" 
                                                stroke={enlarged.isPositive ? '#10B981' : '#DC2626'} 
                                                strokeWidth="2.4" 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round" 
                                            />
                                        </svg>
                                    );
                                })()}
                            </div>

                            <div className="flex items-center justify-between text-[10px] font-mono text-[#9CA3AF] pt-1 border-t border-white/[0.06]">
                                <span>Min: <strong className="text-white">{formatPrice(selectedAsset.low_24h)}</strong></span>
                                <span>Max: <strong className="text-white">{formatPrice(selectedAsset.high_24h)}</strong></span>
                            </div>
                        </div>

                        {/* KEY METRICS GRID (4 BLOCKS) */}
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                            <div className="p-3 rounded-xl bg-[#121622]/60 border border-white/[0.06] space-y-0.5">
                                <span className="text-[10px] text-[#9CA3AF] uppercase block">Massimo 24h</span>
                                <span className="text-sm font-bold text-white block">{formatPrice(selectedAsset.high_24h)}</span>
                            </div>

                            <div className="p-3 rounded-xl bg-[#121622]/60 border border-white/[0.06] space-y-0.5">
                                <span className="text-[10px] text-[#9CA3AF] uppercase block">Minimo 24h</span>
                                <span className="text-sm font-bold text-white block">{formatPrice(selectedAsset.low_24h)}</span>
                            </div>

                            <div className="p-3 rounded-xl bg-[#121622]/60 border border-white/[0.06] space-y-0.5">
                                <span className="text-[10px] text-[#9CA3AF] uppercase block">Volume 24h</span>
                                <span className="text-sm font-bold text-white block">{formatCompactNumber(selectedAsset.total_volume)}</span>
                            </div>

                            <div className="p-3 rounded-xl bg-[#121622]/60 border border-white/[0.06] space-y-0.5">
                                <span className="text-[10px] text-[#9CA3AF] uppercase block">Market Cap</span>
                                <span className="text-sm font-bold text-white block">
                                    {selectedAsset.market_cap > 0 ? formatCompactNumber(selectedAsset.market_cap) : 'Benchmark'}
                                </span>
                            </div>
                        </div>

                        {/* QUICK ACTION BUTTON: REGISTRA TRADE SU QUESTO ASSET */}
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={() => handleRegisterTrade(selectedAsset)}
                                className="w-full min-h-[48px] rounded-xl bg-[#10B981] hover:bg-[#059669] text-slate-950 font-mono text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#10B981]/25 border border-[#10B981]"
                            >
                                <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                                <span>Registra Trade su questo Asset ({selectedAsset.symbol})</span>
                            </button>
                            <p className="text-[10px] text-center text-[#9CA3AF] font-mono mt-1.5">
                                Precompila all'istante il form di Trade Logging senza frizione
                            </p>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};

export default GlobalMarketWatchHub;
