// ============================================================================
// TRADYX VOICE-TO-TRADE PARSER & SPEECH RECOGNITION SERVICE
// (src/services/voiceTradeParser.ts)
// ============================================================================

import { TradeDirection, TradePsychology } from '../types/trade';
import { getApiAuthHeaders } from './authService';
import { GLOBAL_HUBS } from '../data/globalHubs';

export interface PreTradeCheckResult {
    risk_reward_ratio: string;
    estimated_risk_amount?: number | null;
    atlas_macro_alignment: 'ALLINEATO' | 'CONTROTREND_MACRO' | 'NEUTRALE';
    atlas_macro_note: string;
    risk_plan_violation: boolean;
    violation_reason?: string | null;
    verdict: 'APPROVATO' | 'ATTENZIONE' | 'VIOLAZIONE_PIANO';
}

export interface VoiceRiskPlanContext {
    accountType?: 'PROP_FIRM' | 'PERSONAL';
    monthlyBudget?: number;
    maxRiskPerTrade?: number;
    maxRiskType?: 'PERCENT' | 'FIXED';
    propFirmAccountSize?: number;
    propFirmMaxDailyLossPct?: number;
    dailyPnl?: number;
}

export interface AtlasMacroSnapshot {
    countryName: string;
    iso2: string;
    centralBank: string;
    policyRate: number;
    inflationCpi: number;
    gdpGrowth: number;
    yield10y: number;
    primaryIndex: string;
    fxPair: string;
}

