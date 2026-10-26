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
    try {
        return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    } catch {
        return false;
    }
}

/**
 * Creates and starts a SpeechRecognition instance with listeners.
 * Fully protected with try-catch and non-blocking error handling.
 */
/**
 * Helper to parse price strings in Italian/International formats
 * Correctly handles "83.500" as 83500 and "1.0850" as 1.0850.
 */
export function parseTradingPrice(raw: string): number {
    if (!raw) return 0;
    let s = raw.trim().toLowerCase();
    let multiplier = 1;
    if (s.endsWith('k')) {
        multiplier = 1000;
        s = s.slice(0, -1);
    }
    // Pattern like "83.500" or "83,500" where dot/comma is thousands separator
    if (/^\d{1,3}[.,]\d{3}$/.test(s)) {
        s = s.replace(/[.,]/g, '');
    } else if (/^\d{1,3}[.,]\d{3}[.,]\d{3}$/.test(s)) {
        s = s.replace(/[.,]/g, '');
    } else {
        s = s.replace(',', '.');
    }
    const val = parseFloat(s) * multiplier;
    return isNaN(val) ? 0 : val;
}

/**
 * Creates a SpeechRecognition instance configured for continuous listening.
 * Microphone stays active until user explicitly stops it.
 */
export function createSpeechRecognizer(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (err: any) => void,
    onEnd: () => void,
    language = 'it-IT'
) {
    if (!isSpeechRecognitionSupported()) {
        try {
            onError('not-supported');
        } catch (e) {
            console.warn('Error callback failure:', e);
        }
        return null;
    }

    try {
        const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognitionClass) {
            try {
                onError('not-supported');
            } catch (e) {
                console.warn('Error callback failure:', e);
            }
            return null;
        }

        const recognition = new SpeechRecognitionClass();

        // Push-to-talk / manual toggle: continuous listening without premature cut-off!
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
            try {
                let fullTranscript = '';
                for (let i = 0; i < event.results.length; ++i) {
                    fullTranscript += event.results[i][0].transcript + ' ';
                }
                const text = fullTranscript.trim();
                onResult(text, false);
            } catch (err) {
                console.warn('Speech onresult error:', err);
            }
        };

        recognition.onerror = (event: any) => {
            const errCode = event?.error || 'speech_error';
            console.warn('Speech error notice:', errCode);
            try {
                onError(errCode);
            } catch (e) {
                console.warn('Speech onError handler failed:', e);
            }
        };

        recognition.onend = () => {
            try {
                onEnd();
            } catch (e) {
                console.warn('Speech onEnd handler failed:', e);
            }
        };

        return recognition;
    } catch (err) {
        console.warn('SpeechRecognition initialization error:', err);
        try {
            onError(err);
        } catch {}
        return null;
    }
}

/**
 * Client heuristic voice sentence parser for Italian trading terminology.
 * Handles phrases like:
 * - "Long su bitcoin entrato a 83.500 e uscito a 84.500"
 * - "Short solana da 155 chiuso a 148 ero in fomo profitto 700"
 * - "Comprato ether a 3400 stop 3350 confidente"
 */
