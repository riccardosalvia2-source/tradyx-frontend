// ============================================================================
// TRADYX GEMINI AI METRICS & COST CONTROL SERVICE (src/services/geminiMetricsService.ts)
// ============================================================================

import { GeminiCallLog, GeminiModelId } from '../types/auth';

const MODEL_STORAGE_KEY = 'tradyx_default_gemini_model';

// Default Global AI Model Selection
let defaultGeminiModel: GeminiModelId = (function() {
    try {
        const stored = localStorage.getItem(MODEL_STORAGE_KEY);
        if (stored && ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'].includes(stored)) {
            return stored as GeminiModelId;
        }
    } catch (e) {}
    return 'gemini-1.5-flash';
})();

// Call Telemetry Logs In-Memory Storage
const callLogs: GeminiCallLog[] = [
    {
        id: 'gcall-101',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        user_email: 'trader.pro@tradyx.ai',
        model: 'gemini-1.5-flash',
        inputTokens: 420,
        outputTokens: 280,
        latencyMs: 340,
        status: '200 OK'
    },
    {
        id: 'gcall-102',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        user_email: 'marco.quant@tradyx.ai',
        model: 'gemini-2.0-flash',
        inputTokens: 850,
        outputTokens: 510,
        latencyMs: 290,
        status: '200 OK'
    },
    {
        id: 'gcall-103',
        timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
        user_email: 'riccardosalvia2@gmail.com',
        model: 'gemini-1.5-pro',
        inputTokens: 1450,
        outputTokens: 920,
        latencyMs: 820,
        status: '200 OK'
    },
    {
        id: 'gcall-104',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        user_email: 'nuovo.utente@tradyx.ai',
        model: 'gemini-1.5-flash',
        inputTokens: 310,
        outputTokens: 190,
        latencyMs: 310,
        status: '200 OK'
    },
    {
        id: 'gcall-105',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        user_email: 'trader.pro@tradyx.ai',
        model: 'gemini-1.5-flash',
        inputTokens: 540,
        outputTokens: 360,
        latencyMs: 410,
        status: '200 OK'
    }
];

export function getDefaultGeminiModel(): GeminiModelId {
    return defaultGeminiModel;
}

export function setDefaultGeminiModel(model: GeminiModelId): void {
    defaultGeminiModel = model;
    try {
        localStorage.setItem(MODEL_STORAGE_KEY, model);
    } catch (e) {
        console.warn('Failed to store default Gemini model', e);
    }
}

export function recordGeminiCall(
    user_email: string,
    model: GeminiModelId,
    inputTokens: number,
    outputTokens: number,
    latencyMs: number,
    status: '200 OK' | '500 Error' | '429 Rate Limit' = '200 OK'
): GeminiCallLog {
    const entry: GeminiCallLog = {
        id: `gcall-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        user_email,
        model,
        inputTokens,
        outputTokens,
        latencyMs,
        status
    };
    callLogs.unshift(entry);
    return entry;
}

export function getGeminiCallLogs(): GeminiCallLog[] {
    return [...callLogs];
}

// Calculate token price based on model pricing per 1,000 tokens
function calculateCallCost(log: GeminiCallLog): number {
    let inputRate = 0.000075;  // default flash 1.5
    let outputRate = 0.000300;

    if (log.model === 'gemini-2.0-flash') {
        inputRate = 0.000100;
        outputRate = 0.000400;
    } else if (log.model === 'gemini-1.5-pro') {
        inputRate = 0.001250;
        outputRate = 0.005000;
    }

    const inputCost = (log.inputTokens / 1000) * inputRate;
    const outputCost = (log.outputTokens / 1000) * outputRate;
    return inputCost + outputCost;
}

export function getGeminiAggregateMetrics() {
    const totalInputTokens = callLogs.reduce((acc, c) => acc + c.inputTokens, 0);
    const totalOutputTokens = callLogs.reduce((acc, c) => acc + c.outputTokens, 0);
    const totalTokens = totalInputTokens + totalOutputTokens;

    const totalCostUSD = callLogs.reduce((acc, c) => acc + calculateCallCost(c), 0);

    const totalCalls = callLogs.length;
    const avgLatencyMs = totalCalls > 0 
        ? Math.round(callLogs.reduce((acc, c) => acc + c.latencyMs, 0) / totalCalls) 
        : 0;

    return {
        totalCalls,
        totalInputTokens,
        totalOutputTokens,
        totalTokens,
        totalCostUSD,
        avgLatencyMs,
        defaultModel: defaultGeminiModel
    };
}