export interface ParsedVoiceTrade {
    asset_pair?: string;
    direction?: TradeDirection;
    entry_price?: number;
    stop_loss?: number;
    take_profit?: number;
    exit_price?: number;
    pnl?: number;
    position_size?: number;
    risk_reward?: string;
    psychology?: TradePsychology;
    errors?: string[];
    notes?: string;
    rawTranscript: string;
    internal_reasoning?: string[];
    pre_trade_check?: PreTradeCheckResult;
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
 * Maps a ticker or spoken transcript to the most relevant ATLAS country macro hub
 * so pre-trade AI checks verify macro coherence (policy rates, CPI, 10Y yield).
 */
export function resolveAtlasMacroContextForAsset(assetOrText: string): AtlasMacroSnapshot {
    const upper = (assetOrText || '').toUpperCase();

    let targetIso2 = 'US';
    if (/(UCG|ISP|RACE|ENI|ENEL|FTSEMIB|MIB|BTP|ITALIA|MILANO)/.test(upper)) {
        targetIso2 = 'IT';
    } else if (/(DAX|SAP|SIE|BUND|GERMANIA|FRANCOFORTE)/.test(upper)) {
        targetIso2 = 'DE';
    } else if (/(CAC|LVMH|MC\.PA|OAT|FRANCIA|PARIGI)/.test(upper)) {
        targetIso2 = 'FR';
    } else if (/(GBP|FTSE|UKX|GILT|LONDRA|STERLINA)/.test(upper)) {
        targetIso2 = 'GB';
    } else if (/(JPY|N225|NIKKEI|GIAPPONE|TOKYO|YEN)/.test(upper)) {
        targetIso2 = 'JP';
    } else if (/(CHF|SMI|SVIZZERA|ZURIGO)/.test(upper)) {
        targetIso2 = 'CH';
    } else if (/(CNY|HSI|HANG SENG|CINA|SHANGHAI|BABA)/.test(upper)) {
        targetIso2 = 'CN';
    } else if (/(EUR\/USD|EURUSD|EURO|BCE|ECB)/.test(upper)) {
        targetIso2 = 'DE';
    }

    const hub = GLOBAL_HUBS.find((h) => h.iso2 === targetIso2) || GLOBAL_HUBS[0];
    return {
        countryName: hub.countryName,
        iso2: hub.iso2,
        centralBank: hub.macro.centralBank,
        policyRate: hub.macro.policyRate,
        inflationCpi: hub.macro.inflationCpi,
        gdpGrowth: hub.macro.gdpGrowth,
        yield10y: hub.bondYields.y10,
        primaryIndex: hub.primaryIndex.symbol,
        fxPair: hub.fxPairLabel
    };
}

/**
 * Extracts stop loss and take profit from Italian/English spoken phrases if present.
 */
function extractStopAndTarget(rawText: string): { stopLoss?: number; takeProfit?: number } {
    const slMatch = rawText.match(/(?:stop\s*loss|stop|sl)\s*(?:a|at|su)?\s*([\d.,]+k?)/i);
    const tpMatch = rawText.match(/(?:take\s*profit|target|tp|obiettivo)\s*(?:a|at|su)?\s*([\d.,]+k?)/i);
    const stopLoss = slMatch?.[1] ? parseTradingPrice(slMatch[1]) : undefined;
    const takeProfit = tpMatch?.[1] ? parseTradingPrice(tpMatch[1]) : undefined;
    return {
        stopLoss: stopLoss && stopLoss > 0 ? stopLoss : undefined,
        takeProfit: takeProfit && takeProfit > 0 ? takeProfit : undefined
    };
}

/**
 * Deterministic quantitative Pre-Trade Check (R:R math + ATLAS macro check + Risk Plan audit).
 * Used as a rock-solid fallback when server AI is unavailable or to validate extracted numbers.
 */
export function buildLocalPreTradeCheck(
    parsed: ParsedVoiceTrade,
    riskPlan?: VoiceRiskPlanContext,
    atlasMacro?: AtlasMacroSnapshot
): { pre_trade_check: PreTradeCheckResult; internal_reasoning: string[]; risk_reward?: string } {
    const macro = atlasMacro || resolveAtlasMacroContextForAsset(parsed.asset_pair || parsed.rawTranscript);
    const entry = parsed.entry_price;
    const sl = parsed.stop_loss;
    const tp = parsed.take_profit || parsed.exit_price;
    const size = parsed.position_size && parsed.position_size > 0 ? parsed.position_size : 1;
    const dir = parsed.direction || 'LONG';

    let rrRatioNum: number | null = null;
    let rrLabel = 'N/D (Stop Loss non specificato)';
    let estimatedRisk: number | null = null;

    if (entry && sl && entry !== sl) {
        const riskPerUnit = Math.abs(entry - sl);
        estimatedRisk = Number((riskPerUnit * size).toFixed(2));
        if (tp && tp !== entry) {
            const rewardPerUnit =
                dir === 'LONG' ? tp - entry : entry - tp;
            if (rewardPerUnit > 0) {
                rrRatioNum = Number((rewardPerUnit / riskPerUnit).toFixed(2));
                rrLabel = `1:${rrRatioNum}`;
            } else {
                rrLabel = 'Inverso (TP dal lato sbagliato)';
            }
        } else {
            rrLabel = 'SL presente · TP non definito';
        }
    }

    // Risk Plan Audit
    const capital =
        riskPlan?.accountType === 'PROP_FIRM'
            ? riskPlan.propFirmAccountSize || 100000
            : riskPlan?.monthlyBudget || 10000;
    const maxRiskAllowed =
        riskPlan?.maxRiskType === 'PERCENT'
            ? (capital * (riskPlan.maxRiskPerTrade || 2)) / 100
            : riskPlan?.maxRiskPerTrade || 200;

    const violations: string[] = [];
    if (!sl) {
        violations.push('Stop Loss assente nella descrizione del trade (esposizione potenzialmente illimitata).');
    }
    if (estimatedRisk !== null && estimatedRisk > maxRiskAllowed) {
        violations.push(
            `Rischio stimato ($${estimatedRisk.toLocaleString('en-US')}) superiore al limite del piano ($${maxRiskAllowed.toFixed(0)}/trade).`
        );
    }
    if (rrRatioNum !== null && rrRatioNum < 1.5) {
        violations.push(`Rapporto R:R (${rrLabel}) inferiore alla soglia minima istituzionale 1:1.5.`);
    }
    if (parsed.errors?.some((e) => /FOMO|REVENGE|OVERTRADING/i.test(e))) {
        violations.push(`Segnale emotivo critico rilevato nella nota (${parsed.errors.join(', ')}).`);
    }

    // ATLAS Macro Alignment
    const isRestrictiveRegime = macro.policyRate >= 4.0 || macro.inflationCpi >= 3.2;
    const isRiskAsset = /BTC|ETH|SOL|NVDA|TSLA|AAPL|NQ|NDX|SPX|DAX|FTSEMIB|UCG/i.test(
        parsed.asset_pair || ''
    );
    let alignment: PreTradeCheckResult['atlas_macro_alignment'] = 'NEUTRALE';
    let macroNote = `Contesto ${macro.countryName}: ${macro.centralBank} al ${macro.policyRate.toFixed(2)}%, CPI ${macro.inflationCpi.toFixed(1)}% e rendimento 10Y al ${macro.yield10y.toFixed(2)}%.`;

    if (isRiskAsset && isRestrictiveRegime && dir === 'LONG') {
        alignment = 'CONTROTREND_MACRO';
        macroNote = `Regime restrittivo in ${macro.countryName} (${macro.centralBank} ${macro.policyRate.toFixed(2)}%, 10Y ${macro.yield10y.toFixed(2)}%): un LONG su ${parsed.asset_pair || 'asset risk-on'} opera contro il costo del capitale elevato — richiedi conferma volumetrica e stop rigido.`;
    } else if (isRiskAsset && !isRestrictiveRegime && dir === 'LONG') {
        alignment = 'ALLINEATO';
        macroNote = `Regime accomodante/stabile in ${macro.countryName} (${macro.centralBank} ${macro.policyRate.toFixed(2)}%, CPI ${macro.inflationCpi.toFixed(1)}%): coerente con posizionamento LONG su ${parsed.asset_pair || macro.primaryIndex}.`;
    } else if (isRiskAsset && isRestrictiveRegime && dir === 'SHORT') {
        alignment = 'ALLINEATO';
        macroNote = `Tassi elevati (${macro.policyRate.toFixed(2)}%) e rendimenti ${macro.iso2}10Y al ${macro.yield10y.toFixed(2)}% comprimono i multipli: direzione SHORT coerente con la pressione macro di ${macro.countryName}.`;
    }

    const hasViolation = violations.length > 0;
    const verdict: PreTradeCheckResult['verdict'] =
        estimatedRisk !== null && estimatedRisk > maxRiskAllowed
            ? 'VIOLAZIONE_PIANO'
            : hasViolation
            ? 'ATTENZIONE'
            : 'APPROVATO';

    const reasoning = [
        `1. Parametri estratti: ${parsed.asset_pair || 'N/D'} ${dir}, entry=${entry ?? 'N/D'}, SL=${sl ?? 'ASSENTE'}, TP/Exit=${tp ?? 'N/D'}, size=${size}.`,
        `2. Matematica del rischio: R:R=${rrLabel}, rischio monetario stimato=${estimatedRisk !== null ? `$${estimatedRisk}` : 'non calcolabile senza SL'} vs tetto piano $${maxRiskAllowed.toFixed(0)}.`,
        `3. Verifica macro ATLAS (${macro.countryName}): ${macro.centralBank} ${macro.policyRate.toFixed(2)}%, CPI ${macro.inflationCpi.toFixed(1)}%, yield 10Y ${macro.yield10y.toFixed(2)}% -> ${alignment}.`,
        `4. Esito audit risk plan: ${hasViolation ? violations[0] : 'Conforme ai parametri operativi configurati.'}`
    ];

    return {
        risk_reward: rrRatioNum ? rrLabel : parsed.risk_reward,
        internal_reasoning: reasoning,
        pre_trade_check: {
            risk_reward_ratio: rrLabel,
            estimated_risk_amount: estimatedRisk,
            atlas_macro_alignment: alignment,
            atlas_macro_note: macroNote,
            risk_plan_violation: hasViolation,
            violation_reason: hasViolation ? violations.join(' ') : null,
            verdict
        }
    };
}

/**
 * Enhanced voice/text pre-trade parser routed strictly through server-side
 * `/api/ai/coach` (mode: VOICE_PARSE) with automatic R:R calculation, ATLAS
 * macro alignment check, and Risk Plan violation audit.
 */
export async function parseVoiceWithGemini(
    transcript: string,
    options?: {
        userRiskPlan?: VoiceRiskPlanContext;
        atlasMacroContext?: AtlasMacroSnapshot;
    }
): Promise<ParsedVoiceTrade> {
    if (!transcript || transcript.trim().length < 2) {
        return parseVoiceTranscript(transcript);
    }

    const localBaseline = parseVoiceTranscript(transcript);
    const { stopLoss, takeProfit } = extractStopAndTarget(transcript);
    if (stopLoss) localBaseline.stop_loss = stopLoss;
    if (takeProfit) localBaseline.take_profit = takeProfit;

    const macroCtx =
        options?.atlasMacroContext ||
        resolveAtlasMacroContextForAsset(localBaseline.asset_pair || transcript);

    try {
        const authHeaders = await getApiAuthHeaders();
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 12_000);

        const res = await fetch('/api/ai/coach', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders
            },
            body: JSON.stringify({
                mode: 'VOICE_PARSE',
                transcript: transcript.trim().slice(0, 2000),
                userRiskPlan: options?.userRiskPlan,
                atlasMacroContext: macroCtx
            }),
            signal: controller.signal
        });
        clearTimeout(timer);

        if (res.ok) {
            const data = await res.json();
            if (data?.parsed && typeof data.parsed === 'object') {
                return {
                    ...localBaseline,
                    ...data.parsed,
                    rawTranscript: transcript
                };
            }
        }
    } catch (e) {
        console.warn('[Tradyx Voice Parser] Gateway fallback to local pre-trade check:', e);
    }

    const localAudit = buildLocalPreTradeCheck(localBaseline, options?.userRiskPlan, macroCtx);
    return {
        ...localBaseline,
        risk_reward: localAudit.risk_reward || localBaseline.risk_reward,
        internal_reasoning: localAudit.internal_reasoning,
        pre_trade_check: localAudit.pre_trade_check
    };
}