export function parseVoiceTranscript(rawText: string = ''): ParsedVoiceTrade {
    try {
        const text = (rawText || '').trim();
        const lower = text.toLowerCase();
        const parsed: ParsedVoiceTrade = {
            rawTranscript: text,
            notes: text
        };

        if (!text) {
            return parsed;
        }

        // 1. Asset Detection (oral forms in Italian/English)
        const assetMap: Record<string, string> = {
            'bitcoin': 'BTC/USD',
            'btc': 'BTC/USD',
            'ethereum': 'ETH/USD',
            'ether': 'ETH/USD',
            'eth': 'ETH/USD',
            'solana': 'SOL/USD',
            'sol': 'SOL/USD',
            'euro dollaro': 'EUR/USD',
            'eurusd': 'EUR/USD',
            'euro': 'EUR/USD',
            'eur': 'EUR/USD',
            'oro': 'GOLD/USD',
            'gold': 'GOLD/USD',
            'xau': 'GOLD/USD',
            'apple': 'AAPL',
            'aapl': 'AAPL',
            'nvidia': 'NVDA',
            'nvda': 'NVDA',
            'tesla': 'TSLA',
            'tsla': 'TSLA',
            'binance': 'BNB/USD',
            'bnb': 'BNB/USD',
            'spy': 'SPY',
            'qqq': 'QQQ'
        };

        for (const [key, symbol] of Object.entries(assetMap)) {
            const regex = new RegExp(`\\b${key}\\b`, 'i');
            if (regex.test(lower)) {
                parsed.asset_pair = symbol;
                break;
            }
        }

        // 2. Direction Detection
        if (/\b(long|buy|compra|comprato|acquisto|salita|rialzo|su|longato)\b/i.test(lower)) {
            parsed.direction = 'LONG';
        } else if (/\b(short|sell|vendi|venduto|vendita|discesa|ribasso|giù|shortato)\b/i.test(lower)) {
            parsed.direction = 'SHORT';
        }

        // 3. PnL / Performance Detection
        const lossMatch = lower.match(/\b(?:perso|loss|perdita di|perdita|meno|-|sotto)\s*(\d+(?:[.,]\d+)?)/i);
        if (lossMatch) {
            const val = parseTradingPrice(lossMatch[1]);
            if (val > 0) parsed.pnl = -val;
        } else {
            const gainMatch = lower.match(/\b(?:guadagnato|profitto di|profitto|preso|utile|fatto|più|\+|netto|pnl|performance)\s*(\d+(?:[.,]\d+)?)/i);
            if (gainMatch) {
                const val = parseTradingPrice(gainMatch[1]);
                if (val > 0) parsed.pnl = val;
            }
        }

        // 4. Entry Price Detection (e.g. "entrato a 83.500" or "entry 68000")
        const entryMatch = lower.match(/\b(?:da|entrato a|entrato|entry|aperto a|aperto|prezzo di entrata|prezzo|quota)\s*(\d+(?:[.,]\d+)?(?:k)?)\b/i);
        if (entryMatch) {
            const val = parseTradingPrice(entryMatch[1]);
            if (val > 0) parsed.entry_price = val;
        }

        // 5. Exit Price Detection (e.g. "uscito a 84.500" or "chiuso a 84500")
        const exitMatch = lower.match(/\b(?:chiuso a|chiuso|uscito a|uscito|exit|uscita|target a|target|venduto a)\s*(\d+(?:[.,]\d+)?(?:k)?)\b/i);
        if (exitMatch) {
            const val = parseTradingPrice(exitMatch[1]);
            if (val > 0) parsed.exit_price = val;
        }

        // 6. Generic Dual Numbers (e.g. "83500 e 84500" or "83.500 e 84.500")
        if (parsed.entry_price == null) {
            const dualMatch = lower.match(/(\d+(?:[.,]\d+)?(?:k)?)\s+(?:e|ed|a|to)\s+(\d+(?:[.,]\d+)?(?:k)?)/i);
            if (dualMatch) {
                const p1 = parseTradingPrice(dualMatch[1]);
                const p2 = parseTradingPrice(dualMatch[2]);
                if (p1 > 0 && p2 > 0) {
                    parsed.entry_price = p1;
                    parsed.exit_price = p2;
                }
            }
        }

        // 7. Discipline Errors Detection
        const detectedErrors: string[] = [];
        if (/\b(fomo|ero in fomo)\b/i.test(lower)) detectedErrors.push('FOMO');
        if (/\b(overtrading|troppi trade|troppe operazioni)\b/i.test(lower)) detectedErrors.push('OVERTRADING');
        if (/\b(no stop|senza stop|no stop loss|senza stop loss)\b/i.test(lower)) detectedErrors.push('NO STOP LOSS');
        if (/\b(revenge|vendetta|recupero|rabbia)\b/i.test(lower)) detectedErrors.push('REVENGE TRADING');
        if (/\b(early exit|uscito presto|chiuso prima)\b/i.test(lower)) detectedErrors.push('EARLY EXIT');

        if (detectedErrors.length > 0) {
            parsed.errors = detectedErrors;
        }

        // 8. Psychology State
        if (/\b(ansioso|ansia|paura|fear|preoccupato|agitato|stress)\b/i.test(lower)) {
            parsed.psychology = 'FEAR';
        } else if (/\b(confidence|confidente|ero confidente|sicuro|disciplinato|calmo|tranquillo|fiducia)\b/i.test(lower)) {
            parsed.psychology = 'CONFIDENCE';
        } else if (/\b(neutrale|normale|indifferente)\b/i.test(lower)) {
            parsed.psychology = 'NEUTRAL';
        }

        return parsed;
    } catch (err) {
        console.warn('parseVoiceTranscript error fallback:', err);
        return {
            rawTranscript: rawText || '',
            notes: rawText || ''
        };
    }
}

/**
 * Enhanced parser using Google Gemini API (gemini-1.5-flash) with specialized Italian trading prompt.
 * Falls back seamlessly to deterministic regex parser if key not present.
 */
export async function parseVoiceWithGemini(transcript: string): Promise<ParsedVoiceTrade> {
    const geminiApiKey = import.meta.env?.VITE_GEMINI_API_KEY || 
                         import.meta.env?.GEMINI_API_KEY || 
                         (typeof process !== 'undefined' ? (process.env?.VITE_GEMINI_API_KEY || process.env?.GEMINI_API_KEY) : undefined);

    if (!geminiApiKey || geminiApiKey === 'dummy_gemini_key' || geminiApiKey.includes('Dummy')) {
        return parseVoiceTranscript(transcript);
    }

    try {
        const prompt = `Sei un assistente istituzionale di trading. Analizza la seguente frase pronunciata in italiano da un trader ed estrai i parametri operativi.
IMPORTANTE SULLE CIFRE IN ITALIANO: Il punto è spesso usato come separatore delle migliaia (es. "83.500" = 83500, "84.500" = 84500, "1.500" = 1500).

Frase del trader: "${transcript}"

Rispondi ESCLUSIVAMENTE con un oggetto JSON valido (senza markdown o backtick \`\`\`json) avente questi campi:
{
  "asset_pair": string ("BTC/USD", "ETH/USD", "SOL/USD", "AAPL", "NVDA", "EUR/USD", etc.),
  "direction": "LONG" | "SHORT",
  "entry_price": number (es. 83500),
  "exit_price": number (es. 84500),
  "pnl": number,
  "position_size": number,
  "errors": string[] (valori: "FOMO", "OVERTRADING", "NO STOP LOSS", "REVENGE TRADING", "EARLY EXIT"),
  "psychology": "CONFIDENCE" | "NEUTRAL" | "FEAR",
  "notes": string
}`;

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
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
        console.warn('Gemini voice parsing notice, using local parser:', e);
    }

    return parseVoiceTranscript(transcript);
}
