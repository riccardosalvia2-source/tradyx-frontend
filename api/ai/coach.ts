// ============================================================================
// TRADYX API GATEWAY — CHAIN-OF-THOUGHT AI COACH, ULYSSES, VOICE & OCR
// (api/ai/coach.ts)
// Server-side reasoning gateway powered by api/_lib/reasoningEngine.ts:
// - `gemini-2.5-pro` for deep behavioral diagnosis (with auto fallback to 2.5-flash)
// - `gemini-2.5-flash` for low-latency voice pre-trade check & OCR
// - Protected by Supabase JWT Auth Guard, Upstash Redis 30 req/min rate limiter,
//   and strict Zod input/output schema validation.
// ============================================================================

import { ApiRequest, ApiResponse, handleCorsAndMethod, parseJsonBody } from '../_lib/http';
import { verifyAuth } from '../_lib/authGuard';
import {
    coachRequestSchema,
    coachStructuredOutputSchema,
    screenshotOcrOutputSchema,
    sendValidationError,
    voicePreTradeOutputSchema,
    CoachRequestBody
} from '../_lib/validators';
import { AI_RATE_LIMIT, applyRateLimitOrReject } from '../_lib/cacheAndRateLimit';
import { runStructuredReasoning } from '../_lib/reasoningEngine';

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

