// ============================================================================
// TRADYX NEURAL CORE — OMNISCIENT FINANCIAL & PSYCHOLOGICAL COPILOT ENDPOINT
// (api/ai/copilot.ts)
// Server-side deep reasoning copilot backed by real Gemini 2.5 (@google/genai).
// - GET /api/ai/copilot?health=1 -> Live connection & API key diagnostic probe
// - POST /api/ai/copilot         -> Multi-turn conversational Copilot with full
//   live_context telemetry injection, Chain-of-Thought thinking_process,
//   detected_state, operational key_insight_card & suggested_followups.
// - NEVER fabricates fake replies if GEMINI_API_KEY is missing or fails:
//   returns structured diagnostic status ("MISSING_KEY" | "ERROR").
// ============================================================================

import { z } from 'zod';
import { ApiRequest, ApiResponse, getQueryParam, handleCorsAndMethod, parseJsonBody } from '../_lib/http';
import { verifyAuth } from '../_lib/authGuard';
import { sendValidationError } from '../_lib/validators';
import { AI_RATE_LIMIT, applyRateLimitOrReject } from '../_lib/cacheAndRateLimit';
import { MODEL_DEEP, MODEL_FAST, runStructuredReasoning } from '../_lib/reasoningEngine';

const copilotMessageSchema = z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().trim().min(1).max(3000)
});

const copilotRequestSchema = z.object({
    message: z.string().trim().min(1, 'Scrivi un messaggio per Tradyx AI.').max(4000),
    conversation_history: z.array(copilotMessageSchema).max(12).optional(),
    live_context: z.record(z.string(), z.unknown()).optional()
});

const copilotOutputSchema = z.object({
    thinking_process: z.array(z.string().min(8)).min(3).max(6),
    reply_markdown: z.string().min(20).max(6000),
    detected_state: z.enum(['OPTIMAL', 'CAUTION', 'HIGH_EMOTIONAL_RISK']),
    key_insight_card: z
        .object({
            title: z.string().min(3).max(120),
            bias_or_metric: z.string().min(2).max(120),
            recommended_action: z.string().min(8).max(320)
        })
        .nullable()
        .optional(),
    suggested_followups: z.array(z.string().min(6).max(160)).min(2).max(4)
});

