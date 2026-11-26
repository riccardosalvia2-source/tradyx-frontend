// ============================================================================
// TRADYX ZOD INPUT & OUTPUT VALIDATION SCHEMAS (api/_lib/validators.ts)
// Strict validation for all API Gateway query parameters, JSON payloads,
// and structured Chain-of-Thought AI outputs.
// ============================================================================

import { z } from 'zod';
import { ApiResponse } from './http';

const ISO2_REGEX = /^[A-Z]{2}$/;
const ISO3_REGEX = /^[A-Z]{3}$/;
const TICKER_REGEX = /^[A-Z0-9._/\-^]{1,20}$/;

/**
 * Query schema for GET /api/atlas/markets
 */
export const marketsQuerySchema = z.object({
    iso2: z
        .string()
        .trim()
        .toUpperCase()
        .regex(ISO2_REGEX, 'Il parametro iso2 deve essere un codice paese ISO-3166 a 2 lettere (es. IT, US).')
        .optional(),
    symbols: z
        .string()
        .trim()
        .max(300, 'Troppi simboli nella query.')
        .transform((val) =>
            val
                .split(',')
                .map((s) => s.trim().toUpperCase())
                .filter(Boolean)
        )
        .refine(
            (arr) => arr.length <= 25 && arr.every((s) => TICKER_REGEX.test(s)),
            'Uno o più ticker non sono validi (ammessi max 25 ticker alfanumerici).'
        )
        .optional(),
    category: z
        .enum(['ALL', 'INDICES', 'STOCKS', 'FOREX', 'BONDS', 'COMMODITIES', 'CRYPTO', 'ETF'])
        .optional()
});

/**
 * Query schema for GET /api/atlas/news (with full country macro context for deep batch reasoning)
 */
export const newsQuerySchema = z.object({
    iso2: z
        .string()
        .trim()
        .toUpperCase()
        .regex(ISO2_REGEX, 'Codice paese iso2 non valido (richieste 2 lettere maiuscole, es. US, IT).'),
    country: z.string().trim().min(2).max(80).optional(),
    city: z.string().trim().max(80).optional(),
    indexSymbol: z
        .string()
        .trim()
        .toUpperCase()
        .regex(TICKER_REGEX, 'Simbolo indice non valido.')
        .optional(),
    fxPair: z
        .string()
        .trim()
        .toUpperCase()
        .regex(TICKER_REGEX, 'Coppia FX non valida.')
        .optional(),
    currencyCode: z.string().trim().toUpperCase().max(8).optional(),
    centralBank: z.string().trim().max(80).optional(),
    policyRate: z.coerce.number().finite().min(-5).max(150).optional(),
    inflationCpi: z.coerce.number().finite().min(-20).max(500).optional(),
    gdpGrowth: z.coerce.number().finite().min(-50).max(50).optional(),
    yield10y: z.coerce.number().finite().min(-5).max(100).optional(),
    topStocks: z.string().trim().max(240).optional()
});

/**
 * Query schema for GET /api/atlas/macro
 */
export const macroQuerySchema = z.object({
    iso3: z
        .string()
        .trim()
        .toUpperCase()
        .regex(ISO3_REGEX, 'Codice paese iso3 non valido (richieste 3 lettere maiuscole, es. ITA, USA).'),
    iso2: z
        .string()
        .trim()
        .toUpperCase()
        .regex(ISO2_REGEX, 'Codice paese iso2 non valido.')
        .optional()
});

/**
 * Structured trade validation schema
 */
export const tradePayloadSchema = z.object({
    asset_pair: z
        .string()
        .trim()
        .toUpperCase()
        .regex(TICKER_REGEX, 'Ticker/asset non valido.'),
    direction: z.enum(['LONG', 'SHORT']),
    entry_price: z.number().finite().positive().max(10_000_000).optional(),
    exit_price: z.number().finite().positive().max(10_000_000).optional(),
    stop_loss: z.number().finite().positive().max(10_000_000).optional(),
    take_profit: z.number().finite().positive().max(10_000_000).optional(),
    position_size: z.number().finite().nonnegative().max(100_000_000).optional(),
    pnl: z.number().finite().min(-100_000_000).max(100_000_000).optional(),
    emotional_state: z.string().trim().max(40).optional(),
    notes: z.string().trim().max(2000).optional()
});

