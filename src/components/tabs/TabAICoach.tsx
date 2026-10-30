// ============================================================================
// TRADYX MOBILE TAB 6: COACH (AI Specialist - Live Coaching & Market Data)
// ============================================================================

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTradeStore, DEFAULT_MOCK_TRADES } from '../../store/useTradeStore';
import { ChatMessage, UserTradingContext } from '../../types/chat';
import { generateCoachResponse, CoachPersona } from '../../services/aiCoachService';
import { analyzeCorrelationOfDoom, checkCurrentSessionDoomRisk } from '../../services/correlationOfDoomService';
import { 
    BrainCircuit, 
    Send, 
    Sparkles, 
    Star, 
    Bot, 
    User, 
    ShieldCheck, 
    RefreshCw, 
    Activity, 
    TrendingUp, 
    CheckCircle2,
    ArrowUpRight,
    Flame,
    AlertTriangle,
    ShieldAlert,
    HeartPulse,
    Scale,
    History
} from 'lucide-react';
import { 
    getCortisolClearingStatus, 
    analyzeDispositionEffect, 
    analyzeDelayDiscounting 
} from '../../services/neuroPsychService';

export const TabAICoach: React.FC = () => {
    const { trades } = useTradeStore();
    const safeTrades = Array.isArray(trades) && trades.length > 0 ? trades : DEFAULT_MOCK_TRADES;

    const [coachPersona, setCoachPersona] = useState<CoachPersona>('TOUGH_LOVE');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputPrompt, setInputPrompt] = useState<string>('');
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Compute Correlation of Doom patterns from trades
    const doomPatterns = useMemo(() => analyzeCorrelationOfDoom(safeTrades), [safeTrades]);
    const topDoom = doomPatterns[0];
    const currentDoomRisk = useMemo(() => checkCurrentSessionDoomRisk(safeTrades), [safeTrades]);

    // Neuro-Psych Analytics (Cortisol Clearing Window & Biases)
    const cortisolStatus = useMemo(() => getCortisolClearingStatus(safeTrades), [safeTrades]);
    const dispositionEffect = useMemo(() => analyzeDispositionEffect(safeTrades), [safeTrades]);
    const delayDiscounting = useMemo(() => analyzeDelayDiscounting(safeTrades), [safeTrades]);

    // Auto-scroll when messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // Extract trading context from store for AI Coach
    const getTradingContext = (): UserTradingContext => {
        const totalPnl = safeTrades.reduce((acc, t) => acc + (Number(t?.pnl) || 0), 0);
        const wins = safeTrades.filter(t => (Number(t?.pnl) || 0) > 0).length;
        const winRate = Number(((wins / safeTrades.length) * 100).toFixed(1));
        const recent = safeTrades[0];

        return {
            recentEmotion: recent?.emotional_state,
            recentPnL: recent?.pnl || 0,
            totalWinRate: winRate,
            lastTradeNotes: recent?.notes || undefined,
            tradeCount: safeTrades.length,
            cortisolClearingActive: cortisolStatus.isClearingActive,
            cortisolRemainingMinutes: cortisolStatus.remainingMinutes,
            dispositionEffectDetected: dispositionEffect.detected,
            dispositionDetails: dispositionEffect.clinicalAssessment,
            delayDiscountingDetected: delayDiscounting.detected,
            delayDiscountingDetails: delayDiscounting.clinicalAssessment
        };
    };

    const handleSendMessage = async (textToSend?: string) => {
        const query = (textToSend || inputPrompt).trim();
        if (!query || isTyping) return;

        const userMsg: ChatMessage = {
            id: `usr-${Date.now()}`,
            sender: 'user',
            content: query,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMsg]);
        if (!textToSend) setInputPrompt('');
        setIsTyping(true);

        try {
            const context = getTradingContext();
            const aiResponseText = await generateCoachResponse(query, context, coachPersona);

            const aiMsg: ChatMessage = {
                id: `ai-${Date.now()}`,
                sender: 'assistant',
                content: aiResponseText,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch {
            const fallbackMsg: ChatMessage = {
                id: `ai-err-${Date.now()}`,
                sender: 'assistant',
                content: coachPersona === 'TOUGH_LOVE'
                    ? '🏛️ **CRO VERDICT:** La disciplina si misura nei momenti di drawdown, non durante i trend rialzisti facili. Riduci la size del 50%, imposta stop loss ferrei su BTC/USD e non osare toccare il tasto buy senza conferma volumetrica.'
                    : 'Ottima osservazione. Il tuo win rate attuale del 60.0% e profit factor di 5.50 riflettono un vantaggio istituzionale solido. Mantieni stop loss ferrei su asset ad alta volatilità come BTC ed evita entrate tardive.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, fallbackMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const promptSuggestions = [
        'Come eliminare la mia Correlation of Doom?',
        'Analizza il mio Disposition Effect (Taglio dei profitti)',
        'Verifica se soffro di Delay Discounting (Revenge Sizing)',
        'Come gestire la Cortisol Clearing Window di 25 min?',
        'Valuta il mio rischio per trade (Tough Love)'
    ];

    return (
        <div className="w-full flex flex-col min-h-[calc(100dvh-5rem)] px-3 sm:px-4 pt-2 pb-32 text-white select-none overflow-x-hidden relative">
            
            {/* Top Sticky Glass Header */}
            <header className="glass-header sticky top-0 z-30 px-3 py-2.5 rounded-2xl flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl glass-subcard border border-[#10B981]/40 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.15)] shrink-0">
                        <span className="font-sans font-black text-base text-[#10B981]">T</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase font-semibold">
                            QUANT ADVISORY
                        </span>
                        <h1 className="text-xs sm:text-sm font-extrabold text-white tracking-tight">
                            AI SPECIALIST - LIVE COACHING & MARKET DATA
                        </h1>
                    </div>
                </div>

                <span className="px-2.5 py-1 rounded-full glass-subcard text-[10px] font-mono text-[#10B981] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                    GEMINI
                </span>
            </header>

            {/* CORTISOL CLEARING WINDOW KINETIC ADVISORY */}
            {cortisolStatus.isClearingActive && (
                <div className="w-full p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-1.5 text-left font-mono animate-in fade-in">
                    <div className="flex items-center justify-between text-xs font-black text-rose-300">
                        <div className="flex items-center gap-1.5">
                            <HeartPulse className="w-4 h-4 text-rose-400 animate-pulse" />
                            <span>CORTISOL CLEARING WINDOW: ~25 MIN</span>
                        </div>
                        <span className="text-[10px] text-rose-400 font-extrabold">{cortisolStatus.percentCleared}% CLEAR</span>
                    </div>
                    <p className="text-[11px] text-rose-200 leading-relaxed font-sans">
                        Picco ormonale acuto rilevato dal drawdown. L'amigdala è iperattiva e la corteccia prefrontale (PFC) richiede circa 25 minuti per il decadimento metabolico prima di ripristinare decisioni oggettive.
                    </p>
                    <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                        <div 
                            className="h-full bg-rose-500 rounded-full transition-all duration-500" 
                            style={{ width: `${cortisolStatus.percentCleared}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Persona Switcher: Tough Love vs Empathic */}
            <div className="w-full flex items-center justify-between p-1.5 rounded-2xl glass-panel text-xs font-mono font-bold">
                <button
                    type="button"
                    onClick={() => setCoachPersona('TOUGH_LOVE')}
                    className={`flex-1 py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        coachPersona === 'TOUGH_LOVE'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-md shadow-rose-950/40'
                            : 'text-slate-400 hover:text-white'
                    }`}
                >
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    <span>CRO Risk Manager (Tough Love)</span>
                </button>

                <button
                    type="button"
                    onClick={() => setCoachPersona('EMPATHIC')}
                    className={`flex-1 py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        coachPersona === 'EMPATHIC'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-md shadow-emerald-950/40'
                            : 'text-slate-400 hover:text-white'
                    }`}
                >
                    <BrainCircuit className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Empathic Coach</span>
                </button>
            </div>

            {/* CORRELATION OF DOOM ENGINE CARD */}
            {topDoom && (
                <div className="w-full p-4 rounded-2xl glass-panel border border-amber-500/30 bg-amber-950/15 space-y-2.5 font-mono shadow-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase">
                            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                            <span>CORRELATION OF DOOM ENGINE</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[9px] font-black bg-rose-950/80 text-rose-300 border border-rose-800">
                            CRITICAL BIAS
                        </span>
                    </div>

                    <div className="space-y-1">
                        <h4 className="text-xs sm:text-sm font-extrabold text-white leading-snug">
                            {topDoom.headline}
                        </h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                            {topDoom.recommendation}
                        </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] text-[10px] text-slate-400">
                        <span>Win Rate nel pattern: <strong className="text-rose-400">{topDoom.winRate}%</strong></span>
                        <button
                            type="button"
                            onClick={() => handleSendMessage(`Come posso neutralizzare la mia Correlation of Doom (${topDoom.dayName} ${topDoom.timeSlot} con ${topDoom.errorTag})?`)}
                            className="px-2.5 py-1 rounded-lg glass-subcard hover:bg-white/10 text-cyan-300 hover:text-white font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                            <span>Disinnesca Pattern</span>
                            <ArrowUpRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            )}

            {/* Chat Content Body */}
            <div className="flex-1 w-full space-y-3 py-1 overflow-y-auto">
                
                {/* Initial Welcome Screen when no messages */}
                {messages.length === 0 && (
                    <div className="w-full py-6 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="w-16 h-16 rounded-3xl glass-panel flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                            <Star className="w-8 h-8 text-[#10B981] fill-[#10B981]/20 animate-pulse" />
                        </div>

                        <div className="space-y-1 max-w-xs">
                            <h2 className="text-base font-extrabold text-white">
                                Ask me anything about your trades or the market.
                            </h2>
                            <p className="text-xs text-slate-400 font-mono leading-relaxed">
                                Institutional quantitative coaching, drawdown protection & psychological bias detection.
                            </p>
                        </div>

                        {/* Quick Prompts */}
                        <div className="w-full space-y-2 pt-2 max-w-sm">
                            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                                Quick Prompts:
                            </span>
                            {promptSuggestions.map((prompt, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleSendMessage(prompt)}
                                    className="w-full p-2.5 rounded-xl glass-subcard hover:bg-white/[0.08] text-left text-xs font-mono text-slate-300 hover:text-white transition flex items-center justify-between cursor-pointer active:scale-98"
                                >
                                    <span>{prompt}</span>
                                    <ArrowUpRight className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Message Bubble Feed */}
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.sender === 'assistant' && (
                            <div className="w-7 h-7 rounded-lg glass-subcard border border-[#10B981]/40 flex items-center justify-center shrink-0 mt-0.5">
                                <Bot className="w-4 h-4 text-[#10B981]" />
                            </div>
                        )}

                        <div className={`max-w-[85%] rounded-2xl p-3.5 shadow-lg text-xs leading-relaxed ${
                            msg.sender === 'user'
                                ? 'bg-[#10B981] text-white font-semibold rounded-br-xs'
                                : 'glass-panel text-slate-200 rounded-bl-xs font-sans'
                        }`}>
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                            <span className={`text-[9px] font-mono mt-1 block ${
                                msg.sender === 'user' ? 'text-white/70 text-right' : 'text-slate-500'
                            }`}>
                                {msg.timestamp}
                            </span>
                        </div>
                    </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                    <div className="flex gap-2.5 items-center text-xs font-mono text-slate-400">
                        <div className="w-7 h-7 rounded-lg glass-subcard border border-white/10 flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-[#10B981] animate-spin" />
                        </div>
                        <span className="animate-pulse">Analisi quantitativa in corso...</span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* BARRA DI INPUT FISSA SOPRA LA NAVIGAZIONE */}
            <div className="fixed bottom-16 sm:bottom-20 left-0 right-0 z-40 bg-[#0D111A]/80 backdrop-blur-xl border-t border-white/[0.08] p-2.5 shadow-[0_-8px_32px_0_rgba(0,0,0,0.37)]">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                    }}
                    className="w-full max-w-lg mx-auto flex items-center gap-2"
                >
                    <input
                        type="text"
                        value={inputPrompt}
                        onChange={(e) => setInputPrompt(e.target.value)}
                        placeholder="Chiedi al tuo coach..."
                        className="flex-1 h-12 px-4 rounded-xl glass-subcard text-white text-xs font-mono placeholder:text-slate-500 focus:border-[#10B981] focus:outline-none transition-colors"
                    />

                    <button
                        type="submit"
                        disabled={!inputPrompt.trim() || isTyping}
                        className="w-12 h-12 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40 transition-all active:scale-95 shadow-md shadow-[#10B981]/20"
                    >
                        <Send className="w-5 h-5 text-white" />
                    </button>
                </form>
            </div>

        </div>
    );
};

export default TabAICoach;
