// ============================================================================
// TRADYX INTERACTIVE TRADINGVIEW LIGHTWEIGHT CHART MODAL
// (src/components/TradingViewChartModal.tsx)
// Multi-Timeframe Candlestick/Line/Area/Bar Chart, Live WebSocket Ticks,
// Interactive Touch Crosshair HUD, In-Chart Order Execution & Price Alert Sync
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    createChart, 
    CandlestickSeries, 
    LineSeries, 
    AreaSeries, 
    BarSeries, 
    ColorType, 
    CrosshairMode, 
    IChartApi, 
    ISeriesApi, 
    UTCTimestamp 
} from 'lightweight-charts';
import { 
    X, 
    Bell, 
    TrendingUp, 
    TrendingDown, 
    Activity, 
    Clock, 
    Zap, 
    CheckCircle2, 
    AlertCircle, 
    Maximize2, 
    Minimize2,
    DollarSign,
    Sliders,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw
} from 'lucide-react';
import { WatchlistAsset } from '../types/market';
import { formatPrice, formatChangePercent } from '../services/marketWatchService';
import { marketWebSocketService, MarketTick } from '../services/marketWebSocketService';
import { evaluatePriceAlerts, playAlertChime, triggerAlertHaptic } from '../services/priceAlertService';
import { PriceAlertModal } from './PriceAlertModal';
import { useTradeStore } from '../store/useTradeStore';
import { triggerHaptic } from '../services/circuitBreakerService';

export type ChartType = 'candlestick' | 'line' | 'area' | 'bar';
export type ChartTimeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1D';

interface TradingViewChartModalProps {
    asset: WatchlistAsset | null;
    isOpen: boolean;
    onClose: () => void;
    onNavigateToTrade?: (symbol: string) => void;
}

interface OHLCVBar {
    time: UTCTimestamp;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

export const TradingViewChartModal: React.FC<TradingViewChartModalProps> = ({
    asset,
    isOpen,
    onClose,
    onNavigateToTrade
}) => {
    const { addTrade } = useTradeStore();

    // Chart Options State
    const [chartType, setChartType] = useState<ChartType>('candlestick');
    const [timeframe, setTimeframe] = useState<ChartTimeframe>('15m');
    const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

    // Live Price & Tick State
    const [currentPrice, setCurrentPrice] = useState<number>(asset ? asset.current_price : 0);
    const [prevPrice, setPrevPrice] = useState<number>(asset ? asset.current_price : 0);
    const [priceFlash, setPriceFlash] = useState<'UP' | 'DOWN' | null>(null);
    const [priceChange24h, setPriceChange24h] = useState<number>(asset ? asset.price_change_percentage_24h : 0);

    // Crosshair HUD Data
    const [hudData, setHudData] = useState<{
        timeStr: string;
        open?: number;
        high?: number;
        low?: number;
        close: number;
        volume?: number;
    } | null>(null);

    // Alert Modal state
    const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);

    // In-Chart Trade Execution Panel State
    const [isTradePanelOpen, setIsTradePanelOpen] = useState<boolean>(false);
    const [tradeDirection, setTradeDirection] = useState<'LONG' | 'SHORT'>('LONG');
    const [entryPriceInput, setEntryPriceInput] = useState<string>('');
    const [positionSizeInput, setPositionSizeInput] = useState<string>('1.0');
    const [takeProfitInput, setTakeProfitInput] = useState<string>('');
    const [stopLossInput, setStopLossInput] = useState<string>('');
    const [tradeNotesInput, setTradeNotesInput] = useState<string>('');
    const [tradeStatusMessage, setTradeStatusMessage] = useState<string | null>(null);
    const [isSubmittingTrade, setIsSubmittingTrade] = useState<boolean>(false);

    // Chart DOM & API References
    const chartContainerRef = useRef<HTMLDivElement | null>(null);
    const chartApiRef = useRef<IChartApi | null>(null);
    const seriesApiRef = useRef<ISeriesApi<any> | null>(null);
    const lastBarRef = useRef<OHLCVBar | null>(null);

    // Clean symbol formatting (e.g., BTC, ETH, SPX)
    const cleanSymbol = asset ? asset.symbol.replace('/USD', '').replace('USDT', '').toUpperCase() : '';

