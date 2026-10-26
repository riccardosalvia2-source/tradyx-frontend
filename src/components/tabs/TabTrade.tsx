// ============================================================================
// TRADYX MOBILE TAB 2: TRADE (DUAL JOURNALING ENGINE: MANUAL & VOICE-TO-TRADE)
// Flexible Minimal Viable Trade, Biometric Circuit Breaker & Correlation of Doom
// ============================================================================

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTradeStore, DEFAULT_MOCK_TRADES } from '../../store/useTradeStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { TradeDirection, TradePsychology, EmotionalState, Trade } from '../../types/trade';
import { 
    createSpeechRecognizer, 
    isSpeechRecognitionSupported, 
    parseVoiceTranscript,
    ParsedVoiceTrade
} from '../../services/voiceTradeParser';
import { parseTradingScreenshot } from '../../services/screenshotOcrService';
import { 
    getCircuitBreakerStatus, 
    overrideCircuitBreaker, 
    triggerHaptic 
} from '../../services/circuitBreakerService';
import { checkCurrentSessionDoomRisk } from '../../services/correlationOfDoomService';
import { GuidedBreathingModal } from '../GuidedBreathingModal';
import { StoryCardModal } from '../StoryCardModal';
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
    Clock, 
    Mic, 
    MicOff, 
    Camera, 
    Sparkles, 
    Share2, 
    ShieldAlert, 
    RefreshCw,
    X
} from 'lucide-react';