const recentTradeSnapshotSchema = z.object({
    asset_pair: z.string().trim().max(32),
    direction: z.enum(['LONG', 'SHORT']),
    pnl: z.number().finite(),
    position_size: z.number().finite().nonnegative().optional(),
    entry_price: z.number().finite().optional(),
    exit_price: z.number().finite().optional(),
    timestamp: z.string().max(64),
    minutesSincePreviousTrade: z.number().finite().min(0).max(100_000).nullable().optional(),
    emotional_state: z.string().max(40).optional(),
    errors: z.array(z.string().max(40)).max(10).optional(),
    notes: z.string().max(400).optional()
});

const onboardingContextSchema = z.object({
    preferredMarket: z.string().max(80).optional(),
    accountType: z.enum(['PROP_FIRM', 'PERSONAL']).optional(),
    propFirmAccountSize: z.number().finite().positive().optional(),
    propFirmMaxDailyLossPct: z.number().finite().min(0.1).max(50).optional(),
    primaryBiasDetected: z.string().max(120).optional(),
    ulyssesStrictMode: z.boolean().optional(),
    monthlyBudget: z.number().finite().positive().optional(),
    maxRiskPerTrade: z.number().finite().positive().optional(),
    maxRiskType: z.enum(['PERCENT', 'FIXED']).optional()
});

const atlasMacroContextSchema = z.object({
    countryName: z.string().max(80),
    iso2: z.string().max(4),
    centralBank: z.string().max(80),
    policyRate: z.number().finite(),
    inflationCpi: z.number().finite(),
    gdpGrowth: z.number().finite().optional(),
    yield10y: z.number().finite().optional(),
    primaryIndex: z.string().max(32),
    fxPair: z.string().max(32)
});

/**
 * Request body schema for POST /api/ai/coach
 * Supports: COACH | ULYSSES | VOICE_PARSE | SCREENSHOT_OCR
 */
