// ============================================================================
// TRADYX TRADE FORM COMPONENT (src/components/TradeForm.tsx)
// ============================================================================

import React, { useState } from 'react';
import { useTradeStore } from '../store/useTradeStore';
import { EmotionalState, TradeDirection } from '../types/trade';
import { PlusCircle, Flame, ShieldCheck, Zap } from 'lucide-react';

export const TradeForm: React.FC = () => {
    const { addTrade } = useTradeStore();

    const [assetPair, setAssetPair] = useState('BTC/USDT');
    const [direction, setDirection] = useState<TradeDirection>('LONG');
    const [entryPrice, setEntryPrice] = useState(62000);
    const [exitPrice, setExitPrice] = useState(60500);
    const [positionSize, setPositionSize] = useState(1.0);
    const [pnl, setPnl] = useState(-1500);
    const [emotionalState, setEmotionalState] = useState<EmotionalState>('FOMO');
    const [notes, setNotes] = useState('Chased the breakout late and panicked');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await addTrade({
            user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            asset_pair: assetPair,
            direction,
            entry_price: Number(entryPrice),
            exit_price: Number(exitPrice),
            position_size: Number(positionSize),
            pnl: Number(pnl),
            emotional_state: emotionalState,
            notes
        });
    };

    // Quick Test Preset Triggers
    const triggerLossFomoPreset = () => {
        setAssetPair('BTC/USDT');
        setDirection('LONG');
        setEntryPrice(65000);
        setExitPrice(63500);
        setPositionSize(1.5);
        setPnl(-2250);
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
        setAssetPair('EUR/USD');
        setDirection('SHORT');
        setEntryPrice(1.0850);
        setExitPrice(1.0800);
        setPositionSize(10.0);
        setPnl(5000);
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
        setAssetPair('NVDA');
        setDirection('LONG');
        setEntryPrice(120);
        setExitPrice(135);
        setPositionSize(200);
        setPnl(3000);
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
        <div className="bg-slate-950/75 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl shadow-[0_0_30px_rgba(0,240,255,0.06)] hover:border-cyan-500/40 transition-all duration-300 space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-cyan-400" />
                    Log New Trade Operation
                </h3>
            </div>

            {/* Quick Test Presets */}
            <div className="space-y-2">
                <div className="text-xs font-semibold uppercase text-slate-400">Quick Test Preset Triggers (Click to test Quasar Bubble visual reaction):</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                        type="button"
                        onClick={triggerLossFomoPreset}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-rose-950/60 border border-rose-700/80 hover:bg-rose-900/80 text-rose-300 text-xs font-semibold rounded-xl transition shadow-lg"
                    >
                        <Flame className="w-4 h-4 text-rose-400 animate-bounce" />
                        🔴 Test Loss + FOMO (-$2,250)
                    </button>
                    <button
                        type="button"
                        onClick={triggerCalmProfitPreset}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-cyan-950/60 border border-cyan-700/80 hover:bg-cyan-900/80 text-cyan-300 text-xs font-semibold rounded-xl transition shadow-lg"
                    >
                        <ShieldCheck className="w-4 h-4 text-cyan-400" />
                        🟢 Test Profit + Calm (+$5,000)
                    </button>
                    <button
                        type="button"
                        onClick={triggerGreedyPreset}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-950/60 border border-emerald-700/80 hover:bg-emerald-900/80 text-emerald-300 text-xs font-semibold rounded-xl transition shadow-lg"
                    >
                        <Zap className="w-4 h-4 text-amber-400" />
                        🟡 Test Euphoria + Greedy (+$3,000)
                    </button>
                </div>
            </div>

            {/* Manual Entry Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Asset Pair</label>
                        <input
                            type="text"
                            value={assetPair}
                            onChange={(e) => setAssetPair(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-white rounded-lg p-3 w-full text-sm focus:border-cyan-500 outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Direction</label>
                        <select
                            value={direction}
                            onChange={(e) => setDirection(e.target.value as TradeDirection)}
                            className="bg-slate-900 border border-slate-700 text-white rounded-lg p-3 w-full text-sm focus:border-cyan-500 outline-none"
                        >
                            <option value="LONG">LONG</option>
                            <option value="SHORT">SHORT</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Entry Price ($)</label>
                        <input
                            type="number"
                            value={entryPrice}
                            onChange={(e) => setEntryPrice(Number(e.target.value))}
                            className="bg-slate-900 border border-slate-700 text-white rounded-lg p-3 w-full text-sm focus:border-cyan-500 outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Position Size</label>
                        <input
                            type="number"
                            step="0.1"
                            value={positionSize}
                            onChange={(e) => setPositionSize(Number(e.target.value))}
                            className="bg-slate-900 border border-slate-700 text-white rounded-lg p-3 w-full text-sm focus:border-cyan-500 outline-none"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Exit Price ($)</label>
                        <input
                            type="number"
                            value={exitPrice}
                            onChange={(e) => setExitPrice(Number(e.target.value))}
                            className="bg-slate-900 border border-slate-700 text-white rounded-lg p-3 w-full text-sm focus:border-cyan-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">PnL ($)</label>
                        <input
                            type="number"
                            value={pnl}
                            onChange={(e) => setPnl(Number(e.target.value))}
                            className="bg-slate-900 border border-slate-700 text-white rounded-lg p-3 w-full text-sm font-mono focus:border-cyan-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Emotional State</label>
                        <select
                            value={emotionalState}
                            onChange={(e) => setEmotionalState(e.target.value as EmotionalState)}
                            className="bg-slate-900 border border-slate-700 text-white rounded-lg p-3 w-full text-sm focus:border-cyan-500 outline-none"
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
                    <label className="block text-xs font-medium text-slate-400 mb-1">Journal Notes</label>
                    <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Log psychological notes or setup triggers..."
                        className="bg-slate-900 border border-slate-700 text-white rounded-lg p-3 w-full text-sm focus:border-cyan-500 outline-none"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-2xl transition shadow-lg shadow-cyan-500/20 active:scale-[0.99]"
                >
                    Log Trade & Update Quasar Bubble
                </button>
            </form>
        </div>
    );
};
