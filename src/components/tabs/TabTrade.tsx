// ============================================================================
// TRADYX MOBILE TAB 2: TRADE (LOG ENTRY - INSTITUTIONAL JOURNALING)
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useTradeStore } from '../../store/useTradeStore';
import { TradeDirection, TradePsychology, EmotionalState } from '../../types/trade';
import { 
    TrendingUp, 
    TrendingDown, 
    CheckCircle2, 
    AlertCircle, 
    ShieldCheck, 
    Smile, 
    Meh, 
    Frown, 
    Zap, 
    Flame, 
    AlertTriangle, 
    Ban, 
    Clock, 
    ArrowRight
} from 'lucide-react';

export const TabTrade: React.FC = () => {
    const { addTrade } = useTradeStore();

    // Asset and Strategy
    const [assetPair, setAssetPair] = useState<string>('BTC/USD');
    const [strategy, setStrategy] = useState<string>('Trend Following / Breakout');
    const [direction, setDirection] = useState<TradeDirection>('LONG');

    // Numerical trade fields
    const [entryPrice, setEntryPrice] = useState<string>('64250.00');
    const [exitPrice, setExitPrice] = useState<string>('67985.00');
    const [positionSize, setPositionSize] = useState<string>('1.0');
    const [riskReward, setRiskReward] = useState<string>('1:3.2');
    const [fees, setFees] = useState<string>('15.00');

    // Psychology (Emotional State)
    const [psychology, setPsychology] = useState<TradePsychology>('CONFIDENCE');

    // Discipline Protocol (Error Tracker)
    const [selectedErrors, setSelectedErrors] = useState<string[]>([]);

    // Technical Journal Session Notes
    const [notes, setNotes] = useState<string>('Breakout confermato sopra la resistenza giornaliera con alto volume istituzionale.');

    // Status / Toast feedback
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    const assetOptions = [
        'BTC/USD',
        'ETH/USD',
        'SOL/USD',
        'AAPL',
        'NVDA',
        'TSLA',
        'EUR/USD',
        'GOLD/USD'
    ];

    const strategyOptions = [
        'Trend Following / Breakout',
        'Mean Reversion',
        'Liquidity Sweep',
        'Range Play',
        'Earnings Fade',
        'Momentum Scalp'
    ];

    const errorTags = [
        'FOMO',
        'OVERTRADING',
        'NO STOP LOSS',
        'REVENGE TRADING',
        'EARLY EXIT'
    ];

    const toggleError = (err: string) => {
        setSelectedErrors(prev => 
            prev.includes(err) ? prev.filter(e => e !== err) : [...prev, err]
        );
    };

    // Calculate simulated PnL based on entry, exit, position size, and direction
    const calculatedPnl = useMemo(() => {
        const en = parseFloat(entryPrice) || 0;
        const ex = parseFloat(exitPrice) || 0;
        const sz = parseFloat(positionSize) || 0;
        const fee = parseFloat(fees) || 0;

        if (en <= 0 || ex <= 0 || sz <= 0) return 0;
        const gross = direction === 'LONG' ? (ex - en) * sz : (en - ex) * sz;
        return Number((gross - fee).toFixed(2));
    }, [entryPrice, exitPrice, positionSize, fees, direction]);

    const calculatedRoi = useMemo(() => {
        const en = parseFloat(entryPrice) || 0;
        const ex = parseFloat(exitPrice) || 0;
        if (en <= 0 || ex <= 0) return '0.0';
        const diff = direction === 'LONG' ? (ex - en) / en : (en - ex) / en;
        return (diff * 100).toFixed(1);
    }, [entryPrice, exitPrice, direction]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const mappedEmotion: EmotionalState = 
            psychology === 'CONFIDENCE' ? 'Disciplined' : 
            psychology === 'FEAR' ? 'Anxious' : 'Calm';

        try {
            await addTrade({
                user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
                asset_pair: assetPair,
                direction,
                strategy,
                entry_price: parseFloat(entryPrice) || 0,
                exit_price: parseFloat(exitPrice) || null,
                position_size: parseFloat(positionSize) || 1.0,
                risk_reward: riskReward,
                fees: parseFloat(fees) || 0,
                pnl: calculatedPnl,
                roi: parseFloat(calculatedRoi) || 0,
                emotional_state: mappedEmotion,
                psychology,
                errors: selectedErrors,
                notes,
                reasoning: notes
            });

            setFeedbackMessage('SESSION LOG COMMITTED SUCCESSFULLY');
            setTimeout(() => {
                setFeedbackMessage(null);
            }, 3000);
        } catch (err) {
            console.error('Error logging trade:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full flex flex-col space-y-4 px-3 sm:px-4 pt-2 pb-28 text-white select-none overflow-x-hidden">
            
            {/* Top Compact Section Header */}
            <header className="w-full flex items-center justify-between py-2 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#12141A] border border-[#00E599]/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,229,153,0.15)] shrink-0">
                        <span className="font-sans font-black text-base text-[#00E599]">T</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase font-semibold">
                            INSTITUTIONAL JOURNALING
                        </span>
                        <h1 className="text-sm font-extrabold text-white tracking-tight">
                            LOG ENTRY
                        </h1>
                    </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-[#12141A] border border-white/5 text-[10px] font-mono text-cyan-400 font-bold">
                    PROTOCOL 4.2
                </span>
            </header>

            {/* Notification Toast */}
            {feedbackMessage && (
                <div className="w-full p-3 rounded-xl bg-[#00E599]/15 border border-[#00E599]/40 flex items-center gap-2 text-xs font-mono font-bold text-[#00E599] animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00E599] shrink-0" />
                    <span>{feedbackMessage}</span>
                </div>
            )}

            {/* Main Institutional Journaling Card */}
            <form onSubmit={handleSubmit} className="w-full rounded-2xl border border-white/5 bg-[#12141A] p-4 sm:p-5 shadow-2xl space-y-4">
                
                {/* 1. SELETTORI ASSET / SYMBOL & STRATEGY */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                            ASSET / SYMBOL
                        </label>
                        <select
                            value={assetPair}
                            onChange={(e) => setAssetPair(e.target.value)}
                            className="w-full h-12 px-3 rounded-xl bg-[#08090C] border border-white/10 text-white text-xs font-bold font-mono focus:border-[#00E599] focus:outline-none transition-colors"
                        >
                            {assetOptions.map(opt => (
                                <option key={opt} value={opt} className="bg-[#08090C] text-white">
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                            STRATEGY
                        </label>
                        <select
                            value={strategy}
                            onChange={(e) => setStrategy(e.target.value)}
                            className="w-full h-12 px-3 rounded-xl bg-[#08090C] border border-white/10 text-white text-xs font-bold font-mono focus:border-[#00E599] focus:outline-none transition-colors"
                        >
                            {strategyOptions.map(opt => (
                                <option key={opt} value={opt} className="bg-[#08090C] text-white">
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 2. TASTI GRANDI A TOCCO: LONG SIDE / SHORT SIDE */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider block">
                        ORDER DIRECTION
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                        <button
                            type="button"
                            onClick={() => setDirection('LONG')}
                            className={`min-h-[48px] h-12 rounded-xl font-sans font-black text-xs tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95 border ${
                                direction === 'LONG'
                                    ? 'bg-[#00E599] text-[#08090C] border-[#00E599] shadow-[0_0_20px_rgba(0,229,153,0.3)]'
                                    : 'bg-[#08090C] text-slate-400 border-white/10 hover:text-white'
                            }`}
                        >
                            <TrendingUp className="w-4 h-4" />
                            <span>LONG SIDE</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setDirection('SHORT')}
                            className={`min-h-[48px] h-12 rounded-xl font-sans font-black text-xs tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95 border ${
                                direction === 'SHORT'
                                    ? 'bg-[#EF4444] text-white border-[#EF4444] shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                                    : 'bg-[#08090C] text-slate-400 border-white/10 hover:text-white'
                            }`}
                        >
                            <TrendingDown className="w-4 h-4" />
                            <span>SHORT SIDE</span>
                        </button>
                    </div>
                </div>

                {/* 3. CAMPI INPUT VERTICALI BEN SPAZIATI */}
                <div className="grid grid-cols-2 gap-2.5 font-mono">
                    <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-semibold block">
                            Entry Price (€)
                        </label>
                        <input
                            type="number"
                            step="any"
                            value={entryPrice}
                            onChange={(e) => setEntryPrice(e.target.value)}
                            className="w-full h-12 px-3 rounded-xl bg-[#08090C] border border-white/10 text-white text-xs font-bold focus:border-[#00E599] focus:outline-none transition-colors"
                            placeholder="64250.00"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-semibold block">
                            Exit Price (€)
                        </label>
                        <input
                            type="number"
                            step="any"
                            value={exitPrice}
                            onChange={(e) => setExitPrice(e.target.value)}
                            className="w-full h-12 px-3 rounded-xl bg-[#08090C] border border-white/10 text-white text-xs font-bold focus:border-[#00E599] focus:outline-none transition-colors"
                            placeholder="67985.00"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-semibold block">
                            Position Size
                        </label>
                        <input
                            type="number"
                            step="any"
                            value={positionSize}
                            onChange={(e) => setPositionSize(e.target.value)}
                            className="w-full h-12 px-3 rounded-xl bg-[#08090C] border border-white/10 text-white text-xs font-bold focus:border-[#00E599] focus:outline-none transition-colors"
                            placeholder="1.0"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-semibold block">
                            Risk Reward
                        </label>
                        <input
                            type="text"
                            value={riskReward}
                            onChange={(e) => setRiskReward(e.target.value)}
                            className="w-full h-12 px-3 rounded-xl bg-[#08090C] border border-white/10 text-white text-xs font-bold focus:border-[#00E599] focus:outline-none transition-colors"
                            placeholder="1:3.2"
                        />
                    </div>
                </div>

                <div className="space-y-1 font-mono">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Fees / Comm (€)
                    </label>
                    <input
                        type="number"
                        step="any"
                        value={fees}
                        onChange={(e) => setFees(e.target.value)}
                        className="w-full h-12 px-3 rounded-xl bg-[#08090C] border border-white/10 text-white text-xs font-bold focus:border-[#00E599] focus:outline-none transition-colors"
                        placeholder="15.00"
                    />
                </div>

                {/* Pre-calculated PnL summary badge */}
                <div className="p-3 rounded-xl bg-[#08090C] border border-white/5 flex items-center justify-between font-mono">
                    <span className="text-[10px] text-slate-400 uppercase">Estimated Net P&L:</span>
                    <span className={`text-xs font-black ${calculatedPnl >= 0 ? 'text-[#00E599]' : 'text-[#EF4444]'}`}>
                        {calculatedPnl >= 0 ? `+${calculatedPnl.toLocaleString('it-IT', { minimumFractionDigits: 2 })} €` : `${calculatedPnl.toLocaleString('it-IT', { minimumFractionDigits: 2 })} €`} ({calculatedRoi}%)
                    </span>
                </div>

                {/* 4. SEZIONE "PSYCHOLOGY (EMOTIONAL STATE)" */}
                <div className="space-y-2 pt-1 font-mono">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            PSYCHOLOGY (EMOTIONAL STATE)
                        </label>
                        <span className="text-[9px] text-cyan-400">BEHAVIORAL AUDIT</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => setPsychology('CONFIDENCE')}
                            className={`min-h-[44px] py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                                psychology === 'CONFIDENCE'
                                    ? 'bg-[#00E599]/15 text-[#00E599] border-[#00E599]'
                                    : 'bg-[#08090C] text-slate-400 border-white/5 hover:text-white'
                            }`}
                        >
                            <Smile className="w-4 h-4 shrink-0" />
                            <span className="text-[10px] tracking-tight">CONFIDENCE</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setPsychology('NEUTRAL')}
                            className={`min-h-[44px] py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                                psychology === 'NEUTRAL'
                                    ? 'bg-[#1D68BD]/20 text-cyan-300 border-[#1D68BD]'
                                    : 'bg-[#08090C] text-slate-400 border-white/5 hover:text-white'
                            }`}
                        >
                            <Meh className="w-4 h-4 shrink-0" />
                            <span className="text-[10px] tracking-tight">NEUTRAL</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setPsychology('FEAR')}
                            className={`min-h-[44px] py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                                psychology === 'FEAR'
                                    ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]'
                                    : 'bg-[#08090C] text-slate-400 border-white/5 hover:text-white'
                            }`}
                        >
                            <Frown className="w-4 h-4 shrink-0" />
                            <span className="text-[10px] tracking-tight">FEAR</span>
                        </button>
                    </div>
                </div>

                {/* 5. SEZIONE "DISCIPLINE PROTOCOL (ERROR TRACKER)" */}
                <div className="space-y-2 pt-1 font-mono">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        DISCIPLINE PROTOCOL (ERROR TRACKER)
                    </label>

                    <div className="flex flex-wrap gap-1.5">
                        {errorTags.map(err => {
                            const isSelected = selectedErrors.includes(err);
                            return (
                                <button
                                    key={err}
                                    type="button"
                                    onClick={() => toggleError(err)}
                                    className={`px-3 py-1.5 min-h-[36px] rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer border flex items-center gap-1 ${
                                        isSelected
                                            ? 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444] shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                                            : 'bg-[#08090C] text-slate-400 border-white/5 hover:border-white/20'
                                    }`}
                                >
                                    <AlertTriangle className={`w-3 h-3 ${isSelected ? 'text-[#EF4444]' : 'text-slate-500'}`} />
                                    <span>{err}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 6. CAMPO NOTE "SESSION NOTES (TECHNICAL JOURNAL)" */}
                <div className="space-y-1.5 pt-1 font-mono">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        SESSION NOTES (TECHNICAL JOURNAL)
                    </label>
                    <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Log psychological state, trigger reason, execution quality, and post-trade technical observations..."
                        className="w-full p-3 rounded-xl bg-[#08090C] border border-white/10 text-white text-xs font-mono focus:border-[#00E599] focus:outline-none transition-colors resize-none"
                    />
                </div>

                {/* 7. PULSANTE VERDE GRANDE "COMMIT SESSION LOG" */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-[50px] h-13 mt-2 rounded-xl bg-[#00E599] hover:bg-[#00d28b] text-[#08090C] font-sans font-black text-xs sm:text-sm tracking-wider uppercase transition-all duration-200 active:scale-[0.98] shadow-lg shadow-[#00E599]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                    <CheckCircle2 className="w-5 h-5 text-[#08090C]" />
                    <span>{isSubmitting ? 'COMMITTING ENTRY...' : 'COMMIT SESSION LOG'}</span>
                </button>

            </form>
        </div>
    );
};

export default TabTrade;
