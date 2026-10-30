// ============================================================================
// TRADYX NEWS MARKET IMPACT & CONTEXTUAL INTELLIGENCE CARD
// (src/components/NewsMarketImpactCard.tsx)
// Shows Tailored Driver & Operational Outlook with Zero Repetitive Templates
// ============================================================================

import React, { useMemo } from 'react';
import { generateArticleImpact } from '../services/marketIntelligenceService';
import { TrendingUp, TrendingDown, Activity, Sparkles, ExternalLink, ShieldCheck, ArrowRight } from 'lucide-react';

interface NewsMarketImpactCardProps {
    title: string;
    summary?: string;
    sourceType?: string;
    sentimentHint?: string;
    url?: string;
}

export const NewsMarketImpactCard: React.FC<NewsMarketImpactCardProps> = ({
    title,
    summary = '',
    sourceType = 'ALL',
    sentimentHint,
    url
}) => {
    const insight = useMemo(() => {
        return generateArticleImpact({ title, summary, sourceType, sentimentHint, url });
    }, [title, summary, sourceType, sentimentHint, url]);

    return (
        <div className="w-full bg-[#121620]/60 border border-white/[0.08] rounded-xl p-3 mt-2.5 space-y-2.5 backdrop-blur-md transition-all hover:border-white/15 shadow-sm">
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

                {/* Target Asset Badges */}
                <div className="flex flex-wrap items-center gap-1">
                    {insight.assetsInvolved.map((asset, idx) => (
                        <span 
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-white/[0.06] text-slate-200 border border-white/[0.1]"
                        >
                            {asset}
                        </span>
                    ))}
                </div>
            </div>

            {/* Contextual Intelligence: Driver & Operational Outlook */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                {/* Driver */}
                <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                        <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span>Driver di Mercato:</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans leading-relaxed pl-4">
                        {insight.driver}
                    </p>
                </div>

                {/* Outlook Operativo */}
                <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#10B981] uppercase tracking-wider">
                        <ArrowRight className="w-3 h-3 text-[#10B981] shrink-0" />
                        <span>Outlook Operativo:</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans leading-relaxed pl-4">
                        {insight.operationalOutlook}
                    </p>
                </div>
            </div>

            {/* Direct External Canonical Link */}
            {url && (
                <div className="pt-1.5 border-t border-white/[0.05] flex justify-end">
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-cyan-400 hover:text-cyan-300 transition"
                    >
                        <span>Fonte Ufficiale</span>
                        <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            )}
        </div>
    );
};
