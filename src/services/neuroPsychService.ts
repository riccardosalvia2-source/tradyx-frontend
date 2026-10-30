// ============================================================================
// TRADYX NEURO-BEHAVIORAL PSYCHOLOGY & CORTISOL KINETICS SERVICE
// (src/services/neuroPsychService.ts)
// Clinical Framework: Cortisol Clearing Window, Disposition Effect & Delay Discounting
// ============================================================================

import { Trade } from '../types/trade';

const CORTISOL_STORAGE_KEY = 'tradyx_cortisol_window_timestamp';
const CORTISOL_DURATION_MS = 25 * 60 * 1000; // 25 minutes clinical half-life clearance

export interface CortisolStatus {
    isClearingActive: boolean;
    remainingMinutes: number;
    remainingSeconds: number;
    elapsedSeconds: number;
    percentCleared: number; // 0 to 100
    headline: string;
    clinicalNote: string;
}

export interface DispositionEffectAnalysis {
    detected: boolean;
    avgWin: number;
    avgLoss: number;
    winToLossRatio: number;
    earlyExitCount: number;
    headline: string;
    clinicalAssessment: string;
    remediationProtocol: string;
}

export interface DelayDiscountingAnalysis {
    detected: boolean;
    doubledSizeCount: number;
    maxPostLossMultiplier: number;
    headline: string;
    clinicalAssessment: string;
    remediationProtocol: string;
}

/**
 * Calculates current Cortisol Clearing Window kinetics based on user drawdowns.
 */
export function getCortisolClearingStatus(trades: Trade[]): CortisolStatus {
    const totalPnl = trades.reduce((acc, t) => acc + (Number(t?.pnl) || 0), 0);
    const p1 = Number(trades[0]?.pnl) || 0;
    const p2 = Number(trades[1]?.pnl) || 0;
    const isConsecutiveLoss = trades.length >= 2 && p1 < 0 && p2 < 0;
    const isHeavyDrawdown = totalPnl < -200 || p1 < -150 || isConsecutiveLoss;

    let targetTime = 0;
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(CORTISOL_STORAGE_KEY);
        if (stored) {
            targetTime = Number(stored);
        } else if (isHeavyDrawdown) {
            targetTime = Date.now() + CORTISOL_DURATION_MS;
            localStorage.setItem(CORTISOL_STORAGE_KEY, targetTime.toString());
        }
    }

    const now = Date.now();
    const remainingMs = Math.max(0, targetTime - now);
    const isClearingActive = remainingMs > 0 && isHeavyDrawdown;

    const remainingSeconds = Math.ceil(remainingMs / 1000);
    const remainingMinutes = Math.ceil(remainingSeconds / 60);
    const elapsedSeconds = Math.max(0, Math.floor((CORTISOL_DURATION_MS - remainingMs) / 1000));
    const percentCleared = Math.min(100, Math.max(0, Math.round(((CORTISOL_DURATION_MS - remainingMs) / CORTISOL_DURATION_MS) * 100)));

    return {
        isClearingActive,
        remainingMinutes: isClearingActive ? remainingMinutes : 0,
        remainingSeconds: isClearingActive ? remainingSeconds % 60 : 0,
        elapsedSeconds,
        percentCleared: isClearingActive ? percentCleared : 100,
        headline: 'Cortisol Clearing Window: ~25 min',
        clinicalNote: isClearingActive
            ? 'Picco ormonale acuto rilevato dopo il drawdown. Il cortisolo plasmatico e le catecolamine richiedono circa 25 minuti per il decadimento metabolico: le funzioni esecutive della corteccia prefrontale (PFC) sono temporaneamente compromesse.'
            : 'Livelli ormonali di cortisolo nella norma. Stato neurovegetativo ottimale per l\'esecuzione a piano.'
    };
}

/**
 * Detects Loss Aversion / Disposition Effect:
 * Tendency to cut winning trades prematurely out of fear of losing gains,
 * while holding losing trades irrationally hoping to erase damage.
 */