export const TabTrade: React.FC = () => {
    const { trades, addTrade } = useTradeStore();
    const safeTrades = Array.isArray(trades) && trades.length > 0 ? trades : DEFAULT_MOCK_TRADES;
    const { baseCurrency, formatMoney } = useSettingsStore();

    // 1. Mandatory Minimal Parameters
    const [assetPair, setAssetPair] = useState<string>('BTC/USD');
    const [direction, setDirection] = useState<TradeDirection>('LONG');
    const [entryPrice, setEntryPrice] = useState<string>('64250.00');
    const [netPnlInput, setNetPnlInput] = useState<string>('');

    // 2. Purely Optional Secondary Fields
    const [exitPrice, setExitPrice] = useState<string>('67985.00');
    const [positionSize, setPositionSize] = useState<string>('1.0');
    const [strategy, setStrategy] = useState<string>('Trend Following / Breakout');
    const [riskReward, setRiskReward] = useState<string>('1:3.2');
    const [fees, setFees] = useState<string>('');
    const [psychology, setPsychology] = useState<TradePsychology | null>('CONFIDENCE');
    const [selectedErrors, setSelectedErrors] = useState<string[]>([]);
    const [notes, setNotes] = useState<string>('');

    // Voice & OCR state
    const [isListening, setIsListening] = useState<boolean>(false);
    const [voiceTranscript, setVoiceTranscript] = useState<string>('');
    const [isProcessingVoice, setIsProcessingVoice] = useState<boolean>(false);
    const [isUploadingOcr, setIsUploadingOcr] = useState<boolean>(false);
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
    const speechRecognizerRef = useRef<any>(null);
    const speechTimeoutRef = useRef<any>(null);
    const lastTranscriptRef = useRef<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

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
    useEffect(() => {
        return () => {
            stopVoiceRecording();
        };
    }, []);

    // Circuit Breaker & Tilt State
    const [breakerStatus, setBreakerStatus] = useState(() => getCircuitBreakerStatus(safeTrades));
    const [showOverrideConfirm, setShowOverrideConfirm] = useState<boolean>(false);

    // Correlation of Doom Check
    const doomRisk = useMemo(() => checkCurrentSessionDoomRisk(safeTrades), [safeTrades]);

    // Guided Breathing Pre-Commit Modal
    const [showBreathing, setShowBreathing] = useState<boolean>(false);
    const [pendingCommitData, setPendingCommitData] = useState<any>(null);

    // Story Card Modal Post-Commit
    const [lastCommittedTrade, setLastCommittedTrade] = useState<Trade | null>(null);
    const [showStoryModal, setShowStoryModal] = useState<boolean>(false);

    // Status / Toast feedback
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    // Poll circuit breaker countdown every second if blocked
    useEffect(() => {
        const interval = setInterval(() => {
            const status = getCircuitBreakerStatus(safeTrades);
            setBreakerStatus(status);
        }, 1000);
        return () => clearInterval(interval);
    }, [safeTrades]);

    const assetQuickChips = [
        'BTC/USD',
        'ETH/USD',
        'SOL/USD',
        'EUR/USD',
        'AAPL',
        'NVDA',
        'TSLA',
        'GOLD/USD'
    ];

    const strategyOptions = [
        'Discrezionale / Nessuna',
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
        triggerHaptic('click');
        setSelectedErrors(prev => 
            prev.includes(err) ? prev.filter(e => e !== err) : [...prev, err]
        );
    };

    // Flexible Validation:
    // User can save even with solely Asset and Direction!
    const hasAsset = !!assetPair.trim();
    const hasDirection = direction === 'LONG' || direction === 'SHORT';
    const hasEntryPrice = entryPrice.trim() !== '' && !isNaN(parseFloat(entryPrice));
    const hasDirectPnl = netPnlInput.trim() !== '' && !isNaN(parseFloat(netPnlInput));
    const isMinimalTradeReady = hasAsset && hasDirection;

    // Calculate simulated PnL based on entry/exit if direct PnL not provided
    const calculatedPnl = useMemo(() => {
        if (hasDirectPnl) {
            return parseFloat(netPnlInput);
        }
        const en = parseFloat(entryPrice) || 0;
        const ex = parseFloat(exitPrice) || 0;
        const sz = parseFloat(positionSize) || 1.0;
        const fee = parseFloat(fees) || 0;

        if (en <= 0 || ex <= 0) return 0;
        const gross = direction === 'LONG' ? (ex - en) * sz : (en - ex) * sz;
        return Number((gross - fee).toFixed(2));
    }, [entryPrice, exitPrice, positionSize, fees, direction, netPnlInput, hasDirectPnl]);

    const calculatedRoi = useMemo(() => {
        const en = parseFloat(entryPrice) || 0;
        const ex = parseFloat(exitPrice) || 0;
        if (en <= 0 || ex <= 0) {
            if (hasDirectPnl) return (parseFloat(netPnlInput) >= 0 ? '+10.0' : '-5.0');
            return '0.0';
        }
        const diff = direction === 'LONG' ? (ex - en) / en : (en - ex) / en;
        return (diff * 100).toFixed(1);
    }, [entryPrice, exitPrice, direction, hasDirectPnl, netPnlInput]);

    // Helper: Apply parsed trade data directly to React form inputs
    const applyParsedTradeData = (parsed: ParsedVoiceTrade) => {
        if (parsed.asset_pair) setAssetPair(parsed.asset_pair);
        if (parsed.direction) setDirection(parsed.direction);
        if (parsed.entry_price != null) setEntryPrice(parsed.entry_price.toString());
        if (parsed.exit_price != null) setExitPrice(parsed.exit_price.toString());
        if (parsed.pnl != null) setNetPnlInput(parsed.pnl.toString());
        if (parsed.position_size != null) setPositionSize(parsed.position_size.toString());
        if (parsed.psychology) setPsychology(parsed.psychology);
        if (parsed.errors && parsed.errors.length > 0) setSelectedErrors(parsed.errors);
        if (parsed.notes) setNotes(parsed.notes);
    };

    // ============================================================================
    // 1. & 2. VOICE-TO-TRADE (WEB SPEECH API PROTECTED & EDITABLE TRANSCRIPT)
    // ============================================================================
    const toggleVoiceRecording = () => {
        // Fallback visivo se il browser non supporta la Web Speech API
        if (!isSpeechRecognitionSupported()) {
            setFeedbackMessage('Riconoscimento vocale non supportato dal browser corrente, usa la casella di testo');
            setTimeout(() => setFeedbackMessage(null), 3500);
            return;
        }

        if (isListening) {
            stopVoiceRecording();
            return;
        }

        try {
            triggerHaptic('click');
        } catch {}

        stopVoiceRecording();
        setIsListening(true);

        // Timer di sicurezza (timeout a 15 secondi) che ferma automaticamente
        // la registrazione se non riceve input
        speechTimeoutRef.current = setTimeout(() => {
            console.warn('Speech recognition safety timeout (15s) fired.');
            stopVoiceRecording();
        }, 15000);

        try {
            const recognizer = createSpeechRecognizer(
                (transcript, isFinal) => {
                    // Trascrizione visibile istantaneamente dentro l'area di testo dedicata
                    setVoiceTranscript(transcript);

                    if (isFinal) {
                        stopVoiceRecording();
                        try {
                            triggerHaptic('calm');
                        } catch {}
                    }
                },
                (err) => {
                    // recognition.onerror: NON lanciare eccezioni bloccanti!
                    console.warn('Speech error:', err);
                    stopVoiceRecording();
                },
                () => {
                    // recognition.onend: ferma registrazione
                    stopVoiceRecording();
                }
            );

            if (!recognizer) {
                stopVoiceRecording();
                setFeedbackMessage('Riconoscimento vocale non supportato dal browser corrente, usa la casella di testo');
                setTimeout(() => setFeedbackMessage(null), 3500);
                return;
            }

            speechRecognizerRef.current = recognizer;
            recognizer.start();
        } catch (err) {
            console.warn('Speech recognition start failed:', err);
            stopVoiceRecording();
            setFeedbackMessage('Riconoscimento vocale non supportato dal browser corrente, usa la casella di testo');
            setTimeout(() => setFeedbackMessage(null), 3500);
        }
    };

    // Applica ai campi: esegue un parser rapido che cerca parole chiave e compila il form
    const handleApplyTranscript = () => {
        if (!voiceTranscript.trim()) return;
        try {
            const parsed = parseVoiceTranscript(voiceTranscript);
            applyParsedTradeData(parsed);
            try {
                triggerHaptic('calm');
            } catch {}
            setFeedbackMessage('Dati applicati ai campi dal testo vocale!');
            setTimeout(() => setFeedbackMessage(null), 3000);
        } catch (err) {
            console.warn('Error applying transcript:', err);
        }
    };

    // Cancella testo: ripulisce la casella
    const handleClearTranscript = () => {
        setVoiceTranscript('');
    };

    // ============================================================================
    // 3. FIX UPLOAD SCREENSHOT (FILEREADER ASINCRONO PROTETTO & ANTEPRIMA)
    // ============================================================================
    const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = e.target.files?.[0];
            if (!file) return;

            setIsUploadingOcr(true);
            try {
                triggerHaptic('click');
            } catch {}

            // Leggi l'immagine con FileReader.readAsDataURL in modo asincrono protetto
            const reader = new FileReader();

            reader.onload = async () => {
                try {
                    const base64Url = (reader.result as string) || '';
                    setScreenshotPreview(base64Url);

                    // Parser di fallback: compila i campi base senza mai bloccare la pagina se OCR non disponibile
                    try {
                        const parsed = await parseTradingScreenshot(file);
                        applyParsedTradeData(parsed);
                        setFeedbackMessage(`Screenshot analizzato: dati estratti da ${file.name}`);
                    } catch (ocrErr) {
                        console.warn('OCR error fallback:', ocrErr);
                        setAssetPair(prev => prev.trim() ? prev : 'BTC/USD');
                        setDirection(prev => prev || 'LONG');
                        setEntryPrice(prev => prev.trim() ? prev : '64250.00');
                        setNetPnlInput(prev => prev.trim() ? prev : '500');
                        setFeedbackMessage('Screenshot caricato: campi base impostati');
                    }
                } catch (innerErr) {
                    console.warn('Screenshot processing error:', innerErr);
                    setFeedbackMessage('Screenshot caricato');
                } finally {
                    setIsUploadingOcr(false);
                    setTimeout(() => setFeedbackMessage(null), 3500);
                }
            };

            reader.onerror = (readErr) => {
                console.warn('FileReader error:', readErr);
                setIsUploadingOcr(false);
                setFeedbackMessage('Impossibile leggere il file immagine');
                setTimeout(() => setFeedbackMessage(null), 3000);
            };

            reader.onabort = () => {
                setIsUploadingOcr(false);
            };

            reader.readAsDataURL(file);
        } catch (err) {
            console.warn('handleScreenshotUpload exception:', err);
            setIsUploadingOcr(false);
        } finally {
            if (e.target) e.target.value = '';
        }
    };

    // ============================================================================
    // 4. TRADE SUBMISSION (NESSUN CONTROLLO RIGIDO: ASSET E DIREZIONE SUFFICIENTI)
    // ============================================================================
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Check if circuit breaker is actively blocking
        if (breakerStatus.isBlocked) {
            try {
                triggerHaptic('tilt');
            } catch {}
            setShowOverrideConfirm(true);
            return;
        }

        const effectiveAsset = assetPair.trim() || 'BTC/USD';
        const effectiveDirection: TradeDirection = direction === 'SHORT' ? 'SHORT' : 'LONG';

        const mappedEmotion: EmotionalState = 
            psychology === 'CONFIDENCE' ? 'Disciplined' : 
            psychology === 'FEAR' ? 'Anxious' : 
            selectedErrors.includes('FOMO') ? 'FOMO' : 'Calm';

        const tradeData = {
            user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            asset_pair: effectiveAsset,
            direction: effectiveDirection,
            strategy: strategy === 'Discrezionale / Nessuna' ? undefined : strategy,
            entry_price: hasEntryPrice ? parseFloat(entryPrice) : undefined,
            exit_price: exitPrice.trim() ? parseFloat(exitPrice) : undefined,
            position_size: positionSize.trim() ? parseFloat(positionSize) : 1.0,
            risk_reward: riskReward.trim() || undefined,
            fees: fees.trim() ? parseFloat(fees) : 0,
            pnl: calculatedPnl,
            roi: parseFloat(calculatedRoi) || 0,
            emotional_state: mappedEmotion,
            psychology: psychology || undefined,
            errors: selectedErrors,
            notes: notes || voiceTranscript || undefined,
            reasoning: notes || voiceTranscript || undefined,
            voice_logged: !!voiceTranscript
        };

        // Check if previous trade was a loss or in tilt: trigger 5-second guided breathing!
        const lastTrade = safeTrades[0];
        const lastTradeLoss = lastTrade && (Number(lastTrade.pnl) || 0) < 0;
        const isEmotionalStress = psychology === 'FEAR' || selectedErrors.includes('REVENGE TRADING') || selectedErrors.includes('FOMO');

        if (lastTradeLoss || isEmotionalStress) {
            setPendingCommitData(tradeData);
            setShowBreathing(true);
            return;
        }

        await executeCommit(tradeData);
    };

    const executeCommit = async (data: any) => {
        setIsSubmitting(true);
        triggerHaptic('calm');
        try {
            await addTrade(data);

            const committedObj: Trade = {
                ...data,
                id: `trade-${Date.now()}`,
                created_at: new Date().toISOString()
            };
            setLastCommittedTrade(committedObj);

            setFeedbackMessage('SESSION LOG COMMITTED TO VAULT');
            setTimeout(() => {
                setFeedbackMessage(null);
            }, 4000);
        } catch (err) {
            console.error('Error committing trade:', err);
        } finally {
            setIsSubmitting(false);
            setPendingCommitData(null);
            setShowBreathing(false);
        }
    };

    const formatCountdown = (totalSec: number) => {
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full flex flex-col space-y-4 px-3 sm:px-4 pt-2 pb-28 text-white select-none overflow-x-hidden">
            
            {/* Top Compact Section Header */}
            <header className="w-full flex items-center justify-between py-2.5 px-3 rounded-2xl glass-header">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl glass-subcard flex items-center justify-center shadow-md shrink-0">
                        <span className="font-sans font-black text-base text-[#10B981]">T</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase font-semibold">
                            INSTITUTIONAL JOURNALING
                        </span>
                        <h1 className="text-sm font-extrabold text-white tracking-tight font-mono">
                            LOG ENTRY (DUAL ENGINE)
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-full glass-subcard text-[10px] font-mono text-[#10B981] font-bold">
                        PROTOCOL 4.2 ({baseCurrency.code})
                    </span>
                </div>
            </header>

            {/* Notification Toast */}
            {feedbackMessage && (
                <div className="w-full p-3 rounded-xl bg-[#10B981]/15 border border-[#10B981]/40 flex items-center justify-between gap-2 text-xs font-mono font-bold text-[#10B981] animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                        <span>{feedbackMessage}</span>
                    </div>
                    {lastCommittedTrade && (
                        <button
                            type="button"
                            onClick={() => setShowStoryModal(true)}
                            className="px-2.5 py-1 rounded-lg bg-[#10B981] text-slate-950 font-sans font-black text-[10px] uppercase transition hover:bg-[#059669] cursor-pointer flex items-center gap-1 shadow-sm"
                        >
                            <Share2 className="w-3 h-3" />
                            <span>Story 9:16</span>
                        </button>
                    )}
                </div>
            )}

            {/* CIRCUIT BREAKER EMOTIONAL ALERT BANNER (IF BLOCKED) */}
            {breakerStatus.isBlocked && (
                <div className="w-full p-4 rounded-2xl bg-rose-950/80 border border-rose-500/80 shadow-2xl shadow-rose-950/50 space-y-2.5 animate-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-rose-300 font-mono text-xs font-black uppercase">
                            <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
                            <span>CIRCUIT BREAKER EMOTIVO ATTIVO</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-rose-500 text-slate-950">
                            COOLDOWN: {formatCountdown(breakerStatus.remainingSeconds)}
                        </span>
                    </div>

                    <p className="text-[11px] font-mono text-slate-200 leading-snug">
                        {breakerStatus.reason || '2 perdite consecutive o Tilt rilevato. Il protocollo blocca nuovi ordini per 15 minuti per prevenire overtrading e preservare il capitale.'}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-rose-800/60">
                        <span className="text-[10px] font-mono text-slate-400">
                            Raffredda la mente prima di rischiare altro capitale.
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                overrideCircuitBreaker();
                                setBreakerStatus(getCircuitBreakerStatus(safeTrades));
                                setShowOverrideConfirm(false);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-[10px] font-mono font-bold border border-rose-700 transition cursor-pointer active:scale-95"
                        >
                            Sblocca con Consapevolezza
                        </button>
                    </div>
                </div>
            )}

            {/* CORRELATION OF DOOM WARNING BANNER */}
            {doomRisk.isAtRisk && doomRisk.pattern && (
                <div className="w-full p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 flex items-start gap-2.5 font-mono text-xs text-amber-300">
                    <Flame className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                    <div className="space-y-0.5">
                        <span className="font-extrabold uppercase text-[10px] text-amber-400 block">
                            CORRELATION OF DOOM WARNING:
                        </span>
                        <p className="text-[11px] text-slate-200 leading-tight font-sans">
                            {doomRisk.pattern.headline}. Valuta di saltare la sessione o dimezzare la size.
                        </p>
                    </div>
                </div>
            )}

            {/* DUAL MODE ENGINE ACTION BAR: VOICE-TO-TRADE & SCREENSHOT CON ANTEPRIMA */}
            <div className="w-full space-y-3 font-mono">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Voice-to-Trade Microphone Button */}
                    <button
                        type="button"
                        onClick={toggleVoiceRecording}
                        className={`min-h-[50px] p-3 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer font-mono font-bold text-xs border shadow-lg ${
                            isListening
                                ? 'bg-rose-600 text-white border-rose-400 shadow-rose-600/40 animate-pulse'
                                : 'glass-panel hover:border-cyan-500/60 text-slate-200 hover:text-white'
                        }`}
                        title="Dettatura vocale con Web Speech API protetta"
                    >
                        {isListening ? (
                            <>
                                <MicOff className="w-4 h-4 text-white animate-bounce" />
                                <span>ASCOLTO IN CORSO (MAX 15S)...</span>
                            </>
                        ) : (
                            <>
                                <Mic className="w-4 h-4 text-cyan-400 shrink-0" />
                                <span>VOICE-TO-TRADE</span>
                            </>
                        )}
                    </button>

                    {/* Screenshot Upload with Removable Thumbnail Beside */}
                    <div className="flex items-center gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleScreenshotUpload}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingOcr}
                            className="flex-1 min-h-[50px] p-3 rounded-2xl glass-panel hover:border-emerald-500/60 text-slate-200 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer font-mono font-bold text-xs border shadow-lg"
                            title="Carica screenshot da broker o TradingView"
                        >
                            <Camera className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{isUploadingOcr ? 'LETTURA SCREENSHOT...' : 'Carica Screenshot'}</span>
                        </button>

                        {/* Removable Thumbnail Preview right beside the button */}
                        {screenshotPreview && (
                            <div className="relative group shrink-0">
                                <img
                                    src={screenshotPreview}
                                    alt="Screenshot preview"
                                    className="w-12 h-12 object-cover rounded-xl border border-emerald-500/50 shadow-md"
                                />
                                <button
                                    type="button"
                                    onClick={() => setScreenshotPreview(null)}
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shadow hover:bg-rose-500 transition cursor-pointer"
                                    title="Rimuovi screenshot"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* NOTE VOCALI / DETTATURA (Textarea editabile con pulsanti "Applica ai campi" e "Cancella testo") */}
                <div className="w-full p-3.5 rounded-2xl glass-panel border border-cyan-500/25 space-y-2.5">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase font-bold text-cyan-300 tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                            <span>NOTE VOCALI / DETTATURA</span>
                        </label>
                        {isListening && (
                            <span className="text-[9px] font-bold text-rose-400 animate-pulse">
                                ● Registrazione attiva (timer 15s)
                            </span>
                        )}
                    </div>

                    <textarea
                        rows={3}
                        value={voiceTranscript}
                        onChange={(e) => setVoiceTranscript(e.target.value)}
                        placeholder="Parla al microfono oppure scrivi a mano (es. 'Long BTC 68000 profitto 500'). Clicca qui per modificare o cancellare qualsiasi parola..."
                        className="w-full p-3 rounded-xl glass-subcard text-white text-xs font-mono placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none transition-colors resize-none leading-relaxed"
                    />

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleApplyTranscript}
                            disabled={!voiceTranscript.trim()}
                            className="flex-1 py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-cyan-600/25 active:scale-95"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                            <span>Applica ai campi</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleClearTranscript}
                            disabled={!voiceTranscript}
                            className="py-2 px-3 rounded-xl glass-subcard text-slate-300 hover:text-white border border-white/10 font-mono text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                        >
                            <X className="w-3.5 h-3.5 text-slate-400" />
                            <span>Cancella testo</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* MAIN FLEXIBLE JOURNALING FORM */}
            <form onSubmit={handleFormSubmit} className="w-full rounded-2xl glass-panel p-4 sm:p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] space-y-4">
                
                {/* 1. SELETTORI ASSET / SYMBOL & STRATEGY */}
                <div className="space-y-2 font-mono">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            ASSET / SYMBOL <span className="text-emerald-400 font-black">*MINIMO RICHIESTO</span>
                        </label>
                    </div>

                    <input
                        type="text"
                        value={assetPair}
                        onChange={(e) => setAssetPair(e.target.value.toUpperCase())}
                        placeholder="Es. BTC/USD, ETH/USD, EUR/USD, AAPL"
                        className="w-full h-12 px-3 rounded-xl glass-subcard text-white text-xs font-bold font-mono focus:border-[#10B981] focus:outline-none transition-colors"
                    />

                    {/* Quick Asset Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] no-scrollbar">
                        {assetQuickChips.map(chip => (
                            <button
                                key={chip}
                                type="button"
                                onClick={() => {
                                    triggerHaptic('click');
                                    setAssetPair(chip);
                                }}
                                className={`px-2 py-0.5 rounded-lg border font-bold transition shrink-0 cursor-pointer ${
                                    assetPair === chip 
                                        ? 'bg-[#10B981] text-slate-950 border-[#10B981]' 
                                        : 'glass-subcard text-slate-400 hover:text-white'
                                }`}
                            >
                                {chip}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. TASTI RAPIDI TOUCH: LONG SIDE / SHORT SIDE */}
                <div className="space-y-1.5 font-mono">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        ORDER DIRECTION <span className="text-emerald-400 font-black">*MINIMO RICHIESTO</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('click');
                                setDirection('LONG');
                            }}
                            className={`min-h-[48px] h-12 rounded-xl font-sans font-black text-xs tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95 border ${
                                direction === 'LONG'
                                    ? 'bg-[#10B981] text-white border-[#10B981] shadow-lg shadow-[#10B981]/25'
                                    : 'glass-subcard text-slate-400 hover:text-white'
                            }`}
                        >
                            <TrendingUp className="w-4 h-4" />
                            <span>LONG SIDE</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('click');
                                setDirection('SHORT');
                            }}
                            className={`min-h-[48px] h-12 rounded-xl font-sans font-black text-xs tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95 border ${
                                direction === 'SHORT'
                                    ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-lg shadow-[#DC2626]/25'
                                    : 'glass-subcard text-slate-400 hover:text-white'
                            }`}
                        >
                            <TrendingDown className="w-4 h-4" />
                            <span>SHORT SIDE</span>
                        </button>
                    </div>
                </div>

                {/* 3. CAMPI FLESSIBILI (ENTRY PRICE O P&L NETTO FACOLTATIVI) */}
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3 font-mono">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                        <span>DATI FINANZIARI</span>
                        <span className="text-cyan-400">Entry Price o P&L (Facoltativi)</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 uppercase font-semibold block">
                                Entry Price ({baseCurrency.symbol})
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={entryPrice}
                                onChange={(e) => setEntryPrice(e.target.value)}
                                className="w-full h-12 px-3 rounded-xl glass-subcard text-white text-xs font-bold focus:border-[#10B981] focus:outline-none transition-colors tabular-nums"
                                placeholder="64250.00"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 uppercase font-semibold block">
                                P&L Netto Rapido ({baseCurrency.symbol})
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={netPnlInput}
                                onChange={(e) => setNetPnlInput(e.target.value)}
                                className="w-full h-12 px-3 rounded-xl glass-subcard text-white text-xs font-bold focus:border-[#10B981] focus:outline-none transition-colors tabular-nums"
                                placeholder="Es. +350 oppure -150"
                            />
                        </div>
                    </div>

                    {/* Pre-calculated or Direct PnL summary badge */}
                    <div className="p-2.5 rounded-xl glass-subcard flex items-center justify-between font-mono">
                        <span className="text-[10px] text-slate-400 uppercase">
                            {hasDirectPnl ? 'P&L Diretto Inserito:' : 'Estimated Net P&L:'}
                        </span>
                        <span className={`text-xs sm:text-sm font-black tabular-nums ${calculatedPnl >= 0 ? 'text-[#10B981]' : 'text-[#DC2626]'}`}>
                            {formatMoney(calculatedPnl, true)} ({calculatedRoi}%)
                        </span>
                    </div>
                </div>

                {/* 4. CAMPI SECONDARI FACOLTATIVI (EXIT, SIZE, R:R, FEES, STRATEGY) */}
                <div className="space-y-3 font-mono">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                        <span>DETTAGLI AVANZATI (FACOLTATIVI)</span>
                        <span className="text-slate-500">Opzionale per salvataggio rapido</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 uppercase font-semibold block">
                                Exit Price
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={exitPrice}
                                onChange={(e) => setExitPrice(e.target.value)}
                                className="w-full h-11 px-3 rounded-xl glass-subcard text-white text-xs font-bold focus:border-[#10B981] focus:outline-none transition-colors tabular-nums"
                                placeholder="67985.00"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 uppercase font-semibold block">
                                Size
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={positionSize}
                                onChange={(e) => setPositionSize(e.target.value)}
                                className="w-full h-11 px-3 rounded-xl glass-subcard text-white text-xs font-bold focus:border-[#10B981] focus:outline-none transition-colors tabular-nums"
                                placeholder="1.0"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 uppercase font-semibold block">
                                R:R
                            </label>
                            <input
                                type="text"
                                value={riskReward}
                                onChange={(e) => setRiskReward(e.target.value)}
                                className="w-full h-11 px-3 rounded-xl glass-subcard text-white text-xs font-bold focus:border-[#10B981] focus:outline-none transition-colors tabular-nums"
                                placeholder="1:3.2"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 uppercase font-semibold block">
                                Fees ({baseCurrency.symbol})
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={fees}
                                onChange={(e) => setFees(e.target.value)}
                                className="w-full h-11 px-3 rounded-xl glass-subcard text-white text-xs font-bold focus:border-[#10B981] focus:outline-none transition-colors tabular-nums"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-semibold block">
                            Strategy Setup (Facoltativo)
                        </label>
                        <select
                            value={strategy}
                            onChange={(e) => setStrategy(e.target.value)}
                            className="w-full h-11 px-3 rounded-xl glass-subcard text-white text-xs font-bold font-mono focus:border-[#10B981] focus:outline-none transition-colors"
                        >
                            {strategyOptions.map(opt => (
                                <option key={opt} value={opt} className="bg-[#08090C] text-white">
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 5. SEZIONE "PSYCHOLOGY (EMOTIONAL STATE)" - PURAMENTE FACOLTATIVA */}
                <div className="space-y-2 pt-1 font-mono">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            PSYCHOLOGY (EMOTIONAL AUDIT)
                        </label>
                        <span className="text-[9px] text-slate-500">FACOLTATIVO • DESELEZIONABILE</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('click');
                                setPsychology(prev => prev === 'CONFIDENCE' ? null : 'CONFIDENCE');
                            }}
                            className={`min-h-[44px] py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                                psychology === 'CONFIDENCE'
                                    ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981] shadow-sm'
                                    : 'glass-subcard text-slate-400 hover:text-white'
                            }`}
                        >
                            <Smile className="w-4 h-4" />
                            <span>CONFIDENCE</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('click');
                                setPsychology(prev => prev === 'NEUTRAL' ? null : 'NEUTRAL');
                            }}
                            className={`min-h-[44px] py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                                psychology === 'NEUTRAL'
                                    ? 'bg-[#2563EB]/25 text-[#60A5FA] border-[#2563EB] shadow-sm'
                                    : 'glass-subcard text-slate-400 hover:text-white'
                            }`}
                        >
                            <Meh className="w-4 h-4" />
                            <span>NEUTRAL</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('click');
                                setPsychology(prev => prev === 'FEAR' ? null : 'FEAR');
                            }}
                            className={`min-h-[44px] py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                                psychology === 'FEAR'
                                    ? 'bg-[#DC2626]/20 text-[#DC2626] border-[#DC2626] shadow-sm'
                                    : 'glass-subcard text-slate-400 hover:text-white'
                            }`}
                        >
                            <Frown className="w-4 h-4" />
                            <span>FEAR</span>
                        </button>
                    </div>
                </div>

                {/* 6. DISCIPLINE PROTOCOL (ERROR TRACKER) - PURAMENTE FACOLTATIVO */}
                <div className="space-y-2 pt-1 font-mono">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            ERROR TRACKER (FACOLTATIVO)
                        </label>
                        <span className="text-[9px] text-[#DC2626]">SELEZIONA SOLO SE APPLICABILE</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        {errorTags.map(err => {
                            const isSelected = selectedErrors.includes(err);
                            return (
                                <button
                                    key={err}
                                    type="button"
                                    onClick={() => toggleError(err)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                        isSelected
                                            ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-md shadow-[#DC2626]/25'
                                            : 'glass-subcard text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    {err}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 7. NOTE TECNICHE DI SESSIONE */}
                <div className="space-y-1.5 pt-1 font-mono">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        SESSION REASONING & SETUP NOTES (FACOLTATIVO)
                    </label>
                    <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Note opzionali o trigger tecnico..."
                        className="w-full p-3 rounded-xl glass-subcard text-white text-xs font-mono placeholder:text-slate-500 focus:border-[#10B981] focus:outline-none transition-colors resize-none"
                    />
                </div>

                {/* 8. PULSANTE FLESSIBILE "COMMIT SESSION LOG" */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full min-h-[52px] h-13 rounded-xl font-sans font-black text-xs uppercase tracking-wider transition-all duration-200 active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                        isSubmitting
                            ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-wait opacity-70'
                            : breakerStatus.isBlocked
                            ? 'bg-rose-700 hover:bg-rose-600 text-white shadow-rose-900/30'
                            : 'bg-[#10B981] hover:bg-[#059669] text-white shadow-[#10B981]/25'
                    }`}
                >
                    <Zap className="w-4 h-4 text-white" />
                    <span>
                        {isSubmitting 
                            ? 'COMMITTING TO VAULT...' 
                            : breakerStatus.isBlocked 
                            ? `BLOCCO COOLDOWN (${formatCountdown(breakerStatus.remainingSeconds)}) - CLICCA PER SBLOCCARE` 
                            : 'COMMIT SESSION LOG'}
                    </span>
                </button>

            </form>

            {/* GUIDED BREATHING PRE-COMMIT MODAL */}
            {showBreathing && pendingCommitData && (
                <GuidedBreathingModal
                    isOpen={showBreathing}
                    onComplete={() => executeCommit(pendingCommitData)}
                    onSkip={() => executeCommit(pendingCommitData)}
                    reason={
                        selectedErrors.includes('REVENGE TRADING') 
                            ? 'Rilevato tag REVENGE TRADING: Centra il tuo respiro prima di confermare!'
                            : selectedErrors.includes('FOMO')
                            ? 'Rilevato bias FOMO: 5 secondi di respiro per proteggere il tuo capitale.'
                            : 'L\'operazione precedente era in perdita. Ritrova il centro emotivo.'
                    }
                />
            )}

            {/* LUXURY STORY CARD MODAL */}
            {showStoryModal && lastCommittedTrade && (
                <StoryCardModal
                    trade={lastCommittedTrade}
                    onClose={() => setShowStoryModal(false)}
                />
            )}

        </div>
    );
};

export default TabTrade;
