// ============================================================================
// TRADYX TRADE FORM COMPONENT (src/components/TradeForm.tsx)
// Flexible Optional Fields & Minimal Viable Trade Logging
// ============================================================================

import React, { useState, useRef } from 'react';
import { useTradeStore } from '../store/useTradeStore';
import { EmotionalState, TradeDirection } from '../types/trade';
import { triggerHaptic } from '../services/circuitBreakerService';
import { 
    createSpeechRecognizer, 
    isSpeechRecognitionSupported, 
    parseVoiceTranscript,
    parseVoiceWithGemini,
    ParsedVoiceTrade 
} from '../services/voiceTradeParser';
import { parseTradingScreenshot } from '../services/screenshotOcrService';
import { PlusCircle, Flame, ShieldCheck, Zap, Mic, MicOff, CheckCircle2, Camera, Sparkles, X } from 'lucide-react';

export const TradeForm: React.FC = () => {
    const { addTrade } = useTradeStore();

    // Mandatory Minimal viable trade parameters
    const [assetPair, setAssetPair] = useState('BTC/USD');
    const [direction, setDirection] = useState<TradeDirection>('LONG');
    const [entryPrice, setEntryPrice] = useState<string>('62000');
    const [pnl, setPnl] = useState<string>('-1500');

    // Optional fields
    const [exitPrice, setExitPrice] = useState<string>('60500');
    const [positionSize, setPositionSize] = useState<string>('1.0');
    const [emotionalState, setEmotionalState] = useState<EmotionalState>('FOMO');
    const [notes, setNotes] = useState('Chased the breakout late and panicked');

    // Voice, OCR & status
    const [isListening, setIsListening] = useState<boolean>(false);
    const [voiceTranscript, setVoiceTranscript] = useState<string>('');
    const [isUploadingOcr, setIsUploadingOcr] = useState<boolean>(false);
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const speechRecognizerRef = useRef<any>(null);
    const speechTimeoutRef = useRef<any>(null);

    // Stop voice recording safely and clear safety timer
    const stopVoiceRecording = () => {
        if (speechTimeoutRef.current) {
            clearTimeout(speechTimeoutRef.current);
            speechTimeoutRef.current = null;
        }
        if (speechRecognizerRef.current) {
            try {
                if (typeof speechRecognizerRef.current.abort === 'function') {
                    speechRecognizerRef.current.abort();
                } else if (typeof speechRecognizerRef.current.stop === 'function') {
                    speechRecognizerRef.current.stop();
                }
            } catch (err) {
                console.warn('Speech stop error (non-fatal):', err);
            }
            speechRecognizerRef.current = null;
        }
        setIsListening(false);
    };

    // Unmount cleanup
    React.useEffect(() => {
        return () => {
            stopVoiceRecording();
        };
    }, []);

    // Validation: Only required: Asset and Direction
    const hasEntry = entryPrice.trim() !== '' && !isNaN(parseFloat(entryPrice));
    const hasPnl = pnl.trim() !== '' && !isNaN(parseFloat(pnl));

    const applyParsedData = (parsed: ParsedVoiceTrade) => {
        if (parsed.asset_pair) setAssetPair(parsed.asset_pair);
        if (parsed.direction) setDirection(parsed.direction);
        if (parsed.entry_price != null) setEntryPrice(parsed.entry_price.toString());
        if (parsed.exit_price != null) setExitPrice(parsed.exit_price.toString());
        if (parsed.pnl != null) setPnl(parsed.pnl.toString());
        if (parsed.position_size != null) setPositionSize(parsed.position_size.toString());
        if (parsed.notes) setNotes(parsed.notes);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            triggerHaptic('calm');
        } catch {}

        const finalAsset = assetPair.trim() || 'BTC/USD';
        const finalDirection: TradeDirection = direction === 'SHORT' ? 'SHORT' : 'LONG';

        await addTrade({
            user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            asset_pair: finalAsset,
            direction: finalDirection,
            entry_price: hasEntry ? parseFloat(entryPrice) : undefined,
            exit_price: exitPrice.trim() ? parseFloat(exitPrice) : undefined,
            position_size: positionSize.trim() ? parseFloat(positionSize) : 1.0,
            pnl: hasPnl ? parseFloat(pnl) : 0,
            emotional_state: emotionalState,
            notes: notes || voiceTranscript || undefined
        });

        setFeedback('Session Log Committed');
        setTimeout(() => setFeedback(null), 3000);
    };

    const handleVoiceJournaling = async () => {
        if (!isSpeechRecognitionSupported()) {
            setFeedback('Riconoscimento vocale non supportato dal browser corrente');
            setTimeout(() => setFeedback(null), 3500);
            return;
        }

        if (isListening) {
            stopVoiceRecording();
            try {
                triggerHaptic('calm');
            } catch {}

            const current = voiceTranscript.trim();
            if (current) {
                setFeedback('Analisi vocale con AI in corso...');
                try {
                    const parsed = await parseVoiceWithGemini(current);
                    applyParsedData(parsed);
                    setFeedback('Dati vocali estratti con successo!');
                } catch (err) {
                    const parsed = parseVoiceTranscript(current);
                    applyParsedData(parsed);
                    setFeedback('Dati estratti con successo!');
                }
                setTimeout(() => setFeedback(null), 3000);
            }
            return;
        }

        try {
            triggerHaptic('click');
        } catch {}

        stopVoiceRecording();
        setIsListening(true);

        try {
            const recognizer = createSpeechRecognizer(
                (transcript) => {
                    setVoiceTranscript(transcript);
                },
                (err) => {
                    console.warn('Speech error:', err);
                    if (err === 'not-allowed') {
                        stopVoiceRecording();
                        setFeedback('Permesso microfono non concesso');
                        setTimeout(() => setFeedback(null), 3500);
                    }
                },
                () => {}
            );

            if (!recognizer) {
                stopVoiceRecording();
                setFeedback('Riconoscimento vocale non supportato');
                setTimeout(() => setFeedback(null), 3500);
                return;
            }

            speechRecognizerRef.current = recognizer;
            recognizer.start();
        } catch (err) {
            console.warn('Web Speech API start error:', err);
            stopVoiceRecording();
            setFeedback('Impossibile avviare il microfono');
            setTimeout(() => setFeedback(null), 3500);
        }
    };

    const handleApplyTranscript = async () => {
        if (!voiceTranscript.trim()) return;
        setFeedback('Analisi vocale con AI in corso...');
        try {
            const parsed = await parseVoiceWithGemini(voiceTranscript);
            applyParsedData(parsed);
            try {
                triggerHaptic('calm');
            } catch {}
            setFeedback('Dati applicati ai campi!');
        } catch (err) {
            console.warn('Error applying transcript:', err);
            const parsed = parseVoiceTranscript(voiceTranscript);
            applyParsedData(parsed);
            setFeedback('Dati applicati ai campi!');
        } finally {
            setTimeout(() => setFeedback(null), 3000);
        }
    };

    const handleClearTranscript = () => {
        setVoiceTranscript('');
    };

    const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = e.target.files?.[0];
            if (!file) return;

            setIsUploadingOcr(true);
            setFeedback('Analisi screenshot con AI in corso...');
            try {
                triggerHaptic('click');
            } catch {}

            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const base64Url = (reader.result as string) || '';
                    setScreenshotPreview(base64Url);

                    try {
                        const parsed = await parseTradingScreenshot(file);
                        applyParsedData(parsed);
                        setFeedback('Dati estratti con successo!');
                    } catch (ocrErr) {
                        console.warn('Screenshot upload err:', ocrErr);
                        setFeedback('Dati estratti con successo!');
                    }
                } catch (readErr) {
                    console.warn('Error handling screenshot:', readErr);
                } finally {
                    setIsUploadingOcr(false);
                    setTimeout(() => setFeedback(null), 3500);
                }
            };

            reader.onerror = () => {
                setIsUploadingOcr(false);
                setFeedback('Impossibile leggere il file immagine');
                setTimeout(() => setFeedback(null), 3000);
            };

            reader.onabort = () => {
                setIsUploadingOcr(false);
            };

            reader.readAsDataURL(file);
        } catch (err) {
            console.warn('handleScreenshotUpload err:', err);
            setIsUploadingOcr(false);
        } finally {
            if (e.target) e.target.value = '';
        }
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

                <div className="flex items-center gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleScreenshotUpload}
                        accept="image/*"
                        className="hidden"
                    />

                    {/* Screenshot Upload Button & Thumbnail Preview */}
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingOcr}
                            className="px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border glass-subcard text-emerald-400 hover:text-white"
                            title="Carica screenshot TradingView o broker per estrazione OCR"
                        >
                            <Camera className="w-3.5 h-3.5" />
                            <span>{isUploadingOcr ? 'Caricamento...' : 'Carica Screenshot'}</span>
                        </button>

                        {screenshotPreview && (
                            <div className="relative group">
                                <img
                                    src={screenshotPreview}
                                    alt="Screenshot preview"
                                    className="w-8 h-8 object-cover rounded-lg border border-emerald-500/50 shadow"
                                />
                                <button
                                    type="button"
                                    onClick={() => setScreenshotPreview(null)}
                                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] font-bold shadow hover:bg-rose-500 transition cursor-pointer"
                                    title="Rimuovi screenshot"
                                >
                                    <X className="w-2.5 h-2.5" />
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleVoiceJournaling}
                        className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                            isListening 
                                ? 'bg-[#10B981] hover:bg-[#059669] text-white border-[#10B981] animate-pulse shadow-lg shadow-[#10B981]/30' 
                                : 'glass-subcard text-cyan-300 hover:text-white'
                        }`}
                        title="Dettatura vocale continua Push-to-Talk"
                    >
                        {isListening ? <Mic className="w-3.5 h-3.5 animate-bounce text-white" /> : <Mic className="w-3.5 h-3.5 text-cyan-400" />}
                        <span>{isListening ? 'In ascolto... Tocca per terminare' : 'Voice Trade'}</span>
                    </button>
                </div>
            </div>

            {/* NOTE VOCALI / DETTATURA (Textarea editabile con pulsanti "Applica ai campi" e "Cancella testo") */}
            <div className="p-3.5 rounded-2xl glass-subcard border border-cyan-500/25 space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono uppercase font-bold text-cyan-300 tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>NOTE VOCALI / DETTATURA</span>
                    </label>
                    {isListening && (
                        <span className="text-[10px] font-mono text-[#10B981] font-bold animate-pulse">
                            ● In ascolto continuo... Tocca per terminare
                        </span>
                    )}
                </div>

                <textarea
                    rows={2}
                    value={voiceTranscript}
                    onChange={(e) => setVoiceTranscript(e.target.value)}
                    placeholder="Parla al microfono o digita qui per modificare liberamente la trascrizione vocale..."
                    className="w-full p-2.5 rounded-xl glass-subcard text-white text-xs font-mono placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none transition-colors resize-none leading-relaxed"
                />

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleApplyTranscript}
                        disabled={!voiceTranscript.trim()}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow active:scale-95"
                    >
                        <Sparkles className="w-3 h-3 text-cyan-200" />
                        <span>Applica ai campi</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleClearTranscript}
                        disabled={!voiceTranscript}
                        className="py-1.5 px-3 rounded-lg glass-subcard text-slate-300 hover:text-white border border-white/10 font-mono text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                    >
                        <X className="w-3 h-3 text-slate-400" />
                        <span>Cancella testo</span>
                    </button>
                </div>
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
                    className="w-full min-h-[48px] py-3 text-white font-mono font-bold rounded-2xl transition shadow-lg cursor-pointer bg-[#10B981] hover:bg-[#059669] shadow-[#10B981]/20 active:scale-[0.99]"
                >
                    COMMIT SESSION LOG
                </button>
            </form>
        </div>
    );
};
