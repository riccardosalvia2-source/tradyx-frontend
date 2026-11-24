// ============================================================================
// TRADYX NEURO-BEHAVIORAL DIAGNOSTIC ENGINE
// (src/services/onboardingDiagnosticService.ts)
// Calculates personalized emotional risk profile & auto-configured protocols
// ============================================================================

import {
    DiagnosticAnswers,
    DiagnosticResult,
    EmotionalRiskLevel,
    RecommendedProtocolItem,
    StoredDiagnosticProfile,
    MarketPreference,
    PrimaryGoalType
} from '../types/onboarding';

export const DIAGNOSTIC_STORAGE_KEY = 'tradyx_diagnostic_onboarding_v1';

const MARKET_LABELS: Record<MarketPreference, string> = {
    CRYPTO: 'Crypto & Altcoins',
    INDICES_FUTURES: 'Indici & Futures (NQ, ES)',
    FOREX_COMMODITIES: 'Forex & Commodities',
    STOCKS_OPTIONS: 'Azioni & Opzioni'
};

const GOAL_LABELS: Record<PrimaryGoalType, string> = {
    PROP_FIRM_PASS: 'Superare o mantenere un conto Prop Firm',
    ELIMINATE_TILT: 'Eliminare le giornate di tilt e perdita incontrollata',
    INSTITUTIONAL_DISCIPLINE: 'Costruire costanza e disciplina istituzionale',
    AI_VOICE_JOURNAL: 'Tracciare i trade con AI e voce senza perdere tempo'
};

/**
 * Evaluates the 6-step diagnostic quiz using neuro-behavioral heuristics
 * (System 1 vs System 2 balance, Hot-Cold Empathy Gap, Tail-Risk Breaches).
 */
