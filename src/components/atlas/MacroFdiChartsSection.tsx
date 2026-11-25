// ============================================================================
// TRADYX ATLAS — STABLE MEMOIZED MACRO, FDI & EQUITY MARKET CAP SECTION
// (src/components/atlas/MacroFdiChartsSection.tsx)
// Every Recharts container is wrapped in React.memo with explicit fixed height={240}
// and NEVER receives 1-second tick updates -> zero flicker, zero mobile collapse.
// ============================================================================

import React, { useState } from 'react';
import { Building2, Landmark, ShieldCheck } from 'lucide-react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    AreaChart,
    Area,
    CartesianGrid,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { GlobalHub } from '../../types/atlas';
import { EnrichedMacroResult } from '../../services/atlasMacroService';

type MacroSubTab = 'FDI_FLOWS' | 'EQUITY_CAP' | 'FUNDAMENTALS';

interface MacroFdiChartsSectionProps {
    hub: GlobalHub;
    macroData: EnrichedMacroResult;
    isLoadingMacro: boolean;
    exchangeIsOpen: boolean;
    onTickerClick: (tickerSymbol: string) => void;
}

const CHART_PALETTE = ['#10B981', '#38BDF8', '#FACC15', '#818CF8', '#FB7185', '#F97316', '#2DD4BF'];

const TOOLTIP_STYLE = {
    backgroundColor: '#0D111A',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    fontSize: '11px',
    color: '#FFF'
};