const TRADYX_NEURAL_CORE_SYSTEM_PROMPT = `Sei l'intelligenza artificiale centrale ("Tradyx Neural Core") integrata nel sistema operativo di trading Tradyx.
Hai accesso diretto alla telemetria completa e viva dell'utente (\`live_context\`: saldo, storico ultimi 30 trade, metriche di performance, bias comportamentali calcolati automaticamente, azioni recenti nell'interfaccia, watchlist/alert e dati macro del paese attualmente aperto su ATLAS).

COME DEVI RAGIONARE E RISPONDERE:
1. **Analisi Incrociata Reale**: Prima di rispondere, incrocia SEMPRE la domanda dell'utente con i suoi numeri reali presenti in \`live_context\`. Non dare mai consigli generici da manuale se hai i suoi dati davanti: cita i suoi ticker reali, le sue percentuali (Win Rate, Profit Factor, R:R realizzato, Drawdown giornaliero vs limite), i suoi orari migliori/peggiori, i suoi ultimi trade e le azioni recenti compiute nell'app (es. paese esplorato su ATLAS o alert impostati).
2. **Doppia Lente (Finanziaria + Psicologica)**: Valuta ogni domanda sia sul piano tecnico/finanziario (gestione del rischio, R:R, correlazioni macro, tassi banche centrali, esposizione) sia sul piano neuro-comportamentale (Kahneman Sistema 1 vs Sistema 2, Hot-Cold Empathy Gap, Loss Aversion, Disposition Effect, FOMO, Revenge Trading, Delay Discounting).
3. **Protezione Attiva del Capitale (CRO Istituzionale)**: Se l'utente ti chiede un'idea operativa mentre i suoi dati mostrano che è in drawdown, ha attivato la finestra cortisolo o ha 2+ stop loss ravvicinati / revenge trading / oversizing, proteggi PRIMA il suo capitale con lucidità, autorevolezza ed empatia, spiegandogli esattamente perché la sua mente sta cercando recupero. Non fornire mai segnali operativi secchi ("compra X ora") ma analisi macro/tecnica rigorosa e disciplina del rischio.
4. **Stile Conversazionale Naturale (stile Gemini Pro)**: Parla in italiano naturale, chiaro, incisivo, autorevole ed empatico. Formatta \`reply_markdown\` in modo impeccabile usando paragrafi brevi, elenchi puntati, **grassetti sui numeri chiave** e, quando utile, tabelle compatte.

SCHEMA JSON OBBLIGATORIO (rispetta esattamente tutte le chiavi):
{
  "thinking_process": [
    "Passaggio 1: lettura dei dati reali in live_context rilevanti per la domanda (saldo, drawdown, ultimi trade, eventi sessione, ATLAS)",
    "Passaggio 2: incrocio tra lente finanziaria/macro e lente neuro-comportamentale (bias rilevati)",
    "Passaggio 3: valutazione dello stato operativo (OPTIMAL / CAUTION / HIGH_EMOTIONAL_RISK) e priorità di protezione capitale",
    "Passaggio 4: formulazione della risposta conversazionale ad alto valore e della singola azione chiave"
  ],
  "reply_markdown": "Risposta conversazionale completa, naturale e ricca in Markdown italiano.",
  "detected_state": "OPTIMAL" | "CAUTION" | "HIGH_EMOTIONAL_RISK",
  "key_insight_card": {
    "title": "Titolo sintetico dell'insight operativo (o null se non serve)",
    "bias_or_metric": "Bias o metrica chiave numerica (es. 'Revenge Trading · 2 trade <10m' oppure 'Italia BTP 10Y · 3.58%')",
    "recommended_action": "1 azione concreta e misurabile da applicare subito"
  },
  "suggested_followups": [
    "Prima domanda di approfondimento contestuale",
    "Seconda domanda di approfondimento contestuale",
    "Terza domanda di approfondimento contestuale"
  ]
}`;