    // Initialize/Reset State on Asset change or Open
    useEffect(() => {
        if (asset && isOpen) {
            setCurrentPrice(asset.current_price);
            setPrevPrice(asset.current_price);
            setPriceChange24h(asset.price_change_percentage_24h);
            setEntryPriceInput(asset.current_price.toString());
            setIsTradePanelOpen(false);
            setTradeStatusMessage(null);
        }
    }, [asset, isOpen]);

    // Update entry price input whenever currentPrice changes IF trade panel is not focused
    useEffect(() => {
        if (!isTradePanelOpen && currentPrice > 0) {
            setEntryPriceInput(currentPrice.toString());
        }
    }, [currentPrice, isTradePanelOpen]);

    /**
     * Generate synthetic historical bars if Binance API is unreachable or asset is Macro/Index
     */
    const generateSyntheticHistoricalBars = useCallback((basePrice: number, tf: ChartTimeframe): OHLCVBar[] => {
        const bars: OHLCVBar[] = [];
        const count = 100;
        const nowSec = Math.floor(Date.now() / 1000);

        let stepSec = 900; // 15m default
        if (tf === '1m') stepSec = 60;
        else if (tf === '5m') stepSec = 300;
        else if (tf === '15m') stepSec = 900;
        else if (tf === '1h') stepSec = 3600;
        else if (tf === '4h') stepSec = 14400;
        else if (tf === '1D') stepSec = 86400;

        let runningPrice = basePrice * 0.94; // start slightly lower for trend
        const startTime = nowSec - count * stepSec;

        for (let i = 0; i < count; i++) {
            const time = (startTime + i * stepSec) as UTCTimestamp;
            const volatility = runningPrice * 0.0035;
            const open = runningPrice;
            const change = (Math.random() - 0.485) * volatility * 2;
            const close = open + change;
            const high = Math.max(open, close) + Math.random() * volatility;
            const low = Math.min(open, close) - Math.random() * volatility;
            const volume = Math.floor(Math.random() * 50000) + 10000;

            bars.push({
                time,
                open: Number(open.toFixed(basePrice > 100 ? 2 : 4)),
                high: Number(high.toFixed(basePrice > 100 ? 2 : 4)),
                low: Number(low.toFixed(basePrice > 100 ? 2 : 4)),
                close: Number(close.toFixed(basePrice > 100 ? 2 : 4)),
                volume
            });

            runningPrice = close;
        }

        // Ensure the last bar closes at basePrice
        if (bars.length > 0) {
            const last = bars[bars.length - 1];
            last.close = basePrice;
            last.high = Math.max(last.high, basePrice);
            last.low = Math.min(last.low, basePrice);
        }

        return bars;
    }, []);