function buildTraderContextBlock(ctx?: CoachRequestBody['context']): string {
    if (!ctx) {
        return '[CONTESTO TRADER]: Nessuna telemetria diario allegata.';
    }

    const lines: string[] = ['[TELEMETRIA REALE DEL TRADER — USA QUESTI NUMERI ESATTI NELLA DIAGNOSI]'];

    if (ctx.onboardingProfile) {
        const ob = ctx.onboardingProfile;
        lines.push(
            `- Profilo Conto: ${ob.accountType === 'PROP_FIRM' ? `Prop Firm ($${(ob.propFirmAccountSize ?? 100000).toLocaleString('en-US')}, max daily loss ${ob.propFirmMaxDailyLossPct ?? 4}%)` : `Conto Personale (budget $${(ob.monthlyBudget ?? 10000).toLocaleString('en-US')})`}`,
            `- Mercato Principale: ${ob.preferredMarket || 'Non specificato'}`,
            `- Bias Diagnostico Onboarding: ${ob.primaryBiasDetected || 'Non ancora profilato'}`,
            `- Risk Limit per Trade: ${ob.maxRiskPerTrade ?? 'N/D'} ${ob.maxRiskType === 'PERCENT' ? '%' : 'unità valuta'}`,
            `- Protocollo Ulysses Strict: ${ob.ulyssesStrictMode ? 'ATTIVO' : 'Standard'}`
        );
    }

    lines.push(
        `- Metriche Sessione: Win Rate=${ctx.totalWinRate ?? 'N/D'}%, Trade Totali=${ctx.tradeCount ?? 0}, Serie Perdite Consecutive=${ctx.lossStreak ?? 0}`,
        `- PnL Giornaliero: $${(ctx.dailyPnl ?? 0).toFixed(2)} | Drawdown Giornaliero: ${(ctx.dailyDrawdownPct ?? 0).toFixed(2)}% (Limite: ${(ctx.dailyDrawdownLimitPct ?? 4).toFixed(2)}%)`,
        `- Gestione Size: Size Media=${(ctx.avgPositionSize ?? 0).toFixed(3)} | Ultima Size=${(ctx.lastTradeSize ?? 0).toFixed(3)} | Variazione Size vs Media=${ctx.sizeChangePctVsAvg !== undefined ? `${ctx.sizeChangePctVsAvg >= 0 ? '+' : ''}${ctx.sizeChangePctVsAvg.toFixed(1)}%` : 'N/D'}`,
        `- Re-entry più veloce dopo perdita: ${ctx.fastestReentryMinutesAfterLoss != null ? `${ctx.fastestReentryMinutesAfterLoss} minuti` : 'Nessun re-entry ravvicinato rilevato'}`,
        `- Stato Emotivo Recente: ${ctx.recentEmotion || 'N/D'} | Finestra Cortisolo: ${ctx.cortisolClearingActive ? `ATTIVA (~${ctx.cortisolRemainingMinutes ?? 25} min residui)` : 'Spenta'}`,
        `- Disposition Effect: ${ctx.dispositionEffectDetected ? `RILEVATO (${ctx.dispositionDetails || 'taglio precoce profitti'})` : 'No'} | Delay Discounting (Revenge Sizing): ${ctx.delayDiscountingDetected ? `RILEVATO (${ctx.delayDiscountingDetails || 'aumento size post-loss'})` : 'No'}`
    );

    if (Array.isArray(ctx.recentTrades) && ctx.recentTrades.length > 0) {
        lines.push('\n[ULTIMI TRADE REGISTRATI (DAL PIÙ RECENTE AL MENO RECENTE)]');
        ctx.recentTrades.slice(0, 15).forEach((t, idx) => {
            const dt =
                t.minutesSincePreviousTrade != null
                    ? `Δt=${t.minutesSincePreviousTrade}m dal trade prec.`
                    : 'Δt=N/D';
            const errs = t.errors && t.errors.length > 0 ? ` | Errori:[${t.errors.join(',')}]` : '';
            lines.push(
                `${idx + 1}. [${t.timestamp}] ${t.asset_pair} ${t.direction} | PnL: ${t.pnl >= 0 ? '+' : ''}${t.pnl} | Size: ${t.position_size ?? 1} | ${dt} | Emozione: ${t.emotional_state || 'N/D'}${errs}${t.notes ? ` | Note: "${t.notes.slice(0, 100)}"` : ''}`
            );
        });
    }

    return lines.join('\n');
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

    // Financial Advice Policy Guard (zero Gemini spend)
    if ((body.mode === 'COACH' || body.mode === 'ULYSSES') && body.prompt && isFinancialAdviceQuery(body.prompt)) {
        const policyStructured = {
            internal_reasoning: [
                '1. Rilevata richiesta esplicita di segnale operativo o consiglio su acquisto/vendita di asset.',
                '2. Per compliance e mandato comportamentale, Tradyx Coach non emette segnali di trading o target price.',
                '3. Reindirizzo la decisione dal "cosa comprare" alla verifica quantitativa del setup e dello stato emotivo corrente.'
            ],
            diagnosis:
                'Hai richiesto un segnale o consiglio operativo su un asset. Tradyx Coach opera esclusivamente come Chief Risk Officer comportamentale: delegare la decisione di ingresso a un sistema esterno è spesso un segnale di incertezza o FOMO operativa.',
            cognitive_bias_detected: 'Delegation Bias / FOMO Operativa',
            actionable_rule:
                'Prima di aprire qualsiasi ordine nei prossimi 60 minuti, scrivi nel diario entry, stop loss, invalidazione strutturale e R:R minimo 1:2: se manca uno solo di questi 4 numeri, resta flat.',
            risk_score: 48
        };

        res.status(200).json({
            mode: body.mode,
            model: 'policy-guard',
            structured: policyStructured,
            text: policyStructured.diagnosis
        });
        return;
    }

    // ========================================================================
    // MODE 1 & 2: STRUCTURED COACH & ULYSSES PROTOCOL (CoT + Context Injection)
    // ========================================================================
    if ((body.mode === 'COACH' || body.mode === 'ULYSSES') && body.prompt) {
        const ctx = body.context;
        const shouldUseDeepModel = Boolean(
            body.deepAnalysis ||
                body.mode === 'ULYSSES' ||
                (ctx?.lossStreak ?? 0) >= 2 ||
                (ctx?.cortisolClearingActive ?? false) ||
                Math.abs(ctx?.sizeChangePctVsAvg ?? 0) >= 25 ||
                (ctx?.dailyDrawdownPct ?? 0) >= (ctx?.dailyDrawdownLimitPct ?? 4) * 0.5
        );

        const personaStyle =
            body.mode === 'ULYSSES'
                ? 'PROTOCOLLO ULYSSES (NEURO-DISCIPLINA): Il trader è vicino o dentro un tilt emotivo. Sii chirurgico, fermo e focalizzato su blocco della reattività limbica e protezione immediata del drawdown.'
                : body.persona === 'TOUGH_LOVE'
                ? 'PERSONA: Chief Risk Officer (CRO) di un prop trading desk istituzionale (Tough Love). Schietto, diretto, spietato con indisciplina, oversizing e revenge trading. Cita ticker, orari, Δt in minuti e percentuali di size reali.'
                : 'PERSONA: Quantitative Behavioral Finance Coach (Empatico ma analiticamente rigoroso). Lucido, costruttivo, basato esclusivamente sui dati reali del diario senza compiacimento.';

        const systemInstruction = `${personaStyle}

SCHEMA JSON OBBLIGATORIO (rispetta esattamente i nomi chiave e l'ordine):
{
  "internal_reasoning": [
    "Passo 1: analisi dei numeri reali del diario (ticker, orari, Δt tra trade, variazione size %, drawdown vs limite)",
    "Passo 2: identificazione del nesso causale tra esecuzione recente e bias cognitivo/neurochimico",
    "Passo 3: quantificazione del rischio emotivo (1-100) rispetto ai limiti del conto (Personale o Prop Firm)",
    "Passo 4: derivazione della singola regola operativa più ad alto impatto per i prossimi 60 minuti"
  ],
  "diagnosis": "Diagnosi lucida, concreta e tagliente basata sui numeri reali del trader (2-4 frasi dense, cita ticker/orari/Δt/size%/drawdown reali).",
  "cognitive_bias_detected": "Nome preciso del bias (es. 'Revenge Trading (Hot-Cold Empathy Gap)', 'Loss Aversion / Disposition Effect', 'Delay Discounting (Oversizing)', 'FOMO Chasing', oppure 'Nessuno — Esecuzione Disciplinata')",
  "actionable_rule": "1 sola regola operativa misurabile e immediatamente eseguibile nella prossima ora (con minuti/percentuale size/condizione esplicita).",
  "risk_score": 1..100
}`;

        const userPrompt = `${buildTraderContextBlock(ctx)}

DOMANDA / SITUAZIONE DEL TRADER:
"${body.prompt}"`;

        const result = await runStructuredReasoning({
            tier: shouldUseDeepModel ? 'deep' : 'fast',
            systemInstruction,
            userPrompt,
            zodSchema: coachStructuredOutputSchema,
            temperature: 0.25,
            thinkingBudget: shouldUseDeepModel ? 2048 : 1024
        });

        if (result.ok) {
            res.status(200).json({
                mode: body.mode,
                model: result.modelUsed,
                structured: result.data,
                text: result.data.diagnosis
            });
            return;
        }

        if (result.reason === 'QUOTA_EXCEEDED') {
            res.setHeader('Retry-After', '30');
            res.status(429).json({
                error: 'UPSTREAM_RATE_LIMIT',
                message: result.message,
                fallbackRecommended: true
            });
            return;
        }

        res.status(result.reason === 'UNCONFIGURED' ? 503 : 502).json({
            error: result.reason,
            message: result.message,
            fallbackRecommended: true
        });
        return;
    }

    // ========================================================================
    // MODE 3: VOICE-TO-TRADE + INTELLIGENT PRE-TRADE CHECK (R:R + ATLAS + RISK)
    // ========================================================================
    if (body.mode === 'VOICE_PARSE' && body.transcript) {
        const riskPlanStr = body.userRiskPlan
            ? `[PIANO DI RISK MANAGEMENT UTENTE]
- Tipo Conto: ${body.userRiskPlan.accountType === 'PROP_FIRM' ? `Prop Firm ($${(body.userRiskPlan.propFirmAccountSize ?? 100000).toLocaleString('en-US')}, max daily loss ${body.userRiskPlan.propFirmMaxDailyLossPct ?? 4}%)` : `Personale (budget $${(body.userRiskPlan.monthlyBudget ?? 10000).toLocaleString('en-US')})`}
- Rischio Massimo per Trade: ${body.userRiskPlan.maxRiskPerTrade ?? 200} ${body.userRiskPlan.maxRiskType === 'PERCENT' ? '%' : 'unità valuta'}
- PnL Giornaliero Attuale: $${(body.userRiskPlan.dailyPnl ?? 0).toFixed(2)}`
            : '[PIANO DI RISK MANAGEMENT UTENTE]: Standard (max risk $200/trade, R:R minimo 1:1.5).';

        const macroStr = body.atlasMacroContext
            ? `[CONTESTO MACRO ATLAS PAESE DI RIFERIMENTO]
- Paese: ${body.atlasMacroContext.countryName} (${body.atlasMacroContext.iso2})
- Banca Centrale: ${body.atlasMacroContext.centralBank} | Tasso Ufficiale: ${body.atlasMacroContext.policyRate}%
- Inflazione CPI: ${body.atlasMacroContext.inflationCpi}% | Crescita PIL: ${body.atlasMacroContext.gdpGrowth ?? 'N/D'}%
- Rendimento Sovrano 10Y: ${body.atlasMacroContext.yield10y ?? 'N/D'}%
- Indice Principale: ${body.atlasMacroContext.primaryIndex} | Valuta: ${body.atlasMacroContext.fxPair}`
            : '[CONTESTO MACRO ATLAS]: Contesto globale standard.';

        const systemInstruction = `Sei un Quantitative Trade Parser & Pre-Trade Risk Officer istituzionale.
Estrai con precisione matematica i parametri del trade dalla trascrizione vocale/testuale in italiano (nota: in italiano il punto è separatore delle migliaia, es. "83.500" = 83500; "1.0850" = 1.0850).
In aggiunta:
1. Calcola esattamente il Risk/Reward (R:R) da entry_price, stop_loss e take_profit (o exit_price). Se manca lo Stop Loss, segnalalo come violazione critica del risk plan.
2. Verifica la coerenza della direzione del trade rispetto al contesto macro ATLAS del paese fornito (tassi, inflazione, 10Y yield).
3. Verifica se il rischio stimato supera il maxRiskPerTrade o minaccia il limite di drawdown giornaliero del conto.

SCHEMA JSON OBBLIGATORIO:
{
  "internal_reasoning": [
    "Passo 1: parsing esatto di asset, direzione, entry, stop loss, take profit/exit e size",
    "Passo 2: calcolo matematico del R:R e della perdita potenziale allo stop loss",
    "Passo 3: incrocio causale con il contesto macro ATLAS (tassi, inflazione, curva rendimenti)",
    "Passo 4: audit finale contro il piano di risk management dell'utente"
  ],
  "asset_pair": "es. BTC/USD, NQ, EUR/USD, UCG.MI",
  "direction": "LONG" | "SHORT",
  "entry_price": number (opzionale),
  "stop_loss": number (opzionale),
  "take_profit": number (opzionale),
  "exit_price": number (opzionale),
  "pnl": number (opzionale),
  "position_size": number (opzionale),
  "risk_reward": "es. 1:2.4",
  "psychology": "CONFIDENCE" | "NEUTRAL" | "FEAR" | "GREED" | "FOMO" | "REVENGE",
  "errors": ["FOMO" | "REVENGE TRADING" | "OVERTRADING" | "NO STOP LOSS" | "EARLY EXIT"],
  "notes": "sintesi operativa pulita",
  "pre_trade_check": {
    "risk_reward_ratio": "es. 1:2.4 (Asimmetria Favorevole) oppure N/D (Stop Loss assente)",
    "estimated_risk_amount": number | null,
    "atlas_macro_alignment": "ALLINEATO" | "CONTROTREND_MACRO" | "NEUTRALE",
    "atlas_macro_note": "1 frase tecnica causale che collega questo trade ai tassi/CPI/yield del paese ATLAS",
    "risk_plan_violation": boolean,
    "violation_reason": "motivo preciso della violazione (o null se conforme)",
    "verdict": "APPROVATO" | "ATTENZIONE" | "VIOLAZIONE_PIANO"
  }
}`;

        const userPrompt = `${riskPlanStr}

${macroStr}

TRASCRIZIONE / IDEA DI TRADE DEL TRADER:
"${body.transcript}"`;

        const result = await runStructuredReasoning({
            tier: 'fast',
            systemInstruction,
            userPrompt,
            zodSchema: voicePreTradeOutputSchema,
            temperature: 0.2,
            thinkingBudget: 1024
        });

        if (result.ok) {
            res.status(200).json({
                mode: 'VOICE_PARSE',
                model: result.modelUsed,
                parsed: result.data
            });
            return;
        }

        if (result.reason === 'QUOTA_EXCEEDED') {
            res.setHeader('Retry-After', '30');
            res.status(429).json({
                error: 'UPSTREAM_RATE_LIMIT',
                message: result.message,
                fallbackRecommended: true
            });
            return;
        }

        res.status(result.reason === 'UNCONFIGURED' ? 503 : 502).json({
            error: result.reason,
            message: result.message,
            fallbackRecommended: true
        });
        return;
    }

    // ========================================================================
    // MODE 4: MULTIMODAL SCREENSHOT OCR WITH CHAIN-OF-THOUGHT
    // ========================================================================
    if (body.mode === 'SCREENSHOT_OCR' && body.imageBase64) {
        const pureBase64 = body.imageBase64.includes(',')
            ? body.imageBase64.split(',')[1]
            : body.imageBase64;
        const mimeType = body.mimeType || 'image/png';

        const systemInstruction = `Sei un analista OCR multimodale per screenshot di piattaforme di trading (TradingView, MT4/MT5, Binance, Bybit, Interactive Brokers).
Estrai tutti i dati numerici visibili verificando coerenza tra direzione, entry, exit e PnL.
SCHEMA JSON OBBLIGATORIO:
{
  "internal_reasoning": ["Passo 1: identificazione piattaforma e ticker", "Passo 2: verifica prezzi entry/exit/SL/TP e calcolo PnL coerente"],
  "asset": "string",
  "asset_pair": "string",
  "direction": "LONG" | "SHORT",
  "entry_price": number,
  "exit_price": number,
  "stop_loss": number,
  "take_profit": number,
  "pnl": number,
  "pnl_netto": number,
  "roi_percentage": number,
  "position_size": number,
  "notes": "breve nota tecnica"
}`;

        const result = await runStructuredReasoning({
            tier: 'fast',
            systemInstruction,
            userPrompt: 'Estrai i dati del trade dallo screenshot allegato.',
            zodSchema: screenshotOcrOutputSchema,
            temperature: 0.15,
            thinkingBudget: 512,
            multimodalParts: [
                {
                    text: 'Analizza questo screenshot di trading ed estrai i parametri operativi nel JSON richiesto.'
                },
                {
                    inlineData: {
                        mimeType,
                        data: pureBase64
                    }
                }
            ]
        });

        if (result.ok) {
            res.status(200).json({
                mode: 'SCREENSHOT_OCR',
                model: result.modelUsed,
                parsed: result.data
            });
            return;
        }

        res.status(result.reason === 'UNCONFIGURED' ? 503 : 502).json({
            error: result.reason,
            message: result.message,
            fallbackRecommended: true
        });
        return;
    }

    res.status(400).json({
        error: 'UNSUPPORTED_MODE',
        message: 'Modalità AI non supportata.'
    });
}
