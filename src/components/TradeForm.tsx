// ============================================================================
// TRADYX TRADE FORM COMPONENT (src/components/TradeForm.tsx)
// Flexible Optional Fields & Minimal Viable Trade Logging
// ============================================================================

import React, { useState } from 'react';
import { useTradeStore } from '../store/useTradeStore';
import { EmotionalState, TradeDirection } from '../types/trade';
import { triggerHaptic } from '../services/circuitBreakerService';
import { createSpeechRecognizer, isSpeechRecognitionSupported, parseVoiceWithGemini } from '../services/voiceTradeParser';
import { PlusCircle, Flame, ShieldCheck, Zap, Mic, MicOff, CheckCircle2 } from 'lucide-react';

export const TradeForm: React.FC = () => {
    const { addTrade } = useTradeStore();

    // Mandatory Minimal viable trade parameters
    const [assetPair, setAssetPair] = useState('BTC/USDT');
    const [direction, setDirection] = useState<TradeDirection>('LONG');
    const [entryPrice, setEntryPrice] = useState<string>('62000');
    const [pnl, setPnl] = useState<string>('-1500');

    // Optional fields
    const [exitPrice, setExitPrice] = useState<string>('60500');
    const [positionSize, setPositionSize] = useState<string>('1.0');
    const [emotionalState, setEmotionalState] = useState<EmotionalState>('FOMO');
    const [notes, setNotes] = useState('Chased the breakout late and panicked');

    // Voice & status
    const [isListening, setIsListening] = useState<boolean>(false);
    const [feedback, setFeedback] = useState<string | null>(null);

    // Validation: Only required: Asset, Direction, AND (Entry Price OR PnL)
    const hasAsset = !!assetPair.trim();
    const hasDirection = direction === 'LONG' || direction === 'SHORT';
    const hasEntry = entryPrice.trim() !== '' && !isNaN(parseFloat(entryPrice));
    const hasPnl = pnl.trim() !== '' && !isNaN(parseFloat(pnl));
    const isFormValid = hasAsset && hasDirection && (hasEntry || hasPnl);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;

        triggerHaptic('calm');
        await addTrade({
            user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            asset_pair: assetPair.trim(),
            direction,
            entry_price: hasEntry ? parseFloat(entryPrice) : undefined,
            exit_price: exitPrice ? parseFloat(exitPrice) : undefined,
            position_size: positionSize ? parseFloat(positionSize) : 1.0,
            pnl: hasPnl ? parseFloat(pnl) : 0,
            emotional_state: emotionalState,
            notes: notes || undefined
        });

        setFeedback('Session Log Committed');
        setTimeout(() => setFeedback(null), 3000);
    };

    const handleVoiceJournaling = () => {
        if (!isSpeechRecognitionSupported()) {
            setFeedback('Web Speech API non disponibile');
            setTimeout(() => setFeedback(null), 2500);
            return;
        }

        if (isListening) {
            setIsListening(false);
            return;
        }

        triggerHaptic('click');
        setIsListening(true);

        createSpeechRecognizer(
            async (transcript, isFinal) => {
                if (isFinal) {
                    setIsListening(false);
                    triggerHaptic('calm');
                    try {
                        const parsed = await parseVoiceWithGemini(transcript);
                        if (parsed.asset_pair) setAssetPair(parsed.asset_pair);
                        if (parsed.direction) setDirection(parsed.direction);
                        if (parsed.entry_price != null) setEntryPrice(parsed.entry_price.toString());
                        if (parsed.exit_price != null) setExitPrice(parsed.exit_price.toString());
                        if (parsed.pnl != null) setPnl(parsed.pnl.toString());
                        if (parsed.position_size != null) setPositionSize(parsed.position_size.toString());
                        if (parsed.notes) setNotes(parsed.notes);
                        setFeedback('Parametri estratti dalla voce!');
                        setTimeout(() => setFeedback(null), 3000);
                    } catch (e) {
                        console.warn(e);
                    }
                }
            },
            () => setIsListening(false),
            () => setIsListening(false)
        )?.start();
    };

    // Quick Test Preset Triggers
    const triggerLossFomoPreset = () => {
        triggerHaptic('tilt');
        setAssetPair('BTC/USDT');
        setDirection('LONG');
        setEntryPrice('65000');
        setExitPrice('63500');
        setPositionSize('1.5');
        setPnl('-2250');
        setEmotionalState('FOMO');
        setNotes('Panic sold during sudden dip due to high leverage');
        
        addTrade({
            user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            asset_pair: 'BTC/USDT',
            direction: 'LONG',
            entry_price: 65000,
            exit_price: 63500,
            position_size: 1.5,
            pnl: -2250,
            emotional_state: 'FOMO',
            notes: 'Panic sold during sudden dip due to high leverage'
        });
    };

    const triggerCalmProfitPreset = () => {
        triggerHaptic('calm');
        setAssetPair('EUR/USD');
        setDirection('SHORT');
        setEntryPrice('1.0850');
        setExitPrice('1.0800');
        setPositionSize('10.0');
        setPnl('5000');
        setEmotionalState('Disciplined');
        setNotes('Executed according to backtested strategy rules');

        addTrade({
            user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            asset_pair: 'EUR/USD',
            direction: 'SHORT',
            entry_price: 1.0850,
            exit_price: 1.0800,
            position_size: 10.0,
            pnl: 5000,
            emotional_state: 'Disciplined',
            notes: 'Executed according to backtested strategy rules'
        });
    };

    const triggerGreedyPreset = () => {
        triggerHaptic('calm');
        setAssetPair('NVDA');
        setDirection('LONG');
        setEntryPrice('120');
        setExitPrice('135');
        setPositionSize('200');
        setPnl('3000');
        setEmotionalState('Greedy');
        setNotes('Held past profit target wanting extra gains');

        addTrade({
            user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            asset_pair: 'NVDA',
            direction: 'LONG',
            entry_price: 120,
            exit_price: 135,
            position_size: 200,
            pnl: 3000,
            emotional_state: 'Greedy',
            notes: 'Held past profit target wanting extra gains'
        });
    };

    return (
        <div className="glass-panel p-4 sm:p-6 rounded-3xl space-y-5 font-sans w-full shadow-2xl">
            
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Log New Trade Operation</span>
                </h3>

                <button
                    type="button"
                    onClick={handleVoiceJournaling}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                        isListening 
                            ? 'bg-rose-600 text-white border-rose-400 animate-pulse' 
                            : 'glass-subcard text-cyan-300 hover:text-white'
                    }`}
                >
                    {isListening ? <MicOff className="w-3.5 h-3.5 animate-bounce" /> : <Mic className="w-3.5 h-3.5" />}
                    <span>{isListening ? 'Ascolto...' : 'Voice Trade'}</span>
                </button>
            </div>

            {feedback && (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{feedback}</span>
                </div>
            )}

            {/* Quick Test Presets */}
            <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase text-slate-400">Quick Test Preset Triggers:</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                        type="button"
                        onClick={triggerLossFomoPreset}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 min-h-[44px] bg-rose-950/60 border border-rose-700/80 hover:bg-rose-900/80 text-rose-300 text-xs font-semibold rounded-xl transition shadow-lg active:scale-95 cursor-pointer"
                    >
                        <Flame className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
                        <span>🔴 Loss + FOMO (-$2,250)</span>
                    </button>
                    <button
                        type="button"
                        onClick={triggerCalmProfitPreset}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 min-h-[44px] bg-cyan-950/60 border border-cyan-700/80 hover:bg-cyan-900/80 text-cyan-300 text-xs font-semibold rounded-xl transition shadow-lg active:scale-95 cursor-pointer"
                    >
                        <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>🟢 Profit + Calm (+$5,000)</span>
                    </button>
                    <button
                        type="button"
                        onClick={triggerGreedyPreset}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 min-h-[44px] bg-emerald-950/60 border border-emerald-700/80 hover:bg-emerald-900/80 text-emerald-300 text-xs font-semibold rounded-xl transition shadow-lg active:scale-95 cursor-pointer"
                    >
                        <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>🟡 Euphoria + Greedy (+$3,000)</span>
                    </button>
                </div>
            </div>

            {/* Flexible Entry Form (Only Asset, Direction, & (Entry OR PnL) Required) */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                            Asset Pair <span className="text-emerald-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={assetPair}
                            onChange={(e) => setAssetPair(e.target.value.toUpperCase())}
                            className="glass-subcard text-white rounded-xl h-11 px-3 text-sm focus:border-emerald-500 outline-none w-full font-mono"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                            Direction <span className="text-emerald-400">*</span>
                        </label>
                        <select
                            value={direction}
                            onChange={(e) => setDirection(e.target.value as TradeDirection)}
                            className="glass-subcard text-white rounded-xl h-11 px-3 text-sm focus:border-emerald-500 outline-none w-full font-mono"
                        >
                            <option value="LONG">LONG</option>
                            <option value="SHORT">SHORT</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Entry Price ($)</label>
                        <input
                            type="number"
                            step="any"
                            value={entryPrice}
                            onChange={(e) => setEntryPrice(e.target.value)}
                            placeholder="Opzionale se c'è PnL"
                            className="glass-subcard text-white rounded-xl h-11 px-3 text-sm focus:border-emerald-500 outline-none w-full font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">PnL ($)</label>
                        <input
                            type="number"
                            step="any"
                            value={pnl}
                            onChange={(e) => setPnl(e.target.value)}
                            placeholder="Es. +500 o -200"
                            className="glass-subcard text-white rounded-xl h-11 px-3 text-sm font-mono focus:border-emerald-500 outline-none w-full"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Exit Price ($) (Facoltativo)</label>
                        <input
                            type="number"
                            step="any"
                            value={exitPrice}
                            onChange={(e) => setExitPrice(e.target.value)}
                            className="glass-subcard text-white rounded-xl h-11 px-3 text-sm focus:border-emerald-500 outline-none w-full font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Position Size (Facoltativo)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={positionSize}
                            onChange={(e) => setPositionSize(e.target.value)}
                            className="glass-subcard text-white rounded-xl h-11 px-3 text-sm focus:border-emerald-500 outline-none w-full font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Emotional State (Facoltativo)</label>
                        <select
                            value={emotionalState}
                            onChange={(e) => setEmotionalState(e.target.value as EmotionalState)}
                            className="glass-subcard text-white rounded-xl h-11 px-3 text-sm focus:border-emerald-500 outline-none w-full font-mono"
                        >
                            <option value="Calm">Calm (Cool/Disciplined)</option>
                            <option value="Disciplined">Disciplined</option>
                            <option value="Greedy">Greedy (Euphoria)</option>
                            <option value="FOMO">FOMO (Chaotic/Fire)</option>
                            <option value="Anxious">Anxious</option>
                            <option value="Frustrated">Frustrated</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Journal Notes (Facoltativo)</label>
                    <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Log psychological notes or setup triggers..."
                        className="glass-subcard text-white rounded-xl h-11 px-3 text-sm focus:border-emerald-500 outline-none w-full font-mono"
                    />
                </div>

                <button
                    type="submit"
                    disabled={!isFormValid}
                    className={`w-full min-h-[48px] py-3 text-white font-mono font-bold rounded-2xl transition shadow-lg cursor-pointer ${
                        isFormValid 
                            ? 'bg-[#10B981] hover:bg-[#059669] shadow-[#10B981]/20 active:scale-[0.99]'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                    }`}
                >
                    COMMIT SESSION LOG
                </button>
            </form>
        </div>
    );
};
