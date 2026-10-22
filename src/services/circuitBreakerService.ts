// ============================================================================
// TRADYX BIOMETRIC CIRCUIT BREAKER & TILT DETECTOR SERVICE
// (src/services/circuitBreakerService.ts)
// ============================================================================

import { Trade } from '../types/trade';

const COOLDOWN_KEY = 'tradyx_circuit_breaker_until';
const OVERRIDE_KEY = 'tradyx_circuit_breaker_override';

export interface CircuitBreakerStatus {
    isTilt: boolean;
    isBlocked: boolean;
    remainingSeconds: number;
    reason: string | null;
}

/**
 * Detects if the trader is in an emotional "Tilt" state:
 * - 2 consecutive losing trades (pnl < 0)
 * - OR last trade has 'REVENGE TRADING' or 'FOMO' error tags
 * - OR last trade emotion was FOMO/Frustrated
 */
export function isTiltDetected(trades: Trade[]): { isTilt: boolean; reason: string | null } {
    if (!trades || trades.length === 0) return { isTilt: false, reason: null };

    const newest = trades[0];
    const second = trades[1];

    // 1. Check for Revenge Trading or FOMO error tags
    if (newest?.errors && Array.isArray(newest.errors)) {
        const hasRevenge = newest.errors.some(e => e.toUpperCase().includes('REVENGE'));
        const hasFomo = newest.errors.some(e => e.toUpperCase().includes('FOMO'));
        if (hasRevenge) {
            return { 
                isTilt: true, 
                reason: 'Rilevato tag REVENGE TRADING nell\'ultima operazione. Il circuito blocca ulteriori ordini impulsivi.' 
            };
        }
        if (hasFomo) {
            return { 
                isTilt: true, 
                reason: 'Rilevato bias FOMO nell\'ultima operazione. Stop di raffreddamento emotivo consigliato.' 
            };
        }
    }

    // 2. Check for 2 consecutive losing trades
    if (newest && second) {
        const pnl1 = Number(newest.pnl) || 0;
        const pnl2 = Number(second.pnl) || 0;
        if (pnl1 < 0 && pnl2 < 0) {
            return { 
                isTilt: true, 
                reason: `2 perdite consecutive rilevate (${pnl1 < 0 ? '-' : ''}$${Math.abs(pnl1)} e ${pnl2 < 0 ? '-' : ''}$${Math.abs(pnl2)}). Circuit Breaker attivato per preservare il capitale.` 
            };
        }
    }

    return { isTilt: false, reason: null };
}

/**
 * Gets the current circuit breaker status with remaining countdown seconds.
 */
export function getCircuitBreakerStatus(trades: Trade[]): CircuitBreakerStatus {
    const tiltCheck = isTiltDetected(trades);

    if (typeof window === 'undefined') {
        return { isTilt: tiltCheck.isTilt, isBlocked: false, remainingSeconds: 0, reason: tiltCheck.reason };
    }

    try {
        const rawUntil = localStorage.getItem(COOLDOWN_KEY);
        const overrideTimestamp = localStorage.getItem(OVERRIDE_KEY);

        // If override was activated within the last 15 minutes for the current trade, allow override
        if (overrideTimestamp && Date.now() - Number(overrideTimestamp) < 15 * 60 * 1000) {
            return {
                isTilt: tiltCheck.isTilt,
                isBlocked: false,
                remainingSeconds: 0,
                reason: tiltCheck.reason ? `${tiltCheck.reason} (Sblocco consapevole applicato)` : null
            };
        }

        if (rawUntil) {
            const untilTime = Number(rawUntil);
            const remaining = Math.max(0, Math.ceil((untilTime - Date.now()) / 1000));
            if (remaining > 0) {
                return {
                    isTilt: true,
                    isBlocked: true,
                    remainingSeconds: remaining,
                    reason: tiltCheck.reason || 'Circuit Breaker in cooldown (15 minuti di pausa strategica).'
                };
            } else {
                localStorage.removeItem(COOLDOWN_KEY);
            }
        }

        // If tilt is detected and no cooldown was running, activate 15-min cooldown
        if (tiltCheck.isTilt) {
            const fifteenMinutesLater = Date.now() + 15 * 60 * 1000;
            localStorage.setItem(COOLDOWN_KEY, fifteenMinutesLater.toString());
            return {
                isTilt: true,
                isBlocked: true,
                remainingSeconds: 15 * 60,
                reason: tiltCheck.reason
            };
        }
    } catch (e) {
        console.warn('Circuit breaker storage warning:', e);
    }

    return {
        isTilt: false,
        isBlocked: false,
        remainingSeconds: 0,
        reason: null
    };
}

/**
 * Trader conscious override: unlock the terminal with awareness
 */
export function overrideCircuitBreaker(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(COOLDOWN_KEY);
        localStorage.setItem(OVERRIDE_KEY, Date.now().toString());
    }
    triggerHaptic('calm');
}

/**
 * Dynamic Haptic Feedback for iOS Safari / PWA & modern mobile browsers:
 * - 'tilt': fast repeated pulse like racing heartbeat [100, 50, 100, 50, 100]
 * - 'calm': gentle single tap [40]
 * - 'click': minimal touch [15]
 */
export function triggerHaptic(type: 'tilt' | 'calm' | 'click' = 'calm'): void {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
            if (type === 'tilt') {
                navigator.vibrate([100, 50, 100, 50, 100]);
            } else if (type === 'calm') {
                navigator.vibrate([40]);
            } else {
                navigator.vibrate([15]);
            }
        } catch {
            // Silently ignore if unsupported or permission blocked
        }
    }
}
