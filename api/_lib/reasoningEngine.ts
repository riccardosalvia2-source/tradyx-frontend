// ============================================================================
// TRADYX CENTRALIZED AI REASONING ENGINE (api/_lib/reasoningEngine.ts)
// Institutional Chain-of-Thought + Context Injection + Strict JSON Schema
// Powered exclusively server-side by @google/genai (gemini-2.5-flash / 2.5-pro).
// ============================================================================

import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

export type ReasoningTier = 'fast' | 'deep';

export const MODEL_FAST = 'gemini-2.5-flash';
export const MODEL_DEEP = 'gemini-2.5-pro';

/**
 * Mandatory institutional cognitive protocol prepended to every Gemini call.
 * Eliminates generic clichés and enforces direct causal-chain reasoning.
 */
export const INSTITUTIONAL_COGNITIVE_PROTOCOL = `PROTOCOLLO COGNITIVO OBBLIGATORIO (TRADYX QUANT ENGINE):
1. DIVIETO ASSOLUTO DI FRASI GENERICHE: È severamente vietato usare espressioni vaghe, motivazionali o ripetitive come "Monitorare la situazione con cautela", "I mercati sono volatili", "Mantieni la calma e segui il piano", "Valuta attentamente il rischio" o qualsiasi frase che possa applicarsi indistintamente a un altro trader o a un'altra notizia.
2. RAGIONAMENTO PER NESSI CAUSALI DIRETTI:
   - In ambito Macro/News segui sempre la catena: Evento Specifico -> Meccanismo di Trasmissione (tassi reali, spread sovrani, margini aziendali, liquidità interbancaria, export/FX) -> Impatto su costo del capitale o multipli -> Asset/Ticker reali specifici impattati.
   - In ambito Psicologia/Risk Management segui sempre la catena: Metrica Reale del Diario (ticker, orario esatto, intervallo Δt tra trade, size rispetto alla media, drawdown vs limite) -> Bias Cognitivo Specifico -> Vulnerabilità sul capitale -> 1 Regola Operativa Misurabile per i prossimi 60 minuti.
3. CHAIN-OF-THOUGHT OBBLIGATORIO PRIMA DELL'OUTPUT:
   - Compila SEMPRE per primo il campo JSON "internal_reasoning" con 3-4 passaggi logici espliciti e numerici. Ogni campo visibile all'utente deve derivare rigorosamente da quei passaggi.
4. CONFORMITÀ ETICA & PRECISIONE:
   - Rispondi ESCLUSIVAMENTE in JSON valido aderente allo schema richiesto, in lingua italiana professionale da prop trading desk istituzionale.
   - Non inventare numeri non presenti nel contesto. Non fornire mai segnali operativi ("compra X ora") ma analisi causali, valutazione del rischio e disciplina comportamentale.`;

export interface StructuredReasoningOptions<T extends z.ZodTypeAny> {
    tier: ReasoningTier;
    systemInstruction: string;
    userPrompt: string;
    zodSchema: T;
    temperature?: number;
    thinkingBudget?: number;
    multimodalParts?: Array<
        | { text: string }
        | { inlineData: { mimeType: string; data: string } }
    >;
}

export interface StructuredReasoningSuccess<T> {
    ok: true;
    data: T;
    modelUsed: string;
}

export interface StructuredReasoningFailure {
    ok: false;
    reason: 'UNCONFIGURED' | 'QUOTA_EXCEEDED' | 'PARSE_OR_SCHEMA_ERROR' | 'UPSTREAM_ERROR';
    message: string;
}

export type StructuredReasoningResult<T> =
    | StructuredReasoningSuccess<T>
    | StructuredReasoningFailure;

function stripJsonFences(raw: string): string {
    return raw
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
}

function extractFirstJsonBlock(raw: string): string {
    const cleaned = stripJsonFences(raw);
    if (cleaned.startsWith('{') || cleaned.startsWith('[')) return cleaned;
    const objStart = cleaned.indexOf('{');
    const arrStart = cleaned.indexOf('[');
    if (objStart === -1 && arrStart === -1) return cleaned;
    const start =
        objStart === -1 ? arrStart : arrStart === -1 ? objStart : Math.min(objStart, arrStart);
    const endChar = cleaned[start] === '[' ? ']' : '}';
    const end = cleaned.lastIndexOf(endChar);
    return end > start ? cleaned.slice(start, end + 1) : cleaned;
}

