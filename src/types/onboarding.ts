// ============================================================================
// TRADYX PRE-LOGIN & DIAGNOSTIC ONBOARDING TYPES (src/types/onboarding.ts)
// ============================================================================

export type MarketPreference =
    | 'CRYPTO'
    | 'INDICES_FUTURES'
    | 'FOREX_COMMODITIES'
    | 'STOCKS_OPTIONS';

export type CapitalType =
    | 'PERSONAL'
    | 'PROP_FIRM'
    | 'BOTH'
    | 'STARTING';

export type LossTriggerType =
    | 'REVENGE_IMMEDIATE'
    | 'OVERSIZE_RECOVERY'
    | 'EARLY_PROFIT_CUT'
    | 'DISCIPLINED';

export type MainEnemyType =
    | 'FOMO_CHASING'
    | 'MOVING_SL'
    | 'OVERTRADING'
    | 'NO_JOURNAL';

export type RuleViolationFrequency =
    | 'WEEKLY'
    | 'STRESS_DAYS'
    | 'RARE_CATASTROPHIC'
    | 'NEVER';

export type PrimaryGoalType =
    | 'PROP_FIRM_PASS'
    | 'ELIMINATE_TILT'
    | 'INSTITUTIONAL_DISCIPLINE'
    | 'AI_VOICE_JOURNAL';

export interface DiagnosticAnswers {
    market?: MarketPreference;
    capitalType?: CapitalType;
    lossTrigger?: LossTriggerType;
    mainEnemy?: MainEnemyType;
    ruleViolationFreq?: RuleViolationFrequency;
    primaryGoal?: PrimaryGoalType;
}

export type EmotionalRiskLevel = 'CRITICO' | 'ALTO' | 'MODERATO' | 'CONTROLLATO';

export interface RecommendedProtocolItem {
    id: string;
    title: string;
    description: string;
    tag: string;
    accent: 'emerald' | 'amber' | 'rose' | 'cyan';
}

export interface DerivedUserPreferences {
    propFirmShieldEnabled: boolean;
    propFirmMaxDailyLossPercent: number;
    propFirmAccountSize: number;
    ulyssesStrictMode: boolean;
    ulyssesLossThreshold: number;
    voiceJournalPriority: boolean;
    preferredMarketLabel: string;
    primaryGoalLabel: string;
}

export interface DiagnosticResult {
    riskLevel: EmotionalRiskLevel;
    riskScore: number; // 0 - 100
    riskBadgeTitle: string;
    riskSummary: string;
    archetypeLabel: string;
    system1Percent: number; // Impulsive / Amygdala weight
    system2Percent: number; // Analytical / Prefrontal weight
    recommendedProtocols: RecommendedProtocolItem[];
    derivedPreferences: DerivedUserPreferences;
    completedAt: string;
}

export interface StoredDiagnosticProfile {
    answers: Required<DiagnosticAnswers>;
    result: DiagnosticResult;
    appliedToUserId?: string;
}
