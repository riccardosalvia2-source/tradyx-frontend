// ============================================================================
// TRADYX MOBILE TAB 3: AI PSYCHOLOGY COACH (src/components/tabs/TabAICoach.tsx)
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { useTradeStore } from '../../store/useTradeStore';
import { ChatMessage, UserTradingContext } from '../../types/chat';
import { generateCoachResponse } from '../../services/aiCoachService';
import { 
    BrainCircuit, 
    Send, 
    Sparkles, 
    Bot, 
    User, 
    ShieldAlert, 
    RefreshCw, 
    Activity,
    Flame,
    CheckCircle2
} from 'lucide-react';

export const TabAICoach: React.FC = () => {
    const { trades } = useTradeStore();
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome-coach',
            sender: 'assistant',
            content: 'Ciao! Sono **Tradyx AI Coach**, il tuo assistente psicologico per la finanza comportamentale. Monitoro i tuoi trade per aiutarti a disinnescare FOMO, Revenge Trading e impulsività. Come posso supportarti in questo momento?',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [inputPrompt, setInputPrompt] = useState<string>('');
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // Extract trading context from store
    const getTradingContext = (): UserTradingContext => {
        if (!trades || trades.length === 0) return {};
        const recent = trades[0];
        const totalPnl = trades.reduce((acc, t) => acc + (Number(t?.pnl) || 0), 0);
        const wins = trades.filter(t => (Number(t?.pnl) || 0) > 0).length;
        const winRate = Number(((wins / trades.length) * 100).toFixed(1));

        return {
            recentEmotion: recent.emotional_state,
            recentPnL: recent.pnl || 0,
            totalWinRate: winRate,
            lastTradeNotes: recent.notes || undefined,
            tradeCount: trades.length
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
            const aiResponseText = await generateCoachResponse(query, context);

            const aiMsg: ChatMessage = {
                id: `ai-${Date.now()}`,
                sender: 'assistant',
                content: aiResponseText,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err) {
            setMessages(prev => [
                ...prev,
                {
                    id: `ai-err-${Date.now()}`,
                    sender: 'assistant',
                    content: 'Attendi qualche istante. Mantieni una respirazione calma e verifica di non entrare a mercato sotto l\'influenza della frustrazione.',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    const recentEmotion = trades[0]?.emotional_state || 'Disciplined';
    const isLossDetected = trades.some(t => (Number(t?.pnl) || 0) < 0 && (t.emotional_state === 'FOMO' || t.emotional_state === 'Frustrated'));

    // Quick suggestion prompt chips
    const quickPrompts = [
        '🔥 Ho appena preso un Loss, che faccio?',
        '⚠️ Sento l\'impulso di fare Revenge Trading',
        '✨ Come proteggo i profitti senza FOMO?',
        '📊 Valuta la mia disciplina recente'
    ];

    return (
        <div className="w-full flex flex-col space-y-4 px-3.5 sm:px-4 pt-2 pb-28">
            
            {/* 1. HEADER AI COACH */}
            <header className="w-full flex items-center justify-between py-1 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-0.5 shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center justify-center">
                        <div className="w-full h-full bg-[#05070B] rounded-[14px] flex items-center justify-center">
                            <BrainCircuit className="w-5 h-5 text-purple-400 animate-pulse" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-white">TRADYX AI COACH</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        </div>
                        <div className="text-[10px] text-cyan-400 font-mono tracking-wider">
                            Trading Psychology & Bias Shield
                        </div>
                    </div>
                </div>

                <div className="px-2 py-1 rounded-full bg-purple-950/60 border border-purple-500/40 text-[10px] font-mono text-purple-300 font-bold">
                    ATTIVO
                </div>
            </header>

            {/* 2. LIVE BEHAVIORAL DIAGNOSIS CARD */}
            <div className="w-full rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-3.5 shadow-xl space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">
                        Diagnosi Comportamentale Attuale
                    </span>
                    <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full border ${
                        isLossDetected 
                            ? 'bg-rose-950/80 text-rose-300 border-rose-500/50' 
                            : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                    }`}>
                        {isLossDetected ? '⚠️ Rischio Emotivo Rilevato' : '✨ Disciplina Ottimale'}
                    </span>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs">
                    <div className="p-2 rounded-lg bg-purple-950/60 text-purple-400 shrink-0">
                        <Activity className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                        <div className="font-bold text-white">
                            Ultimo Stato Rilevato: <span className="text-cyan-400 font-mono">{recentEmotion}</span>
                        </div>
                        <div className="text-[11px] text-slate-300 leading-snug">
                            {isLossDetected
                                ? 'Rilevato picco di tensione post-perdita. Fai 5 respiri profondi prima di piazzare un nuovo ordine.'
                                : 'Il tuo diario mostra ottima aderenza al trading plan. Mantieni la calma e non aumentare la leva.'}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. INTERACTIVE CHAT STREAM */}
            <div className="w-full rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-3 shadow-xl space-y-3 min-h-[300px] max-h-[420px] overflow-y-auto">
                {messages.map((msg) => {
                    const isAi = msg.sender === 'assistant';
                    return (
                        <div
                            key={msg.id}
                            className={`flex gap-2.5 ${isAi ? 'justify-start' : 'justify-end'}`}
                        >
                            {isAi && (
                                <div className="w-7 h-7 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center shrink-0 mt-0.5">
                                    <Bot className="w-4 h-4 text-cyan-400" />
                                </div>
                            )}

                            <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed space-y-1 ${
                                isAi
                                    ? 'bg-slate-900/90 border border-white/10 text-slate-200'
                                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium shadow-md'
                            }`}>
                                <div className="break-words whitespace-pre-wrap">
                                    {msg.content}
                                </div>
                                <div className={`text-[9px] font-mono ${isAi ? 'text-slate-400' : 'text-cyan-100'} text-right`}>
                                    {msg.timestamp}
                                </div>
                            </div>

                            {!isAi && (
                                <div className="w-7 h-7 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center shrink-0 mt-0.5">
                                    <User className="w-4 h-4 text-cyan-400" />
                                </div>
                            )}
                        </div>
                    );
                })}

                {isTyping && (
                    <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 p-2">
                        <BrainCircuit className="w-4 h-4 animate-spin text-purple-400" />
                        <span className="animate-pulse">Tradyx Coach sta analizzando il tuo bias...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* 4. QUICK SUGGESTION PROMPT CHIPS */}
            <div className="w-full space-y-1.5">
                <div className="text-[10px] font-semibold text-slate-400 uppercase font-mono tracking-wide">
                    Spunti Rapidi per la Sessione:
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {quickPrompts.map((prompt, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => handleSendMessage(prompt)}
                            disabled={isTyping}
                            className="px-2.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-purple-500/50 text-slate-300 hover:text-white text-[11px] font-medium transition active:scale-95 cursor-pointer text-left truncate max-w-full"
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
            </div>

            {/* 5. THUMB-FRIENDLY INPUT BAR */}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                }}
                className="w-full flex items-center gap-2 pt-1"
            >
                <input
                    type="text"
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    placeholder="Chiedi supporto psicologico..."
                    className="flex-1 h-12 px-3.5 bg-[#05070B] border border-white/15 focus:border-cyan-400 rounded-2xl text-xs text-white placeholder-slate-500 outline-none transition"
                    disabled={isTyping}
                />
                <button
                    type="submit"
                    disabled={!inputPrompt.trim() || isTyping}
                    className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-40 text-slate-950 font-black flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20 active:scale-95 transition cursor-pointer"
                    aria-label="Invia messaggio"
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>

        </div>
    );
};

export default TabAICoach;