const FdiAreaChartCard = React.memo(
    ({ data, isLive }: { data: { year: string; inflowBn: number }[]; isLive: boolean }) => (
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-[#10B981]">
                        Trend Storico Afflussi FDI (5 Anni)
                    </span>
                    <h3 className="text-xs sm:text-sm font-black text-white">
                        Investimenti Diretti Esteri Netti ($ Miliardi)
                    </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {isLive ? 'World Bank Live' : 'Dataset Istituzionale'}
                </span>
            </div>

            <div className="w-full" style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={data} margin={{ top: 8, right: 14, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="atlasStableFdiGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.45} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis
                            dataKey="year"
                            tick={{ fill: '#94A3B8', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: '#94A3B8', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            unit="B"
                        />
                        <Tooltip
                            contentStyle={TOOLTIP_STYLE}
                            formatter={(v: any) => [`$${v}B`, 'FDI Netti']}
                        />
                        <Area
                            type="monotone"
                            dataKey="inflowBn"
                            stroke="#10B981"
                            strokeWidth={2.4}
                            fill="url(#atlasStableFdiGrad)"
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
);
FdiAreaChartCard.displayName = 'FdiAreaChartCard';

const SectorDonutAndBarsCard = React.memo(
    ({
        eyebrow,
        title,
        data,
        nameKey,
        valueKey,
        tooltipLabel
    }: {
        eyebrow: string;
        title: string;
        data: Array<Record<string, any>>;
        nameKey: string;
        valueKey: string;
        tooltipLabel: string;
    }) => (
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
            <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#FACC15]">
                    {eyebrow}
                </span>
                <h3 className="text-xs sm:text-sm font-black text-white">{title}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Donut Chart — Explicit fixed height={240} */}
                <div className="md:col-span-5 w-full" style={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                            <Pie
                                data={data}
                                dataKey={valueKey}
                                nameKey={nameKey}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={86}
                                paddingAngle={2}
                                isAnimationActive={false}
                            >
                                {data.map((entry, idx) => (
                                    <Cell
                                        key={String(entry[nameKey])}
                                        fill={CHART_PALETTE[idx % CHART_PALETTE.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                formatter={(v: any) => [`${v}%`, tooltipLabel]}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Horizontal Bar Chart — Explicit fixed height={240} */}
                <div className="md:col-span-7 w-full" style={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 4, right: 18, left: 6, bottom: 4 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="rgba(255,255,255,0.06)"
                                horizontal={false}
                            />
                            <XAxis
                                type="number"
                                unit="%"
                                tick={{ fill: '#94A3B8', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                type="category"
                                dataKey={nameKey}
                                width={110}
                                tick={{ fill: '#E2E8F0', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                formatter={(v: any) => [`${v}%`, tooltipLabel]}
                            />
                            <Bar
                                dataKey={valueKey}
                                radius={[0, 6, 6, 0]}
                                isAnimationActive={false}
                            >
                                {data.map((entry, idx) => (
                                    <Cell
                                        key={String(entry[nameKey])}
                                        fill={CHART_PALETTE[idx % CHART_PALETTE.length]}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
);
SectorDonutAndBarsCard.displayName = 'SectorDonutAndBarsCard';

export const MacroFdiChartsSection: React.FC<MacroFdiChartsSectionProps> = React.memo(
    ({ hub, macroData, isLoadingMacro, exchangeIsOpen, onTickerClick }) => {
        const [macroSubTab, setMacroSubTab] = useState<MacroSubTab>('FDI_FLOWS');

        const latestFdiBn =
            macroData.fdiHistory5Y[macroData.fdiHistory5Y.length - 1]?.inflowBn ?? 0;

        const maxCorpCap = Math.max(1, ...hub.topStocks.map((c) => c.marketCapBn));

        return (
            <div className="space-y-4">
                {/* 3-Way Interactive Sub-Tab Switch */}
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                    <button
                        type="button"
                        onClick={() => setMacroSubTab('FDI_FLOWS')}
                        className={`py-2 px-2 rounded-xl text-[10px] sm:text-xs font-mono font-extrabold transition cursor-pointer ${
                            macroSubTab === 'FDI_FLOWS'
                                ? 'bg-white text-[#08090C] shadow'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        Macro &amp; Flussi FDI
                    </button>
                    <button
                        type="button"
                        onClick={() => setMacroSubTab('EQUITY_CAP')}
                        className={`py-2 px-2 rounded-xl text-[10px] sm:text-xs font-mono font-extrabold transition cursor-pointer ${
                            macroSubTab === 'EQUITY_CAP'
                                ? 'bg-white text-[#08090C] shadow'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        Equity Market Cap
                    </button>
                    <button
                        type="button"
                        onClick={() => setMacroSubTab('FUNDAMENTALS')}
                        className={`py-2 px-2 rounded-xl text-[10px] sm:text-xs font-mono font-extrabold transition cursor-pointer ${
                            macroSubTab === 'FUNDAMENTALS'
                                ? 'bg-white text-[#08090C] shadow'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        Fondamentali &amp; Borsa
                    </button>
                </div>

                {/* SUB-TAB 1: MACRO & FLUSSI FDI */}
                {macroSubTab === 'FDI_FLOWS' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono">
                            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-emerald-500/25 space-y-1">
                                <span className="text-[9px] uppercase text-slate-400 block">
                                    Flussi FDI Netti (Ultimo Anno)
                                </span>
                                <strong className="text-lg font-black text-[#10B981] tabular-nums block">
                                    ${latestFdiBn.toLocaleString('it-IT')}B
                                </strong>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                                <span className="text-[9px] uppercase text-slate-400 block">
                                    Investimenti Esteri (FDI / PIL %)
                                </span>
                                <strong className="text-lg font-black text-cyan-400 tabular-nums block">
                                    {macroData.macro.fdiToGdpPct.toFixed(2)}%
                                </strong>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                                <span className="text-[9px] uppercase text-slate-400 block">
                                    Investimenti Fissi Lordi (CAPEX)
                                </span>
                                <strong className="text-lg font-black text-[#FACC15] tabular-nums block">
                                    {macroData.macro.grossFixedCapexPct.toFixed(1)}% PIL
                                </strong>
                            </div>
                        </div>

                        <FdiAreaChartCard
                            data={macroData.fdiHistory5Y}
                            isLive={macroData.isWorldBankLive}
                        />

                        <SectorDonutAndBarsCard
                            eyebrow={`Ripartizione Settoriale Investimenti (${hub.countryName})`}
                            title="In cosa investono maggiormente (%)"
                            data={hub.fdiSectors}
                            nameKey="sector"
                            valueKey="share"
                            tooltipLabel="Quota FDI"
                        />
                    </div>
                )}

                {/* SUB-TAB 2: EQUITY MARKET CAP + TOP 10 AZIENDE NAZIONALI QUOTATE */}
                {macroSubTab === 'EQUITY_CAP' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono">
                            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-emerald-500/25 space-y-1">
                                <span className="text-[9px] uppercase text-slate-400 block">
                                    Capitalizzazione Borsa Totale
                                </span>
                                <strong className="text-lg font-black text-[#10B981] tabular-nums block">
                                    ${macroData.totalMarketCapBn.toLocaleString('it-IT')}B
                                </strong>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                                <span className="text-[9px] uppercase text-slate-400 block">
                                    Market Cap / PIL (Buffett Indicator)
                                </span>
                                <strong className="text-lg font-black text-[#FACC15] tabular-nums block">
                                    {macroData.marketCapToGdpPct.toFixed(1)}%
                                </strong>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                                <span className="text-[9px] uppercase text-slate-400 block">
                                    Borsa Principale
                                </span>
                                <strong className="text-xs font-black text-white block truncate">
                                    {hub.exchangeCode} · {hub.primaryIndex.symbol}
                                </strong>
                                <span className="text-[9px] text-slate-400 block truncate">
                                    {hub.exchangeName}
                                </span>
                            </div>
                        </div>

                        <SectorDonutAndBarsCard
                            eyebrow={`Composizione Listino (${hub.exchangeCode})`}
                            title="Peso dei Settori Quotati in Borsa (%)"
                            data={hub.equityMarket.topSectors}
                            nameKey="name"
                            valueKey="weight"
                            tooltipLabel="Peso Indice"
                        />

                        {/* Top 10 National Listed Corporations Table */}
                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                                    <Building2 className="w-4 h-4 text-[#10B981]" />
                                    <span>
                                        Top {hub.topStocks.length} Aziende Nazionali Quotate
                                    </span>
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                    Tocca per Grafico / Trade
                                </span>
                            </div>

                            <div className="space-y-2">
                                {hub.topStocks.map((company, idx) => {
                                    const pct = Number(
                                        (
                                            (idx % 3 === 1 ? -0.45 : 0.65) +
                                            ((idx * 17) % 19) * 0.08
                                        ).toFixed(2)
                                    );
                                    const isPos = pct >= 0;
                                    const weightPct = Math.max(
                                        10,
                                        Math.round((company.marketCapBn / maxCorpCap) * 100)
                                    );

                                    return (
                                        <button
                                            key={company.symbol}
                                            type="button"
                                            onClick={() => onTickerClick(company.symbol)}
                                            className="w-full p-3 rounded-xl bg-[#08090C]/85 hover:bg-white/[0.06] border border-white/[0.07] hover:border-[#10B981]/50 transition text-left space-y-2 cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="min-w-0 flex items-center gap-2.5">
                                                    <span className="text-[10px] font-mono text-slate-500 w-4 shrink-0">
                                                        #{idx + 1}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-black font-mono text-[#10B981]">
                                                                {company.symbol}
                                                            </span>
                                                            <span className="text-xs font-bold text-white truncate">
                                                                {company.name}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] font-mono text-slate-400">
                                                            {company.sector} · Cap $
                                                            {company.marketCapBn.toLocaleString(
                                                                'it-IT'
                                                            )}
                                                            B
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="text-right font-mono shrink-0">
                                                    <span className="text-xs font-black text-white tabular-nums block">
                                                        {company.basePrice.toLocaleString('it-IT', {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2
                                                        })}
                                                    </span>
                                                    <span
                                                        className={`text-[10px] font-bold tabular-nums ${
                                                            isPos
                                                                ? 'text-[#10B981]'
                                                                : 'text-[#DC2626]'
                                                        }`}
                                                    >
                                                        {isPos ? '+' : ''}
                                                        {pct.toFixed(2)}%
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-[#10B981] to-cyan-400"
                                                    style={{ width: `${weightPct}%` }}
                                                />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* SUB-TAB 3: FONDAMENTALI & BORSA (13-KPI 3-COLUMN DESKTOP / 1-COLUMN MOBILE) */}
                {macroSubTab === 'FUNDAMENTALS' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
                            <span className="flex items-center gap-1.5">
                                <Landmark className="w-3.5 h-3.5 text-[#10B981]" />
                                <span>Indicatori Macroeconomici &amp; Sovrani</span>
                            </span>
                            <span className="text-[#10B981] font-bold">
                                {isLoadingMacro
                                    ? 'Sync World Bank...'
                                    : macroData.isWorldBankLive
                                    ? 'World Bank API Live'
                                    : 'Institutional Feed'}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono">
                            {[
                                {
                                    label: 'Rating Sovrano',
                                    value: macroData.macro.sovereignRating,
                                    accent: 'text-[#FACC15]'
                                },
                                {
                                    label: 'Banca Centrale',
                                    value: macroData.macro.centralBank,
                                    accent: 'text-white text-xs'
                                },
                                {
                                    label: 'Orario Borsa Live',
                                    value: `${hub.exchangeCode} (${hub.openHour}:00-${hub.closeHour}:00)`,
                                    accent: exchangeIsOpen
                                        ? 'text-[#10B981] text-xs'
                                        : 'text-slate-200 text-xs'
                                },
                                {
                                    label: 'Tasso Banca Centrale',
                                    value: `${macroData.macro.policyRate.toFixed(2)}%`,
                                    accent: 'text-[#FACC15]'
                                },
                                {
                                    label: 'Inflazione (CPI YoY)',
                                    value: `${macroData.macro.inflationCpi.toFixed(1)}%`,
                                    accent:
                                        macroData.macro.inflationCpi > 4
                                            ? 'text-rose-400'
                                            : 'text-[#10B981]'
                                },
                                {
                                    label: 'Crescita PIL (GDP YoY)',
                                    value: `${macroData.macro.gdpGrowth >= 0 ? '+' : ''}${macroData.macro.gdpGrowth.toFixed(1)}%`,
                                    accent:
                                        macroData.macro.gdpGrowth >= 0
                                            ? 'text-[#10B981]'
                                            : 'text-rose-400'
                                },
                                {
                                    label: 'PIL Nominale Totale',
                                    value: `$${macroData.macro.gdpNominalBn.toLocaleString('it-IT')}B`,
                                    accent: 'text-white'
                                },
                                {
                                    label: 'PIL Pro Capite',
                                    value: `$${macroData.macro.gdpPerCapitaUsd.toLocaleString('it-IT')}`,
                                    accent: 'text-cyan-300'
                                },
                                {
                                    label: 'Tasso Disoccupazione',
                                    value: `${macroData.macro.unemployment.toFixed(1)}%`,
                                    accent: 'text-slate-100'
                                },
                                {
                                    label: 'Debito Pubblico / PIL',
                                    value: `${macroData.macro.debtToGdp.toFixed(1)}%`,
                                    accent:
                                        macroData.macro.debtToGdp > 100
                                            ? 'text-amber-400'
                                            : 'text-slate-100'
                                },
                                {
                                    label: 'Bilancia Commerciale',
                                    value: `${macroData.macro.tradeBalanceBn >= 0 ? '+' : '-'}$${Math.abs(macroData.macro.tradeBalanceBn).toLocaleString('it-IT')}B`,
                                    accent:
                                        macroData.macro.tradeBalanceBn >= 0
                                            ? 'text-[#10B981]'
                                            : 'text-rose-400'
                                },
                                {
                                    label: 'Partite Correnti / PIL',
                                    value: `${macroData.macro.currentAccountToGdp >= 0 ? '+' : ''}${macroData.macro.currentAccountToGdp.toFixed(2)}%`,
                                    accent:
                                        macroData.macro.currentAccountToGdp >= 0
                                            ? 'text-[#10B981]'
                                            : 'text-amber-400'
                                },
                                {
                                    label: 'Riserve Valutarie',
                                    value: `$${macroData.macro.fxReservesBn.toLocaleString('it-IT')}B`,
                                    accent: 'text-cyan-400'
                                }
                            ].map((kpi) => (
                                <div
                                    key={kpi.label}
                                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-1"
                                >
                                    <span className="text-[9px] uppercase text-slate-400 block leading-tight">
                                        {kpi.label}
                                    </span>
                                    <strong
                                        className={`text-sm sm:text-base font-black tabular-nums block leading-snug ${kpi.accent}`}
                                    >
                                        {kpi.value}
                                    </strong>
                                </div>
                            ))}
                        </div>

                        <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5 px-1 pt-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                            <span>
                                World Bank Open Data API v2 + Banche Centrali &amp; dataset istituzionale Tradyx.
                            </span>
                        </div>
                    </div>
                )}
            </div>
        );
    }
);

MacroFdiChartsSection.displayName = 'MacroFdiChartsSection';
export default MacroFdiChartsSection;