    /**
     * Fetch historical Klines / Candlesticks
     */
    const fetchHistoricalKlines = useCallback(async (sym: string, tf: ChartTimeframe, basePrice: number): Promise<OHLCVBar[]> => {
        const intervalMap: Record<ChartTimeframe, string> = {
            '1m': '1m',
            '5m': '5m',
            '15m': '15m',
            '1h': '1h',
            '4h': '4h',
            '1D': '1d'
        };

        const interval = intervalMap[tf] || '15m';

        // Check if crypto on Binance
        if (asset && asset.type === 'crypto') {
            try {
                const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}USDT&interval=${interval}&limit=120`);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        return data.map((item: any) => ({
                            time: Math.floor(item[0] / 1000) as UTCTimestamp,
                            open: parseFloat(item[1]),
                            high: parseFloat(item[2]),
                            low: parseFloat(item[3]),
                            close: parseFloat(item[4]),
                            volume: parseFloat(item[5])
                        }));
                    }
                }
            } catch (err) {
                console.warn('[TradingViewChart] Binance historical klines fetch error, using synthetic fallback:', err);
            }
        }

        // Fallback for Macro or offline
        return generateSyntheticHistoricalBars(basePrice, tf);
    }, [asset, generateSyntheticHistoricalBars]);

    /**
     * Initialize Lightweight Chart & Series
     */
    useEffect(() => {
        if (!isOpen || !chartContainerRef.current || !asset) return;

        setIsLoadingData(true);

        // Clean previous instance
        if (chartApiRef.current) {
            chartApiRef.current.remove();
            chartApiRef.current = null;
            seriesApiRef.current = null;
        }

        const container = chartContainerRef.current;
        const width = container.clientWidth || 360;
        const height = container.clientHeight || 320;

        // Create Chart Instance
        const chart = createChart(container, {
            width,
            height,
            layout: {
                background: { type: ColorType.Solid, color: '#08090C' },
                textColor: '#9CA3AF',
                fontSize: 11,
                fontFamily: 'JetBrains Mono, monospace'
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.04)' }
            },
            crosshair: {
                mode: CrosshairMode.Normal,
                vertLine: {
                    color: 'rgba(16, 185, 129, 0.5)',
                    width: 1,
                    style: 2,
                    labelBackgroundColor: '#10B981'
                },
                horzLine: {
                    color: 'rgba(16, 185, 129, 0.5)',
                    width: 1,
                    style: 2,
                    labelBackgroundColor: '#10B981'
                }
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.08)',
                autoScale: true,
                scaleMargins: {
                    top: 0.12,
                    bottom: 0.12
                }
            },
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.08)',
                timeVisible: true,
                secondsVisible: false,
                rightOffset: 6
            },
            handleScroll: {
                mouseWheel: true,
                pressedMouseMove: true,
                horzTouchDrag: true,
                vertTouchDrag: false
            },
            handleScale: {
                axisPressedMouseMove: true,
                mouseWheel: true,
                pinch: true
            }
        });

        chartApiRef.current = chart;

        // Instantiate Series based on selected chartType
        let series: ISeriesApi<any>;

        if (chartType === 'candlestick') {
            series = chart.addSeries(CandlestickSeries, {
                upColor: '#10B981',
                downColor: '#DC2626',
                borderUpColor: '#10B981',
                borderDownColor: '#DC2626',
                wickUpColor: '#10B981',
                wickDownColor: '#DC2626'
            });
        } else if (chartType === 'line') {
            series = chart.addSeries(LineSeries, {
                color: '#10B981',
                lineWidth: 2,
                crosshairMarkerVisible: true,
                crosshairMarkerRadius: 5
            });
        } else if (chartType === 'area') {
            series = chart.addSeries(AreaSeries, {
                topColor: 'rgba(16, 185, 129, 0.35)',
                bottomColor: 'rgba(16, 185, 129, 0.01)',
                lineColor: '#10B981',
                lineWidth: 2
            });
        } else {
            // bar
            series = chart.addSeries(BarSeries, {
                upColor: '#10B981',
                downColor: '#DC2626'
            });
        }

        seriesApiRef.current = series;

        // Fetch & Set Data
        let isMounted = true;
        fetchHistoricalKlines(cleanSymbol, timeframe, asset.current_price).then((bars) => {
            if (!isMounted || !seriesApiRef.current) return;

            if (chartType === 'candlestick' || chartType === 'bar') {
                series.setData(bars);
            } else {
                // Line or Area expects { time, value }
                const lineData = bars.map(b => ({
                    time: b.time,
                    value: b.close
                }));
                series.setData(lineData);
            }

            if (bars.length > 0) {
                lastBarRef.current = bars[bars.length - 1];
                chart.timeScale().fitContent();
            }

            setIsLoadingData(false);
        });

        // Crosshair HUD listener
        chart.subscribeCrosshairMove((param) => {
            if (!param || !param.time || !seriesApiRef.current) {
                setHudData(null);
                return;
            }

            const data = param.seriesData.get(seriesApiRef.current) as any;
            if (!data) {
                setHudData(null);
                return;
            }

            let timeStr = '';
            if (typeof param.time === 'number') {
                const date = new Date(param.time * 1000);
                timeStr = `${date.toLocaleDateString('it-IT')} ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
            }

            if (data.open !== undefined) {
                setHudData({
                    timeStr,
                    open: data.open,
                    high: data.high,
                    low: data.low,
                    close: data.close,
                    volume: (data as any).volume
                });
            } else if (data.value !== undefined) {
                setHudData({
                    timeStr,
                    close: data.value
                });
            }
        });

        // Resize Observer
        const resizeObserver = new ResizeObserver((entries) => {
            if (!entries || entries.length === 0 || !chartApiRef.current) return;
            const { width: newW, height: newH } = entries[0].contentRect;
            chartApiRef.current.applyOptions({ width: newW, height: newH });
        });

        resizeObserver.observe(container);

