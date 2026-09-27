// ============================================================================
// TRADYX HIGH-END FINTECH SAAS LANDING PAGE (src/components/LandingPage.tsx)
// Dark Futuristic Luxury Palette, Glassmorphism, 3D Floating Smartphone & Bento Grid
// ============================================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    LogIn,
    Activity,
    Target,
    Smartphone,
    Lock,
    CheckCircle2,
    Star,
    Award,
    Users,
    Shield,
    ChevronRight
} from 'lucide-react';

import { UserAccount } from '../types/auth';

interface LandingPageProps {
    onOpenDemo?: () => void;
    onOpenAuthModal?: () => void;
    authUser?: UserAccount | null;
    onLogout?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
    onOpenDemo, 
    onOpenAuthModal, 
    authUser, 
    onLogout 
}) => {
    // Interactive Demo State (FOMO, REVENGE, DISCIPLINED)
    const [activePreset, setActivePreset] = useState<'FOMO' | 'REVENGE' | 'DISCIPLINED'>('DISCIPLINED');

    const demoConfigs: Record<'FOMO' | 'REVENGE' | 'DISCIPLINED', { 
        config: BubbleConfig; 
        title: string; 
        advice: string; 
        badgeBg: string;
        badgeText: string;
        borderColor: string;
        glowColor: string;
        pnl: string;
        winRate: string;
    }> = {
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
            advice: '⚠️ Ingresso d’impulso su un’estensione verticale del prezzo senza attendere il retest della struttura. L’AI ha bloccato temporaneamente l’ordine per proteggere il capitale.',
            badgeBg: 'bg-rose-500/10',
            badgeText: 'text-rose-400',
            borderColor: 'border-rose-500/40',
            glowColor: 'shadow-rose-500/20',
            pnl: '-$1,450.00',
            winRate: '34%'
        },
        REVENGE: {
            config: {
                primaryColor: '#A855F7',
                secondaryColor: '#EC4899',
                speed: 2.1,
                turbulence: 0.75,
                pulseRate: 1.9,
                glowIntensity: 1.7
            },
            title: '⚡ Revenge Trading Rilevato (Over-leveraging & Rabbia)',
            advice: '⚠️ Rilevato tentativo di "recuperare" la perdita precedente triplicando la size. Rischio di violazione del Risk Management Plan.',
            badgeBg: 'bg-purple-500/10',
            badgeText: 'text-purple-400',
            borderColor: 'border-purple-500/40',
            glowColor: 'shadow-purple-500/20',
            pnl: '-$3,820.00',
            winRate: '28%'
        },
        DISCIPLINED: {
            config: {
                primaryColor: '#00F0FF',
                secondaryColor: '#3B82F6',
                speed: 0.6,
                turbulence: 0.15,
                pulseRate: 0.8,
                glowIntensity: 1.3
            },
            title: '✅ Esecuzione Disciplinata & Stato Mentale Ottimale',
            advice: '✨ Setup in perfetto accordo con il tuo trading plan. Risk/Reward 1:3.2 rispettato. Stato psicologico calmo e focalizzato.',
            badgeBg: 'bg-cyan-500/10',
            badgeText: 'text-cyan-400',
            borderColor: 'border-cyan-500/40',
            glowColor: 'shadow-cyan-500/20',
            pnl: '+$8,940.00',
            winRate: '78%'
        }
    };

    const currentDemo = demoConfigs[activePreset];

    return (
        <div className="min-h-screen min-h-[100dvh] bg-[#05070B] text-slate-100 selection:bg-cyan-500 selection:text-slate-950 font-sans pb-16 overflow-x-hidden relative">
            
            {/* AMBIENT BACKGROUND GLOWS (Radial Gradients Dark Futuristic Luxury) */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                {/* Top Center Main Halo */}
                <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[650px] bg-gradient-to-tr from-cyan-600/20 via-teal-500/15 to-indigo-600/15 blur-[160px] rounded-full" />
                {/* Middle Left Cyan Glow */}
                <div className="absolute top-[35%] -left-48 w-[650px] h-[650px] bg-cyan-500/10 blur-[170px] rounded-full" />
                {/* Middle Right Purple Glow */}
                <div className="absolute top-[65%] -right-48 w-[700px] h-[700px] bg-indigo-600/10 blur-[180px] rounded-full" />
                {/* Bottom Center Subtle Glow */}
                <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-cyan-500/10 blur-[150px] rounded-full" />
            </div>

            {/* STICKY GLASS NAVBAR */}
            <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[#05070B]/85 border-b border-white/10 shadow-2xl transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
                    
                    {/* Brand Logo */}
                    <a href="#" className="flex items-center gap-3.5 group">
                        <div className="p-2.5 bg-gradient-to-tr from-cyan-400 via-teal-400 to-indigo-600 rounded-2xl shadow-lg shadow-cyan-500/30 group-hover:scale-105 group-hover:shadow-cyan-500/50 transition-all duration-300">
                            <BrainCircuit className="w-6 h-6 text-slate-950 font-black" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-black tracking-tight text-white font-sans">
                                    TRADYX
                                </span>
                                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-extrabold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                                    FINTECH AI
                                </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase font-semibold block">
                                AI Behavioral Trading Platform
                            </span>
                        </div>
                    </a>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8 text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                        <a href="#features" className="hover:text-cyan-400 transition-colors">
                            Funzionalità
                        </a>
                        <a href="#demo" className="hover:text-cyan-400 transition-colors">
                            Quasar 3D Demo
                        </a>
                        <a href="#testimonials" className="hover:text-cyan-400 transition-colors">
                            Social Proof
                        </a>
                        <a href="#pricing" className="hover:text-cyan-400 transition-colors">
                            Piani & Prezzi
                        </a>
                    </nav>

                    {/* Auth & CTA Actions */}
                    <div className="flex items-center gap-3">
                        {authUser ? (
                            <div className="flex items-center gap-3">
                                <span className="hidden sm:inline-flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold bg-white/[0.03] backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                    {authUser.full_name || authUser.email}
                                </span>
                                <button
                                    type="button"
                                    onClick={onLogout}
                                    className="px-4 py-2 bg-white/[0.03] hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-xs font-bold text-slate-300 hover:text-rose-300 rounded-xl transition-all cursor-pointer active:scale-95"
                                >
                                    Disconnetti
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={onOpenAuthModal}
                                    className="flex items-center gap-2 px-4.5 py-2.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 rounded-xl text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer active:scale-95"
                                >
                                    <LogIn className="w-4 h-4 text-cyan-400" />
                                    <span>Accedi</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={onOpenAuthModal}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-400 via-teal-400 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-black text-xs rounded-xl shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all cursor-pointer active:scale-95 group"
                                >
                                    <Sparkles className="w-4 h-4 text-slate-950 group-hover:rotate-12 transition-transform" />
                                    <span>Inizia Ora</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* HERO SECTION */}
            <section className="relative pt-12 sm:pt-20 pb-20 max-w-7xl mx-auto px-4 sm:px-6 z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                    
                    {/* Left Column: Value Proposition & CTAs */}
                    <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
                        
                        {/* Status Badge with Live Pulsing Dot */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/[0.03] backdrop-blur-md border border-cyan-500/30 rounded-full text-cyan-300 text-xs font-mono font-bold shadow-2xl hover:border-cyan-500/50 transition-colors"
                        >
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
                            </span>
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                            <span>Google Gemini AI & Behavioral Finance Analytics</span>
                        </motion.div>

                        {/* Magnetic Title with Bright Gradient */}
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-4xl sm:text-6xl xl:text-7xl font-black text-white tracking-tight leading-[1.08]"
                        >
                            Il Sentiment del Trading <br className="hidden sm:inline" />
                            Potenziato dall'
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-500">
                                Intelligenza Artificiale
                            </span>
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal"
                        >
                            Analizza la FOMO in tempo reale, azzera il Revenge Trading e trasforma la tua disciplina in profitti costanti con la prima <strong>Matrix 3D Comportamentale</strong> al mondo.
                        </motion.p>

                        {/* Main Magnetic Action Buttons */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
                        >
                            <button
                                type="button"
                                onClick={onOpenAuthModal}
                                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-400 via-teal-400 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-black text-sm rounded-2xl transition-all duration-300 shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 cursor-pointer group"
                            >
                                <span>Inizia Gratis Ora</span>
                                <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button
                                type="button"
                                onClick={onOpenDemo}
                                className="w-full sm:w-auto px-8 py-4 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-500/50 text-white font-extrabold text-sm rounded-2xl transition-all backdrop-blur-md active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer group"
                            >
                                <BrainCircuit className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
                                <span>Prova la Dashboard Live</span>
                            </button>
                        </motion.div>

                        {/* Micro Social Proof / Features Badges */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 font-mono text-xs text-slate-400"
                        >
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                                <span>Nessuna carta richiesta</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>Setup in 60 secondi</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                                <span>Export CSV/JSON illimitato</span>
                            </div>
                        </motion.div>

                    </div>

                    {/* Right Column: 3D Tilted Smartphone Mockup */}
                    <div className="lg:col-span-5 flex justify-center perspective-1000">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, rotateY: -15, rotateX: 10 }}
                            animate={{ 
                                opacity: 1, 
                                scale: 1, 
                                rotateY: -12, 
                                rotateX: 8,
                                y: [0, -12, 0]
                            }}
                            transition={{ 
                                opacity: { duration: 0.8 },
                                scale: { duration: 0.8 },
                                rotateY: { duration: 0.8 },
                                rotateX: { duration: 0.8 },
                                y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
                            }}
                            whileHover={{ rotateY: 0, rotateX: 0, scale: 1.02 }}
                            className="relative w-full max-w-[340px] h-[660px] bg-slate-950 rounded-[48px] border-[6px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,240,255,0.3)] p-3 overflow-hidden transform-style-3d cursor-pointer group"
                        >
                            {/* Smartphone Outer Titanium Frame Glow */}
                            <div className="absolute -inset-1 rounded-[52px] bg-gradient-to-b from-cyan-500/40 via-purple-500/20 to-transparent blur-sm pointer-events-none" />

                            {/* Dynamic Island / Notch */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-950 rounded-full z-30 flex items-center justify-between px-2.5 border border-slate-800/80">
                                <div className="w-2.5 h-2.5 rounded-full bg-cyan-500/80 animate-pulse" />
                                <div className="w-2 h-2 rounded-full bg-slate-800" />
                            </div>

                            {/* Phone Display Screen (Live Tradyx Mobile Preview) */}
                            <div className="relative w-full h-full bg-[#090D16] rounded-[38px] overflow-hidden flex flex-col justify-between pt-8 pb-4 px-3 border border-white/10 text-white font-sans">
                                
                                {/* App Mobile Header */}
                                <div className="flex items-center justify-between pt-2 px-1 border-b border-white/10 pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-cyan-500/20 rounded-xl border border-cyan-500/40">
                                            <BrainCircuit className="w-4 h-4 text-cyan-400" />
                                        </div>
                                        <span className="font-extrabold text-xs tracking-wider">TRADYX PRO</span>
                                    </div>
                                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-[9px] font-mono font-bold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                        LIVE
                                    </span>
                                </div>

                                {/* Live 3D Quasar Bubble inside Phone Screen */}
                                <div className="relative w-full h-[260px] flex items-center justify-center my-auto">
                                    <QuasarBubble config={currentDemo.config} />
                                </div>

                                {/* Floating Live Alert Card */}
                                <div className="p-3 bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-2xl space-y-2 shadow-2xl">
                                    <div className="flex items-center justify-between text-[11px] font-mono">
                                        <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                                            <Bot className="w-3.5 h-3.5" />
                                            QUASAR AI ALERT
                                        </span>
                                        <span className="text-slate-400">Adesso</span>
                                    </div>
                                    <p className="text-[11px] text-slate-200 leading-snug font-sans">
                                        Stato emotivo calmo. Rischio da FOMO evitato su BTC/USDT.
                                    </p>
                                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-white/10">
                                        <span>WIN RATE: <strong className="text-emerald-400">78%</strong></span>
                                        <span>R:R: <strong className="text-cyan-300">1:3.2</strong></span>
                                    </div>
                                </div>

                                {/* Phone Bottom Navigation */}
                                <div className="flex items-center justify-around text-[10px] text-slate-400 font-mono pt-2 border-t border-white/10">
                                    <span className="text-cyan-400 font-bold">Journal</span>
                                    <span>Analytics</span>
                                    <span>AI Coach</span>
                                </div>

                            </div>
                        </motion.div>
                    </div>

                </div>
            </section>

            {/* STATS TICKER COUNTER BAR */}
            <section className="py-10 border-y border-white/10 bg-white/[0.01] backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center font-mono">
                        <div className="space-y-1">
                            <div className="text-3xl sm:text-4xl font-black text-cyan-400">$2.8M+</div>
                            <div className="text-xs text-slate-400 font-sans">Perdite da FOMO Evitate</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-3xl sm:text-4xl font-black text-purple-400">99.4%</div>
                            <div className="text-xs text-slate-400 font-sans">Precisione Rilevamento Bias</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-3xl sm:text-4xl font-black text-emerald-400">5,400+</div>
                            <div className="text-xs text-slate-400 font-sans">Trader Disciplinati Attivi</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-3xl sm:text-4xl font-black text-rose-400">4.9 / 5</div>
                            <div className="text-xs text-slate-400 font-sans">Valutazione della Community</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* BENTO GRID FUNZIONALITÀ (ASYMMETRIC MODULAR GRID) */}
            <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 space-y-12 relative z-10">
                
                {/* Section Header */}
                <div className="text-center space-y-4 max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-400 text-xs font-mono font-bold uppercase">
                        <Layers className="w-3.5 h-3.5" />
                        Architettura FinTech Modulare
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                        Bento Grid delle Funzionalità Avanzate
                    </h2>
                    <p className="text-sm sm:text-base text-slate-400">
                        Strumenti quantitativi e algoritmi di intelligenza comportamentale racchiusi in un'interfaccia ad altissime prestazioni.
                    </p>
                </div>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* BENTO CARD 1: Quasar Bubble Sentiment (Large 2 Cols) */}
                    <div className="md:col-span-2 glass-card glass-card-hover rounded-3xl p-8 space-y-6 flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-400">
                                    <BrainCircuit className="w-6 h-6" />
                                </div>
                                <span className="px-3 py-1 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded-full text-[10px] font-mono font-bold uppercase flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                                    3D WebGL GLSL Shader
                                </span>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-white">Quasar Bubble Sentiment Matrix</h3>
                                <p className="text-sm text-slate-300 leading-relaxed font-sans">
                                    L'orbe WebGL tridimensionale reagisce istantaneamente alle tue operazioni di trading. Modifica colore, velocità di rotazione e turbolenza in base alla stabilità emotiva e al livello di rischio del portafoglio.
                                </p>
                            </div>
                        </div>

                        {/* Interactive Metric Pills */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs pt-4 border-t border-white/10">
                            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-2xl">
                                <div className="text-slate-400 text-[10px]">TURBOLENZA:</div>
                                <div className="text-cyan-400 font-bold text-sm">0.15 (Stabile)</div>
                            </div>
                            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-2xl">
                                <div className="text-slate-400 text-[10px]">GLOW RATE:</div>
                                <div className="text-emerald-400 font-bold text-sm">1.3x Optimal</div>
                            </div>
                            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-2xl">
                                <div className="text-slate-400 text-[10px]">BIAS STATUS:</div>
                                <div className="text-purple-400 font-bold text-sm">98.5% Clear</div>
                            </div>
                        </div>
                    </div>

                    {/* BENTO CARD 2: Cost of Emotion ($) (1 Col) */}
                    <div className="glass-card glass-card-hover rounded-3xl p-8 space-y-6 flex flex-col justify-between relative overflow-hidden">
                        <div className="space-y-4">
                            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 w-fit">
                                <BarChart3 className="w-6 h-6" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-white">Cost of Emotion Breakdown</h3>
                                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                                    Calcola esattamente in dollari ($) l'impatto finanziario delle decisioni emotive (FOMO, Avidità, Revenge Trading) rispetto alle entrate disciplinate.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl space-y-2 font-mono text-xs">
                            <div className="flex justify-between text-slate-400">
                                <span>Perdite Emotive:</span>
                                <span className="text-rose-400 font-bold">-$2,800.00</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>Profitto Plan:</span>
                                <span className="text-emerald-400 font-bold">+$9,400.00</span>
                            </div>
                            <div className="flex justify-between text-white pt-2 border-t border-white/10 font-bold">
                                <span>Delta Netto:</span>
                                <span className="text-cyan-300">+$6,600.00</span>
                            </div>
                        </div>
                    </div>

                    {/* BENTO CARD 3: AI Coach Google Gemini (1 Col) */}
                    <div className="glass-card glass-card-hover rounded-3xl p-8 space-y-6 flex flex-col justify-between">
                        <div className="space-y-4">
                            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-purple-400 w-fit">
                                <Bot className="w-6 h-6" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-white">Google Gemini AI Coach</h3>
                                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                                    Un personal coach virtuale integrato che analizza la tua cronologia, rileva pattern comportamentali negativi ed interviene prima che tu commetta errori fatali.
                                </p>
                            </div>
                        </div>

                        <div className="p-3.5 bg-purple-950/40 border border-purple-500/30 rounded-2xl space-y-1 text-xs">
                            <div className="text-purple-300 font-mono font-bold flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                Prompt Interattivo AI:
                            </div>
                            <p className="text-slate-300 text-[11px]">
                                "Attenzione: hai aperto 3 trade consecutivi in 15 minuti. Pausa di 20 min raccomandata."
                            </p>
                        </div>
                    </div>

                    {/* BENTO CARD 4: Expectancy & R:R Matrix (1 Col) */}
                    <div className="glass-card glass-card-hover rounded-3xl p-8 space-y-6 flex flex-col justify-between">
                        <div className="space-y-4">
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 w-fit">
                                <Target className="w-6 h-6" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-white">Expectancy & $EV Matrix</h3>
                                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                                    Valuta la matematica dietro al tuo edge: Win Rate %, Risk/Reward reale e Valore Atteso Statistico ($EV) per ogni singolo trade.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-xl">
                                <span className="text-[10px] text-slate-400">WIN RATE</span>
                                <div className="text-white font-black text-sm">68.4%</div>
                            </div>
                            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-xl">
                                <span className="text-[10px] text-slate-400">$EV / TRADE</span>
                                <div className="text-emerald-400 font-black text-sm">+$245.80</div>
                            </div>
                        </div>
                    </div>

                    {/* BENTO CARD 5: Quant Backtesting Engine (Large 2 Cols) */}
                    <div className="md:col-span-2 glass-card glass-card-hover rounded-3xl p-8 space-y-6 flex flex-col justify-between">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400">
                                    <Layers className="w-6 h-6" />
                                </div>
                                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-full text-[10px] font-mono font-bold uppercase">
                                    Monte Carlo Stochastic Simulation
                                </span>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-white">Quant Backtesting & Drawdown Curve</h3>
                                <p className="text-sm text-slate-300 leading-relaxed font-sans">
                                    Simula migliaia di scenari stocastici sui dati storici di mercato per verificare la solidità della tua strategia prima di rischiare capitale reale sul mercato.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                            <div>
                                <div className="text-slate-400 text-[10px]">MAX DRAWDOWN STIMATO:</div>
                                <div className="text-amber-400 font-bold text-sm">-6.2% Max</div>
                            </div>
                            <div>
                                <div className="text-slate-400 text-[10px]">SHARPE RATIO:</div>
                                <div className="text-cyan-300 font-bold text-sm">2.42 (High Edge)</div>
                            </div>
                            <div>
                                <div className="text-slate-400 text-[10px]">PROFIT FACTOR:</div>
                                <div className="text-emerald-400 font-bold text-sm">3.18</div>
                            </div>
                        </div>
                    </div>

                </div>

            </section>

            {/* SEZIONE DIMOSTRATIVA INTERATTIVA QUASAR 3D MATRIX */}
            <section id="demo" className="py-20 bg-white/[0.01] border-y border-white/10 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
                    
                    <div className="text-center space-y-3 max-w-2xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-300 text-xs font-mono font-bold uppercase">
                            <BrainCircuit className="w-4 h-4 text-purple-400" />
                            Dimostrazione Visuale 3D WebGL
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white">
                            Quasar 3D Behavioral Matrix Live
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-400">
                            Seleziona uno stato emotivo di prova per testare la risposta dinamica dell'orbe tridimensionale e dell'AI Coach:
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto glass-card rounded-3xl p-6 sm:p-10 backdrop-blur-2xl shadow-2xl space-y-8 border border-white/10">
                        
                        {/* 3 Interactive Preset Selector Buttons */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <button
                                type="button"
                                onClick={() => setActivePreset('FOMO')}
                                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                                    activePreset === 'FOMO' 
                                        ? 'bg-rose-950/60 border-rose-500 text-white shadow-xl shadow-rose-950/50' 
                                        : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                                }`}
                            >
                                <div className="flex items-center gap-2 font-bold text-sm text-rose-400 font-mono">
                                    <Flame className="w-4 h-4" />
                                    FOMO Trading
                                </div>
                                <div className="text-[11px] text-slate-400">Inseguimento impulsivo</div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActivePreset('REVENGE')}
                                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                                    activePreset === 'REVENGE' 
                                        ? 'bg-purple-950/60 border-purple-500 text-white shadow-xl shadow-purple-950/50' 
                                        : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                                }`}
                            >
                                <div className="flex items-center gap-2 font-bold text-sm text-purple-400 font-mono">
                                    <AlertTriangle className="w-4 h-4" />
                                    Revenge Trading
                                </div>
                                <div className="text-[11px] text-slate-400">Recupero rabbioso</div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActivePreset('DISCIPLINED')}
                                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                                    activePreset === 'DISCIPLINED' 
                                        ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-xl shadow-cyan-950/50' 
                                        : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                                }`}
                            >
                                <div className="flex items-center gap-2 font-bold text-sm text-cyan-400 font-mono">
                                    <ShieldCheck className="w-4 h-4" />
                                    Trading Disciplinato
                                </div>
                                <div className="text-[11px] text-slate-400">Rispetto del Plan</div>
                            </button>
                        </div>

                        {/* Visual Canvas & AI Coach Feedback */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border border-white/10 rounded-3xl p-6 sm:p-8 bg-black/40 shadow-2xl">
                            
                            <div className="lg:col-span-6 w-full max-w-[380px] mx-auto min-h-[340px] flex items-center justify-center relative p-2">
                                <QuasarBubble config={currentDemo.config} />
                            </div>

                            <div className="lg:col-span-6 space-y-6">
                                <div className="space-y-2">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase font-mono border ${currentDemo.badgeBg} ${currentDemo.badgeText} ${currentDemo.borderColor}`}>
                                        STATO COMPORTAMENTALE RILEVATO
                                    </span>
                                    <h3 className="text-lg sm:text-xl font-black text-white pt-1">
                                        {currentDemo.title}
                                    </h3>
                                </div>

                                <div className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl space-y-2.5 text-xs leading-relaxed">
                                    <div className="flex items-center gap-2 font-mono font-bold text-cyan-400">
                                        <Bot className="w-4 h-4" />
                                        Simulated AI Coach Feedback:
                                    </div>
                                    <p className="text-slate-200 font-sans">{currentDemo.advice}</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                                    <div className="p-3 bg-white/[0.02] border border-white/10 rounded-xl">
                                        <span className="text-[10px] text-slate-400">PNL STIMATO</span>
                                        <div className={`font-extrabold text-sm ${currentDemo.pnl.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {currentDemo.pnl}
                                        </div>
                                    </div>
                                    <div className="p-3 bg-white/[0.02] border border-white/10 rounded-xl">
                                        <span className="text-[10px] text-slate-400">WIN RATE %</span>
                                        <div className="font-extrabold text-sm text-white">{currentDemo.winRate}</div>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </div>

                </div>
            </section>

            {/* SOCIAL PROOF & VERIFIED TESTIMONIALS */}
            <section id="testimonials" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 space-y-12 z-10 relative">
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-mono font-bold uppercase">
                        <Users className="w-4 h-4" />
                        Community & Social Proof
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black text-white">
                        Scelto da oltre 5,000 Trader Professionisti
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400">
                        Ecco cosa dicono i trader che hanno eliminato la FOMO grazie a Tradyx:
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Testimonial 1 */}
                    <div className="glass-card glass-card-hover rounded-3xl p-6 space-y-4 flex flex-col justify-between">
                        <div className="space-y-3">
                            <div className="flex items-center gap-1 text-amber-400">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                                ))}
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed font-sans">
                                "La Quasar Bubble mi ha letteralmente salvato il conto in diverse occasioni. Quando vedo la bolla diventare viola di turbolenza, so che devo chiudere i grafici per il resto della giornata."
                            </p>
                        </div>
                        <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-600 flex items-center justify-center font-bold text-slate-950 font-mono text-sm">
                                MP
                            </div>
                            <div>
                                <div className="text-xs font-bold text-white">Marco P.</div>
                                <div className="text-[10px] text-cyan-400 font-mono">Trader Crypto & Forex</div>
                            </div>
                        </div>
                    </div>

                    {/* Testimonial 2 */}
                    <div className="glass-card glass-card-hover rounded-3xl p-6 space-y-4 flex flex-col justify-between">
                        <div className="space-y-3">
                            <div className="flex items-center gap-1 text-amber-400">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                                ))}
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed font-sans">
                                "Il Cost of Emotion Breakdown mi ha aperto gli occhi: perdevo oltre $3,000 al mese solo di FOMO. Con Tradyx sono passato in positivo costante in 60 giorni."
                            </p>
                        </div>
                        <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-400 to-rose-600 flex items-center justify-center font-bold text-slate-950 font-mono text-sm">
                                GVR
                            </div>
                            <div>
                                <div className="text-xs font-bold text-white">Gianluca V.</div>
                                <div className="text-[10px] text-purple-400 font-mono">Prop Firm Funded Trader</div>
                            </div>
                        </div>
                    </div>

                    {/* Testimonial 3 */}
                    <div className="glass-card glass-card-hover rounded-3xl p-6 space-y-4 flex flex-col justify-between">
                        <div className="space-y-3">
                            <div className="flex items-center gap-1 text-amber-400">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                                ))}
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed font-sans">
                                "L'integrazione di Google Gemini per l'AI Coach è semplicemente geniale. Mi fornisce consigli personalizzati prima di confermare un ordine. Indispensabile!"
                            </p>
                        </div>
                        <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-600 flex items-center justify-center font-bold text-slate-950 font-mono text-sm">
                                SDB
                            </div>
                            <div>
                                <div className="text-xs font-bold text-white">Stefano D.</div>
                                <div className="text-[10px] text-emerald-400 font-mono">Quant & Algorithmic Trader</div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* TABELLA PIANI & PREZZI (PRICING) */}
            <section id="pricing" className="py-24 bg-white/[0.01] border-t border-white/10 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
                    
                    <div className="text-center space-y-4 max-w-2xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-400 text-xs font-mono font-bold uppercase">
                            <Award className="w-4 h-4" />
                            Piani di Abbonamento
                        </div>
                        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                            Scegli il piano adatto alle tue ambizioni
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-400">
                            Accedi immediatamente a tutti gli strumenti di Intelligenza Comportamentale.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
                        
                        {/* PLAN 1: Starter Free */}
                        <div className="glass-card glass-card-hover rounded-3xl p-8 flex flex-col justify-between space-y-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-white">Starter Free</h3>
                                    <p className="text-xs text-slate-400 font-mono">Per iniziare il monitoraggio</p>
                                </div>
                                <div className="text-4xl font-black text-white font-mono">
                                    $0 <span className="text-xs font-normal text-slate-400">/mese</span>
                                </div>
                                <ul className="space-y-3 text-xs text-slate-300 font-sans">
                                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-cyan-400" /> 10 Trade Registrabili / mese</li>
                                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-cyan-400" /> Analisi Comportamentale Base</li>
                                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-cyan-400" /> Accesso Crypto Market Widget</li>
                                    <li className="flex items-center gap-2.5 text-slate-500"><Check className="w-4 h-4 text-slate-600" /> Quasar 3D Sentiment Matrix</li>
                                </ul>
                            </div>
                            <button
                                type="button"
                                onClick={onOpenAuthModal}
                                className="w-full py-3.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-white/20 text-white font-bold text-xs rounded-xl transition-all text-center flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                            >
                                <span>Inizia Gratis</span>
                                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                            </button>
                        </div>

                        {/* PLAN 2: Pro Trader (Featured) */}
                        <div className="glass-card rounded-3xl p-8 flex flex-col justify-between space-y-8 border-2 border-cyan-500 shadow-2xl shadow-cyan-500/20 relative">
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-cyan-400 to-indigo-600 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg">
                                PIÙ POPOLARE
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-white">Pro Trader</h3>
                                    <p className="text-xs text-cyan-300 font-mono">Per trader orientati alla disciplina</p>
                                </div>
                                <div className="text-4xl font-black text-white font-mono">
                                    $9.99 <span className="text-xs font-normal text-slate-400">/mese</span>
                                </div>
                                <ul className="space-y-3 text-xs text-slate-200 font-sans">
                                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-cyan-400" /> Trade e Diario Illimitati</li>
                                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-cyan-400" /> Quasar 3D WebGL Sentiment Orb</li>
                                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-cyan-400" /> AI Coach Google Gemini 2.5 Flash</li>
                                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-cyan-400" /> Cost of Emotion Breakdown Widget</li>
                                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-cyan-400" /> Expectancy & $EV Matrix</li>
                                </ul>
                            </div>
                            <button
                                type="button"
                                onClick={onOpenAuthModal}
                                className="w-full py-4 bg-gradient-to-r from-cyan-400 via-teal-400 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-black text-xs rounded-xl shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all text-center flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                            >
                                <span>Attiva Pro Trader</span>
                                <Sparkles className="w-4 h-4 text-slate-950" />
                            </button>
                        </div>

                        {/* PLAN 3: Quant VIP */}
                        <div className="glass-card glass-card-hover rounded-3xl p-8 flex flex-col justify-between space-y-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-white">Quant VIP</h3>
                                    <p className="text-xs text-purple-300 font-mono">Per sistematici e gestori quantitativi</p>
                                </div>
                                <div className="text-4xl font-black text-white font-mono">
                                    $19.99 <span className="text-xs font-normal text-slate-400">/mese</span>
                                </div>
                                <ul className="space-y-3 text-xs text-slate-300 font-sans">
                                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-purple-400" /> Tutto incluso nel piano Pro Trader</li>
                                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-purple-400" /> Quant Backtest Monte Carlo Engine</li>
                                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-purple-400" /> Priorità API Gemini 1.5 Pro</li>
                                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-purple-400" /> Export CSV & JSON Illimitati</li>
                                </ul>
                            </div>
                            <button
                                type="button"
                                onClick={onOpenAuthModal}
                                className="w-full py-3.5 bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-700 font-bold text-xs rounded-xl transition-all text-center flex items-center justify-center gap-2 cursor-pointer active:scale-95 font-mono"
                            >
                                <span>Diventa Quant VIP</span>
                                <Sparkles className="w-3.5 h-3.5" />
                            </button>
                        </div>

                    </div>
                </div>
            </section>

            {/* FOOTER LEGALE */}
            <footer className="border-t border-white/10 pt-16 pb-8 max-w-7xl mx-auto px-4 sm:px-6 font-mono text-xs space-y-8 z-10 relative">
                
                <div className="p-5 bg-white/[0.02] border border-white/10 rounded-2xl text-[11px] text-slate-400 leading-relaxed space-y-2 font-sans">
                    <div className="flex items-center gap-2 text-rose-400 font-bold font-mono uppercase text-xs">
                        <Shield className="w-4 h-4 text-rose-400" />
                        <span>Avviso sui Rischi Finanziari (Financial Risk Disclaimer)</span>
                    </div>
                    <p>
                        Il trading su strumenti finanziari (Criptovalute, Azioni, Forex e Derivatives) comporta un elevato livello di rischio per il capitale depositato. Tradyx è una piattaforma software di analisi comportamentale, supporto psicologico e backtesting analitico. Non costituisce sollecitazione all’investimento né fornisce segnali finanziari o consulenza patrimoniale.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 border-t border-white/10 pt-8 font-mono text-[11px]">
                    <div>
                        © 2026 TRADYX AI Inc. Tutti i diritti riservati.
                    </div>
                    <div className="flex items-center gap-6">
                        <a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-cyan-400 transition-colors">Termini di Servizio</a>
                        <a href="#" className="hover:text-cyan-400 transition-colors">Sicurezza API</a>
                    </div>
                </div>

            </footer>

        </div>
    );
};

export default LandingPage;
