// ============================================================================
// TRADYX VOICE-TO-TRADE PARSER & SPEECH RECOGNITION SERVICE
// (src/services/voiceTradeParser.ts)
// ============================================================================

import { TradeDirection, TradePsychology } from '../types/trade';

export interface ParsedVoiceTrade {
    asset_pair?: string;
    direction?: TradeDirection;
    entry_price?: number;
    exit_price?: number;
    pnl?: number;
    position_size?: number;
    risk_reward?: string;
    psychology?: TradePsychology;
    errors?: string[];
    notes?: string;
    rawTranscript: string;
}

// Check Web Speech API browser availability
export function isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

/**
 * Creates and starts a SpeechRecognition instance with listeners.
 */
export function createSpeechRecognizer(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (err: any) => void,
    onEnd: () => void,
    language = 'it-IT'
) {
    if (!isSpeechRecognitionSupported()) {
        onError(new Error('Web Speech API non supportata in questo browser.'));
        return null;
    }

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionClass();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        const text = finalTranscript || interimTranscript;
        onResult(text, !!finalTranscript);
    };

    recognition.onerror = (event: any) => {
        onError(event.error || event);
    };

    recognition.onend = () => {
        onEnd();
    };

    return recognition;
}

/**
 * Client heuristic voice sentence parser.
 * Handles phrases like:
 * - "Long su BTC da 67000"
 * - "Perso 200 su ETH per FOMO"
 * - "Short Nvidia da 135 chiuso a 128 profitto 1400"
 * - "Comprato Solana a 155 stop 150 overtrading"
 */
export function parseVoiceTranscript(rawText: string): ParsedVoiceTrade {
    const text = rawText.trim();
    const lower = text.toLowerCase();
    const parsed: ParsedVoiceTrade = {
        rawTranscript: text,
        notes: text
    };

    // 1. Asset Detection
    const assetMap: Record<string, string> = {
        'btc': 'BTC/USD',
        'bitcoin': 'BTC/USD',
        'eth': 'ETH/USD',
        'ethereum': 'ETH/USD',
        'ether': 'ETH/USD',
        'sol': 'SOL/USD',
        'solana': 'SOL/USD',
        'eur': 'EUR/USD',
        'euro': 'EUR/USD',
        'eurusd': 'EUR/USD',
        'gold': 'GOLD/USD',
        'oro': 'GOLD/USD',
        'xau': 'GOLD/USD',
        'aapl': 'AAPL',
        'apple': 'AAPL',
        'nvda': 'NVDA',
        'nvidia': 'NVDA',
        'tsla': 'TSLA',
        'tesla': 'TSLA'
    };

    for (const [key, symbol] of Object.entries(assetMap)) {
        // match word boundary
        const regex = new RegExp(`\\b${key}\\b`, 'i');
        if (regex.test(lower)) {
            parsed.asset_pair = symbol;
            break;
        }
    }

    // 2. Direction Detection
    if (/\b(long|buy|compra|comprato|acquisto|rialzo|su|longato)\b/i.test(lower)) {
        parsed.direction = 'LONG';
    } else if (/\b(short|sell|vendi|venduto|vendita|ribasso|giù|shortato)\b/i.test(lower)) {
        parsed.direction = 'SHORT';
    }

    // 3. PnL Detection
    // "perso 200", "loss 350", "-200", "perdita 400"
    const lossMatch = lower.match(/\b(?:perso|loss|perdita di|meno|-)\s*(\d+(?:[.,]\d+)?)/i);
    if (lossMatch) {
        const val = parseFloat(lossMatch[1].replace(',', '.'));
        if (!isNaN(val)) parsed.pnl = -Math.abs(val);
    } else {
        // "guadagnato 500", "profitto 500", "+500", "preso 300", "utile 400"
        const gainMatch = lower.match(/\b(?:guadagnato|profitto|preso|utile|fatto|più|\+)\s*(\d+(?:[.,]\d+)?)/i);
        if (gainMatch) {
            const val = parseFloat(gainMatch[1].replace(',', '.'));
            if (!isNaN(val)) parsed.pnl = Math.abs(val);
        }
    }

    // 4. Entry Price Detection
    // "da 67000", "a 67k", "prezzo 67000", "entry 67000", "entrato a 145"
    const entryMatch = lower.match(/\b(?:da|entrato a|entry|aperto a|prezzo di entrata|prezzo)\s*(\d+(?:[.,]\d+)?)(k)?\b/i);
    if (entryMatch) {
        let val = parseFloat(entryMatch[1].replace(',', '.'));
        if (entryMatch[2]) val *= 1000;
        if (!isNaN(val) && val > 0) parsed.entry_price = val;
    }

    // 5. Exit Price Detection
    // "chiuso a 68000", "uscito a 68000", "exit 68000", "target 68000"
    const exitMatch = lower.match(/\b(?:chiuso a|uscito a|exit|uscita|target a|venduto a)\s*(\d+(?:[.,]\d+)?)(k)?\b/i);
    if (exitMatch) {
        let val = parseFloat(exitMatch[1].replace(',', '.'));
        if (exitMatch[2]) val *= 1000;
        if (!isNaN(val) && val > 0) parsed.exit_price = val;
    }

    // 6. Discipline Errors Detection
    const detectedErrors: string[] = [];
    if (/\b(fomo)\b/i.test(lower)) detectedErrors.push('FOMO');
    if (/\b(overtrading|troppi trade)\b/i.test(lower)) detectedErrors.push('OVERTRADING');
    if (/\b(no stop|senza stop|no stop loss)\b/i.test(lower)) detectedErrors.push('NO STOP LOSS');
    if (/\b(revenge|vendetta|recupero|rabbia)\b/i.test(lower)) detectedErrors.push('REVENGE TRADING');
    if (/\b(early exit|uscito presto|chiuso prima)\b/i.test(lower)) detectedErrors.push('EARLY EXIT');

    if (detectedErrors.length > 0) {
        parsed.errors = detectedErrors;
    }

    // 7. Psychology State
    if (/\b(confidence|sicuro|disciplinato|calmo|tranquillo)\b/i.test(lower)) {
        parsed.psychology = 'CONFIDENCE';
    } else if (/\b(fear|paura|ansia|agitato|preoccupato)\b/i.test(lower)) {
        parsed.psychology = 'FEAR';
    } else if (/\b(neutrale|normale|indifferente)\b/i.test(lower)) {
        parsed.psychology = 'NEUTRAL';
    }

    return parsed;
}