export function evaluateDiagnosticProfile(
    answers: Required<DiagnosticAnswers>
): DiagnosticResult {
    // 1. Score emotional vulnerability from Questions 3, 4, and 5
    let score = 15; // baseline human cognitive friction

    // Question 3: Immediate post-loss mental response (Hot-Cold Empathy Gap)
    switch (answers.lossTrigger) {
        case 'OVERSIZE_RECOVERY':
            score += 36;
            break;
        case 'REVENGE_IMMEDIATE':
            score += 32;
            break;
        case 'EARLY_PROFIT_CUT':
            score += 20;
            break;
        case 'DISCIPLINED':
            score += 4;
            break;
    }

    // Question 4: Primary obstacle over last 90 days
    switch (answers.mainEnemy) {
        case 'MOVING_SL':
            score += 26;
            break;
        case 'OVERTRADING':
            score += 22;
            break;
        case 'FOMO_CHASING':
            score += 18;
            break;
        case 'NO_JOURNAL':
            score += 10;
            break;
    }

    // Question 5: Frequency of trading rule violations
    switch (answers.ruleViolationFreq) {
        case 'WEEKLY':
            score += 24;
            break;
        case 'RARE_CATASTROPHIC':
            score += 21;
            break;
        case 'STRESS_DAYS':
            score += 14;
            break;
        case 'NEVER':
            score += 0;
            break;
    }

    const riskScore = Math.max(12, Math.min(96, score));

    // 2. Determine risk level & dynamic badge title
    let riskLevel: EmotionalRiskLevel;
    let riskBadgeTitle: string;
    let archetypeLabel: string;
    let riskSummary: string;

    if (riskScore >= 76) {
        riskLevel = 'CRITICO';
        if (answers.lossTrigger === 'OVERSIZE_RECOVERY' || answers.mainEnemy === 'MOVING_SL') {
            riskBadgeTitle = 'Critico — Rischio Tilt Esplosivo & Oversizing';
            archetypeLabel = 'Sequestro Amigdalico ad Alto Impatto';
            riskSummary =
                'Dopo una perdita il Sistema 1 prende il controllo con impulsi di recupero rapido e alterazione del rischio. Serve una barriera fisica pre-esecuzione prima che un singolo episodio bruci il capitale.';
        } else {
            riskBadgeTitle = 'Critico — Elevata Vulnerabilità a Revenge Trading';
            archetypeLabel = 'Loop Dopaminergico di Recupero';
            riskSummary =
                'Il divario empatico caldo-freddo ti porta a forzare ingressi fuori piano sotto stress. Tradyx interverrà con frizione cognitiva attiva per spezzare la sequenza impulsiva.';
        }
    } else if (riskScore >= 54) {
        riskLevel = 'ALTO';
        if (answers.lossTrigger === 'REVENGE_IMMEDIATE' || answers.mainEnemy === 'OVERTRADING') {
            riskBadgeTitle = 'Alto — Vulnerabilità a Revenge Trading & Impulsività';
            archetypeLabel = 'Reattività Emotiva Post-Loss';
            riskSummary =
                'La tua operatività perde efficienza nelle fasi di drawdown o stress. L\'attivazione del Protocollo Ulysses bloccherà l\'overtrading prima che intacchi l\'equity mensile.';
        } else if (answers.mainEnemy === 'FOMO_CHASING') {
            riskBadgeTitle = 'Alto — Bias FOMO & Rottura delle Regole';
            archetypeLabel = 'Inseguimento Impulsivo della Volatilità';
            riskSummary =
                'La paura di restare fuori dai movimenti ti porta a entrare su candele estese con R:R sfavorevole. Tradyx calibrerà check razionali pre-ingresso.';
        } else {
            riskBadgeTitle = 'Alto — Rischio Tail-Loss & Violazione Stop';
            archetypeLabel = 'Erosione Asimmetrica del Capitale';
            riskSummary =
                'Anche poche infrazioni concentrate nelle giornate difficili possono cancellare settimane di profitti. La protezione automatica limiterà il danno sul nascere.';
        }
    } else if (riskScore >= 34) {
        riskLevel = 'MODERATO';
        if (answers.lossTrigger === 'EARLY_PROFIT_CUT') {
            riskBadgeTitle = 'Moderato — Rischio Loss Aversion & Chiusura Anticipata';
            archetypeLabel = 'Avversione alla Perdita Asimmetrica';
            riskSummary =
                'Mantieni un buon controllo di base, ma l\'ansia di restituire i guadagni ti spinge a tagliare i winner troppo presto. L\'AI Coach misurerà il tuo Costo delle Emozioni reale.';
        } else {
            riskBadgeTitle = 'Moderato — Frizione di Disciplina sotto Stress';
            archetypeLabel = 'Operatore Strutturato con Picchi Emotivi';
            riskSummary =
                'Hai già fondamenta solide, ma nei momenti di alta pressione emergono micro-deviazioni dal piano. Tradyx consoliderà la tua costanza con telemetria comportamentale.';
        }
    } else {
        riskLevel = 'CONTROLLATO';
        riskBadgeTitle = 'Controllato — Profilo Disciplinato ad Alto Potenziale';
        archetypeLabel = 'Esecuzione Analitica (Sistema 2 Dominante)';
        riskSummary =
            'Mostri un eccellente controllo della corteccia prefrontale. Tradyx lavorerà come esoscheletro quantitativo per tracciare edge, expectancy e proteggere i tuoi standard istituzionali.';
    }

    // 3. System 1 vs System 2 balance
    const system1Percent = Math.max(18, Math.min(86, Math.round(riskScore * 0.88)));
    const system2Percent = 100 - system1Percent;

    // 4. Tailored Tradyx Protocol Interventions
    const isPropFirmFocus =
        answers.capitalType === 'PROP_FIRM' ||
        answers.capitalType === 'BOTH' ||
        answers.primaryGoal === 'PROP_FIRM_PASS';

    const ulyssesThreshold = riskScore >= 72 ? 1 : 2;
    const voicePriority =
        answers.mainEnemy === 'NO_JOURNAL' || answers.primaryGoal === 'AI_VOICE_JOURNAL';

    const recommendedProtocols: RecommendedProtocolItem[] = [];

    // Protocol 1: Ulysses Active Friction (always tailored)
    recommendedProtocols.push({
        id: 'ulysses',
        title:
            riskScore >= 72
                ? 'Frizione Attiva Ulysses Immediata (Soglia Alta)'
                : `Attivazione Frizione Attiva Ulysses dopo ${ulyssesThreshold} perdite`,
        description:
            answers.lossTrigger === 'OVERSIZE_RECOVERY'
                ? 'Blocca gli aumenti impulsivi di size e attiva la Triade di Sblocco Razionale (Sistema 2) per 20 min di decadimento del cortisolo.'
                : answers.lossTrigger === 'EARLY_PROFIT_CUT'
                ? 'Check comportamentale mirato contro la Loss Aversion per proteggere il tuo Risk/Reward medio sui trade in profitto.'
                : 'Intercetta il revenge trading in tempo reale e richiede verifica razionale prima di riaprire nuove posizioni.',
        tag: riskScore >= 72 ? 'STRICT MODE' : 'ULYSSES OS',
        accent: riskScore >= 54 ? 'rose' : 'emerald'
    });

    // Protocol 2: Prop Firm Shield OR Risk Guardrail
    if (isPropFirmFocus) {
        recommendedProtocols.push({
            id: 'prop-shield',
            title: 'Monitoraggio Drawdown Prop Firm 5% (Alert al 4%)',
            description:
                'Prop Firm Shield pre-attivato per proteggere challenge e conti funded (FTMO, Apex, FundedNext) con avviso preventivo prima della squalifica.',
            tag: 'AUTO-ATTIVO',
            accent: 'amber'
        });
    } else if (answers.mainEnemy === 'MOVING_SL' || answers.mainEnemy === 'OVERTRADING') {
        recommendedProtocols.push({
            id: 'risk-guardrail',
            title:
                answers.mainEnemy === 'MOVING_SL'
                    ? 'Guardrail Stop Loss & Protezione Capitale'
                    : 'Circuit Breaker Anti-Overtrading Giornaliero',
            description:
                answers.mainEnemy === 'MOVING_SL'
                    ? 'Tracciamento rigoroso del rischio massimo per singolo trade e alert sul Costo delle Emozioni quando devii dallo stop pianificato.'
                    : 'Limita la fatica decisionale rilevando sequenze di trade ravvicinati e suggerendo pausa strategica di decompressione.',
            tag: 'RISK GUARD',
            accent: 'amber'
        });
    } else {
        recommendedProtocols.push({
            id: 'market-telemetry',
            title: `Telemetria & Quasar Sentiment su ${MARKET_LABELS[answers.market]}`,
            description:
                'Sincronizzazione del tuo profilo di volatilità con il feed sentiment Quasar e matrice di Expectancy sul tuo mercato primario.',
            tag: 'CALIBRATO',
            accent: 'cyan'
        });
    }

    // Protocol 3: Voice-to-Trade AI or Behavioral Analytics
    if (voicePriority) {
        recommendedProtocols.push({
            id: 'voice-ai',
            title: 'Voice-to-Trade AI per eliminare il carico post-sessione',
            description:
                'Registra i trade parlando in 10 secondi o caricando uno screenshot: l\'AI estrae PnL, asset e bias emotivi automaticamente.',
            tag: 'ZERO FRICTION',
            accent: 'emerald'
        });
    } else {
        recommendedProtocols.push({
            id: 'ai-coach',
            title: 'AI Neuro-Coach & Analisi Costo delle Emozioni',
            description:
                `Quantifica in €/$ quanto ti costano FOMO, tilt e deviazioni sulle sessioni di ${MARKET_LABELS[answers.market]} per raggiungere il tuo obiettivo a 90 giorni.`,
            tag: 'AI ENGINE',
            accent: 'cyan'
        });
    }

    return {
        riskLevel,
        riskScore,
        riskBadgeTitle,
        riskSummary,
        archetypeLabel,
        system1Percent,
        system2Percent,
        recommendedProtocols,
        derivedPreferences: {
            propFirmShieldEnabled: isPropFirmFocus,
            propFirmMaxDailyLossPercent: riskScore >= 72 ? 3.5 : 4.0,
            propFirmAccountSize: 100000,
            ulyssesStrictMode: riskScore >= 54,
            ulyssesLossThreshold: ulyssesThreshold,
            voiceJournalPriority: voicePriority,
            preferredMarketLabel: MARKET_LABELS[answers.market],
            primaryGoalLabel: GOAL_LABELS[answers.primaryGoal]
        },
        completedAt: new Date().toISOString()
    };
}

export function saveDiagnosticProfile(
    answers: Required<DiagnosticAnswers>,
    result: DiagnosticResult,
    appliedToUserId?: string
): StoredDiagnosticProfile {
    const payload: StoredDiagnosticProfile = {
        answers,
        result,
        appliedToUserId
    };
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(DIAGNOSTIC_STORAGE_KEY, JSON.stringify(payload));
        } catch (err) {
            console.warn('[Tradyx Onboarding] Unable to persist diagnostic profile:', err);
        }
    }
    return payload;
}

export function loadDiagnosticProfile(): StoredDiagnosticProfile | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(DIAGNOSTIC_STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as StoredDiagnosticProfile;
    } catch (err) {
        console.warn('[Tradyx Onboarding] Unable to read diagnostic profile:', err);
        return null;
    }
}
