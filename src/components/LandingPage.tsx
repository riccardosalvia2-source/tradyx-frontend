// ============================================================================
// TRADYX STANDALONE COMMERCIAL MARKETING SITE (src/components/LandingPage.tsx)
// ============================================================================

import React, { useState } from 'react';
import { QuasarBubble } from './QuasarBubble';
import { BubbleConfig } from '../types/bubble';
import { 
    BrainCircuit, 
    Sparkles, 
    ShieldCheck, 
    TrendingUp, 
    Flame, 
    AlertTriangle, 
    Zap, 
    Check, 
    ArrowRight, 
    Layers, 
    BarChart3, 
    Bot, 
    ExternalLink,
    LogIn,
    Activity,
    Scale,
    Calendar,
    Target
} from 'lucide-react';

import { UserAccount } from '../types/auth';

interface LandingPageProps {
    onOpenDemo?: () => void;
    onOpenAuthModal?: () => void;
    authUser?: UserAccount | null;
    onLogout?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenDemo, onOpenAuthModal, authUser, onLogout }) => {
    // Local Visual Interactive Demo Preset (0 API calls / 0 DB)
    const [activePreset, setActivePreset] = useState<'FOMO' | 'REVENGE' | 'DISCIPLINED'>('DISCIPLINED');

    const demoConfigs: Record<'FOMO' | 'REVENGE' | 'DISCIPLINED', { config: BubbleConfig; title: string; advice: string; tagColor: string }> = {
        FOMO: {
            config: {
                primaryColor: '#FF0055',
                secondaryColor: '#FF5500',
                speed: 2.8,
                turbulence: 0.9,
                pulseRate: 2.5,
                glowIntensity: 2.0
            },
            title: '🔥 Bias FOMO Rilevato (Fear Of Missing Out)',
            advice: '⚠️ Ingresso d’impulso su un’estensione verticale del prezzo senza attendere il retest. Fermati 20 minuti prima di toccare la leva!',
            tagColor: 'bg-rose-950 text-rose-300 border-rose-800'
        },
        REVENGE: {
            config: {
                primaryColor: '#9333EA',
                secondaryColor: '#FF0077',
                speed: 2.0,
                turbulence: 0.7,
                pulseRate: 1.8,
                glowIntensity: 1.6
            },
            title: '⚡ Revenge Trading Rilevato (Rabbia & Over-leveraging)',
            advice: '⚠️ Tentativo impulsivo di "recuperare" la perdita precedente aumentandone la dimensione. Rischio elevato di violare il trading plan.',
            tagColor: 'bg-amber-950 text-amber-300 border-amber-800'
        },
        DISCIPLINED: {
            config: {
                primaryColor: '#00F0FF',
                secondaryColor: '#0047FF',
                speed: 0.6,
                turbulence: 0.15,
                pulseRate: 0.8,
                glowIntensity: 1.3
            },
            title: '✅ Esecuzione Disciplinata & Stato Mentale Calmo',
            advice: '✨ Setup in perfetto accordo con le regole del tuo Risk Management plan. Rapporto Rischio/Rendimento 1:3 rispettato.',
            tagColor: 'bg-emerald-950 text-emerald-300 border-emerald-800'
        }
    };

    const currentDemo = demoConfigs[activePreset];

    return (
        <div className="min-h-screen bg-transparent text-white selection:bg-cyan-500 selection:text-slate-950 font-sans pb-24 overflow-x-hidden relative">
            
            {/* SINGLE CLEAN MARKETING NAVBAR */}
            <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-50 shadow-2xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
                    
                    {/* Logo TRADYX */}
                    <a href="#" className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl shadow-xl shadow-cyan-500/20">
                            <BrainCircuit className="w-6 h-6 text-slate-950 font-bold" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white via-cyan-200 to-blue-400 bg-clip-text text-transparent">
                                    TRADYX
                                </h1>
                                <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase font-mono">
                                    MARKETING SITE
                                </span>
                            </div>
                            <div className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase font-semibold">
                                AI Trading Journal & Market Intelligence
                            </div>
                        </div>
                    </a>

                    {/* Navigation Links to Demo Sandbox & Pricing */}
                    <nav className="hidden md:flex items-center gap-8 text-xs font-extrabold text-slate-300 uppercase tracking-wider font-mono">
                        <button 
                            type="button" 
                            onClick={onOpenDemo} 
                            className="hover:text-cyan-400 transition cursor-pointer"
                        >
                            Funzionalità
                        </button>
                        <button 
                            type="button" 
                            onClick={onOpenDemo} 
                            className="hover:text-cyan-400 transition cursor-pointer"
                        >
                            Psicologia AI
                        </button>
                        <a href="#pricing" className="hover:text-cyan-400 transition">Piani & Prezzi</a>
                    </nav>

                    {/* External Platform / Auth Modal Trigger Links */}
                    <div className="flex items-center gap-3">
                        {authUser ? (
                            <div className="flex items-center gap-3">
                                <span className="hidden sm:inline-block text-xs font-mono text-emerald-400 font-bold bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                                    🟢 {authUser.full_name || authUser.email}
                                </span>
                                <button
                                    type="button"
                                    onClick={onLogout}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-rose-950/80 border border-slate-800 text-xs font-bold text-slate-300 hover:text-rose-300 rounded-xl transition cursor-pointer active:scale-95"
                                >
                                    <span>Disconnetti</span>
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={onOpenAuthModal}
                                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer active:scale-95"
                                >
                                    <LogIn className="w-4 h-4 text-cyan-400" />
                                    <span>Accedi</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={onOpenAuthModal}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-xl shadow-cyan-500/25 cursor-pointer active:scale-95"
                                >
                                    <Sparkles className="w-4 h-4 text-slate-950" />
                                    <span>Inizia Gratis</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* HERO SECTION */}
            <section className="relative pt-12 sm:pt-20 pb-16 max-w-7xl mx-auto px-4 sm:px-6">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="text-center space-y-6 max-w-4xl mx-auto relative z-10">
                    
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900/90 border border-cyan-500/40 rounded-full text-cyan-300 text-xs font-mono font-bold shadow-xl">
                        <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                        <span>Powered by Google Gemini AI & Behavioral Finance Analytics</span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
                        Il Trading Journal AI che legge la tua <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">psicologia di mercato</span>
                    </h1>

                    <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
                        Analizza la FOMO, azzera il Revenge Trading e trasforma la tua disciplina operativa in profitti costanti con il primo diario di bordo al mondo dotato di <strong>Matrix 3D comportamentale</strong>.
                    </p>

                    {/* External Link CTA & Live Interactive Demo Trigger Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onOpenAuthModal}
                            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-400 via-blue-600 to-indigo-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-sm rounded-2xl transition shadow-2xl shadow-cyan-500/30 active:scale-95 flex items-center justify-center gap-3 cursor-pointer group"
                        >
                            <span>Inizia Gratis Ora</span>
                            <Sparkles className="w-4 h-4 text-slate-950 group-hover:scale-110 transition" />
                        </button>

                        <button
                            type="button"
                            onClick={onOpenDemo}
                            className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 border border-cyan-500/50 hover:border-cyan-400 text-white font-extrabold text-sm rounded-2xl transition shadow-xl active:scale-95 flex items-center justify-center gap-2 cursor-pointer group"
                        >
                            <BrainCircuit className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition" />
                            <span>Prova la Dashboard Live</span>
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        </button>
                    </div>

                    {/* Stats Counter */}
                    <div className="pt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-800/80 max-w-3xl mx-auto font-mono text-left sm:text-center">
                        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-0.5">
                            <div className="text-2xl font-extrabold text-cyan-400">$1.4M+</div>
                            <div className="text-[11px] text-slate-400">Perdite da FOMO Evitate</div>
                        </div>
                        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-0.5">
                            <div className="text-2xl font-extrabold text-purple-400">98.7%</div>
                            <div className="text-[11px] text-slate-400">Precisione Rilevamento Bias</div>
                        </div>
                        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-0.5">
                            <div className="text-2xl font-extrabold text-emerald-400">3.4k+</div>
                            <div className="text-[11px] text-slate-400">Trader Disciplinati Attivi</div>
                        </div>
                    </div>

                </div>
            </section>

            {/* DEMO INTERATTIVA QUASAR BUBBLE SECTION */}
            <section id="demo" className="py-16 bg-slate-950/90 border-y border-slate-800/80 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
                    
                    <div className="text-center space-y-2 max-w-2xl mx-auto">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-950/80 border border-purple-500/40 rounded-full text-purple-300 text-xs font-mono font-bold uppercase">
                            <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
                            Dimostrazione Visuale Locale
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                            Quasar 3D Behavioral Matrix
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-400">
                            Seleziona uno stato emotivo di prova per osservare l'orbe WebGL locale e la risposta simulated dell'AI Coach:
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
                        
                        {/* 3 Test Presets */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <button
                                type="button"
                                onClick={() => setActivePreset('FOMO')}
                                className={`p-4 rounded-2xl border text-left transition space-y-1 ${
                                    activePreset === 'FOMO' 
                                        ? 'bg-rose-950/80 border-rose-500 text-white shadow-lg shadow-rose-950/50' 
                                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                            >
                                <div className="flex items-center gap-2 font-bold text-sm text-rose-400">
                                    <Flame className="w-4 h-4" />
                                    FOMO Trading
                                </div>
                                <div className="text-[11px] text-slate-400">Inseguimento dei prezzi</div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActivePreset('REVENGE')}
                                className={`p-4 rounded-2xl border text-left transition space-y-1 ${
                                    activePreset === 'REVENGE' 
                                        ? 'bg-purple-950/80 border-purple-500 text-white shadow-lg shadow-purple-950/50' 
                                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                            >
                                <div className="flex items-center gap-2 font-bold text-sm text-purple-400">
                                    <AlertTriangle className="w-4 h-4" />
                                    Revenge Trading
                                </div>
                                <div className="text-[11px] text-slate-400">Recupero rabbioso</div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActivePreset('DISCIPLINED')}
                                className={`p-4 rounded-2xl border text-left transition space-y-1 ${
                                    activePreset === 'DISCIPLINED' 
                                        ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-lg shadow-emerald-950/50' 
                                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                            >
                                <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                                    <ShieldCheck className="w-4 h-4" />
                                    Trading Disciplinato
                                </div>
                                <div className="text-[11px] text-slate-400">Rispetto del Plan</div>
                            </button>
                        </div>

                        {/* Visual Canvas Demo */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center border border-slate-800 rounded-3xl p-6 bg-slate-950/80 shadow-2xl">
                            <div className="lg:col-span-6 w-full max-w-[420px] mx-auto min-h-[380px] flex items-center justify-center relative p-4 overflow-hidden">
                                <QuasarBubble config={currentDemo.config} />
                            </div>

                            <div className="lg:col-span-6 space-y-4">
                                <div className="space-y-1">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase font-mono border ${currentDemo.tagColor}`}>
                                        STATO EMOTIVO TEST
                                    </span>
                                    <h3 className="text-base sm:text-lg font-extrabold text-white pt-1">{currentDemo.title}</h3>
                                </div>

                                <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2 text-xs leading-relaxed">
                                    <div className="flex items-center gap-2 font-bold text-cyan-400 font-mono">
                                        <Bot className="w-4 h-4" />
                                        Simulated AI Coach Feedback:
                                    </div>
                                    <p className="text-slate-300 font-sans">{currentDemo.advice}</p>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </section>

            {/* VETRINA FUNZIONALITÀ & PREVIEW GRAFICI ANALITICI */}
            <section id="features" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
                <div className="text-center space-y-3 max-w-3xl mx-auto">
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                        Vetrina Funzionalità & Analytics Avanzati
                    </h2>
                    <p className="text-sm text-slate-400">
                        Anteprima dei grafici analitici disponibili nella piattaforma operativa TRADYX.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Widget Preview 1: Cost of Emotion */}
                    <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4 hover:border-cyan-500/40 transition">
                        <div className="flex items-center gap-3 text-cyan-400">
                            <div className="p-3 bg-cyan-950 border border-cyan-800 rounded-2xl">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-extrabold text-white">Cost of Emotion Breakdown</h3>
                                <p className="text-xs text-slate-400 font-mono">Impatto Monetario Emotivo</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Quantifica esattamente in dollari ($) quanto il tuo capitale risente degli errori emotivi (FOMO, Avidità, Revenge Trading) rispetto ai profitti generati dall'esecuzione disciplinata.
                        </p>
                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 font-mono text-xs">
                            <div className="flex justify-between text-slate-400"><span>Perdite da FOMO:</span><span className="text-rose-400 font-bold">-$2,800</span></div>
                            <div className="flex justify-between text-slate-400"><span>Profitto Disciplinato:</span><span className="text-emerald-400 font-bold">+$7,200</span></div>
                            <div className="flex justify-between text-slate-200 pt-1 border-t border-slate-800 font-bold"><span>Delta Emotivo Netto:</span><span className="text-cyan-300">+$4,400</span></div>
                        </div>
                    </div>

                    {/* Widget Preview 2: Expectancy Matrix */}
                    <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4 hover:border-purple-500/40 transition">
                        <div className="flex items-center gap-3 text-purple-400">
                            <div className="p-3 bg-purple-950 border border-purple-800 rounded-2xl">
                                <Target className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-extrabold text-white">Expectancy & R:R Matrix</h3>
                                <p className="text-xs text-slate-400 font-mono">Valore Atteso Matematico ($EV)</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Calcola in tempo reale il Win Rate effettivo %, il Risk/Reward realizzato sul campo ed il Valore Atteso ($EV) teorico generato per ogni singola operazione aperta.
                        </p>
                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-2 gap-3 font-mono text-xs">
                            <div><span className="text-slate-400 text-[10px]">WIN RATE:</span><div className="text-base font-bold text-white">62.5%</div></div>
                            <div><span className="text-slate-400 text-[10px]">RISK/REWARD:</span><div className="text-base font-bold text-purple-300">1 : 2.45</div></div>
                            <div className="col-span-2 pt-1 border-t border-slate-800"><span className="text-slate-400 text-[10px]">EXPECTANCY ($EV/TRADE):</span><div className="text-lg font-bold text-emerald-400">+$185.20</div></div>
                        </div>
                    </div>

                    {/* Widget Preview 3: Heatmap Calendar */}
                    <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4 hover:border-emerald-500/40 transition">
                        <div className="flex items-center gap-3 text-emerald-400">
                            <div className="p-3 bg-emerald-950 border border-emerald-800 rounded-2xl">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-extrabold text-white">Trading Heatmap Calendar</h3>
                                <p className="text-xs text-slate-400 font-mono">Griglia Giornaliera PnL</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Visualizza le tue performance su un calendario mensile stile GitHub, identificando a colpo d'occhio i giorni di profitto (verde) e i giorni di drawdown (rosso).
                        </p>
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-7 gap-1 text-center font-mono text-[9px]">
                            <div className="p-2 bg-emerald-600 text-white rounded-lg font-bold">+$1.2k</div>
                            <div className="p-2 bg-rose-600 text-white rounded-lg font-bold">-$450</div>
                            <div className="p-2 bg-emerald-950 text-emerald-400 rounded-lg">+$320</div>
                            <div className="p-2 bg-slate-900 text-slate-500 rounded-lg">FLAT</div>
                            <div className="p-2 bg-emerald-600 text-white rounded-lg font-bold">+$2.1k</div>
                            <div className="p-2 bg-emerald-950 text-emerald-400 rounded-lg">+$540</div>
                            <div className="p-2 bg-rose-950 text-rose-300 rounded-lg">-$180</div>
                        </div>
                    </div>

                    {/* Widget Preview 4: Quant Backtesting */}
                    <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4 hover:border-amber-500/40 transition">
                        <div className="flex items-center gap-3 text-amber-400">
                            <div className="p-3 bg-amber-950 border border-amber-800 rounded-2xl">
                                <Layers className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-extrabold text-white">Quant Backtesting & Drawdown Curve</h3>
                                <p className="text-xs text-slate-400 font-mono">Simulazione Monte Carlo</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Simula l'andamento della curva di equity con algoritmi di stress-test e simulazione stocastica su dati storici di mercato prima dell'esecuzione live.
                        </p>
                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 font-mono text-xs">
                            <div className="flex justify-between text-slate-400"><span>Max Drawdown Stimato:</span><span className="text-amber-400 font-bold">-8.4%</span></div>
                            <div className="flex justify-between text-slate-400"><span>Sharpe Ratio:</span><span className="text-cyan-300 font-bold">2.15</span></div>
                        </div>
                    </div>

                </div>
            </section>

            {/* TABELLA PIANI & PREZZI */}
            <section id="pricing" className="py-16 bg-slate-950/90 border-t border-slate-800/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
                    
                    <div className="text-center space-y-3 max-w-2xl mx-auto">
                        <span className="px-3 py-1 bg-cyan-950 border border-cyan-800 rounded-full text-cyan-400 text-xs font-mono font-bold uppercase">
                            Piani di Abbonamento
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                            Scegli il piano adatto al tuo Trading
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-400">
                            Accedi subito alla piattaforma operativa Vercel.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
                        
                        {/* Plan 1: Free */}
                        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl flex flex-col justify-between space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-extrabold text-white">Starter Free</h3>
                                    <p className="text-xs text-slate-400 font-mono">Per iniziare il monitoraggio</p>
                                </div>
                                <div className="text-3xl font-black text-white font-mono">$0 <span className="text-xs font-normal text-slate-400">/mese</span></div>
                                <ul className="space-y-2.5 text-xs text-slate-300">
                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> 10 Trade Registrabili / mese</li>
                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Analisi Comportamentale Base</li>
                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Accesso Crypto Market Widget</li>
                                </ul>
                            </div>
                            <button
                                type="button"
                                onClick={onOpenAuthModal}
                                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition text-center flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <span>Inizia Gratis</span>
                                <Sparkles className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Plan 2: Pro Trader */}
                        <div className="p-6 bg-slate-900 border-2 border-cyan-500 rounded-3xl flex flex-col justify-between space-y-6 shadow-2xl shadow-cyan-500/20 relative">
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-full shadow">
                                PIÙ POPOLARE
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-extrabold text-white">Pro Trader</h3>
                                    <p className="text-xs text-cyan-300 font-mono">Per trader attivi orientati alla disciplina</p>
                                </div>
                                <div className="text-3xl font-black text-white font-mono">$9.99 <span className="text-xs font-normal text-slate-400">/mese</span></div>
                                <ul className="space-y-2.5 text-xs text-slate-200">
                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Trade e Diario Illimitati</li>
                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> AI Coach Google Gemini 2.5 Flash</li>
                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Cost of Emotion Breakdown Widget</li>
                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Trading Heatmap Calendar Grid</li>
                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Expectancy & R:R Matrix ($EV)</li>
                                </ul>
                            </div>
                            <button
                                type="button"
                                onClick={onOpenAuthModal}
                                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition text-center flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <span>Attiva Pro Trader</span>
                                <Sparkles className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Plan 3: VIP Quant */}
                        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl flex flex-col justify-between space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-extrabold text-white">Quant VIP</h3>
                                    <p className="text-xs text-purple-300 font-mono">Per sistematici e gestori quantitativi</p>
                                </div>
                                <div className="text-3xl font-black text-white font-mono">$19.99 <span className="text-xs font-normal text-slate-400">/mese</span></div>
                                <ul className="space-y-2.5 text-xs text-slate-300">
                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400" /> Tutto incluso nel piano Pro Trader</li>
                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400" /> Quant Backtest Monte Carlo Engine</li>
                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400" /> Priorità API Gemini 1.5 Pro</li>
                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400" /> Export CSV & JSON Illimitati</li>
                                </ul>
                            </div>
                            <button
                                type="button"
                                onClick={onOpenAuthModal}
                                className="w-full py-3 bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-700 font-bold text-xs rounded-xl transition text-center flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <span>Diventa Quant VIP</span>
                                <Sparkles className="w-3.5 h-3.5" />
                            </button>
                        </div>

                    </div>
                </div>
            </section>

            {/* FOOTER LEGALE */}
            <footer className="border-t border-slate-800/80 pt-12 max-w-7xl mx-auto px-4 sm:px-6 font-mono text-xs space-y-8">
                
                <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl text-[10px] text-slate-500 leading-relaxed space-y-1">
                    <strong className="text-slate-400 uppercase">⚠️ Avviso sui Rischi Finanziari (Financial Risk Disclaimer):</strong>
                    <p>
                        Il trading su strumenti finanziari (Criptovalute, Azioni, Forex e Derivatives) comporta un elevato livello di rischio per il capitale depositato. Tradyx è una piattaforma software di analisi comportamentale, supporto psicologico e backtesting analitico. Non costituisce sollecitazione all’investimento né fornisce segnali finanziari o consulenza patrimoniale.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 border-t border-slate-900 pt-6">
                    <div>
                        © 2026 TRADYX AI Inc. Tutti i diritti riservati.
                    </div>
                </div>

            </footer>

        </div>
    );
};
