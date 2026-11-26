// ============================================================================
// TRADYX NEURAL CORE — OMNISCIENT GEMINI COPILOT INTERFACE
// (src/components/coach/TradyxAiCopilot.tsx)
// Native conversational Financial & Psychological Copilot connected to
// /api/ai/copilot with live system telemetry, Chain-of-Thought disclosure,
// operational insight cards, and 1-tap contextual follow-ups.
// ============================================================================

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    BrainCircuit,
    Send,
    Sparkles,
    ChevronDown,
    ChevronUp,
    ShieldCheck,
    ShieldAlert,
    AlertTriangle,
    RefreshCw,
    ArrowUpRight,
    Activity,
    Globe,
    RotateCcw,
    Cpu,
    CheckCircle2,
    Terminal
} from 'lucide-react';
import { useTradeStore } from '../../store/useTradeStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import {
    buildTradyxLiveContext,
    useNeuralTelemetryStore
} from '../../services/tradyxNeuralContext';
import { getApiAuthHeaders, addSystemLog } from '../../services/authService';

type DetectedState = 'OPTIMAL' | 'CAUTION' | 'HIGH_EMOTIONAL_RISK';

interface KeyInsightCard {
    title: string;
    bias_or_metric: string;
    recommended_action: string;
}

interface CopilotMessage {
    id: string;
    role: 'user' | 'assistant' | 'diagnostic';
    content: string;
    timestamp: string;
    thinkingProcess?: string[];
    detectedState?: DetectedState;
    keyInsightCard?: KeyInsightCard | null;
    suggestedFollowups?: string[];
    modelUsed?: string | null;
    errorCode?: 'MISSING_KEY' | 'ERROR';
}

interface ConnectionHealth {
    status: 'CHECKING' | 'OK' | 'MISSING_KEY' | 'ERROR';
    errorDetail?: string;
}

// ============================================================================
// LIGHTWEIGHT CLEAN MARKDOWN RENDERER (Bold, Code/Tickers, Lists, Tables)
// ============================================================================
function renderInlineMarkdown(text: string): React.ReactNode[] {
    const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
    return tokens.map((tok, i) => {
        if (tok.startsWith('**') && tok.endsWith('**') && tok.length > 4) {
            return (
                <strong key={i} className="font-extrabold text-white">
                    {tok.slice(2, -2)}
                </strong>
            );
        }
        if (tok.startsWith('`') && tok.endsWith('`') && tok.length > 2) {
            return (
                <code
                    key={i}
                    className="px-1.5 py-0.5 mx-0.5 rounded-md bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] font-mono text-[11px] font-bold"
                >
                    {tok.slice(1, -1)}
                </code>
            );
        }
        if (tok.startsWith('*') && tok.endsWith('*') && tok.length > 2) {
            return (
                <em key={i} className="italic text-slate-200">
                    {tok.slice(1, -1)}
                </em>
            );
        }
        return <React.Fragment key={i}>{tok}</React.Fragment>;
    });
}

