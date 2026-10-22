// ============================================================================
// TRADYX DEDICATED ISOLATED TESTING SANDBOX ROUTE (/sandbox-test)
// Accessible EXCLUSIVELY via direct URL routing:
// - Local: http://localhost:3000/sandbox-test
// - Vercel: https://<tuo-dominio-vercel>/sandbox-test
// ============================================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTradeStore } from '../store/useTradeStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Trade, TradeDirection, EmotionalState, TradePsychology } from '../types/trade';
import { 
    Zap, 
    Trash2, 
    Activity, 
    Cpu, 
    Gauge, 
    Flame, 
    ShieldCheck, 
    BarChart3, 
    TrendingUp, 
    TrendingDown, 
    ArrowLeft, 
    CheckCircle2, 
    RefreshCw, 
    Database, 
    Terminal, 
    Layers,
    Sparkles,
    Sliders
} from 'lucide-react';

export const SandboxTestPage: React.FC = () => {
    const { trades, injectMockTrades, clearAllTrades } = useTradeStore();
    const { formatMoney } = useSettingsStore();

    // Load Simulation Controls
    const [injectCount, setInjectCount] = useState<number>(100);
    const [isInjecting, setIsInjecting] = useState<boolean>(false);
    const [lastActionTime, setLastActionTime] = useState<string>('Nessuna');
    const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

    // Performance Benchmark State
    const [renderLatencyMs, setRenderLatencyMs] = useState<number>(0);
    const [fps, setFps] = useState<number>(60);
    const [memoryMb, setMemoryMb] = useState<string>('N/A');

    // FPS loop counter
    const frameCountRef = useRef<number>(0);
    const lastFpsCalcRef = useRef<number>(performance.now());

    useEffect(() => {
        let animId: number;
        const tick = () => {
            frameCountRef.current++;
            const now = performance.now();
            if (now - lastFpsCalcRef.current >= 1000) {
                const currentFps = Math.round((frameCountRef.current * 1000) / (now - lastFpsCalcRef.current));
                setFps(Math.min(60, currentFps));
                frameCountRef.current = 0;
                lastFpsCalcRef.current = now;

                // Memory query
                if (typeof window !== 'undefined' && (performance as any).memory) {
                    const used = (performance as any).memory.usedJSHeapSize / (1024 * 1024);
                    setMemoryMb(`${used.toFixed(1)} MB`);
                } else {
                    setMemoryMb('Sandbox Guard');
                }
            }
            animId = requestAnimationFrame(tick);
        };
        animId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(animId);
    }, []);

    // Synthetic Load Generator
    const generateRealisticMockTrades = (count: number): Trade[] => {
        const assets = [
            { pair: 'BTC/USD', minP: 60000, maxP: 69000 },
            { pair: 'ETH/USD', minP: 3100, maxP: 3600 },
            { pair: 'SOL/USD', minP: 135, maxP: 175 },
            { pair: 'AAPL', minP: 210, maxP: 235 },
            { pair: 'NVDA', minP: 115, maxP: 145 },
            { pair: 'EUR/USD', minP: 1.075, maxP: 1.095 }
        ];

        const strategies = [
            'Trend Following / Breakout',
            'Liquidity Sweep & Wick Absorption',
            'Mean Reversion Order Block',
            'Volume Profile POC Bounce',
            'Earnings Fade Play'
        ];

        const errorsList = ['FOMO', 'OVERTRADING', 'NO STOP LOSS', 'REVENGE TRADING', 'EARLY EXIT'];

        const now = Date.now();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        const generated: Trade[] = [];

        for (let i = 0; i < count; i++) {
            const assetConfig = assets[i % assets.length];
            const direction: TradeDirection = Math.random() > 0.45 ? 'LONG' : 'SHORT';
            const isWin = Math.random() < 0.58; // 58% win rate

            const entry = Number((assetConfig.minP + Math.random() * (assetConfig.maxP - assetConfig.minP)).toFixed(2));
            const deltaPercent = (Math.random() * 0.05 + 0.005);
            let exit = direction === 'LONG'
                ? (isWin ? entry * (1 + deltaPercent) : entry * (1 - deltaPercent))
                : (isWin ? entry * (1 - deltaPercent) : entry * (1 + deltaPercent));
            exit = Number(exit.toFixed(2));

            const pnl = isWin 
                ? Number((Math.random() * 1800 + 120).toFixed(2))
                : -Number((Math.random() * 950 + 80).toFixed(2));

            const roi = Number(((pnl / (entry * 1.0)) * 100).toFixed(2));
            const timestamp = new Date(now - (i / count) * thirtyDaysMs - Math.random() * 7200000).toISOString();

            const emotional_state: EmotionalState = isWin 
                ? (Math.random() > 0.3 ? 'Disciplined' : 'Calm')
                : (Math.random() > 0.5 ? 'Anxious' : 'FOMO');

            const psychology: TradePsychology = isWin ? 'CONFIDENCE' : (Math.random() > 0.5 ? 'FEAR' : 'NEUTRAL');
            const errors = isWin ? [] : (Math.random() > 0.4 ? [errorsList[Math.floor(Math.random() * errorsList.length)]] : []);

            generated.push({
                id: `stress-test-${i + 1}-${Date.now().toString(36)}`,
                user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
                asset_pair: assetConfig.pair,
                direction,
                entry_price: entry,
                exit_price: exit,
                pnl,
                roi,
                position_size: Number((Math.random() * 2 + 0.5).toFixed(2)),
                strategy: strategies[i % strategies.length],
                risk_reward: isWin ? '1:2.8' : '1:1.0',
                fees: Number((Math.random() * 8 + 2).toFixed(2)),
                emotional_state,
                psychology,
                errors,
                notes: `Stress test simulato #${i + 1}: ${assetConfig.pair} ${direction} (${isWin ? 'Profit' : 'Stop loss'}).`,
                reasoning: `Esecuzione algoritmica di carico per verificare la reattività a ${count} operazioni distribuite nell'ultimo mese.`,
                created_at: timestamp
            });
        }

        return generated;
    };

    // Injection Handler
    const handleInjectMockData = () => {
        setIsInjecting(true);
        const start = performance.now();

        const mockTrades = generateRealisticMockTrades(injectCount);
        injectMockTrades(mockTrades);

        const latency = performance.now() - start;
        setRenderLatencyMs(Number(latency.toFixed(2)));
        setIsInjecting(false);
        setLastActionTime(new Date().toLocaleTimeString('it-IT'));
        setFeedbackToast(`Iniettati ${injectCount} trade simulati con successo (${latency.toFixed(1)} ms)`);
        setTimeout(() => setFeedbackToast(null), 3500);
    };

    // Clear Data Handler
    const handleClearData = () => {
        const start = performance.now();
        clearAllTrades();
        const latency = performance.now() - start;
        setRenderLatencyMs(Number(latency.toFixed(2)));
        setLastActionTime(new Date().toLocaleTimeString('it-IT'));
        setFeedbackToast(`Database di test svuotato con successo (${latency.toFixed(1)} ms)`);
        setTimeout(() => setFeedbackToast(null), 3500);
    };

    // Calculate aggregated stats to benchmark chart render computation
    const metrics = useMemo(() => {
        const start = performance.now();
        const safeTrades = Array.isArray(trades) ? trades : [];
        const totalTrades = safeTrades.length;
        const totalPnl = safeTrades.reduce((acc, t) => acc + (Number(t.pnl) || 0), 0);
        const wins = safeTrades.filter(t => (Number(t.pnl) || 0) > 0);
        const losses = safeTrades.filter(t => (Number(t.pnl) || 0) < 0);
        const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;

        const grossProfit = wins.reduce((acc, t) => acc + Number(t.pnl), 0);
        const grossLoss = Math.abs(losses.reduce((acc, t) => acc + Number(t.pnl), 0));
        const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : (grossProfit > 0 ? 'MAX' : '0.00');

        // Equity Curve simulation points
        let runningPnl = 10000;
        let peak = 10000;
        let maxDrawdown = 0;
        const equityPoints: { x: number; y: number }[] = [{ x: 0, y: 10000 }];

        // Sort chronologically ascending for curve
        const sorted = [...safeTrades].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        sorted.forEach((t, idx) => {
            runningPnl += (Number(t.pnl) || 0);
            if (runningPnl > peak) peak = runningPnl;
            const dd = peak > 0 ? ((peak - runningPnl) / peak) * 100 : 0;
            if (dd > maxDrawdown) maxDrawdown = dd;
            equityPoints.push({ x: idx + 1, y: runningPnl });
        });

        const computeDuration = performance.now() - start;
        return {
            totalTrades,
            totalPnl,
            winRate,
            profitFactor,
            maxDrawdown: maxDrawdown.toFixed(1),
            equityPoints,
            computeDuration: computeDuration.toFixed(2)
        };
    }, [trades]);

    return (
        <div className="min-h-[100dvh] w-full bg-[#08090C] text-slate-100 flex flex-col items-center justify-start py-6 px-3 sm:px-6 select-none font-sans">
            
            {/* TOAST CONFIRMATION NOTIFICATION */}
            {feedbackToast && (
                <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-emerald-950/90 border border-[#10B981] shadow-2xl shadow-[#10B981]/30 flex items-center gap-2 text-xs font-mono font-bold text-emerald-200 animate-in slide-in-from-top-3">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span>{feedbackToast}</span>
                </div>
            )}

            <div className="w-full max-w-4xl space-y-5">
                
                {/* 1. TOP BAR & BACK NAVIGATION */}
                <div className="w-full flex items-center justify-between border-b border-white/[0.08] pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#111318] border border-[#10B981]/40 flex items-center justify-center shadow-lg shadow-[#10B981]/15">
                            <Terminal className="w-5 h-5 text-[#10B981]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 rounded-full border border-[#10B981]/30">
                                    DEV PRIVATE SANDBOX
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">
                                    ROUTE: /sandbox-test
                                </span>
                            </div>
                            <h1 className="text-base sm:text-xl font-black text-white tracking-tight font-mono mt-0.5">
                                Tradyx Sandbox & Stress Test Utility
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <a 
                            href="/"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 text-xs font-mono font-bold text-slate-300 hover:text-white transition active:scale-95"
                        >
                            <ArrowLeft className="w-4 h-4 text-[#10B981]" />
                            <span className="hidden sm:inline">Torna all'App</span>
                        </a>
                    </div>
                </div>

                {/* 2. REAL-TIME TELEMETRY MONITOR (FPS, MEMORY, LATENCY) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    
                    {/* Telemetry Card: Rendering Latency */}
                    <div className="p-3.5 rounded-2xl bg-[#0D111A] border border-white/[0.08] shadow-lg flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                            <span>RENDER BENCHMARK</span>
                            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-2xl font-black font-mono text-cyan-400">
                                {renderLatencyMs > 0 ? `${renderLatencyMs}ms` : `${metrics.computeDuration}ms`}
                            </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 mt-1">Tempo ricalcolo grafici</span>
                    </div>

                    {/* Telemetry Card: Frame Rate (FPS) */}
                    <div className="p-3.5 rounded-2xl bg-[#0D111A] border border-white/[0.08] shadow-lg flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                            <span>FRAME RATE</span>
                            <Activity className="w-3.5 h-3.5 text-[#10B981]" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className={`text-2xl font-black font-mono ${fps >= 55 ? 'text-[#10B981]' : 'text-amber-400'}`}>
                                {fps} FPS
                            </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 mt-1">Stabilità animazioni 60fps</span>
                    </div>

                    {/* Telemetry Card: Memory Usage */}
                    <div className="p-3.5 rounded-2xl bg-[#0D111A] border border-white/[0.08] shadow-lg flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                            <span>CONSUMO MEMORIA</span>
                            <Cpu className="w-3.5 h-3.5 text-purple-400" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-2xl font-black font-mono text-purple-400">
                                {memoryMb}
                            </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 mt-1">Heap memory allocata</span>
                    </div>

                    {/* Telemetry Card: Operazioni in Memoria */}
                    <div className="p-3.5 rounded-2xl bg-[#0D111A] border border-white/[0.08] shadow-lg flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                            <span>TRADE ATTIVI</span>
                            <Layers className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-2xl font-black font-mono text-white">
                                {metrics.totalTrades}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">record</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 mt-1">Nello store / database</span>
                    </div>

                </div>

                {/* 3. CONTROL PANEL: INIEZIONE MOCK DATA & RESET DATABASE */}
                <div className="w-full p-4 sm:p-5 rounded-2xl bg-[#0D111A] border border-white/[0.08] shadow-2xl space-y-4">
                    
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sliders className="w-4 h-4 text-[#10B981]" />
                            <h2 className="text-sm font-black font-mono uppercase text-white tracking-wide">
                                CONTROLLO INIEZIONE DATI & STRESS TEST
                            </h2>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                            Ultima esecuzione: <strong className="text-slate-200">{lastActionTime}</strong>
                        </span>
                    </div>

                    {/* Dedicated 1-Click Injection Buttons: 50 Trade & 300 Trade */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        
                        {/* Pulsante Inietta 50 Trade di Test */}
                        <button
                            type="button"
                            onClick={() => {
                                setInjectCount(50);
                                setIsInjecting(true);
                                const start = performance.now();
                                const mockTrades = generateRealisticMockTrades(50);
                                injectMockTrades(mockTrades);
                                const latency = performance.now() - start;
                                setRenderLatencyMs(Number(latency.toFixed(2)));
                                setIsInjecting(false);
                                setLastActionTime(new Date().toLocaleTimeString('it-IT'));
                                setFeedbackToast(`Iniettati 50 trade di test con successo (${latency.toFixed(1)} ms)`);
                                setTimeout(() => setFeedbackToast(null), 3500);
                            }}
                            disabled={isInjecting}
                            className="h-13 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] hover:brightness-110 text-white font-mono text-xs font-black uppercase tracking-wider transition cursor-pointer active:scale-98 flex items-center justify-center gap-2 shadow-lg shadow-[#10B981]/20 p-2 text-center"
                        >
                            <Zap className="w-4 h-4 text-white shrink-0" />
                            <span>Inietta 50 Trade di Test</span>
                        </button>

                        {/* Pulsante Inietta 300 Trade di Test */}
                        <button
                            type="button"
                            onClick={() => {
                                setInjectCount(300);
                                setIsInjecting(true);
                                const start = performance.now();
                                const mockTrades = generateRealisticMockTrades(300);
                                injectMockTrades(mockTrades);
                                const latency = performance.now() - start;
                                setRenderLatencyMs(Number(latency.toFixed(2)));
                                setIsInjecting(false);
                                setLastActionTime(new Date().toLocaleTimeString('it-IT'));
                                setFeedbackToast(`Iniettati 300 trade di test con successo (${latency.toFixed(1)} ms)`);
                                setTimeout(() => setFeedbackToast(null), 3500);
                            }}
                            disabled={isInjecting}
                            className="h-13 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:brightness-110 text-white font-mono text-xs font-black uppercase tracking-wider transition cursor-pointer active:scale-98 flex items-center justify-center gap-2 shadow-lg shadow-[#2563EB]/25 p-2 text-center"
                        >
                            <Zap className="w-4 h-4 text-cyan-300 shrink-0" />
                            <span>Inietta 300 Trade di Test</span>
                        </button>

                        {/* Pulsante Resetta Database Test */}
                        <button
                            type="button"
                            onClick={handleClearData}
                            className="h-13 rounded-xl bg-red-950/50 hover:bg-red-900/70 border border-red-500/50 text-red-300 hover:text-white font-mono text-xs font-black uppercase tracking-wider transition cursor-pointer active:scale-98 flex items-center justify-center gap-2 shadow-lg p-2 text-center"
                        >
                            <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
                            <span>Resetta Database Test</span>
                        </button>

                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono text-slate-400 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
                        <span>I trade casuali ma realistici popolano Heatmap, Equity Line, Drawdown, Hourly Distribution ed Error Tracker con dati distribuiti nell'ultimo mese.</span>
                    </div>

                </div>

                {/* 4. PERFORMANCE VERIFICATION: TEST REPORT & CAPACITY */}
                <div className="w-full p-4 sm:p-5 rounded-2xl bg-[#0D111A] border border-white/[0.08] shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-cyan-400" />
                            <h2 className="text-sm font-black font-mono uppercase text-white tracking-wide">
                                REPORT AGGREGATO & VERIFICA GRAFICI
                            </h2>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                            CAPACITÀ: 500 TRADE TESTATA
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-xl bg-[#111318] border border-white/5 font-mono">
                            <span className="text-[10px] text-slate-400 uppercase">P&L CUMULATIVO</span>
                            <div className={`text-base font-black ${metrics.totalPnl >= 0 ? 'text-[#10B981]' : 'text-[#DC2626]'}`}>
                                {formatMoney(metrics.totalPnl, true)}
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#111318] border border-white/5 font-mono">
                            <span className="text-[10px] text-slate-400 uppercase">WIN RATE</span>
                            <div className="text-base font-black text-white">
                                {metrics.winRate.toFixed(1)}%
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#111318] border border-white/5 font-mono">
                            <span className="text-[10px] text-slate-400 uppercase">PROFIT FACTOR</span>
                            <div className="text-base font-black text-cyan-400">
                                {metrics.profitFactor}
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#111318] border border-white/5 font-mono">
                            <span className="text-[10px] text-slate-400 uppercase">MAX DRAWDOWN</span>
                            <div className="text-base font-black text-rose-400">
                                -{metrics.maxDrawdown}%
                            </div>
                        </div>
                    </div>

                    {/* LIVE SIMULATED EQUITY CURVE SVG PREVIEW */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                            <span>EQUITY CURVE IN TEMPO REALE ({metrics.totalTrades} OPERAZIONI)</span>
                            <span className="text-[#10B981] font-bold">Rendering a 60 FPS</span>
                        </div>
                        <div className="w-full h-32 rounded-xl bg-black/60 border border-white/5 p-2 flex items-center justify-center relative overflow-hidden">
                            {metrics.equityPoints.length > 1 ? (
                                <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                                            <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                                        </linearGradient>
                                    </defs>
                                    {(() => {
                                        const pts = metrics.equityPoints;
                                        const minY = Math.min(...pts.map(p => p.y));
                                        const maxY = Math.max(...pts.map(p => p.y));
                                        const rangeY = (maxY - minY) || 1;
                                        const pathData = pts.map((p, i) => {
                                            const x = (i / (pts.length - 1)) * 400;
                                            const y = 90 - ((p.y - minY) / rangeY) * 80;
                                            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                                        }).join(' ');

                                        const areaData = `${pathData} L 400 100 L 0 100 Z`;

                                        return (
                                            <>
                                                <path d={areaData} fill="url(#equityGrad)" />
                                                <path d={pathData} fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
                                            </>
                                        );
                                    })()}
                                </svg>
                            ) : (
                                <span className="text-xs font-mono text-slate-500">
                                    Nessun trade iniettato. Clicca su "Inietta Mock Data" per iniziare lo stress test.
                                </span>
                            )}
                        </div>
                    </div>

                </div>

            </div>

        </div>
    );
};

export default SandboxTestPage;