export function analyzeDispositionEffect(trades: Trade[]): DispositionEffectAnalysis {
    if (!trades || trades.length === 0) {
        return {
            detected: false,
            avgWin: 0,
            avgLoss: 0,
            winToLossRatio: 1,
            earlyExitCount: 0,
            headline: 'Disposition Effect: Nella Norma',
            clinicalAssessment: 'Nessun pattern di chiusura asimmetrica rilevato nel campione attuale.',
            remediationProtocol: 'Mantieni target prestabiliti e trailing stop algoritmici.'
        };
    }

    const winTrades = trades.filter(t => (Number(t.pnl) || 0) > 0);
    const lossTrades = trades.filter(t => (Number(t.pnl) || 0) < 0);

    const totalWin = winTrades.reduce((acc, t) => acc + Number(t.pnl), 0);
    const totalLoss = Math.abs(lossTrades.reduce((acc, t) => acc + Number(t.pnl), 0));

    const avgWin = winTrades.length > 0 ? Number((totalWin / winTrades.length).toFixed(2)) : 0;
    const avgLoss = lossTrades.length > 0 ? Number((totalLoss / lossTrades.length).toFixed(2)) : 0;

    const earlyExitCount = trades.filter(t => 
        t.errors?.some(e => e.toUpperCase().includes('EARLY EXIT'))
    ).length;

    // Asymmetry check: if average loss is significantly higher than average win OR high early exit tags
    const ratio = avgLoss > 0 ? Number((avgWin / avgLoss).toFixed(2)) : (avgWin > 0 ? 2.5 : 1);
    const isDispositionDetected = (avgLoss > avgWin * 1.3 && winTrades.length >= 2) || earlyExitCount >= 1;

    return {
        detected: isDispositionDetected,
        avgWin,
        avgLoss,
        winToLossRatio: ratio,
        earlyExitCount,
        headline: isDispositionDetected 
            ? 'Loss Aversion / Disposition Effect Rilevato' 
            : 'Loss Aversion Bilanciata (RR Sano)',
        clinicalAssessment: isDispositionDetected
            ? `Tagli i trade in profitto troppo presto (guadagno medio $${avgWin.toLocaleString()}) per la paura compulsiva di vedere svanire il guadagno, mentre lasci correre le perdite (perdita media $${avgLoss.toLocaleString()}) sperando irrazionalmente che il prezzo torni a pareggio.`
            : `Rapporto Win/Loss ($${avgWin} vs $${avgLoss}) sotto controllo fisiologico. Non si rilevano asimmetrie patologiche di chiusura anticipata.`,
        remediationProtocol: isDispositionDetected
            ? 'Imposta Take Profit fisso 1:2.5 prima del click ed elimina il monitoraggio tick-by-tick. Applica il divieto clinico di spostamento dello Stop Loss.'
            : 'Prosegui con il rigore attuale e documenta il motivo di ogni uscita manuale nel diario.'
    };
}

/**
 * Detects Delay Discounting (Revenge Sizing):
 * Compulsive devaluation of future capital risk for immediate emotional relief,
 * manifested by doubled position sizing on trades opened right after a loss.
 */
export function analyzeDelayDiscounting(trades: Trade[]): DelayDiscountingAnalysis {
    if (!trades || trades.length < 2) {
        return {
            detected: false,
            doubledSizeCount: 0,
            maxPostLossMultiplier: 1,
            headline: 'Delay Discounting: Nessuna Anomalia',
            clinicalAssessment: 'Dati storici insufficienti o dimensionamento coerente.',
            remediationProtocol: 'Mantieni il dimensionamento a percentuale fissa del conto (max 1-2%).'
        };
    }

    let doubledSizeCount = 0;
    let maxMultiplier = 1;

    // Scan consecutive pairs
    for (let i = 0; i < trades.length - 1; i++) {
        const currentTrade = trades[i];     // Opened more recently
        const previousTrade = trades[i + 1]; // Previous trade

        const prevPnl = Number(previousTrade.pnl) || 0;
        const prevSize = Number(previousTrade.position_size) || 1.0;
        const currentSize = Number(currentTrade.position_size) || 1.0;

        // If previous trade was a loss and current size is >= 1.6x previous size
        if (prevPnl < 0 && prevSize > 0) {
            const multiplier = currentSize / prevSize;
            if (multiplier >= 1.6) {
                doubledSizeCount++;
                if (multiplier > maxMultiplier) maxMultiplier = Number(multiplier.toFixed(1));
            }
        }

        // Also check if current trade has REVENGE tag
        if (currentTrade.errors?.some(e => e.toUpperCase().includes('REVENGE'))) {
            doubledSizeCount++;
            if (maxMultiplier < 2) maxMultiplier = 2;
        }
    }

    const detected = doubledSizeCount > 0;

    return {
        detected,
        doubledSizeCount,
        maxPostLossMultiplier: maxMultiplier,
        headline: detected 
            ? 'Delay Discounting Rilevato (Revenge Sizing)' 
            : 'Delay Discounting Assente (Size Costante)',
        clinicalAssessment: detected
            ? `Rilevato raddoppio della size (fino a ${maxMultiplier}x) su operazioni aperte subito dopo una perdita. Questa condotta riflette la svalutazione temporale del rischio per ricercare sollievo psicologico istantaneo (dopamina) a discapito della longevità del capitale.`
            : 'Dimensionamento delle posizioni stabile e costante, senza picchi compulsivi di leva dopo le perdite.',
        remediationProtocol: detected
            ? 'Blocco algoritmico della size: non superare mai l\'1% del capitale dopo una sessione negativa. Attiva l\'Ulysses Contract obbligatorio.'
            : 'Conserva il position sizing fisso standard per tutti i setup.'
    };
}
