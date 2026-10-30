// ============================================================================
// TRADYX NEWS MARKET IMPACT & ASSET INTELLIGENCE CARD
// (src/components/NewsMarketImpactCard.tsx)
// Glassmorphic Operational Container with Directional Badge, Asset Pills, and
// Retail Operational Caption ("Cosa significa per i mercati")
// ============================================================================

import React, { useMemo } from 'react';
import { analyzeMarketImpact } from '../services/marketIntelligenceService';
import { TrendingUp, TrendingDown, Activity, Sparkles, Layers } from 'lucide-react';

interface NewsMarketImpactCardProps {
    title: string;
    summary?: string;
    sourceType?: string;
    sentimentHint?: string;
}

export const NewsMarketImpactCard: React.FC<NewsMarketImpactCardProps> = ({
    title,
    summary = '',
    sourceType = 'ALL',
    sentimentHint
}) => {
    const insight = useMemo(() => {
        return analyzeMarketImpact(title, summary, sourceType, sentimentHint);
    }, [title, summary, sourceType, sentimentHint]);

    return (
        <div className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 mt-2 space-y-2 select-text backdrop-blur-sm transition-all hover:border-white/10">
            {/* Top Row: Directional Badge & Asset Badges */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] font-mono">
                {/* Directional Badge */}
                <div className={`px-2.5 py-0.5 rounded-full font-black flex items-center gap-1 border ${insight.directionPillBg}`}>
                    {insight.direction === 'BULLISH' && (
                        <TrendingUp className="w-3 h-3 text-[#10B981]" />
                    )}
                    {insight.direction === 'BEARISH' && (
                        <TrendingDown className="w-3 h-3 text-[#DC2626]" />
                    )}
                    {insight.direction === 'NEUTRAL_VOLATILE' && (
                        <Activity className="w-3 h-3 text-[#F59E0B]" />
                    )}
                    <span>{insight.directionLabel}</span>
                </div>

                {/* Asset Involved Badges */}
                <div className="flex flex-wrap items-center gap-1">
                    {insight.assetsInvolved.map((asset, idx) => (
                        <span 
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-white/[0.05] text-slate-300 border border-white/[0.08]"
                        >
                            {asset}
                        </span>
                    ))}
                </div>
            </div>

            {/* Didascalia Operativa ("Cosa significa per i mercati") */}
            <div className="pt-1.5 border-t border-white/[0.05] space-y-1">
                <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span>Cosa significa per i mercati:</span>
                </div>
                <p className="text-[11px] text-slate-300 font-mono leading-relaxed">
                    {insight.operationalMeaning}
                </p>
            </div>
        </div>
    );
};