/**
 * Enhanced parser using Gemini API (if key available) or fallback to heuristic parser.
 */
export async function parseVoiceWithGemini(transcript: string): Promise<ParsedVoiceTrade> {
    const geminiApiKey = import.meta.env?.VITE_GEMINI_API_KEY || 
                         import.meta.env?.GEMINI_API_KEY || 
                         (typeof process !== 'undefined' ? process.env?.VITE_GEMINI_API_KEY : undefined);

    if (!geminiApiKey || geminiApiKey === 'dummy_gemini_key') {
        return parseVoiceTranscript(transcript);
    }

    try {
        const prompt = `Sei un parser di ordini di trading istituzionale. Estrai i parametri da questa frase pronunciata dal trader: "${transcript}".
Rispondi ESCLUSIVAMENTE con un oggetto JSON valido (senza markdown o testo intorno) con questi campi opzionali se presenti:
{
  "asset_pair": string ("BTC/USD", "ETH/USD", "SOL/USD", "AAPL", "NVDA", "EUR/USD", etc.),
  "direction": "LONG" | "SHORT",
  "entry_price": number,
  "exit_price": number,
  "pnl": number,
  "position_size": number,
  "errors": string[] (valori possibili: "FOMO", "OVERTRADING", "NO STOP LOSS", "REVENGE TRADING", "EARLY EXIT"),
  "psychology": "CONFIDENCE" | "NEUTRAL" | "FEAR",
  "notes": string
}`;

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }]
            })
        });

        if (res.ok) {
            const data = await res.json();
            const textReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textReply) {
                const cleaned = textReply.replace(/```json/g, '').replace(/```/g, '').trim();
                const jsonParsed = JSON.parse(cleaned);
                return {
                    ...jsonParsed,
                    rawTranscript: transcript
                };
            }
        }
    } catch (e) {
        console.warn('Gemini voice parsing fallback to client parser:', e);
    }

    return parseVoiceTranscript(transcript);
}
