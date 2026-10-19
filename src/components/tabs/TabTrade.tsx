// ============================================================================
// TRADYX MOBILE TAB 2: TRADE & CHARTS (src/components/tabs/TabTrade.tsx)
// Full width mobile chart with horizontal timeframe scroll + vertical order form
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useTradeStore } from '../../store/useTradeStore';
import { EmotionalState, TradeDirection } from '../../types/trade';
import { 
    TrendingUp, 
    TrendingDown, 
    SlidersHorizontal, 
    Flame, 
    ShieldCheck, 
    Zap, 
    CheckCircle2, 
    BarChart2, 
    ArrowRight,
    ChevronDown,
    Activity
} from 'lucide-react';

export const TabTrade: React.FC = () => {
    const { addTrade } = useTradeStore();

    // Asset selection
    const [selectedAsset, setSelectedAsset] = useState<string>('BTC/USDT');
    const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1H' | '4H' | '1D' | '1W'>('1H');

    // Order form state
    const [direction, setDirection] = useState<TradeDirection>('LONG');
    const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
    const [entryPrice, setEntryPrice] = useState<number>(67420);
    const [positionSize, setPositionSize] = useState<number>(0.5);
    const [stopLoss, setStopLoss] = useState<number>(65800);
    const [takeProfit, setTakeProfit] = useState<number>(71500);
    const [emotionalState, setEmotionalState] = useState<EmotionalState>('Disciplined');
    const [notes, setNotes] = useState<string>('Setup con breakout confermato su timeframe 1H');

    // Success Toast Notification
    const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string>('');

    // Pre-calculated Risk / Reward ratio
    const riskReward = useMemo(() => {
        if (!entryPrice || !stopLoss || !takeProfit) return '1:2.0';
        const risk = Math.abs(entryPrice - stopLoss);
        const reward = Math.abs(takeProfit - entryPrice);
        if (risk <= 0) return '1:1.0';
        return `1:${(reward / risk).toFixed(1)}`;
    }, [entryPrice, stopLoss, takeProfit]);

    const potentialLoss = useMemo(() => {
        return Math.abs(entryPrice - stopLoss) * positionSize;
    }, [entryPrice, stopLoss, positionSize]);

    const potentialProfit = useMemo(() => {
        return Math.abs(takeProfit - entryPrice) * positionSize;
    }, [entryPrice, takeProfit, positionSize]);

    // Timeframe options
    const timeframes: ('1m' | '5m' | '15m' | '1H' | '4H' | '1D' | '1W')[] = [
        '1m', '5m', '15m', '1H', '4H', '1D', '1W'
    ];

    // Mock asset prices
    const assetPrices: Record<string, { price: number; change: string; isUp: boolean }> = {
        'BTC/USDT': { price: 67420, change: '+2.4%', isUp: true },
        'ETH/USDT': { price: 3510, change: '+1.8%', isUp: true },
        'SOL/USDT': { price: 184.5, change: '-0.6%', isUp: false },
        'EUR/USD': { price: 1.0855, change: '+0.12%', isUp: true },
        'NVDA': { price: 132.8, change: '+3.2%', isUp: true },
    };

    const handleAssetChange = (asset: string) => {
        setSelectedAsset(asset);
        const p = assetPrices[asset]?.price || 67420;
        setEntryPrice(p);
        if (direction === 'LONG') {
            setStopLoss(Number((p * 0.97).toFixed(2)));
            setTakeProfit(Number((p * 1.05).toFixed(2)));
        } else {
            setStopLoss(Number((p * 1.03).toFixed(2)));
            setTakeProfit(Number((p * 0.95).toFixed(2)));
        }
    };

    const handleQuickSize = (percentage: number) => {
        // Mock size based on percentage of $25,000 account
        const capitalAllocation = 25000 * (percentage / 100);
        const calculatedSize = Number((capitalAllocation / (entryPrice || 67420)).toFixed(2));
        setPositionSize(calculatedSize || 0.1);
    };

    const handleSubmitOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Calculated realistic simulated PnL based on TP target
        const simulatedPnl = direction === 'LONG' 
            ? Math.round(potentialProfit) 
            : Math.round(-potentialLoss);

        await addTrade({
            user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            asset_pair: selectedAsset,
            direction,
            entry_price: Number(entryPrice),
            exit_price: direction === 'LONG' ? Number(takeProfit) : Number(stopLoss),
            position_size: Number(positionSize),
            pnl: simulatedPnl,
            emotional_state: emotionalState,
            notes: notes || `${orderType} ${direction} su ${selectedAsset}`
        });

        setToastMessage(`Ordine ${direction} ${selectedAsset} registrato nel Journal!`);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
    };

    // Quick presets
    const handleQuickPreset = (presetType: 'FOMO' | 'PROFIT' | 'GREED') => {
        if (presetType === 'FOMO') {
            addTrade({
                user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
                asset_pair: 'BTC/USDT',
                direction: 'LONG',
                entry_price: 68500,
                exit_price: 66250,
                position_size: 1.0,
                pnl: -2250,
                emotional_state: 'FOMO',
                notes: 'Inseguito il pump in ritardo senza attendere il ritracciamento.'
            });
            setToastMessage('🔴 Trade simulato FOMO (-$2,250) aggiunto!');
        } else if (presetType === 'PROFIT') {
            addTrade({
                user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
                asset_pair: 'EUR/USD',
                direction: 'SHORT',
                entry_price: 1.0850,
                exit_price: 1.0800,
                position_size: 10.0,
                pnl: 5000,
                emotional_state: 'Disciplined',
                notes: 'Setup conforme al trading plan. Target pieno raggiunto.'
            });
            setToastMessage('🟢 Trade Disciplinato (+$5,000) aggiunto!');
        } else {
            addTrade({
                user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
                asset_pair: 'NVDA',
                direction: 'LONG',
                entry_price: 120,
                exit_price: 135,
                position_size: 200,
                pnl: 3000,
                emotional_state: 'Greedy',
                notes: 'Posizione mantenuta oltre il target per avidità.'
            });
            setToastMessage('🟡 Trade Greed (+$3,000) aggiunto!');
        }
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
    };

    return (
        <div className="w-full flex flex-col space-y-4 px-3.5 sm:px-4 pt-2 pb-28">
            
            {/* SUCCESS FLOATING TOAST */}
            {showSuccessToast && (
                <div className="fixed top-14 left-4 right-4 z-50 max-w-sm mx-auto p-3 bg-slate-900 border border-emerald-500 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-3 duration-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-white font-mono">{toastMessage}</span>
                </div>
            )}

            {/* 1. ASSET SELECTOR & LIVE QUOTE */}
            <header className="w-full flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                    <select
                        value={selectedAsset}
                        onChange={(e) => handleAssetChange(e.target.value)}
                        className="bg-[#05070B] border border-white/10 text-white font-mono font-black text-sm rounded-xl px-2.5 py-1.5 focus:border-cyan-400 outline-none cursor-pointer"
                    >
                        <option value="BTC/USDT">BTC/USDT</option>
                        <option value="ETH/USDT">ETH/USDT</option>
                        <option value="SOL/USDT">SOL/USDT</option>
                        <option value="EUR/USD">EUR/USD</option>
                        <option value="NVDA">NVDA (Stock)</option>
                    </select>

                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                        assetPrices[selectedAsset]?.isUp 
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' 
                            : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                    }`}>
                        {assetPrices[selectedAsset]?.change}
                    </span>
                </div>

                <div className="text-right font-mono">
                    <div className="text-sm font-extrabold text-white">
                        ${assetPrices[selectedAsset]?.price?.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400">Prezzo Live</div>
                </div>
            </header>

            {/* 2. TIMEFRAME SCROLLBAR (overflow-x-auto no-scrollbar) */}
            <div className="w-full overflow-x-auto no-scrollbar flex items-center gap-1.5 py-1 select-none">
                {timeframes.map((tf) => (
                    <button
                        key={tf}
                        type="button"
                        onClick={() => setTimeframe(tf)}
                        className={`min-w-[44px] h-8 px-2.5 rounded-lg text-xs font-mono font-bold transition shrink-0 cursor-pointer ${
                            timeframe === tf
                                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                                : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/5'
                        }`}
                    >
                        {tf}
                    </button>
                ))}
            </div>

            {/* 3. GRAFICO A TUTTA LARGHEZZA (w-full con SVG dinamico ad alta definizione) */}
            <div className="w-full rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-3 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 font-mono">
                        <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{selectedAsset} • {timeframe}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                        <span>RSI: <strong className="text-cyan-400">62.4</strong></span>
                        <span>VOL: <strong className="text-purple-400">14.2M</strong></span>
                    </div>
                </div>

                {/* SVG CANDLESTICK & GLOWING AREA CHART */}
                <div className="w-full h-44 sm:h-52 relative">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 340 160" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.0" />
                            </linearGradient>
                        </defs>

                        {/* Grid lines */}
                        <line x1="0" y1="40" x2="340" y2="40" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                        <line x1="0" y1="80" x2="340" y2="80" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                        <line x1="0" y1="120" x2="340" y2="120" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

                        {/* Area glow under trend line */}
                        <path
                            d="M 10 120 Q 50 140, 90 95 T 170 80 T 250 50 T 330 35 L 330 150 L 10 150 Z"
                            fill="url(#chartGradient)"
                        />

                        {/* Main Trend Line */}
                        <path
                            d="M 10 120 Q 50 140, 90 95 T 170 80 T 250 50 T 330 35"
                            fill="none"
                            stroke="#00F0FF"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        />

                        {/* Simulated Candlesticks (Green and Red) */}
                        <g>
                            {/* Candle 1 (Green) */}
                            <line x1="30" y1="105" x2="30" y2="135" stroke="#10B981" strokeWidth="1" />
                            <rect x="26" y="112" width="8" height="18" fill="#10B981" rx="1" />

                            {/* Candle 2 (Red) */}
                            <line x1="70" y1="90" x2="70" y2="125" stroke="#F43F5E" strokeWidth="1" />
                            <rect x="66" y="98" width="8" height="20" fill="#F43F5E" rx="1" />

                            {/* Candle 3 (Green) */}
                            <line x1="110" y1="75" x2="110" y2="110" stroke="#10B981" strokeWidth="1" />
                            <rect x="106" y="80" width="8" height="24" fill="#10B981" rx="1" />

                            {/* Candle 4 (Green) */}
                            <line x1="150" y1="65" x2="150" y2="95" stroke="#10B981" strokeWidth="1" />
                            <rect x="146" y="70" width="8" height="18" fill="#10B981" rx="1" />

                            {/* Candle 5 (Red) */}
                            <line x1="190" y1="60" x2="190" y2="90" stroke="#F43F5E" strokeWidth="1" />
                            <rect x="186" y="65" width="8" height="15" fill="#F43F5E" rx="1" />

                            {/* Candle 6 (Green) */}
                            <line x1="230" y1="45" x2="230" y2="75" stroke="#10B981" strokeWidth="1" />
                            <rect x="226" y="50" width="8" height="20" fill="#10B981" rx="1" />

                            {/* Candle 7 (Green Breakout) */}
                            <line x1="270" y1="35" x2="270" y2="65" stroke="#10B981" strokeWidth="1" />
                            <rect x="266" y="38" width="8" height="22" fill="#10B981" rx="1" />

                            {/* Candle 8 (Current Active Candle) */}
                            <line x1="310" y1="25" x2="310" y2="55" stroke="#10B981" strokeWidth="1" />
                            <rect x="306" y="30" width="8" height="18" fill="#10B981" rx="1" />
                        </g>

                        {/* Current Price Marker */}
                        <line x1="0" y1="35" x2="340" y2="35" stroke="#00F0FF" strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
                        <circle cx="330" cy="35" r="4" fill="#00F0FF" />
                    </svg>

                    {/* Current Price Floating Badge */}
                    <div className="absolute top-6 right-2 px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-400 text-[10px] font-mono font-bold text-cyan-300">
                        ${assetPrices[selectedAsset]?.price}
                    </div>
                </div>
            </div>

            {/* 4. MODULO DI IMMISSIONE ORDINI (Disposto in verticale con pulsanti ampi touch-friendly) */}
            <form onSubmit={handleSubmitOrder} className="w-full rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-4 shadow-xl space-y-4">
                
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-black text-white uppercase tracking-wider font-mono">
                        Immissione Ordine
                    </span>
                    <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                        <button
                            type="button"
                            onClick={() => setOrderType('MARKET')}
                            className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg transition ${
                                orderType === 'MARKET' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                            }`}
                        >
                            Market
                        </button>
                        <button
                            type="button"
                            onClick={() => setOrderType('LIMIT')}
                            className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg transition ${
                                orderType === 'LIMIT' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                            }`}
                        >
                            Limit
                        </button>
                    </div>
                </div>

                {/* BUY / SELL TOGGLE BUTTONS - Disposti in verticale o affiancati con altezza h-12 */}
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setDirection('LONG')}
                        className={`h-12 w-full rounded-xl text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                            direction === 'LONG'
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                                : 'bg-white/[0.04] text-slate-400 border border-white/5'
                        }`}
                    >
                        <TrendingUp className="w-5 h-5" />
                        <span>BUY / LONG</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setDirection('SHORT')}
                        className={`h-12 w-full rounded-xl text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                            direction === 'SHORT'
                                ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/20'
                                : 'bg-white/[0.04] text-slate-400 border border-white/5'
                        }`}
                    >
                        <TrendingDown className="w-5 h-5" />
                        <span>SELL / SHORT</span>
                    </button>
                </div>

                {/* SIZE (Posizione / Contratti) */}
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                        <label className="text-slate-400 font-medium">Quantità / Size</label>
                        <span className="text-slate-500 font-mono text-[11px]">Contratti</span>
                    </div>
                    <input
                        type="number"
                        step="0.01"
                        value={positionSize}
                        onChange={(e) => setPositionSize(Number(e.target.value))}
                        className="w-full h-11 px-3 bg-[#05070B] border border-white/10 rounded-xl text-white font-mono text-sm focus:border-cyan-400 outline-none"
                        required
                    />

                    {/* Quick % chips */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                        {[25, 50, 75, 100].map((pct) => (
                            <button
                                key={pct}
                                type="button"
                                onClick={() => handleQuickSize(pct)}
                                className="h-8 rounded-lg bg-white/[0.03] border border-white/5 text-[11px] font-mono font-bold text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition active:scale-95"
                            >
                                {pct}%
                            </button>
                        ))}
                    </div>
                </div>

                {/* ENTRY PRICE */}
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                        <label className="text-slate-400 font-medium">Prezzo di Entrata ($)</label>
                        <span className="text-slate-500 font-mono text-[11px]">USD</span>
                    </div>
                    <input
                        type="number"
                        value={entryPrice}
                        onChange={(e) => setEntryPrice(Number(e.target.value))}
                        className="w-full h-11 px-3 bg-[#05070B] border border-white/10 rounded-xl text-white font-mono text-sm focus:border-cyan-400 outline-none"
                        required
                    />
                </div>

                {/* STOP LOSS & TAKE PROFIT (Disposti in 2 colonne comode) */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-rose-400">Stop Loss ($)</label>
                        <input
                            type="number"
                            value={stopLoss}
                            onChange={(e) => setStopLoss(Number(e.target.value))}
                            className="w-full h-11 px-2.5 bg-[#05070B] border border-rose-500/30 rounded-xl text-white font-mono text-xs focus:border-rose-400 outline-none"
                        />
                        <div className="text-[10px] text-rose-400/80 font-mono">
                            -$ {potentialLoss.toFixed(0)}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-emerald-400">Take Profit ($)</label>
                        <input
                            type="number"
                            value={takeProfit}
                            onChange={(e) => setTakeProfit(Number(e.target.value))}
                            className="w-full h-11 px-2.5 bg-[#05070B] border border-emerald-500/30 rounded-xl text-white font-mono text-xs focus:border-emerald-400 outline-none"
                        />
                        <div className="text-[10px] text-emerald-400/80 font-mono">
                            +$ {potentialProfit.toFixed(0)}
                        </div>
                    </div>
                </div>

                {/* RISK REWARD BADGE */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 font-mono text-xs">
                    <span className="text-slate-400">Rischio/Rendimento:</span>
                    <span className="font-black text-cyan-400">{riskReward}</span>
                </div>

                {/* STATO EMOTIVO */}
                <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-400">Stato Emotivo All'Ingresso</label>
                    <select
                        value={emotionalState}
                        onChange={(e) => setEmotionalState(e.target.value as EmotionalState)}
                        className="w-full h-11 px-3 bg-[#05070B] border border-white/10 rounded-xl text-white text-xs focus:border-cyan-400 outline-none cursor-pointer"
                    >
                        <option value="Disciplined">Disciplinato (Rispetto del Trading Plan)</option>
                        <option value="Calm">Calmo & Neutro</option>
                        <option value="FOMO">FOMO (Inseguimento dei prezzi)</option>
                        <option value="Greedy">Greed (Avidità ed Euforia)</option>
                        <option value="Anxious">Ansioso</option>
                        <option value="Frustrated">Frustrato / Revenge Trade</option>
                    </select>
                </div>

                {/* NOTE DIARIO */}
                <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-400">Note Psicologiche / Setup</label>
                    <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Motivazione dell'entrata..."
                        className="w-full h-11 px-3 bg-[#05070B] border border-white/10 rounded-xl text-white text-xs focus:border-cyan-400 outline-none"
                    />
                </div>

                {/* PULSANTE DI ESECUZIONE ORDINE (Ampio e facile da premere con il pollice) */}
                <button
                    type="submit"
                    className={`w-full h-13 min-h-[50px] rounded-2xl font-black text-sm tracking-wide transition shadow-xl active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                        direction === 'LONG'
                            ? 'bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950 shadow-emerald-500/20'
                            : 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-rose-500/20'
                    }`}
                >
                    <span>ESEGUI ORDINE {direction} ({selectedAsset})</span>
                    <ArrowRight className="w-4 h-4" />
                </button>
            </form>

            {/* QUICK TEST PRESETS FOR FAST INTERACTION */}
            <div className="w-full space-y-2">
                <div className="text-[10px] font-semibold text-slate-400 uppercase font-mono tracking-wide">
                    Test Rapido con 1 Tocco:
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <button
                        type="button"
                        onClick={() => handleQuickPreset('FOMO')}
                        className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-[10px] font-bold text-center active:scale-95 transition"
                    >
                        Loss FOMO (-$2,250)
                    </button>
                    <button
                        type="button"
                        onClick={() => handleQuickPreset('PROFIT')}
                        className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold text-center active:scale-95 transition"
                    >
                        Calm Win (+$5,000)
                    </button>
                    <button
                        type="button"
                        onClick={() => handleQuickPreset('GREED')}
                        className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[10px] font-bold text-center active:scale-95 transition"
                    >
                        Greed (+$3,000)
                    </button>
                </div>
            </div>

        </div>
    );
};

export default TabTrade;