export const coachRequestSchema = z
    .object({
        mode: z.enum(['COACH', 'ULYSSES', 'VOICE_PARSE', 'SCREENSHOT_OCR']).default('COACH'),
        prompt: z.string().trim().min(1).max(4000).optional(),
        persona: z.enum(['EMPATHIC', 'TOUGH_LOVE']).default('TOUGH_LOVE'),
        deepAnalysis: z.boolean().optional(),
        transcript: z.string().trim().min(2).max(2000).optional(),
        imageBase64: z.string().trim().min(20).max(8_000_000).optional(),
        mimeType: z
            .enum(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
            .default('image/png')
            .optional(),
        context: z
            .object({
                recentPnL: z.number().finite().optional(),
                recentEmotion: z.string().max(60).optional(),
                totalWinRate: z.number().min(0).max(100).optional(),
                tradeCount: z.number().int().min(0).max(100_000).optional(),
                lastTradeNotes: z.string().max(1000).optional(),
                cortisolClearingActive: z.boolean().optional(),
                cortisolRemainingMinutes: z.number().min(0).max(180).optional(),
                dispositionEffectDetected: z.boolean().optional(),
                dispositionDetails: z.string().max(400).optional(),
                delayDiscountingDetected: z.boolean().optional(),
                delayDiscountingDetails: z.string().max(400).optional(),
                lossStreak: z.number().int().min(0).max(100).optional(),
                avgPositionSize: z.number().finite().nonnegative().optional(),
                lastTradeSize: z.number().finite().nonnegative().optional(),
                sizeChangePctVsAvg: z.number().finite().optional(),
                dailyPnl: z.number().finite().optional(),
                dailyDrawdownPct: z.number().finite().optional(),
                dailyDrawdownLimitPct: z.number().finite().optional(),
                fastestReentryMinutesAfterLoss: z.number().finite().nullable().optional(),
                onboardingProfile: onboardingContextSchema.optional(),
                recentTrades: z.array(recentTradeSnapshotSchema).max(15).optional()
            })
            .optional(),
        userRiskPlan: onboardingContextSchema
            .extend({
                dailyPnl: z.number().finite().optional()
            })
            .optional(),
        atlasMacroContext: atlasMacroContextSchema.optional(),
        tradePayload: tradePayloadSchema.optional()
    })
    .superRefine((data, ctx) => {
        if ((data.mode === 'COACH' || data.mode === 'ULYSSES') && !data.prompt) {
            ctx.addIssue({
                code: 'custom',
                path: ['prompt'],
                message: 'Il campo prompt è obbligatorio in modalità COACH o ULYSSES.'
            });
        }
        if (data.mode === 'VOICE_PARSE' && !data.transcript) {
            ctx.addIssue({
                code: 'custom',
                path: ['transcript'],
                message: 'Il campo transcript è obbligatorio in modalità VOICE_PARSE.'
            });
        }
        if (data.mode === 'SCREENSHOT_OCR' && !data.imageBase64) {
            ctx.addIssue({
                code: 'custom',
                path: ['imageBase64'],
                message: 'Il campo imageBase64 è obbligatorio in modalità SCREENSHOT_OCR.'
            });
        }
    });

// ============================================================================
// STRICT GEMINI OUTPUT SCHEMAS (ALL START WITH `internal_reasoning: string[]`)
// ============================================================================

export const coachStructuredOutputSchema = z.object({
    internal_reasoning: z.array(z.string().min(8)).min(2).max(6),
    diagnosis: z.string().min(20).max(1200),
    cognitive_bias_detected: z.string().min(3).max(100),
    actionable_rule: z.string().min(12).max(500),
    risk_score: z.number().min(1).max(100)
});

export const atlasNewsBatchItemSchema = z.object({
    index: z.number().int().min(0),
    internal_reasoning: z.array(z.string().min(8)).min(2).max(5),
    transmission_mechanism: z.string().min(10).max(320),
    operationalImpact: z.string().min(15).max(360),
    sentiment: z.enum(['BULLISH', 'BEARISH', 'VOLATILITÀ', 'NEUTRAL']),
    horizon: z.enum(['Intraday', 'Multi-day']),
    impactedTickers: z.array(z.string().min(1).max(16)).min(1).max(5)
});

export const atlasNewsBatchOutputSchema = z.object({
    internal_reasoning: z.array(z.string().min(8)).min(2).max(5),
    analyses: z.array(atlasNewsBatchItemSchema).min(1)
});

export const voicePreTradeOutputSchema = z.object({
    internal_reasoning: z.array(z.string().min(8)).min(2).max(5),
    asset_pair: z.string().max(24).optional(),
    direction: z.enum(['LONG', 'SHORT']).optional(),
    entry_price: z.number().finite().positive().optional(),
    stop_loss: z.number().finite().positive().optional(),
    take_profit: z.number().finite().positive().optional(),
    exit_price: z.number().finite().positive().optional(),
    pnl: z.number().finite().optional(),
    position_size: z.number().finite().nonnegative().optional(),
    risk_reward: z.string().max(40).optional(),
    psychology: z.enum(['CONFIDENCE', 'NEUTRAL', 'FEAR', 'GREED', 'FOMO', 'REVENGE']).optional(),
    errors: z.array(z.string().max(40)).max(6).optional(),
    notes: z.string().max(500).optional(),
    pre_trade_check: z.object({
        risk_reward_ratio: z.string().max(60),
        estimated_risk_amount: z.number().finite().nullable().optional(),
        atlas_macro_alignment: z.enum(['ALLINEATO', 'CONTROTREND_MACRO', 'NEUTRALE']),
        atlas_macro_note: z.string().min(10).max(360),
        risk_plan_violation: z.boolean(),
        violation_reason: z.string().max(320).nullable().optional(),
        verdict: z.enum(['APPROVATO', 'ATTENZIONE', 'VIOLAZIONE_PIANO'])
    })
});

export const screenshotOcrOutputSchema = z.object({
    internal_reasoning: z.array(z.string().min(6)).min(2).max(5),
    asset: z.string().max(24).optional(),
    asset_pair: z.string().max(24).optional(),
    direction: z.enum(['LONG', 'SHORT']).optional(),
    entry_price: z.number().finite().positive().optional(),
    exit_price: z.number().finite().positive().optional(),
    stop_loss: z.number().finite().positive().optional(),
    take_profit: z.number().finite().positive().optional(),
    pnl: z.number().finite().optional(),
    pnl_netto: z.number().finite().optional(),
    roi_percentage: z.number().finite().optional(),
    position_size: z.number().finite().nonnegative().optional(),
    notes: z.string().max(400).optional()
});

export type MarketsQuery = z.infer<typeof marketsQuerySchema>;
export type NewsQuery = z.infer<typeof newsQuerySchema>;
export type MacroQuery = z.infer<typeof macroQuerySchema>;
export type CoachRequestBody = z.infer<typeof coachRequestSchema>;
export type CoachStructuredOutput = z.infer<typeof coachStructuredOutputSchema>;
export type VoicePreTradeOutput = z.infer<typeof voicePreTradeOutputSchema>;

export function sendValidationError(res: ApiResponse, error: z.ZodError): void {
    const details = error.issues.map((issue) => ({
        field: issue.path.join('.') || 'root',
        message: issue.message
    }));

    res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Parametri della richiesta non validi.',
        details
    });
}
