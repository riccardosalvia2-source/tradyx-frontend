// ============================================================================
// TRADYX AI COACH FLOATING CHAT DRAWER (src/components/AICoachDrawer.tsx)
// Author: Senior AI Engineer & Lead React Developer
// Description: Floating glassmorphic slide-over chat drawer with quick prompt chips,
//              auto-scroll message thread, and psychology coach integration.
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, UserTradingContext } from '../types/chat';
import { generateCoachResponse } from '../services/aiCoachService';
import { useTradeStore } from '../store/useTradeStore';
import { FINANCIAL_DISCLAIMER_IT } from '../../security/disclaimer';
import { 
    BrainCircuit, 
    X, 
    Send, 
    Sparkles, 
    ShieldAlert, 
    Bot, 
    User, 
    RefreshCw, 
    Flame, 
    Activity 
} from 'lucide-react';

interface AICoachDrawerProps {
    isOpenExternal?: boolean;
    setIsOpenExternal?: (open: boolean) => void;
}

export const AICoachDrawer: React.FC<AICoachDrawerProps> = ({
    isOpenExternal,
    setIsOpenExternal
}) => {
    const [internalOpen, setInternalOpen] = useState<boolean>(false);
    
    const isOpen = isOpenExternal !== undefined ? isOpenExternal : internalOpen;
    const setIsOpen = (val: boolean) => {
        if (setIsOpenExternal) setIsOpenExternal(val);
        setInternalOpen(val);
    };
    const [inputPrompt, setInputPrompt] = useState<string>('');
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'msg-welcome',
            sender: 'assistant',
            content: 'Ciao! Sono **Tradyx Coach**, il tuo assistente virtuale per la disciplina ed la psicologia del trading. Come posso aiutarti a mantenere la calma ed evitare bias cognitivi oggi?',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { trades } = useTradeStore();

    // Auto-scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // Extract current trading context from Zustand store
    const getTradingContext = (): UserTradingContext => {
        if (!trades || trades.length === 0) return {};
        const recent = trades[0];
        const totalPnl = trades.reduce((acc, t) => acc + (t.pnl || 0), 0);
        const wins = trades.filter(t => (t.pnl || 0) > 0).length;
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

        const context = getTradingContext();
        const aiResponseText = await generateCoachResponse(query, context);

        const aiMsg: ChatMessage = {
            id: `ai-${Date.now()}`,
            sender: 'assistant',
            content: aiResponseText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setIsTyping(false);
        setMessages(prev => [...prev, aiMsg]);
    };

    return (
        <>
            {/* Slide-over Glassmorphic Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-20 right-4 sm:right-6 w-[92vw] sm:w-[420px] h-[560px] max-h-[80vh] z-50 bg-slate-950/95 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">

                    
                    {/* Panel Header */}
                    <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl text-slate-950 shadow-md">
                                <BrainCircuit className="w-5 h-5 font-bold" />
                            </div>
                            <div>
                                <h4 className="text-sm font-extrabold text-slate-100 flex items-center gap-1.5">
                                    Tradyx AI Coach
                                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                                </h4>
                                <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                    Psicologia del Trading & Bias
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Quick Prompt Chips */}
                    <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/60 overflow-x-auto flex gap-2 no-scrollbar">
                        <button
                            type="button"
                            onClick={() => handleSendMessage('🧠 Ho appena fatto Revenge Trading, come mi calmo?')}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-cyan-300 rounded-full whitespace-nowrap transition"
                        >
                            🧠 Revenge Trading
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSendMessage('🔥 Sento troppa FOMO prima dell apertura delle borse')}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-rose-300 rounded-full whitespace-nowrap transition"
                        >
                            🔥 Sento FOMO
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSendMessage('📊 Analizza il mio stato emotivo dagli ultimi trade')}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-emerald-300 rounded-full whitespace-nowrap transition"
                        >
                            📊 Analisi Emotiva
                        </button>
                    </div>

                    {/* Chat Messages Thread */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-sans">
                        {messages.map((msg) => {
                            const isUser = msg.sender === 'user';

                            return (
                                <div
                                    key={msg.id}
                                    className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
                                >
                                    {/* Avatar */}
                                    <div className={`p-1.5 rounded-xl text-slate-950 flex-shrink-0 ${
                                        isUser ? 'bg-cyan-400' : 'bg-slate-800 text-cyan-400 border border-slate-700'
                                    }`}>
                                        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                                    </div>

                                    {/* Bubble */}
                                    <div className={`max-w-[82%] p-3.5 rounded-2xl space-y-1 ${
                                        isUser 
                                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-semibold shadow-lg' 
                                            : 'bg-slate-900/90 border border-slate-800 text-slate-200 shadow-md leading-relaxed whitespace-pre-wrap'
                                    }`}>
                                        <div>{msg.content}</div>
                                        <div className={`text-[9px] font-mono text-right ${isUser ? 'text-slate-900/70' : 'text-slate-500'}`}>
                                            {msg.timestamp}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Typing Indicator */}
                        {isTyping && (
                            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono py-2 px-3 bg-slate-900/60 rounded-xl border border-slate-800/60 w-max animate-pulse">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                                Tradyx Coach sta elaborando...
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input Box */}
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                        className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2"
                    >
                        <input
                            type="text"
                            value={inputPrompt}
                            onChange={(e) => setInputPrompt(e.target.value)}
                            placeholder="Chiedi supporto psicologico a Tradyx Coach..."
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:border-cyan-500 outline-none"
                        />
                        <button
                            type="submit"
                            disabled={!inputPrompt.trim() || isTyping}
                            className="p-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl transition disabled:opacity-40"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>

                    {/* Disclaimer Footer */}
                    <div className="bg-slate-950 px-3 py-1.5 text-center text-[9px] text-slate-500 font-mono border-t border-slate-900">
                        ⚖️ Non fornisce consigli finanziari. Supporto psicologico e comportamentale.
                    </div>
                </div>
            )}
        </>
    );
};