function isQuotaError(err: unknown): boolean {
    const e = err as { status?: number; message?: string };
    const msg = String(e?.message || '').toLowerCase();
    return e?.status === 429 || msg.includes('quota') || msg.includes('rate limit') || msg.includes('resource_exhausted');
}

async function invokeGeminiJson(
    ai: GoogleGenAI,
    model: string,
    fullSystemInstruction: string,
    contents: string | Array<{ role: string; parts: Array<any> }>,
    temperature: number,
    thinkingBudget?: number
): Promise<string | null> {
    const baseConfig: Record<string, unknown> = {
        systemInstruction: fullSystemInstruction,
        temperature,
        responseMimeType: 'application/json'
    };

    // Enable native thinkingConfig where supported by Gemini 2.5 models
    if (typeof thinkingBudget === 'number' && thinkingBudget > 0) {
        try {
            const response = await ai.models.generateContent({
                model,
                contents,
                config: {
                    ...baseConfig,
                    thinkingConfig: { thinkingBudget }
                } as any
            });
            if (response?.text?.trim()) return response.text.trim();
        } catch (err: any) {
            // If the SDK/model rejects thinkingConfig syntax, fall back immediately without thinkingConfig
            const msg = String(err?.message || '').toLowerCase();
            if (!msg.includes('thinking') && !msg.includes('unknown field') && !msg.includes('invalid argument')) {
                throw err;
            }
        }
    }

    const response = await ai.models.generateContent({
        model,
        contents,
        config: baseConfig as any
    });
    return response?.text?.trim() || null;
}

/**
 * Executes a strict Chain-of-Thought structured JSON reasoning call against Gemini 2.5.
 * Automatically falls back from gemini-2.5-pro -> gemini-2.5-flash if deep tier fails or hits quota.
 */
export async function runStructuredReasoning<T extends z.ZodTypeAny>(
    options: StructuredReasoningOptions<T>
): Promise<StructuredReasoningResult<z.infer<T>>> {
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
        return {
            ok: false,
            reason: 'UNCONFIGURED',
            message: 'GEMINI_API_KEY non configurata lato server.'
        };
    }

    const ai = new GoogleGenAI({ apiKey });
    const fullSystemInstruction = `${INSTITUTIONAL_COGNITIVE_PROTOCOL}\n\n${options.systemInstruction}`;
    const temperature = options.temperature ?? 0.25;
    const thinkingBudget = options.thinkingBudget ?? (options.tier === 'deep' ? 2048 : 1024);

    const contents: string | Array<{ role: string; parts: Array<any> }> =
        options.multimodalParts && options.multimodalParts.length > 0
            ? [{ role: 'user', parts: options.multimodalParts }]
            : options.userPrompt;

    const candidateModels =
        options.tier === 'deep' ? [MODEL_DEEP, MODEL_FAST] : [MODEL_FAST];

    let lastError: unknown = null;

    for (const model of candidateModels) {
        try {
            const rawText = await invokeGeminiJson(
                ai,
                model,
                fullSystemInstruction,
                contents,
                temperature,
                thinkingBudget
            );

            if (!rawText) continue;

            const jsonStr = extractFirstJsonBlock(rawText);
            const parsedJson = JSON.parse(jsonStr);
            const validated = options.zodSchema.safeParse(parsedJson);

            if (validated.success) {
                return {
                    ok: true,
                    data: validated.data,
                    modelUsed: model
                };
            }

            lastError = new Error(
                `Schema mismatch (${model}): ${validated.error.issues
                    .map((i) => `${i.path.join('.')}: ${i.message}`)
                    .join('; ')}`
            );
        } catch (err) {
            lastError = err;
            if (isQuotaError(err) && model === MODEL_FAST) {
                return {
                    ok: false,
                    reason: 'QUOTA_EXCEEDED',
                    message: 'Quota Gemini momentaneamente esaurita.'
                };
            }
            // If deep model failed/timed out/hit quota, loop automatically tries MODEL_FAST
        }
    }

    if (isQuotaError(lastError)) {
        return {
            ok: false,
            reason: 'QUOTA_EXCEEDED',
            message: 'Quota Gemini temporaneamente raggiunta.'
        };
    }

    return {
        ok: false,
        reason: lastError instanceof SyntaxError ? 'PARSE_OR_SCHEMA_ERROR' : 'UPSTREAM_ERROR',
        message: String((lastError as Error)?.message || 'Errore motore di ragionamento AI.')
    };
}