function shouldRouteToDeepProModel(message: string, liveContext?: Record<string, unknown>): boolean {
    const lower = message.toLowerCase();
    const isComplexQuery =
        message.length > 170 ||
        /(audit|completo|portafoglio|strategia|correlazion|macro|drawdown|psicologi|bias|revenge|tilt|analizza nel dettaglio|opportunit|prop firm|rischio complessivo)/.test(
            lower
        );

    const bias = (liveContext?.biasTelemetry as any) || {};
    const perf = (liveContext?.performanceMetrics as any) || {};
    const highRiskTelemetry =
        (perf?.consecutiveLosses ?? 0) >= 2 ||
        bias?.emotionalStatusLabel === 'Allerta' ||
        Boolean(bias?.cortisolClearingActive);

    return isComplexQuery || highRiskTelemetry;
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
    if (!handleCorsAndMethod(req, res, ['GET', 'POST'])) return;

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();

    // Lightweight live health / configuration probe for Copilot header badge
    if (req.method === 'GET') {
        const health = getQueryParam(req, 'health');
        if (health === '1' || health === 'true') {
            res.setHeader('Cache-Control', 'no-store');
            if (!apiKey) {
                res.status(200).json({
                    status: 'MISSING_KEY',
                    connected: false,
                    models: { fast: MODEL_FAST, deep: MODEL_DEEP },
                    error_detail:
                        'Chiave server GEMINI_API_KEY non configurata su Vercel (Settings -> Environment Variables -> GEMINI_API_KEY).'
                });
                return;
            }
            res.status(200).json({
                status: 'OK',
                connected: true,
                models: { fast: MODEL_FAST, deep: MODEL_DEEP }
            });
            return;
        }
        res.status(400).json({
            status: 'ERROR',
            error_detail: 'Usa GET ?health=1 per diagnostica oppure POST per interrogare Tradyx Neural Core.'
        });
        return;
    }

    // POST: Full Omniscient Copilot Request
    const auth = await verifyAuth(req, res, { requireAuth: true });
    if (!auth) return;

    const allowed = await applyRateLimitOrReject(
        req,
        res,
        'ai_copilot',
        auth.userId,
        AI_RATE_LIMIT.MAX_REQUESTS,
        AI_RATE_LIMIT.WINDOW_SECONDS
    );
    if (!allowed) return;

    const rawBody = parseJsonBody(req);
    if (rawBody === null) {
        res.status(400).json({
            status: 'ERROR',
            error_detail: 'Il corpo della richiesta non è un JSON valido.'
        });
        return;
    }

    const parsed = copilotRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
        sendValidationError(res, parsed.error);
        return;
    }

    // Strict diagnostic response if GEMINI_API_KEY is missing — NEVER fabricate fake replies!
    if (!apiKey) {
        res.status(200).json({
            status: 'MISSING_KEY',
            error_detail:
                'GEMINI_API_KEY non è configurata nelle Environment Variables di Vercel. Aggiungi GEMINI_API_KEY (senza prefisso VITE_) in Vercel Dashboard -> Project Settings -> Environment Variables ed esegui Redeploy per attivare Tradyx Neural Core.',
            model_used: null
        });
        return;
    }

    const { message, conversation_history = [], live_context } = parsed.data;
    const useDeep = shouldRouteToDeepProModel(message, live_context);

    const historyText =
        conversation_history.length > 0
            ? conversation_history
                  .slice(-8)
                  .map((m) => `${m.role === 'user' ? 'TRADER' : 'TRADYX AI'}: ${m.content}`)
                  .join('\n\n')
            : 'Inizio nuova conversazione.';

    const serializedContext = live_context
        ? JSON.stringify(live_context, null, 2).slice(0, 14_000)
        : '{}';

    const userPrompt = `[LIVE_CONTEXT — TELEMETRIA REALE DI SISTEMA TRADYX]
${serializedContext}

[CRONOLOGIA CONVERSAZIONE RECENTE]
${historyText}

[MESSAGGIO ATTUALE DEL TRADER]
"${message}"`;

    // Primary call using selected tier; if fast fails, explicitly try deep too so Flash <-> Pro fallback works both ways
    let result = await runStructuredReasoning({
        tier: useDeep ? 'deep' : 'fast',
        systemInstruction: TRADYX_NEURAL_CORE_SYSTEM_PROMPT,
        userPrompt,
        zodSchema: copilotOutputSchema,
        temperature: 0.3,
        thinkingBudget: useDeep ? 2048 : 1024
    });

    if (!result.ok && !useDeep && result.reason !== 'UNCONFIGURED' && result.reason !== 'QUOTA_EXCEEDED') {
        result = await runStructuredReasoning({
            tier: 'deep',
            systemInstruction: TRADYX_NEURAL_CORE_SYSTEM_PROMPT,
            userPrompt,
            zodSchema: copilotOutputSchema,
            temperature: 0.3,
            thinkingBudget: 2048
        });
    }

    if (result.ok) {
        res.status(200).json({
            status: 'OK',
            model_used: result.modelUsed,
            thinking_process: result.data.thinking_process,
            reply_markdown: result.data.reply_markdown,
            detected_state: result.data.detected_state,
            key_insight_card: result.data.key_insight_card ?? null,
            suggested_followups: result.data.suggested_followups.slice(0, 3)
        });
        return;
    }

    if (result.reason === 'UNCONFIGURED') {
        res.status(200).json({
            status: 'MISSING_KEY',
            error_detail: result.message,
            model_used: null
        });
        return;
    }

    if (result.reason === 'QUOTA_EXCEEDED') {
        res.setHeader('Retry-After', '30');
        res.status(429).json({
            status: 'ERROR',
            error_detail:
                'Quota API Gemini temporaneamente raggiunta (HTTP 429). Attendi 30 secondi e riprova.',
            model_used: null
        });
        return;
    }

    res.status(502).json({
        status: 'ERROR',
        error_detail: `Connessione a Gemini non riuscita (${result.reason}): ${result.message}`,
        model_used: null
    });
}
