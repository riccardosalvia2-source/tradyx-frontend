// ============================================================================
// TRADYX API GATEWAY — PROTECTED GEMINI AI COACH, ULYSSES, VOICE & OCR
// (api/ai/coach.ts)
// Strict server-side Gemini endpoint protected by:
// 1. Supabase JWT Auth Guard (`api/_lib/authGuard.ts`)
// 2. Upstash Redis / Memory Rate Limiting (30 req/min -> HTTP 429 + Retry-After)
// 3. Strict Zod Payload Validation (`api/_lib/validators.ts` -> HTTP 400)
// 4. Server-only `process.env.GEMINI_API_KEY` via `@google/genai` (gemini-2.5-flash)
// ============================================================================

import { GoogleGenAI } from '@google/genai';
import { ApiRequest, ApiResponse, handleCorsAndMethod, parseJsonBody } from '../_lib/http';
import { verifyAuth } from '../_lib/authGuard';
import { coachRequestSchema, sendValidationError } from '../_lib/validators';
import { AI_RATE_LIMIT, applyRateLimitOrReject } from '../_lib/cacheAndRateLimit';

const MODEL_ID = 'gemini-2.5-flash';

const EMPATHIC_SYSTEM_PROMPT = `Sei "Tradyx Coach", un assistente virtuale altamente specializzato in psicologia del trading, finanza comportamentale e disciplina operativa per la piattaforma Tradyx.
REGOLE FONDAMENTALI ED ETICHE:
1. NON FORNIRE MAI CONSIGLI FINANZIARI O SEGNALI OPERATIVI. Non suggerire mai se acquistare, vendere, aprire o chiudere posizioni su specifici asset. Se l'utente chiede un segnale, rifiuta garbatamente ricordando che sei un coach psicologico e non un consulente finanziario.
2. OBIETTIVO: Aiutare il trader a identificare e superare FOMO, Revenge Trading, Avidità, Over-trading e Ansia da prestazione.
3. RISPOSTE ANALITICHE: Integra sempre le metriche reali del diario operativo nel tuo ragionamento.
4. TONO: Empatico, riflessivo, professionale e calmo. Rispondi in italiano.`;

const TOUGH_LOVE_SYSTEM_PROMPT = `Sei il "Chief Risk Officer (CRO) Istituzionale" di Tradyx e di un prop trading desk di Wall Street.
La tua persona è "TOUGH LOVE RISK MANAGER": schietto, inflessibile, professionale, autoritario e senza fronzoli.
Il tuo compito assoluto è PROTEGGERE IL CAPITALE del trader ed eliminare ogni dilettantismo emotivo.
REGOLE:
1. NESSUN COMPLIMENTO FACILE se il trader viola il risk plan.
2. TOLLERANZA ZERO per FOMO, Revenge Trading o size eccessiva.
3. NON FORNIRE MAI segnali di trading o consigli di investimento.
4. TONO: Diretto, lapidario, orientato alla sopravvivenza del capitale nel lungo termine. Rispondi in italiano.`;

const ULYSSES_SYSTEM_PROMPT = `Sei il modulo neuro-comportamentale "Protocollo Ulysses" di Tradyx.
Il trader è in potenziale tilt emotivo o drawdown consecutivo (cortisolo elevato / amigdala iperattiva).
Il tuo compito è guidare il rientro razionale nella corteccia prefrontale (PFC) con 3 passi brevi, concreti e misurabili (respirazione/pausa, revisione del piano, checklist prima del prossimo trade).
NON fornire segnali di trading. Rispondi in italiano in modo lucido e fermo.`;

const FINANCIAL_ADVICE_TRIGGERS = [
    'comprare',
    'vendere',
    'buy',
    'sell',
    'segnale',
    'signal',
    'dove investire',
    'che asset comprare',
    'target price',
    'previsione btc',
    'previsione prezzo',
    'conviene comprare'
];

function isFinancialAdviceQuery(text: string): boolean {
    const lower = text.toLowerCase();
    return FINANCIAL_ADVICE_TRIGGERS.some((trigger) => lower.includes(trigger));
}

