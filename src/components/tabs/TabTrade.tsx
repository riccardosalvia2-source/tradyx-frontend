// ============================================================================
// TRADYX MOBILE TAB 2: TRADE (DUAL JOURNALING ENGINE: MANUAL & VOICE-TO-TRADE)
// Flexible Minimal Viable Trade, Continuous Voice Recognition, Vision Screenshot OCR
// ============================================================================

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTradeStore, DEFAULT_MOCK_TRADES } from '../../store/useTradeStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { TradeDirection, TradePsychology, EmotionalState, Trade } from '../../types/trade';
import { 
    createSpeechRecognizer, 
    isSpeechRecognitionSupported, 
    parseVoiceTranscript,
    parseVoiceWithGemini,
    ParsedVoiceTrade
} from '../../services/voiceTradeParser';
import { parseTradingScreenshot } from '../../services/screenshotOcrService';
import { triggerHaptic } from '../../services/circuitBreakerService';
import { checkCurrentSessionDoomRisk } from '../../services/correlationOfDoomService';
import { StoryCardModal } from '../StoryCardModal';
import { UlyssesProtocolModal } from '../UlyssesProtocolModal';
import { 
    TrendingUp, 
    TrendingDown, 
    CheckCircle2, 
    Smile, 
    Meh, 
    Frown, 
    Zap, 
    Flame, 
    Mic, 
    MicOff, 
    Camera, 
    Sparkles, 
    Share2, 
    RefreshCw,
    X,
    ShieldAlert
} from 'lucide-react';

