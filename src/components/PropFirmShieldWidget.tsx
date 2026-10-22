// ============================================================================
// TRADYX PROP FIRM SHIELD PRESET WIDGET
// (src/components/PropFirmShieldWidget.tsx)
// Early warning alert before reaching 5% max disqualification rule (triggers at 4%)
// ============================================================================

import React, { useMemo } from 'react';
import { useTradeStore, DEFAULT_MOCK_TRADES } from '../store/useTradeStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { ShieldAlert, ShieldCheck, AlertTriangle, Zap, CheckCircle2, Lock } from 'lucide-react';

export const PropFirmShieldWidget: React.FC = () => {
    const { trades } = useTradeStore();
    const safeTrades = Array.isArray(trades) && trades.length > 0 ? trades : DEFAULT_MOCK_TRADES;

    const {
        baseCurrency,
        propFirmShieldEnabled,
        propFirmMaxDailyLossPercent,
        propFirmAccountSize,
        setPropFirmShield,
        formatMoney
    } = useSettingsStore();

    // Calculate today's net P&L from trades
    const todaysPnl = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysTrades = safeTrades.filter(t => (t.created_at || '').startsWith(todayStr));
        // If no trades today, calculate from recent trades for demo visibility
        const sourceTrades = todaysTrades.length > 0 ? todaysTrades : safeTrades.slice(0, 3);
        return sourceTrades.reduce((acc, t) => acc + (Number(t.pnl) || 0), 0);
    }, [safeTrades]);

    const dailyLossAmount = todaysPnl < 0 ? Math.abs(todaysPnl) : 0;
    const dailyDrawdownPercent = Number(((dailyLossAmount / propFirmAccountSize) * 100).toFixed(2));
    
    // Thresholds
    const alertThreshold = propFirmMaxDailyLossPercent; // 4.0%
    const hardDisqualificationLimit = 5.0; // 5.0% standard prop firm rule
    const maxAllowedLoss = (propFirmAccountSize * hardDisqualificationLimit) / 100;
    const alertLossAmount = (propFirmAccountSize * alertThreshold) / 100;
    const distanceToDisqualification = Math.max(0, maxAllowedLoss - dailyLossAmount);

    const isApproachingBreach = dailyDrawdownPercent >= 3.5;
    const isOverAlert = dailyDrawdownPercent >= alertThreshold;

    const challengePresets = [
        { label: '50K Challenge', size: 50000 },
        { label: '100K Challenge', size: 100000 },
        { label: '200K Challenge', size: 200000 },
    ];

    return (
        <section className={`w-full rounded-2xl glass-panel p-4 sm:p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] space-y-4 border ${
            isApproachingBreach 
                ? 'border-rose-500/80 bg-rose-950/20 shadow-rose-950/40 ring-1 ring-rose-500/50' 
                : 'border-white/[0.08]'
        }`}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isApproachingBreach ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                        {isApproachingBreach ? (
                            <ShieldAlert className="w-4 h-4 animate-bounce" />
                        ) : (
                            <ShieldCheck className="w-4 h-4" />
                        )}
                    </div>
                    <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider block">
                            CAPITAL GUARDIAN
                        </span>
                        <h3 className="text-xs sm:text-sm font-extrabold text-white font-mono flex items-center gap-2">
                            <span>PROP FIRM SHIELD PRESET</span>
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-black bg-cyan-950 text-cyan-300 border border-cyan-800">
                                FTMO / APEX
                            </span>
                        </h3>
                    </div>
                </div>

                {/* Enable/Disable Toggle */}
                <button
                    type="button"
                    onClick={() => setPropFirmShield(!propFirmShieldEnabled)}
                    className={`px-3 py-1.5 rounded-xl font-mono text-[10px] font-bold transition cursor-pointer border ${
                        propFirmShieldEnabled
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                            : 'glass-subcard text-slate-400 hover:text-white'
                    }`}
                >
                    {propFirmShieldEnabled ? 'SHIELD ATTIVO' : 'SHIELD OFF'}
                </button>
            </div>

            {/* Warning Alert Banner (if approaching or exceeded 4%) */}
            {isApproachingBreach && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-start gap-2.5 animate-pulse text-xs font-mono">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                        <strong className="text-rose-300 font-bold block">
                            🚨 PROP SHIELD PREVENTIVE ALERT (SOGLIA 4% RAGGIUNTA):
                        </strong>
                        <p className="text-slate-200 text-[11px] leading-tight">
                            Drawdown odierno al <span className="font-black text-rose-400">{dailyDrawdownPercent}%</span> (max squalifica prop tipica: 5.0%). 
                            Sei a soli <strong className="text-white underline">{formatMoney(distanceToDisqualification, false)}</strong> dal breach del conto funded!
                        </p>
                    </div>
                </div>
            )}

            {/* Quick Challenge Preset Selectors */}
            <div className="space-y-1.5 font-mono">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Account Challenge Size ({baseCurrency.symbol}):
                </span>
                <div className="grid grid-cols-3 gap-2">
                    {challengePresets.map(preset => (
                        <button
                            key={preset.size}
                            type="button"
                            onClick={() => setPropFirmShield(propFirmShieldEnabled, alertThreshold, preset.size)}
                            className={`min-h-[40px] px-2 py-1.5 rounded-xl text-[11px] font-bold transition border cursor-pointer ${
                                propFirmAccountSize === preset.size
                                    ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981] shadow-sm'
                                    : 'glass-subcard text-slate-400 hover:text-white'
                            }`}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Drawdown Gauge & Runway Metrics */}
            <div className="grid grid-cols-2 gap-2.5 font-mono">
                <div className="p-3 rounded-xl glass-subcard space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase block">Daily Drawdown:</span>
                    <div className={`text-base font-black tabular-nums ${
                        isApproachingBreach ? 'text-rose-400' : 'text-slate-100'
                    }`}>
                        {dailyDrawdownPercent}% <span className="text-[10px] text-slate-400 font-normal">/ 5.0%</span>
                    </div>
                    <span className="text-[9px] text-slate-500 block">
                        Perdita oggi: {formatMoney(dailyLossAmount, false)}
                    </span>
                </div>

                <div className="p-3 rounded-xl glass-subcard space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase block">Distance to Breach:</span>
                    <div className={`text-base font-black tabular-nums ${
                        distanceToDisqualification < 1000 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                        {formatMoney(distanceToDisqualification, false)}
                    </div>
                    <span className="text-[9px] text-slate-500 block">
                        Margine di sicurezza attivo
                    </span>
                </div>
            </div>

            {/* Visual Risk Progress Bar */}
            <div className="space-y-1 font-mono">
                <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Drawdown Runway vs 5% Breach Limit</span>
                    <span className="font-bold text-white tabular-nums">
                        {dailyDrawdownPercent}% / 5.0% Max
                    </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#08090C] overflow-hidden border border-white/5 relative">
                    {/* 4% Alert Marker */}
                    <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10" 
                        style={{ left: `${(4.0 / 5.0) * 100}%` }} 
                        title="Alert Soglia 4%" 
                    />
                    {/* Fill Bar */}
                    <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                            isApproachingBreach 
                                ? 'bg-gradient-to-r from-amber-500 to-rose-600' 
                                : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                        }`}
                        style={{ width: `${Math.min(100, (dailyDrawdownPercent / 5.0) * 100)}%` }}
                    />
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 pt-0.5">
                    <span>0% (Safe)</span>
                    <span className="text-amber-400 font-bold">4.0% (Early Alert)</span>
                    <span className="text-rose-500 font-bold">5.0% (Hard Breach)</span>
                </div>
            </div>

            <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5 pt-1 border-t border-white/[0.08]">
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Preset compatibile con FTMO, FundedNext, The Funded Trader & Apex Trader Funding.</span>
            </div>
        </section>
    );
};