function stripJsonFences(raw: string): string {
    return raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
    if (!handleCorsAndMethod(req, res, ['POST'])) return;

    // 1. Authenticate caller via Supabase JWT (when configured)
    const auth = await verifyAuth(req, res, { requireAuth: true });
    if (!auth) return;

    // 2. Enforce 30 req/min rate limit per authenticated user / IP
    const allowed = await applyRateLimitOrReject(
        req,
        res,
        'ai_coach',
        auth.userId,
        AI_RATE_LIMIT.MAX_REQUESTS,
        AI_RATE_LIMIT.WINDOW_SECONDS
    );
    if (!allowed) return;

    // 3. Parse & strictly validate JSON body with Zod
    const rawBody = parseJsonBody(req);
    if (rawBody === null) {
        res.status(400).json({
            error: 'INVALID_JSON',
            message: 'Il corpo della richiesta non è un JSON valido.'
        });
        return;
    }

    const parsed = coachRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
        sendValidationError(res, parsed.error);
        return;
    }

    const body = parsed.data;

    // Guard against financial advice requests before spending Gemini tokens
    if ((body.mode === 'COACH' || body.mode === 'ULYSSES') && body.prompt && isFinancialAdviceQuery(body.prompt)) {
        res.status(200).json({
            mode: body.mode,
            model: 'policy-guard',
            text: `⚠️ **Nota di Responsabilità:** Come **Tradyx Coach**, sono specializzato esclusivamente nella psicologia del trading e nella gestione del rischio comportamentale.\n\n*Non fornisco segnali operativi o raccomandazioni su quali asset acquistare o vendere.*\n\nChiediti prima di aprire il grafico: stai eseguendo il tuo piano o inseguendo un impulso emotivo (FOMO)?`
        });
        return;
    }

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
        res.status(503).json({
            error: 'AI_SERVICE_UNCONFIGURED',
            message: 'Motore AI lato server non ancora configurato (GEMINI_API_KEY mancante).',
            fallbackRecommended: true
        });
        return;
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
        // MODE 1 & 2: COACH & ULYSSES
        if (body.mode === 'COACH' || body.mode === 'ULYSSES') {
            const ctx = body.context;
            const contextBlock = ctx
                ? `[METRICHE DIARIO UTENTE]
- PnL Recente: $${(ctx.recentPnL ?? 0).toLocaleString('en-US')}
- Stato Emotivo Dominante: ${ctx.recentEmotion || 'Calm'}
- Win Rate Storico: ${ctx.totalWinRate ?? 0}%
- Operazioni Registrate: ${ctx.tradeCount ?? 0}
- Note Ultimo Trade: "${ctx.lastTradeNotes || 'Nessuna'}"
- Finestra Cortisolo: ${ctx.cortisolClearingActive ? `ATTIVA (~${ctx.cortisolRemainingMinutes ?? 25} min rimanenti)` : 'Normale'}
- Serie Perdite Consecutive: ${ctx.lossStreak ?? 0}`
                : 'Nessun dato diario fornito per questa sessione.';

            const systemInstruction =
                body.mode === 'ULYSSES'
                    ? ULYSSES_SYSTEM_PROMPT
                    : body.persona === 'TOUGH_LOVE'
                    ? TOUGH_LOVE_SYSTEM_PROMPT
                    : EMPATHIC_SYSTEM_PROMPT;

            const response = await ai.models.generateContent({
                model: MODEL_ID,
                contents: `${contextBlock}\n\nMESSAGGIO DEL TRADER:\n"${body.prompt}"`,
                config: {
                    systemInstruction,
                    temperature: body.mode === 'ULYSSES' ? 0.45 : 0.65
                }
            });

            const text = response?.text?.trim();
            if (!text) {
                res.status(502).json({
                    error: 'EMPTY_AI_RESPONSE',
                    message: 'Risposta vuota dal motore AI.',
                    fallbackRecommended: true
                });
                return;
            }

            res.status(200).json({
                mode: body.mode,
                model: MODEL_ID,
                text
            });
            return;
        }

        // MODE 3: VOICE_PARSE
        if (body.mode === 'VOICE_PARSE' && body.transcript) {
            const prompt = `Sei un parser finanziario istituzionale. Estrai i dati strutturati da questa trascrizione vocale di un trader in italiano.
Restituisci SOLO un oggetto JSON valido (nessun markdown) con queste chiavi opzionali:
{
  "asset_pair": "string es. BTC/USD, EUR/USD, AAPL, NVDA",
  "direction": "LONG" | "SHORT",
  "entry_price": number,
  "exit_price": number,
  "pnl": number,
  "position_size": number,
  "risk_reward": "string es. 1:2.5",
  "psychology": "CONFIDENCE" | "NEUTRAL" | "FEAR" | "GREED" | "FOMO" | "REVENGE",
  "errors": ["FOMO" | "REVENGE" | "OVERTRADING" | "NO_SL" | "EARLY_EXIT"],
  "notes": "string"
}

TRASCRIZIONE:
"${body.transcript}"`;

            const response = await ai.models.generateContent({
                model: MODEL_ID,
                contents: prompt,
                config: {
                    temperature: 0.1,
                    responseMimeType: 'application/json'
                }
            });

            const rawText = response?.text?.trim();
            if (!rawText) {
                res.status(502).json({
                    error: 'EMPTY_AI_RESPONSE',
                    message: 'Impossibile estrarre i dati dalla trascrizione.',
                    fallbackRecommended: true
                });
                return;
            }

            const extracted = JSON.parse(stripJsonFences(rawText));
            res.status(200).json({
                mode: 'VOICE_PARSE',
                model: MODEL_ID,
                parsed: extracted
            });
            return;
        }

        // MODE 4: SCREENSHOT_OCR
        if (body.mode === 'SCREENSHOT_OCR' && body.imageBase64) {
            const pureBase64 = body.imageBase64.includes(',')
                ? body.imageBase64.split(',')[1]
                : body.imageBase64;
            const mimeType = body.mimeType || 'image/png';

            const response = await ai.models.generateContent({
                model: MODEL_ID,
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text: `Analizza questo screenshot di trading (broker, TradingView, MT4/MT5 o exchange).
Restituisci SOLO un oggetto JSON valido (nessun markdown) con i dati del trade rilevati:
{
  "asset": "string es. BTC/USD",
  "asset_pair": "string es. BTC/USD",
  "direction": "LONG" | "SHORT",
  "entry_price": number,
  "exit_price": number,
  "pnl": number,
  "pnl_netto": number,
  "roi_percentage": number,
  "position_size": number,
  "notes": "breve descrizione del setup o chiusura visibile"
}`
                            },
                            {
                                inlineData: {
                                    mimeType,
                                    data: pureBase64
                                }
                            }
                        ]
                    }
                ],
                config: {
                    temperature: 0.1,
                    responseMimeType: 'application/json'
                }
            });

            const rawText = response?.text?.trim();
            if (!rawText) {
                res.status(502).json({
                    error: 'EMPTY_AI_RESPONSE',
                    message: 'Impossibile leggere i dati dallo screenshot.',
                    fallbackRecommended: true
                });
                return;
            }

            const extracted = JSON.parse(stripJsonFences(rawText));
            res.status(200).json({
                mode: 'SCREENSHOT_OCR',
                model: MODEL_ID,
                parsed: extracted
            });
            return;
        }

        res.status(400).json({
            error: 'UNSUPPORTED_MODE',
            message: 'Modalità AI non supportata.'
        });
    } catch (err: any) {
        const isQuota =
            err?.status === 429 ||
            String(err?.message || '').toLowerCase().includes('quota') ||
            String(err?.message || '').toLowerCase().includes('rate limit');

        if (isQuota) {
            res.setHeader('Retry-After', '30');
            res.status(429).json({
                error: 'UPSTREAM_RATE_LIMIT',
                message: 'Il provider AI ha temporaneamente raggiunto il limite di quota. Riprova tra 30 secondi.',
                fallbackRecommended: true
            });
            return;
        }

        res.status(500).json({
            error: 'AI_GATEWAY_ERROR',
            message: 'Errore temporaneo del motore AI lato server.',
            fallbackRecommended: true
        });
    }
}