const MarkdownReply: React.FC<{ markdown: string }> = ({ markdown }) => {
    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    const blocks: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i].trim();

        if (!line) {
            i += 1;
            continue;
        }

        // Markdown Table block
        if (line.startsWith('|') && i + 1 < lines.length && lines[i + 1].trim().startsWith('|')) {
            const tableLines: string[] = [];
            while (i < lines.length && lines[i].trim().startsWith('|')) {
                tableLines.push(lines[i].trim());
                i += 1;
            }
            const rows = tableLines
                .filter((r) => !/^\|[\s\-:|]+\|$/.test(r))
                .map((r) =>
                    r
                        .replace(/^\||\|$/g, '')
                        .split('|')
                        .map((c) => c.trim())
                );
            if (rows.length > 0) {
                const [header, ...bodyRows] = rows;
                blocks.push(
                    <div
                        key={`tbl-${i}`}
                        className="my-2 overflow-x-auto rounded-xl border border-white/[0.08] bg-black/30"
                    >
                        <table className="w-full text-left border-collapse text-[11px] font-mono">
                            <thead>
                                <tr className="border-b border-white/[0.08] bg-white/[0.04] text-cyan-300">
                                    {header.map((cell, ci) => (
                                        <th key={ci} className="px-2.5 py-1.5 font-bold">
                                            {renderInlineMarkdown(cell)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.05]">
                                {bodyRows.map((row, ri) => (
                                    <tr key={ri} className="text-slate-200">
                                        {row.map((cell, ci) => (
                                            <td key={ci} className="px-2.5 py-1.5">
                                                {renderInlineMarkdown(cell)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            }
            continue;
        }

        // Headings (### / ## / #)
        const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
        if (headingMatch) {
            blocks.push(
                <h4
                    key={`h-${i}`}
                    className="text-xs sm:text-[13px] font-extrabold text-cyan-300 tracking-tight pt-1.5 pb-0.5"
                >
                    {renderInlineMarkdown(headingMatch[2])}
                </h4>
            );
            i += 1;
            continue;
        }

        // Bullet list
        if (/^[-•*]\s+/.test(line)) {
            const listItems: string[] = [];
            while (i < lines.length && /^[-•*]\s+/.test(lines[i].trim())) {
                listItems.push(lines[i].trim().replace(/^[-•*]\s+/, ''));
                i += 1;
            }
            blocks.push(
                <ul key={`ul-${i}`} className="space-y-1.5 pl-1 my-1">
                    {listItems.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-200 leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0 mt-1.5" />
                            <span>{renderInlineMarkdown(item)}</span>
                        </li>
                    ))}
                </ul>
            );
            continue;
        }

        // Numbered list
        if (/^\d+[.)]\s+/.test(line)) {
            const listItems: string[] = [];
            while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
                listItems.push(lines[i].trim().replace(/^\d+[.)]\s+/, ''));
                i += 1;
            }
            blocks.push(
                <ol key={`ol-${i}`} className="space-y-1.5 pl-1 my-1">
                    {listItems.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-200 leading-relaxed">
                            <span className="text-[10px] font-mono font-black text-cyan-400 shrink-0 mt-0.5">
                                {idx + 1}.
                            </span>
                            <span>{renderInlineMarkdown(item)}</span>
                        </li>
                    ))}
                </ol>
            );
            continue;
        }

        // Standard paragraph
        blocks.push(
            <p key={`p-${i}`} className="text-xs sm:text-[13px] text-slate-200 leading-relaxed">
                {renderInlineMarkdown(line)}
            </p>
        );
        i += 1;
    }

    return <div className="space-y-2">{blocks}</div>;
};

// ============================================================================
// MAIN COPILOT COMPONENT
// ============================================================================
export const TradyxAiCopilot: React.FC = () => {
    const trades = useTradeStore((s) => s.trades);
    const settings = useSettingsStore();
    const activeAtlasHub = useNeuralTelemetryStore((s) => s.activeAtlasHub);
    const sessionEvents = useNeuralTelemetryStore((s) => s.events);
    const pendingCopilotRequest = useNeuralTelemetryStore((s) => s.pendingCopilotRequest);
    const consumePendingCopilotRequest = useNeuralTelemetryStore(
        (s) => s.consumePendingCopilotRequest
    );

    const [messages, setMessages] = useState<CopilotMessage[]>([]);
    const [inputText, setInputText] = useState<string>('');
    const [isThinking, setIsThinking] = useState<boolean>(false);
    const [expandedThinkingIds, setExpandedThinkingIds] = useState<Record<string, boolean>>({});
    const [health, setHealth] = useState<ConnectionHealth>({ status: 'CHECKING' });

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesRef = useRef<CopilotMessage[]>([]);
    messagesRef.current = messages;

    // Live reactive snapshot of the entire Tradyx OS
    const liveContext = useMemo(
        () => buildTradyxLiveContext(),
        // Recompute whenever trades, key risk settings, active ATLAS hub, or session events change
        [
            trades,
            settings.monthlyBudget,
            settings.propFirmShieldEnabled,
            settings.propFirmMaxDailyLossPercent,
            settings.propFirmAccountSize,
            settings.maxRiskPerTrade,
            activeAtlasHub,
            sessionEvents.length
        ]
    );

    // 1. Real live health check on mount (no Gemini tokens spent)
    const checkServerHealth = useCallback(async () => {
        setHealth({ status: 'CHECKING' });
        try {
            const res = await fetch('/api/ai/copilot?health=1');
            if (!res.ok) {
                setHealth({
                    status: 'ERROR',
                    errorDetail: `Endpoint /api/ai/copilot non raggiungibile (HTTP ${res.status}). Verifica il deploy Vercel.`
                });
                return;
            }
            const data = await res.json();
            if (data?.status === 'OK' && data?.connected) {
                setHealth({ status: 'OK' });
            } else if (data?.status === 'MISSING_KEY') {
                setHealth({
                    status: 'MISSING_KEY',
                    errorDetail: data.error_detail
                });
            } else {
                setHealth({
                    status: 'ERROR',
                    errorDetail: data?.error_detail || 'Stato connessione Gemini non verificabile.'
                });
            }
        } catch {
            setHealth({
                status: 'ERROR',
                errorDetail:
                    'Serverless function /api/ai/copilot non disponibile in questo ambiente locale. In produzione su Vercel con GEMINI_API_KEY si connette automaticamente.'
            });
        }
    }, []);

    useEffect(() => {
        void checkServerHealth();
    }, [checkServerHealth]);

    // Auto-scroll smoothly on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    // 2. Dynamic contextual initial prompts based on what the user is actually doing
    const contextualInitialPrompts = useMemo(() => {
        const prompts: Array<{ label: string; tag: string }> = [];

        if (liveContext.activeAtlasHub) {
            prompts.push({
                label: `Analizza come i dati macro di ${liveContext.activeAtlasHub.countryName} (${liveContext.activeAtlasHub.centralBank} ${liveContext.activeAtlasHub.policyRate}%, CPI ${liveContext.activeAtlasHub.inflationCpi}%) influenzano la mia operatività`,
                tag: `ATLAS · ${liveContext.activeAtlasHub.iso2}`
            });
        }

        const latestTrade = liveContext.recentTrades[0];
        if (latestTrade && latestTrade.pnl < 0) {
            prompts.push({
                label: `Analizza il mio ultimo trade in perdita su ${latestTrade.asset_pair} (${latestTrade.pnl}) e dimmi se ho commesso errori emotivi o di risk management`,
                tag: 'POST-LOSS AUDIT'
            });
        } else if (latestTrade) {
            prompts.push({
                label: `Analizza il mio ultimo trade su ${latestTrade.asset_pair} (${latestTrade.direction}) e verifica se la size è coerente col mio piano`,
                tag: 'TRADE REVIEW'
            });
        }

        if (
            liveContext.biasTelemetry.revengeTrading.score > 0 ||
            liveContext.biasTelemetry.tiltOversizing.score > 0
        ) {
            prompts.push({
                label: 'Esamina i miei pattern di Revenge Trading e Oversizing dagli ultimi 30 trade e crea una regola protettiva',
                tag: 'BIAS SHIELD'
            });
        } else if (liveContext.biasTelemetry.worstAsset) {
            prompts.push({
                label: `Perché sto perdendo su ${liveContext.biasTelemetry.worstAsset.symbol} rispetto al mio asset migliore (${liveContext.biasTelemetry.bestAsset?.symbol || 'portafoglio'})?`,
                tag: 'EDGE MATRIX'
            });
        }

        prompts.push({
            label: 'Fai un audit completo del mio andamento finanziario e psicologico: saldo, drawdown, fasce orarie e punti deboli',
            tag: 'FULL AUDIT'
        });

        if (prompts.length < 4) {
            prompts.push({
                label: 'Come devo calibrare rischio per trade e numero di operazioni oggi in base al mio Win Rate e Profit Factor?',
                tag: 'RISK PLAN'
            });
        }

        return prompts.slice(0, 4);
    }, [liveContext]);

    // 3. Send message to real /api/ai/copilot endpoint with full TradyxLiveContext
    const sendMessage = useCallback(async (rawText?: string) => {
        const query = (rawText ?? inputText).trim();
        if (!query || isThinking) return;

        const nowLabel = new Date().toLocaleTimeString('it-IT', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const userMsg: CopilotMessage = {
            id: `u-${Date.now()}`,
            role: 'user',
            content: query,
            timestamp: nowLabel
        };

        const historyForApi = messagesRef.current
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .slice(-10)
            .map((m) => ({
                role: m.role as 'user' | 'assistant',
                content: m.content.slice(0, 2000)
            }));

        setMessages((prev) => [...prev, userMsg]);
        if (!rawText) setInputText('');
        setIsThinking(true);

        const freshLiveContext = buildTradyxLiveContext();
        addSystemLog(
            'AI_QUERY',
            `Tradyx Neural Core query: "${query.slice(0, 50)}${query.length > 50 ? '...' : ''}"`,
            'trader.pro@tradyx.ai',
            {
                tradesAnalyzed: freshLiveContext.performanceMetrics.totalTradesAnalyzed,
                emotionalStatus: freshLiveContext.biasTelemetry.emotionalStatusLabel
            }
        );

        try {
            const authHeaders = await getApiAuthHeaders();
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 35_000);

            const res = await fetch('/api/ai/copilot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                },
                body: JSON.stringify({
                    message: query,
                    conversation_history: historyForApi,
                    live_context: freshLiveContext
                }),
                signal: controller.signal
            });
            clearTimeout(timer);

            const data = await res.json().catch(() => null);
            const replyTime = new Date().toLocaleTimeString('it-IT', {
                hour: '2-digit',
                minute: '2-digit'
            });

            if (data?.status === 'OK' && typeof data?.reply_markdown === 'string') {
                setHealth({ status: 'OK' });
                const aiMsg: CopilotMessage = {
                    id: `a-${Date.now()}`,
                    role: 'assistant',
                    content: data.reply_markdown,
                    timestamp: replyTime,
                    thinkingProcess: Array.isArray(data.thinking_process)
                        ? data.thinking_process
                        : [],
                    detectedState: data.detected_state || 'OPTIMAL',
                    keyInsightCard: data.key_insight_card || null,
                    suggestedFollowups: Array.isArray(data.suggested_followups)
                        ? data.suggested_followups.slice(0, 3)
                        : [],
                    modelUsed: data.model_used || 'gemini-2.5-flash'
                };
                setMessages((prev) => [...prev, aiMsg]);
                return;
            }

            // Explicit transparent diagnostic — NEVER fake an AI reply!
            const errStatus: 'MISSING_KEY' | 'ERROR' =
                data?.status === 'MISSING_KEY' ? 'MISSING_KEY' : 'ERROR';
            const detail =
                data?.error_detail ||
                data?.message ||
                `Risposta non valida dal server (HTTP ${res.status}).`;

            setHealth({ status: errStatus, errorDetail: detail });
            setMessages((prev) => [
                ...prev,
                {
                    id: `diag-${Date.now()}`,
                    role: 'diagnostic',
                    content: detail,
                    timestamp: replyTime,
                    errorCode: errStatus
                }
            ]);
        } catch (err: any) {
            const replyTime = new Date().toLocaleTimeString('it-IT', {
                hour: '2-digit',
                minute: '2-digit'
            });
            const detail =
                err?.name === 'AbortError'
                    ? 'Timeout durante il ragionamento profondo di Gemini (>35s). Riprova con una richiesta più mirata.'
                    : 'Impossibile raggiungere l’endpoint server /api/ai/copilot. Verifica la connessione o la presenza di GEMINI_API_KEY su Vercel.';

            setHealth({ status: 'ERROR', errorDetail: detail });
            setMessages((prev) => [
                ...prev,
                {
                    id: `diag-${Date.now()}`,
                    role: 'diagnostic',
                    content: detail,
                    timestamp: replyTime,
                    errorCode: 'ERROR'
                }
            ]);
        } finally {
            setIsThinking(false);
        }
    }, [inputText, isThinking]);

    // 4. Auto-consume contextual "Chiedi a Tradyx AI" prompt triggered from HISTORY or ATLAS
    useEffect(() => {
        if (pendingCopilotRequest && !isThinking) {
            const req = consumePendingCopilotRequest();
            if (req?.prompt) {
                void sendMessage(req.prompt);
            }
        }
    }, [pendingCopilotRequest, isThinking, consumePendingCopilotRequest, sendMessage]);

    const emotionalPillStyle =
        liveContext.biasTelemetry.emotionalStatusLabel === 'Allerta'
            ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
            : liveContext.biasTelemetry.emotionalStatusLabel === 'Cautela'
            ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
            : 'bg-emerald-500/15 text-[#10B981] border-emerald-500/40';

    const lastAssistantIdx = useMemo(() => {
        for (let idx = messages.length - 1; idx >= 0; idx -= 1) {
            if (messages[idx].role === 'assistant') return idx;
        }
        return -1;
    }, [messages]);

    return (
        <div className="w-full flex flex-col min-h-[calc(100dvh-5rem)] px-3 sm:px-4 pt-2 pb-36 text-white select-none overflow-x-hidden relative">
            {/* =============================================================== */}
            {/* LIVE NEURAL TELEMETRY HEADER                                    */}
            {/* =============================================================== */}
            <header className="glass-header sticky top-0 z-30 p-3 rounded-2xl shadow-xl space-y-2.5 border border-white/[0.08]">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#10B981]/25 to-[#2563EB]/25 border border-[#10B981]/40 flex items-center justify-center shadow-[0_0_18px_rgba(16,185,129,0.2)] shrink-0">
                            <BrainCircuit className="w-5 h-5 text-[#10B981]" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono font-black tracking-wider uppercase text-cyan-300">
                                    TRADYX NEURAL CORE
                                </span>
                                {liveContext.activeAtlasHub && (
                                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-[9px] font-mono text-cyan-200 inline-flex items-center gap-1">
                                        <Globe className="w-2.5 h-2.5" />
                                        {liveContext.activeAtlasHub.iso2}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-xs sm:text-sm font-extrabold text-white truncate">
                                Copilot Finanziario & Psicologico Omnisciente
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        {messages.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setMessages([])}
                                title="Nuova conversazione"
                                className="p-1.5 rounded-xl glass-subcard text-slate-400 hover:text-white transition cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => void checkServerHealth()}
                            className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-black border flex items-center gap-1.5 cursor-pointer transition ${
                                health.status === 'OK'
                                    ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40'
                                    : health.status === 'CHECKING'
                                    ? 'bg-white/[0.06] text-slate-300 border-white/[0.12]'
                                    : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                            }`}
                        >
                            <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                    health.status === 'OK'
                                        ? 'bg-[#10B981] animate-pulse'
                                        : health.status === 'CHECKING'
                                        ? 'bg-slate-400 animate-ping'
                                        : 'bg-rose-400'
                                }`}
                            />
                            <span>
                                {health.status === 'OK'
                                    ? 'GEMINI NEURAL CORE ATTIVO'
                                    : health.status === 'CHECKING'
                                    ? 'CONNESSIONE...'
                                    : health.status === 'MISSING_KEY'
                                    ? 'GEMINI KEY MANCANTE'
                                    : 'DIAGNOSTICA API'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* 3 LIVE SYSTEM TELEMETRY PILLS */}
                <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                    <div className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-between">
                        <span className="text-slate-400 truncate">Trade Analizzati</span>
                        <strong className="text-white font-black ml-1">
                            {liveContext.performanceMetrics.totalTradesAnalyzed}
                        </strong>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-between">
                        <span className="text-slate-400 truncate">Win Rate</span>
                        <strong className="text-[#10B981] font-black ml-1">
                            {liveContext.performanceMetrics.winRatePct}%
                        </strong>
                    </div>
                    <div
                        className={`px-2.5 py-1.5 rounded-xl border flex items-center justify-between ${emotionalPillStyle}`}
                    >
                        <span className="opacity-80 truncate">Stato</span>
                        <strong className="font-black ml-1">
                            {liveContext.biasTelemetry.emotionalStatusLabel}
                        </strong>
                    </div>
                </div>
            </header>

            {/* DIAGNOSTIC BANNER WHEN GEMINI_API_KEY IS MISSING OR UNREACHABLE */}
            {(health.status === 'MISSING_KEY' || health.status === 'ERROR') && (
                <div className="mt-3 p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs space-y-1.5 animate-in fade-in">
                    <div className="flex items-center gap-2 text-amber-300 font-mono font-black text-[11px]">
                        <Terminal className="w-4 h-4 shrink-0" />
                        <span>
                            {health.status === 'MISSING_KEY'
                                ? 'CONFIGURAZIONE RICHIESTA: GEMINI_API_KEY SU VERCEL'
                                : 'DIAGNOSTICA ENDPOINT /api/ai/copilot'}
                        </span>
                    </div>
                    <p className="text-[11px] text-amber-100/90 leading-relaxed">
                        {health.errorDetail}
                    </p>
                </div>
            )}

            {/* =============================================================== */}
            {/* CONVERSATIONAL CHAT STREAM                                      */}
            {/* =============================================================== */}
            <div className="flex-1 w-full space-y-4 py-4">
                {messages.length === 0 && (
                    <div className="py-5 flex flex-col items-center text-center space-y-5 animate-in fade-in">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#10B981]/20 via-cyan-500/15 to-[#2563EB]/25 border border-[#10B981]/35 flex items-center justify-center shadow-[0_0_35px_rgba(16,185,129,0.2)]">
                                <Sparkles className="w-8 h-8 text-[#10B981]" />
                            </div>
                            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-[#08090C] border border-[#10B981]/50 text-[8px] font-mono font-black text-[#10B981]">
                                LIVE OS
                            </span>
                        </div>

                        <div className="space-y-1.5 max-w-sm">
                            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                                Chiedi qualsiasi cosa al tuo Copilot
                            </h2>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Telemetria attiva su saldo (
                                <strong className="text-slate-200 font-mono">
                                    {settings.formatMoney(
                                        liveContext.walletAndRisk.currentBalance,
                                        false
                                    )}
                                </strong>
                                ), drawdown ({liveContext.walletAndRisk.dailyDrawdownPct}% /{' '}
                                {liveContext.walletAndRisk.dailyDrawdownLimitPct}%), bias
                                comportamentali e dati macro ATLAS.
                            </p>
                        </div>

                        {/* 4 CONTEXTUAL SMART INITIAL PROMPTS */}
                        <div className="w-full space-y-2 text-left">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold px-1 block">
                                Prompt Contestuali Live
                            </span>
                            {contextualInitialPrompts.map((item, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => void sendMessage(item.label)}
                                    className="w-full p-3 rounded-2xl glass-panel hover:bg-white/[0.06] border border-white/[0.08] hover:border-[#10B981]/40 transition flex items-start justify-between gap-3 cursor-pointer active:scale-[0.99] text-left"
                                >
                                    <div className="space-y-1">
                                        <span className="inline-block px-2 py-0.5 rounded-md bg-[#10B981]/10 border border-[#10B981]/25 text-[9px] font-mono font-black text-[#10B981]">
                                            {item.tag}
                                        </span>
                                        <p className="text-xs text-slate-200 leading-snug font-medium">
                                            {item.label}
                                        </p>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-[#10B981] shrink-0 mt-1" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, msgIdx) => {
                    if (msg.role === 'user') {
                        return (
                            <div key={msg.id} className="flex justify-end">
                                <div className="max-w-[85%] rounded-2xl rounded-br-sm px-4 py-3 bg-gradient-to-br from-[#10B981] to-[#059669] text-white shadow-lg shadow-[#10B981]/15">
                                    <p className="text-xs sm:text-[13px] font-semibold leading-relaxed whitespace-pre-wrap">
                                        {msg.content}
                                    </p>
                                    <span className="block text-[9px] font-mono text-white/70 text-right mt-1">
                                        {msg.timestamp}
                                    </span>
                                </div>
                            </div>
                        );
                    }

                    if (msg.role === 'diagnostic') {
                        return (
                            <div key={msg.id} className="flex justify-start">
                                <div className="w-full rounded-2xl p-3.5 bg-rose-950/40 border border-rose-500/40 space-y-2">
                                    <div className="flex items-center gap-2 text-rose-300 font-mono text-[11px] font-black">
                                        <AlertTriangle className="w-4 h-4 shrink-0" />
                                        <span>
                                            {msg.errorCode === 'MISSING_KEY'
                                                ? 'GEMINI_API_KEY non configurata lato server'
                                                : 'Errore chiamata Gemini Neural Core'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-rose-100/90 leading-relaxed">
                                        {msg.content}
                                    </p>
                                    <span className="block text-[9px] font-mono text-rose-300/60">
                                        {msg.timestamp} · Diagnostica trasparente (nessuna risposta simulata)
                                    </span>
                                </div>
                            </div>
                        );
                    }

                    const isExpanded = !!expandedThinkingIds[msg.id];
                    const stateStyle =
                        msg.detectedState === 'HIGH_EMOTIONAL_RISK'
                            ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                            : msg.detectedState === 'CAUTION'
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                            : 'bg-emerald-500/12 border-emerald-500/35 text-emerald-100';

                    return (
                        <div key={msg.id} className="flex items-start gap-2.5">
                            <div className="w-7 h-7 rounded-xl bg-[#10B981]/15 border border-[#10B981]/40 flex items-center justify-center shrink-0 mt-0.5">
                                <BrainCircuit className="w-4 h-4 text-[#10B981]" />
                            </div>

                            <div className="flex-1 min-w-0 space-y-2.5">
                                <div className="rounded-2xl rounded-tl-sm p-4 glass-panel border border-white/[0.08] shadow-xl space-y-3">
                                    {/* Conversational Rich Markdown Reply */}
                                    <MarkdownReply markdown={msg.content} />

                                    {/* Operational Key Insight Card */}
                                    {msg.keyInsightCard && (
                                        <div className={`p-3 rounded-xl border space-y-1.5 ${stateStyle}`}>
                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-black uppercase">
                                                    {msg.detectedState === 'HIGH_EMOTIONAL_RISK' ? (
                                                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                                                    ) : msg.detectedState === 'CAUTION' ? (
                                                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                                    ) : (
                                                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                                                    )}
                                                    <span>{msg.keyInsightCard.title}</span>
                                                </span>
                                                <span className="px-2 py-0.5 rounded-md bg-black/30 text-[9px] font-mono font-bold">
                                                    {msg.keyInsightCard.bias_or_metric}
                                                </span>
                                            </div>
                                            <p className="text-[11px] leading-snug font-medium">
                                                {msg.keyInsightCard.recommended_action}
                                            </p>
                                        </div>
                                    )}

                                    {/* Expandable Thinking Process Toggle */}
                                    <div className="pt-2 border-t border-white/[0.07] flex items-center justify-between gap-2 flex-wrap">
                                        {msg.thinkingProcess && msg.thinkingProcess.length > 0 ? (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setExpandedThinkingIds((prev) => ({
                                                        ...prev,
                                                        [msg.id]: !prev[msg.id]
                                                    }))
                                                }
                                                className="inline-flex items-center gap-1.5 text-[10px] font-mono text-cyan-300 hover:text-cyan-200 transition cursor-pointer"
                                            >
                                                <Cpu className="w-3 h-3" />
                                                <span>
                                                    🧠 Processo di Ragionamento AI (
                                                    {msg.thinkingProcess.length} step)
                                                </span>
                                                {isExpanded ? (
                                                    <ChevronUp className="w-3 h-3" />
                                                ) : (
                                                    <ChevronDown className="w-3 h-3" />
                                                )}
                                            </button>
                                        ) : (
                                            <span />
                                        )}

                                        <span className="text-[9px] font-mono text-slate-500">
                                            {msg.modelUsed || 'gemini-2.5'} · {msg.timestamp}
                                        </span>
                                    </div>

                                    {isExpanded && msg.thinkingProcess && (
                                        <div className="p-3 rounded-xl bg-[#05080F]/95 border border-cyan-500/20 space-y-1.5 animate-in fade-in">
                                            {msg.thinkingProcess.map((step, sIdx) => (
                                                <div
                                                    key={sIdx}
                                                    className="flex items-start gap-2 text-[10px] font-mono text-slate-300 leading-relaxed"
                                                >
                                                    <span className="text-cyan-400 font-black shrink-0">
                                                        [{sIdx + 1}]
                                                    </span>
                                                    <span>{step.replace(/^\d+[.)]\s*/, '')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* 3 Clickable Suggested Follow-ups (shown below the latest AI reply) */}
                                {msgIdx === lastAssistantIdx &&
                                    msg.suggestedFollowups &&
                                    msg.suggestedFollowups.length > 0 &&
                                    !isThinking && (
                                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                                            {msg.suggestedFollowups.map((follow, fIdx) => (
                                                <button
                                                    key={fIdx}
                                                    type="button"
                                                    onClick={() => void sendMessage(follow)}
                                                    className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-[#10B981]/15 border border-white/[0.1] hover:border-[#10B981]/40 text-[11px] text-slate-200 hover:text-white transition text-left cursor-pointer active:scale-[0.98] inline-flex items-center gap-1.5"
                                                >
                                                    <Sparkles className="w-3 h-3 text-[#10B981] shrink-0" />
                                                    <span>{follow}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                            </div>
                        </div>
                    );
                })}

                {/* Deep Reasoning Indicator */}
                {isThinking && (
                    <div className="flex items-start gap-2.5 animate-in fade-in">
                        <div className="w-7 h-7 rounded-xl bg-[#10B981]/15 border border-[#10B981]/40 flex items-center justify-center shrink-0">
                            <RefreshCw className="w-3.5 h-3.5 text-[#10B981] animate-spin" />
                        </div>
                        <div className="px-3.5 py-2.5 rounded-2xl glass-panel border border-[#10B981]/25 text-xs font-mono text-slate-300 flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-[#10B981] animate-pulse" />
                            <span>
                                Tradyx Neural Core sta incrociando telemetria, bias e macro...
                            </span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* =============================================================== */}
            {/* FIXED CHAT COMPOSER BAR                                         */}
            {/* =============================================================== */}
            <div className="fixed bottom-16 sm:bottom-20 left-0 right-0 z-40 bg-[#08090C]/90 backdrop-blur-xl border-t border-white/[0.08] p-2.5 shadow-[0_-8px_32px_0_rgba(0,0,0,0.45)]">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        void sendMessage();
                    }}
                    className="w-full max-w-lg mx-auto flex items-center gap-2"
                >
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Chiedi a Tradyx AI (portafoglio, trade, bias, macro ATLAS)..."
                        className="flex-1 h-12 px-4 rounded-xl glass-subcard text-white text-xs sm:text-[13px] placeholder:text-slate-500 focus:border-[#10B981] focus:outline-none transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={!inputText.trim() || isThinking}
                        className="w-12 h-12 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40 transition-all active:scale-95 shadow-lg shadow-[#10B981]/25"
                        aria-label="Invia messaggio a Tradyx AI"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TradyxAiCopilot;