        return () => {
            isMounted = false;
            resizeObserver.disconnect();
            if (chartApiRef.current) {
                chartApiRef.current.remove();
                chartApiRef.current = null;
                seriesApiRef.current = null;
            }
        };
    }, [isOpen, asset, cleanSymbol, chartType, timeframe, fetchHistoricalKlines]);

    /**
     * Real-time WebSocket Tick Subscription & Live Bar Updating
     */
    useEffect(() => {
        if (!isOpen || !asset) return;

        const unsubscribe = marketWebSocketService.subscribe((tick: MarketTick) => {
            if (tick.symbol !== cleanSymbol) return;

            setPrevPrice(prev => {
                if (tick.price > prev) {
                    setPriceFlash('UP');
                } else if (tick.price < prev) {
                    setPriceFlash('DOWN');
                }
                setTimeout(() => setPriceFlash(null), 300);
                return tick.price;
            });

            setCurrentPrice(tick.price);
            setPriceChange24h(tick.change24h);

            // Update live bar on lightweight chart
            if (seriesApiRef.current && lastBarRef.current) {
                const currentBar = lastBarRef.current;
                const updatedBar: OHLCVBar = {
                    ...currentBar,
                    high: Math.max(currentBar.high, tick.price),
                    low: Math.min(currentBar.low, tick.price),
                    close: tick.price
                };
                lastBarRef.current = updatedBar;

                try {
                    if (chartType === 'candlestick' || chartType === 'bar') {
                        seriesApiRef.current.update(updatedBar);
                    } else {
                        seriesApiRef.current.update({
                            time: updatedBar.time,
                            value: tick.price
                        });
                    }
                } catch {
                    // ignore tick render race
                }
            }

            // Check against active price alerts!
            evaluatePriceAlerts(cleanSymbol, tick.price);
        });

        return () => {
            unsubscribe();
        };
    }, [isOpen, asset, cleanSymbol, chartType]);

    /**
     * In-Chart Trade Execution Handler
     */
    const handleExecuteTrade = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!asset) return;

        const parsedEntry = parseFloat(entryPriceInput);
        if (isNaN(parsedEntry) || parsedEntry <= 0) {
            setTradeStatusMessage('Inserisci un prezzo di ingresso valido');
            return;
        }

        const parsedSize = parseFloat(positionSizeInput) || 1.0;
        const parsedTP = parseFloat(takeProfitInput) || undefined;
        const parsedSL = parseFloat(stopLossInput) || undefined;

        setIsSubmittingTrade(true);
        triggerHaptic('click');

        try {
            const formattedPair = asset.symbol.includes('/') 
                ? asset.symbol 
                : `${asset.symbol}/USD`;

            let calculatedRR = '1:2.0';
            if (parsedTP && parsedSL && parsedSL !== parsedEntry) {
                const reward = Math.abs(parsedTP - parsedEntry);
                const risk = Math.abs(parsedEntry - parsedSL);
                calculatedRR = `1:${(reward / risk).toFixed(1)}`;
            }

            await addTrade({
                user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
                asset_pair: formattedPair,
                direction: tradeDirection,
                entry_price: parsedEntry,
                position_size: parsedSize,
                notes: tradeNotesInput.trim() || `Eseguito da Terminale TradingView Live su ${asset.symbol} (${tradeDirection})`,
                strategy: 'TradingView Real-Time Terminal',
                emotional_state: 'Disciplined',
                psychology: 'CONFIDENCE',
                roi: 0,
                pnl: 0,
                risk_reward: calculatedRR
            });

            // Feedback
            triggerHaptic('success');
            playAlertChime();
            setTradeStatusMessage(`✓ Operazione ${tradeDirection} su ${asset.symbol} aggiunta a Trade History!`);

            setTimeout(() => {
                setIsTradePanelOpen(false);
                setTradeStatusMessage(null);
            }, 2200);
        } catch (err) {
            setTradeStatusMessage('Errore nel salvataggio dell\'operazione');
        } finally {
            setIsSubmittingTrade(false);
        }
    };

    if (!isOpen || !asset) return null;

    const isPositiveChange = priceChange24h >= 0;

    return (
        <div 
            className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-4xl bg-[#08090C] rounded-t-3xl sm:rounded-3xl border border-white/[0.12] flex flex-col overflow-hidden max-h-[96dvh] shadow-[0_0_50px_rgba(0,0,0,0.9)] animate-in slide-in-from-bottom duration-300 font-sans"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 1. TOP HEADER: ASSET IDENTITY, LIVE TICK, ALERTS & CLOSE */}
                <div className="w-full px-4 py-3 bg-[#0E121B] border-b border-white/[0.08] flex items-center justify-between gap-3">
                    {/* Left: Asset info */}
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#161B28] border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                            {asset.image ? (
                                <img src={asset.image} alt={asset.symbol} className="w-full h-full object-cover" />
                            ) : (
                                <span className="font-mono font-black text-xs text-[#10B981]">{cleanSymbol.slice(0, 3)}</span>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm sm:text-base font-black text-white font-mono tracking-tight">
                                    {asset.symbol}
                                </h2>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-white/[0.08] text-slate-300 uppercase">
                                    {asset.type}
                                </span>
                            </div>
                            <p className="text-[11px] text-[#9CA3AF] truncate max-w-[140px] sm:max-w-none">
                                {asset.name}
                            </p>
                        </div>
                    </div>

                    {/* Center: Live Tick Price with 300ms Flash */}
                    <div className="flex items-center gap-2 sm:gap-3 text-right">
                        <div className="flex flex-col items-end">
                            <span 
                                className={`text-sm sm:text-lg font-black font-mono tracking-tight transition-colors duration-300 px-1.5 py-0.5 rounded ${
                                    priceFlash === 'UP' 
                                        ? 'text-emerald-400 bg-emerald-500/15' 
                                        : priceFlash === 'DOWN' 
                                            ? 'text-rose-400 bg-rose-500/15' 
                                            : 'text-white'
                                }`}
                            >
                                {formatPrice(currentPrice)}
                            </span>
                            <div className={`flex items-center gap-0.5 text-[10px] font-mono font-bold ${
                                isPositiveChange ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                                {isPositiveChange ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                <span>{formatChangePercent(priceChange24h)}</span>
                            </div>
                        </div>

                        {/* Price Alert Bell Button */}
                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('click');
                                setIsAlertModalOpen(true);
                            }}
                            className="p-2 rounded-xl bg-white/[0.05] hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 border border-white/10 hover:border-amber-500/30 transition cursor-pointer"
                            title="Imposta Allarme di Prezzo"
                        >
                            <Bell className="w-4 h-4" />
                        </button>

                        {/* Close Modal Button */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition cursor-pointer"
                            title="Chiudi Grafico"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* 2. CHART CONTROLS TOOLBAR: TIMEFRAME & CHART TYPE SWITCHERS */}
                <div className="px-4 py-2 bg-[#0A0D14] border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    {/* Timeframes */}
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                        {(['1m', '5m', '15m', '1h', '4h', '1D'] as ChartTimeframe[]).map((tf) => (
                            <button
                                key={tf}
                                type="button"
                                onClick={() => {
                                    triggerHaptic('click');
                                    setTimeframe(tf);
                                }}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                                    timeframe === tf
                                        ? 'bg-[#10B981] text-slate-950 font-black shadow-md shadow-[#10B981]/20'
                                        : 'bg-white/[0.04] text-[#9CA3AF] hover:text-white hover:bg-white/[0.08]'
                                }`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>

                    {/* Chart Types */}
                    <div className="flex items-center gap-1 bg-[#121620] p-0.5 rounded-lg border border-white/[0.06]">
                        {[
                            { id: 'candlestick' as ChartType, label: 'Candele' },
                            { id: 'line' as ChartType, label: 'Linea' },
                            { id: 'area' as ChartType, label: 'Area' },
                            { id: 'bar' as ChartType, label: 'Barre' }
                        ].map((ct) => (
                            <button
                                key={ct.id}
                                type="button"
                                onClick={() => {
                                    triggerHaptic('click');
                                    setChartType(ct.id);
                                }}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                    chartType === ct.id
                                        ? 'bg-white/15 text-white font-extrabold'
                                        : 'text-[#9CA3AF] hover:text-white'
                                }`}
                            >
                                {ct.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. INTERACTIVE HUD (CROSSHAIR VALUES) */}
                <div className="px-4 py-1.5 bg-[#08090C] border-b border-white/[0.04] flex items-center justify-between text-[10px] font-mono text-[#9CA3AF] overflow-x-auto scrollbar-none">
                    <div className="flex items-center gap-3 shrink-0">
                        {hudData ? (
                            <>
                                <span className="text-slate-300 font-semibold">{hudData.timeStr}</span>
                                {hudData.open !== undefined && (
                                    <span>O: <strong className="text-white">${hudData.open}</strong></span>
                                )}
                                {hudData.high !== undefined && (
                                    <span>H: <strong className="text-emerald-400">${hudData.high}</strong></span>
                                )}
                                {hudData.low !== undefined && (
                                    <span>L: <strong className="text-rose-400">${hudData.low}</strong></span>
                                )}
                                <span>C: <strong className="text-white">${hudData.close}</strong></span>
                            </>
                        ) : (
                            <>
                                <span className="text-[#10B981] flex items-center gap-1">
                                    <Activity className="w-3 h-3 animate-pulse" />
                                    TICK STREAM ATTIVO
                                </span>
                                <span>Ultimo: <strong className="text-white">${currentPrice}</strong></span>
                                <span>Massimo 24h: <strong className="text-white">${asset.high_24h}</strong></span>
                                <span>Minimo 24h: <strong className="text-white">${asset.low_24h}</strong></span>
                            </>
                        )}
                    </div>

                    <div className="text-[9px] text-[#9CA3AF] hidden sm:block shrink-0">
                        TradingView Engine • Touch & Zoom
                    </div>
                </div>

                {/* 4. FINANCIAL CANVAS CONTAINER */}
                <div className="relative w-full h-[280px] sm:h-[350px] bg-[#08090C]">
                    <div ref={chartContainerRef} className="w-full h-full" />

                    {isLoadingData && (
                        <div className="absolute inset-0 bg-[#08090C]/80 backdrop-blur-xs flex items-center justify-center font-mono text-xs text-[#9CA3AF] gap-2">
                            <RefreshCw className="w-4 h-4 text-[#10B981] animate-spin" />
                            <span>Caricamento candele in corso...</span>
                        </div>
                    )}
                </div>

                {/* 5. IN-CHART OPERATIONAL MODULE: BUY / SELL BUTTONS & RAPID TRADE FORM */}
                <div className="p-3.5 bg-[#0E121B] border-t border-white/[0.08] space-y-3">
                    
                    {/* Execution Buttons: 🟢 COMPRA / LONG | 🔴 VENDI / SHORT */}
                    <div className="grid grid-cols-2 gap-2.5">
                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('click');
                                setTradeDirection('LONG');
                                setEntryPriceInput(currentPrice.toString());
                                setIsTradePanelOpen(true);
                            }}
                            className={`min-h-[46px] rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-95 ${
                                isTradePanelOpen && tradeDirection === 'LONG'
                                    ? 'bg-[#10B981] text-slate-950 ring-2 ring-[#10B981] shadow-[#10B981]/30'
                                    : 'bg-[#10B981]/20 hover:bg-[#10B981]/30 text-emerald-400 border border-[#10B981]/40'
                            }`}
                        >
                            <TrendingUp className="w-4 h-4 stroke-[2.5]" />
                            <span>🟢 COMPRA / LONG</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('click');
                                setTradeDirection('SHORT');
                                setEntryPriceInput(currentPrice.toString());
                                setIsTradePanelOpen(true);
                            }}
                            className={`min-h-[46px] rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-95 ${
                                isTradePanelOpen && tradeDirection === 'SHORT'
                                    ? 'bg-[#DC2626] text-white ring-2 ring-[#DC2626] shadow-[#DC2626]/30'
                                    : 'bg-[#DC2626]/20 hover:bg-[#DC2626]/30 text-rose-400 border border-[#DC2626]/40'
                            }`}
                        >
                            <TrendingDown className="w-4 h-4 stroke-[2.5]" />
                            <span>🔴 VENDI / SHORT</span>
                        </button>
                    </div>

                    {/* Collapsible Instant Trade Registration Form */}
                    {isTradePanelOpen && (
                        <form 
                            onSubmit={handleExecuteTrade}
                            className="p-3.5 rounded-2xl bg-[#121622] border border-white/[0.08] space-y-3 animate-in fade-in slide-in-from-top-2 duration-200"
                        >
                            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase ${
                                        tradeDirection === 'LONG' ? 'bg-[#10B981] text-slate-950' : 'bg-[#DC2626] text-white'
                                    }`}>
                                        {tradeDirection}
                                    </span>
                                    <span className="text-xs font-mono font-bold text-white">
                                        Ordine Rapido: {asset.symbol}/USD
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsTradePanelOpen(false)}
                                    className="text-slate-400 hover:text-white p-1"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Inputs Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                                {/* Entry Price (Locked / Pre-filled) */}
                                <div className="space-y-1">
                                    <label className="text-[10px] text-[#9CA3AF] block uppercase font-bold">
                                        Prezzo Entrata ($)
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={entryPriceInput}
                                        onChange={(e) => setEntryPriceInput(e.target.value)}
                                        className="w-full bg-[#08090C] border border-white/[0.1] rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:border-[#10B981] outline-none"
                                        required
                                    />
                                </div>

                                {/* Position Size */}
                                <div className="space-y-1">
                                    <label className="text-[10px] text-[#9CA3AF] block uppercase font-bold">
                                        Size / Quantità
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={positionSizeInput}
                                        onChange={(e) => setPositionSizeInput(e.target.value)}
                                        placeholder="1.0"
                                        className="w-full bg-[#08090C] border border-white/[0.1] rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:border-[#10B981] outline-none"
                                    />
                                </div>

                                {/* Take Profit (Optional) */}
                                <div className="space-y-1">
                                    <label className="text-[10px] text-emerald-400 block uppercase font-bold">
                                        Take Profit ($)
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={takeProfitInput}
                                        onChange={(e) => setTakeProfitInput(e.target.value)}
                                        placeholder={tradeDirection === 'LONG' ? (currentPrice * 1.03).toFixed(2) : (currentPrice * 0.97).toFixed(2)}
                                        className="w-full bg-[#08090C] border border-white/[0.1] rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:border-emerald-400 outline-none"
                                    />
                                </div>

                                {/* Stop Loss (Optional) */}
                                <div className="space-y-1">
                                    <label className="text-[10px] text-rose-400 block uppercase font-bold">
                                        Stop Loss ($)
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={stopLossInput}
                                        onChange={(e) => setStopLossInput(e.target.value)}
                                        placeholder={tradeDirection === 'LONG' ? (currentPrice * 0.985).toFixed(2) : (currentPrice * 1.015).toFixed(2)}
                                        className="w-full bg-[#08090C] border border-white/[0.1] rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:border-rose-400 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Optional Notes */}
                            <div className="space-y-1">
                                <label className="text-[10px] text-[#9CA3AF] block uppercase font-bold">
                                    Note Operative / Setup
                                </label>
                                <input
                                    type="text"
                                    value={tradeNotesInput}
                                    onChange={(e) => setTradeNotesInput(e.target.value)}
                                    placeholder="Es. Ingresso su retest supporto 1H con volume elevato"
                                    className="w-full bg-[#08090C] border border-white/[0.1] rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:border-cyan-400 outline-none"
                                />
                            </div>

                            {/* Status Message */}
                            {tradeStatusMessage && (
                                <div className={`p-2.5 rounded-xl font-mono text-xs font-bold text-center animate-in fade-in ${
                                    tradeStatusMessage.startsWith('✓') 
                                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                                        : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                }`}>
                                    {tradeStatusMessage}
                                </div>
                            )}

                            {/* Submit Button: AGGIUNGI A TRADE HISTORY */}
                            <button
                                type="submit"
                                disabled={isSubmittingTrade}
                                className={`w-full min-h-[46px] rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-lg border ${
                                    tradeDirection === 'LONG'
                                        ? 'bg-[#10B981] hover:bg-[#059669] text-slate-950 border-[#10B981] shadow-[#10B981]/25'
                                        : 'bg-[#DC2626] hover:bg-[#B91C1C] text-white border-[#DC2626] shadow-[#DC2626]/25'
                                }`}
                            >
                                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                                <span>{isSubmittingTrade ? 'REGISTRAZIONE IN CORSO...' : 'AGGIUNGI A TRADE HISTORY'}</span>
                            </button>
                        </form>
                    )}

                </div>
            </div>

            {/* Price Alert Configuration Modal */}
            <PriceAlertModal
                symbol={asset.symbol}
                currentPrice={currentPrice}
                isOpen={isAlertModalOpen}
                onClose={() => setIsAlertModalOpen(false)}
            />
        </div>
    );
};

export default TradingViewChartModal;