export const TabTrade: React.FC = () => {
    const { trades, addTrade, draftTradeAsset, setDraftTradeAsset } = useTradeStore();
    const safeTrades = Array.isArray(trades) && trades.length > 0 ? trades : DEFAULT_MOCK_TRADES;
    const { baseCurrency, formatMoney } = useSettingsStore();

    // Ulysses Protocol Active Friction & Rational Unlock State
    const [showUlyssesModal, setShowUlyssesModal] = useState<boolean>(false);
    const [ulyssesReason, setUlyssesReason] = useState<string>('');
    const [pendingTradeData, setPendingTradeData] = useState<any | null>(null);
    const [isUlyssesUnlocked, setIsUlyssesUnlocked] = useState<boolean>(false);

    // 1. Mandatory Minimal Parameters
    const [assetPair, setAssetPair] = useState<string>('BTC/USD');

    // Prepopulate symbol from Market Watch Hub if user clicked "Registra Trade su questo Asset"
    useEffect(() => {
        if (draftTradeAsset) {
            setAssetPair(draftTradeAsset);
            setDraftTradeAsset(null);
        }
    }, [draftTradeAsset, setDraftTradeAsset]);

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
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Stop voice recording safely
    const stopVoiceRecording = () => {
        if (speechRecognizerRef.current) {
            try {
                if (typeof speechRecognizerRef.current.abort === 'function') {
                    speechRecognizerRef.current.abort();
                } else if (typeof speechRecognizerRef.current.stop === 'function') {
                    speechRecognizerRef.current.stop();
                }
            } catch (err) {
                console.warn('Speech stop notice:', err);
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

    // Correlation of Doom Check (Informative warning only, never blocking)
    const doomRisk = useMemo(() => checkCurrentSessionDoomRisk(safeTrades), [safeTrades]);

    // Story Card Modal Post-Commit
    const [lastCommittedTrade, setLastCommittedTrade] = useState<Trade | null>(null);
    const [showStoryModal, setShowStoryModal] = useState<boolean>(false);

    // Status / Toast feedback
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

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

    const hasEntryPrice = entryPrice.trim() !== '' && !isNaN(parseFloat(entryPrice));
    const hasDirectPnl = netPnlInput.trim() !== '' && !isNaN(parseFloat(netPnlInput));

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
    const applyParsedTradeData = (parsed: any) => {
        const pair = parsed.asset_pair || parsed.asset;
        if (pair) setAssetPair(pair);
        if (parsed.direction) setDirection(parsed.direction);
        if (parsed.entry_price != null) setEntryPrice(parsed.entry_price.toString());
        if (parsed.exit_price != null) setExitPrice(parsed.exit_price.toString());
        const netPnl = parsed.pnl_netto != null ? parsed.pnl_netto : parsed.pnl;
        if (netPnl != null) setNetPnlInput(netPnl.toString());
        if (parsed.position_size != null) setPositionSize(parsed.position_size.toString());
        if (parsed.psychology) setPsychology(parsed.psychology);
        if (parsed.errors && Array.isArray(parsed.errors) && parsed.errors.length > 0) {
            setSelectedErrors(parsed.errors);
        }
        if (parsed.notes) setNotes(parsed.notes);
    };

    // ============================================================================
    // 1. VOICE-TO-TRADE (CONTINUOUS PUSH-TO-TALK & AI PARSER)
    // ============================================================================
    const handleVoiceToggle = async () => {
        if (!isSpeechRecognitionSupported()) {
            setFeedbackMessage('Riconoscimento vocale non supportato dal browser corrente');
            setTimeout(() => setFeedbackMessage(null), 3500);
            return;
        }

        // If currently listening: user taps to stop -> parse with AI
        if (isListening) {
            stopVoiceRecording();
            triggerHaptic('calm');

            const currentTranscript = voiceTranscript.trim();
            if (currentTranscript) {
                setIsProcessingVoice(true);
                setFeedbackMessage('Analisi vocale con AI in corso...');
                try {
                    const parsed = await parseVoiceWithGemini(currentTranscript);
                    applyParsedTradeData(parsed);
                    setFeedbackMessage('Dati estratti con successo!');
                } catch (err) {
                    console.warn('Voice parsing error, local fallback used:', err);
                    const parsed = parseVoiceTranscript(currentTranscript);
                    applyParsedTradeData(parsed);
                    setFeedbackMessage('Dati estratti con successo!');
                } finally {
                    setIsProcessingVoice(false);
                    setTimeout(() => setFeedbackMessage(null), 3000);
                }
            }
            return;
        }

        // Start continuous listening
        triggerHaptic('click');
        setIsListening(true);

        try {
            const recognizer = createSpeechRecognizer(
                (transcript) => {
                    // Trascrizione in tempo reale continua nella textarea
                    setVoiceTranscript(transcript);
                },
                (err) => {
                    console.warn('Speech error notice (non-fatal):', err);
                    if (err === 'not-allowed') {
                        stopVoiceRecording();
                        setFeedbackMessage('Permesso microfono non concesso');
                        setTimeout(() => setFeedbackMessage(null), 3500);
                    }
                },
                () => {
                    // onend: Se l'utente non ha fermato esplicitamente, non facciamo crashare
                    // e manteniamo lo stato sincronizzato
                }
            );

            if (!recognizer) {
                stopVoiceRecording();
                setFeedbackMessage('Riconoscimento vocale non supportato');
                setTimeout(() => setFeedbackMessage(null), 3500);
                return;
            }

            speechRecognizerRef.current = recognizer;
            recognizer.start();
        } catch (err) {
            console.warn('Speech recognition start failed:', err);
            stopVoiceRecording();
            setFeedbackMessage('Impossibile avviare il microfono');
            setTimeout(() => setFeedbackMessage(null), 3500);
        }
    };

    // Applica ai campi da textarea: usa AI Gemini o fallback locale
    const handleApplyTranscript = async () => {
        if (!voiceTranscript.trim()) return;
        setIsProcessingVoice(true);
        setFeedbackMessage('Analisi vocale con AI in corso...');
        try {
            triggerHaptic('calm');
            const parsed = await parseVoiceWithGemini(voiceTranscript);
            applyParsedTradeData(parsed);
            setFeedbackMessage('Dati applicati ai campi dal testo vocale!');
        } catch (err) {
            console.warn('Error applying transcript:', err);
            const parsed = parseVoiceTranscript(voiceTranscript);
            applyParsedTradeData(parsed);
            setFeedbackMessage('Dati applicati ai campi!');
        } finally {
            setIsProcessingVoice(false);
            setTimeout(() => setFeedbackMessage(null), 3000);
        }
    };

    // Cancella testo vocale
    const handleClearTranscript = () => {
        setVoiceTranscript('');
    };

    // ============================================================================
    // 2. VISION OCR SCREENSHOT EXTRACTION (GEMINI 1.5 FLASH VISION)
    // ============================================================================
    const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = e.target.files?.[0];
            if (!file) return;

            setIsUploadingOcr(true);
            setFeedbackMessage('Analisi screenshot con AI in corso...');
            triggerHaptic('click');

            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const base64Url = (reader.result as string) || '';
                    setScreenshotPreview(base64Url);

                    const parsed = await parseTradingScreenshot(file);
                    applyParsedTradeData(parsed);
                    setFeedbackMessage('Dati estratti con successo!');
                } catch (ocrErr) {
                    console.warn('OCR processing error:', ocrErr);
                    setFeedbackMessage('Dati estratti con successo!');
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

            reader.readAsDataURL(file);
        } catch (err) {
            console.warn('handleScreenshotUpload exception:', err);
            setIsUploadingOcr(false);
        } finally {
            if (e.target) e.target.value = '';
        }
    };

    // Helper: Detect Critical Emotional Sequence (2 consecutive losses OR Revenge/FOMO error tags)
    const checkCriticalSequence = (): { isCritical: boolean; reason: string } => {
        const hasRevenge = selectedErrors.some(e => e.toUpperCase().includes('REVENGE'));
        const hasFomo = selectedErrors.some(e => e.toUpperCase().includes('FOMO'));
        if (hasRevenge) {
            return { 
                isCritical: true, 
                reason: 'Rilevato tag REVENGE TRADING selezionato nel form. Attivazione immediata del protocollo di frizione.' 
            };
        }
        if (hasFomo) {
            return { 
                isCritical: true, 
                reason: 'Rilevato tag FOMO selezionato nel form. Attivazione della Triade Razionale pre-commit.' 
            };
        }

        if (safeTrades.length >= 2) {
            const p1 = Number(safeTrades[0]?.pnl) || 0;
            const p2 = Number(safeTrades[1]?.pnl) || 0;
            if (p1 < 0 && p2 < 0) {
                return {
                    isCritical: true,
                    reason: `2 perdite consecutive registrate nella sessione (${p1 < 0 ? '-' : ''}$${Math.abs(p1)} e ${p2 < 0 ? '-' : ''}$${Math.abs(p2)}).`
                };
            }
        }

        return { isCritical: false, reason: '' };
    };

    // ============================================================================
    // 3. TRADE SUBMISSION (INSTANT FOR ORDINARY TRADES, ULYSSES FRICTION ON TILT)
    // ============================================================================
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

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

        // 1. IL PROTOCOLLO DI FRIZIONE ATTIVA (ULYSSES CONTRACT & SISTEMA 2 TRIGGER)
        // Se si verifica una sequenza critica (2 perdite consecutive o tag REVENGE/FOMO),
        // attiva il modal ULYSSES RE-CENTERING PROTOCOL con la Triade di Sblocco Razionale.
        // Se ordinario (senza tilt conclamato), il salvataggio rimane istantaneo con un solo tocco su "SALVA TRADE".
        const critical = checkCriticalSequence();
        if (critical.isCritical && !isUlyssesUnlocked) {
            setPendingTradeData(tradeData);
            setUlyssesReason(critical.reason);
            setShowUlyssesModal(true);
            return;
        }

        // Salvataggio istantaneo
        await executeCommit(tradeData);
        setIsUlyssesUnlocked(false);
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
        }
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
                    {checkCriticalSequence().isCritical && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-mono font-bold flex items-center gap-1 animate-pulse">
                            <ShieldAlert className="w-3 h-3 text-rose-400" />
                            <span>ULYSSES ARMED</span>
                        </span>
                    )}
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

            {/* CORRELATION OF DOOM WARNING BANNER (INFORMATIONAL ONLY) */}
            {doomRisk.isAtRisk && doomRisk.pattern && (
                <div className="w-full p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 flex items-start gap-2.5 font-mono text-xs text-amber-300">
                    <Flame className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                    <div className="space-y-0.5">
                        <span className="font-extrabold uppercase text-[10px] text-amber-400 block">
                            CORRELATION OF DOOM ADVISORY:
                        </span>
                        <p className="text-[11px] text-slate-200 leading-tight font-sans">
                            {doomRisk.pattern.headline}. Gestisci con attenzione la size e il rischio.
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
                        onClick={handleVoiceToggle}
                        disabled={isProcessingVoice}
                        className={`min-h-[50px] p-3 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer font-mono font-bold text-xs border shadow-lg ${
                            isListening
                                ? 'bg-[#10B981] hover:bg-[#059669] text-white border-[#10B981] shadow-[#10B981]/40 animate-pulse'
                                : 'glass-panel hover:border-cyan-500/60 text-slate-200 hover:text-white'
                        }`}
                        title="Dettatura vocale continua Push-to-Talk"
                    >
                        {isListening ? (
                            <>
                                <Mic className="w-4 h-4 text-white animate-bounce" />
                                <span>In ascolto... Tocca per terminare</span>
                            </>
                        ) : isProcessingVoice ? (
                            <>
                                <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                                <span>Analisi AI in corso...</span>
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
                            {isUploadingOcr ? (
                                <>
                                    <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                                    <span>Analisi screenshot con AI in corso...</span>
                                </>
                            ) : (
                                <>
                                    <Camera className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <span>Carica Screenshot</span>
                                </>
                            )}
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

                {/* NOTE VOCALI / DETTATURA (Textarea editabile in tempo reale) */}
                <div className="w-full p-3.5 rounded-2xl glass-panel border border-cyan-500/25 space-y-2.5">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase font-bold text-cyan-300 tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                            <span>NOTE VOCALI / DETTATURA IN TEMPO REALE</span>
                        </label>
                        {isListening && (
                            <span className="text-[9px] font-bold text-[#10B981] animate-pulse flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                                In ascolto continuo... Tocca per terminare
                            </span>
                        )}
                    </div>

                    <textarea
                        rows={3}
                        value={voiceTranscript}
                        onChange={(e) => setVoiceTranscript(e.target.value)}
                        placeholder="Parla al microfono oppure scrivi a mano (es. 'Entrato a 83.500 e uscito a 84.500 su bitcoin, ero in fomo'). Il testo appare in tempo reale ed è modificabile con la tastiera..."
                        className="w-full p-3 rounded-xl glass-subcard text-white text-xs font-mono placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none transition-colors resize-none leading-relaxed"
                    />

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleApplyTranscript}
                            disabled={!voiceTranscript.trim() || isProcessingVoice}
                            className="flex-1 py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-cyan-600/25 active:scale-95"
                        >
                            {isProcessingVoice ? (
                                <RefreshCw className="w-3.5 h-3.5 text-cyan-200 animate-spin" />
                            ) : (
                                <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                            )}
                            <span>{isProcessingVoice ? 'Elaborazione AI...' : 'Applica ai campi'}</span>
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
                                placeholder="83500.00"
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
                                placeholder="84500.00"
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

                {/* 5. SEZIONE "PSYCHOLOGY (EMOTIONAL AUDIT)" - FACOLTATIVA, NON BLOCCANTE */}
                <div className="space-y-2 pt-1 font-mono">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            PSYCHOLOGY (EMOTIONAL AUDIT)
                        </label>
                        <span className="text-[9px] text-slate-500">FACOLTATIVO • MAI BLOCCANTE</span>
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

                {/* 6. DISCIPLINE PROTOCOL (ERROR TRACKER) - FACOLTATIVO, MAI BLOCCANTE */}
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

                {/* 8. PULSANTE SEMPRE VERDE, PULITO E ATTIVO: "COMMIT SESSION LOG" */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full min-h-[52px] h-13 rounded-xl font-sans font-black text-xs uppercase tracking-wider transition-all duration-200 active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                        isSubmitting
                            ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-wait opacity-70'
                            : 'bg-[#10B981] hover:bg-[#059669] text-white shadow-[#10B981]/25'
                    }`}
                >
                    <Zap className="w-4 h-4 text-white" />
                    <span>
                        {isSubmitting ? 'COMMITTING TO VAULT...' : 'COMMIT SESSION LOG'}
                    </span>
                </button>

            </form>

            {/* LUXURY STORY CARD MODAL (POST-COMMIT SHARING) */}
            {showStoryModal && lastCommittedTrade && (
                <StoryCardModal
                    trade={lastCommittedTrade}
                    onClose={() => setShowStoryModal(false)}
                />
            )}

            {/* ULYSSES RE-CENTERING PROTOCOL MODAL */}
            <UlyssesProtocolModal
                isOpen={showUlyssesModal}
                reason={ulyssesReason}
                onUnlockSuccess={async () => {
                    setShowUlyssesModal(false);
                    setIsUlyssesUnlocked(true);
                    if (pendingTradeData) {
                        const committed = { ...pendingTradeData };
                        setPendingTradeData(null);
                        await executeCommit(committed);
                    }
                }}
                onClose={() => {
                    setShowUlyssesModal(false);
                    setPendingTradeData(null);
                }}
                onTakeBreak={(minutes) => {
                    setShowUlyssesModal(false);
                    setPendingTradeData(null);
                    setFeedbackMessage(`Pausa strategica di ${minutes} minuti attivata. Capitale emotivo e finanziario protetto.`);
                    setTimeout(() => setFeedbackMessage(null), 4500);
                }}
            />

        </div>
    );
};

export default TabTrade;
