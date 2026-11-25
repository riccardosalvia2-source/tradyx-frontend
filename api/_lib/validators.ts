// ============================================================================
// TRADYX ZOD INPUT VALIDATION SCHEMAS (api/_lib/validators.ts)
// Strict validation for all API Gateway query parameters and JSON payloads.
// Malformed inputs are immediately rejected with HTTP 400 Bad Request.
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
 * Query schema for GET /api/atlas/news
 */
export const newsQuerySchema = z.object({
    iso2: z
        .string()
        .trim()
        .toUpperCase()
        .regex(ISO2_REGEX, 'Codice paese iso2 non valido (richieste 2 lettere maiuscole, es. US, IT).'),
    country: z
        .string()
        .trim()
        .min(2, 'Nome paese troppo corto.')
        .max(80, 'Nome paese troppo lungo.')
        .optional(),
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
    centralBank: z.string().trim().max(80).optional()
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
 * Structured trade validation schema (used by AI coach / journal / voice verification)
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
    position_size: z.number().finite().nonnegative().max(100_000_000).optional(),
    pnl: z.number().finite().min(-100_000_000).max(100_000_000).optional(),
    emotional_state: z.string().trim().max(40).optional(),
    notes: z.string().trim().max(2000).optional()
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
                lossStreak: z.number().int().min(0).max(100).optional()
            })
            .optional(),
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

export type MarketsQuery = z.infer<typeof marketsQuerySchema>;
export type NewsQuery = z.infer<typeof newsQuerySchema>;
export type MacroQuery = z.infer<typeof macroQuerySchema>;
export type CoachRequestBody = z.infer<typeof coachRequestSchema>;

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
