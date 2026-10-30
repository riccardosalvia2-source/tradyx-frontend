// ============================================================================
// TRADYX PRICE ALERT & REAL-TIME NOTIFICATION ENGINE
// (src/services/priceAlertService.ts)
// Browser Notification API, Web Audio Synthesizer, Haptic Vibration & Storage
// ============================================================================

export interface PriceAlert {
    id: string;
    symbol: string;             // e.g. "BTC", "SOL", "SPX", "XAU"
    targetPrice: number;
    condition: 'ABOVE' | 'BELOW'; // >= or <=
    note?: string;
    createdAt: string;
    triggeredAt?: string;
    isActive: boolean;
    isTriggered: boolean;
    linkedTradeId?: string;
}

const STORAGE_KEY = 'tradyx_price_alerts_v2';

/**
 * Retrieve all price alerts from local storage
 */
export function getStoredAlerts(): PriceAlert[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/**
 * Save alerts to local storage
 */
export function saveAlerts(alerts: PriceAlert[]): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
    } catch {
        // quota ignore
    }
}

/**
 * Synthesize a clean, luxury fintech bell/chime using Web Audio API
 */
export function playAlertChime(): void {
    if (typeof window === 'undefined') return;
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        const ctx = new AudioContextClass();
        const now = ctx.currentTime;

        // Primary tone: D5 -> A5 -> D6
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        osc1.frequency.exponentialRampToValueAtTime(880.00, now + 0.12); // A5

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(880.00, now + 0.12);
        osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.32); // D6

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now + 0.08);
        osc1.stop(now + 0.55);
        osc2.stop(now + 0.55);
    } catch (e) {
        // Audio autoplay policy handled silently
    }
}

/**
 * Request Browser Notification Permissions cleanly
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
        try {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        } catch {
            return false;
        }
    }
    return false;
}

/**
 * Trigger physical haptics on supported mobile devices
 */
export function triggerAlertHaptic(): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
            navigator.vibrate([200, 100, 200]);
        } catch {
            // ignore
        }
    }
}

/**
 * Create a new Price Alert
 */
export function createPriceAlert(data: {
    symbol: string;
    targetPrice: number;
    condition: 'ABOVE' | 'BELOW';
    note?: string;
    linkedTradeId?: string;
}): PriceAlert {
    const alerts = getStoredAlerts();
    const cleanSymbol = data.symbol.replace('/USD', '').replace('USDT', '').toUpperCase();

    const newAlert: PriceAlert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        symbol: cleanSymbol,
        targetPrice: Number(data.targetPrice),
        condition: data.condition,
        note: data.note?.trim() || '',
        createdAt: new Date().toISOString(),
        isActive: true,
        isTriggered: false,
        linkedTradeId: data.linkedTradeId
    };

    alerts.unshift(newAlert);
    saveAlerts(alerts);
    return newAlert;
}

/**
 * Delete a price alert
 */
export function deletePriceAlert(alertId: string): void {
    const alerts = getStoredAlerts().filter(a => a.id !== alertId);
    saveAlerts(alerts);
}

/**
 * Toggle active state of a price alert
 */
export function togglePriceAlert(alertId: string): PriceAlert[] {
    const alerts = getStoredAlerts().map(a => {
        if (a.id === alertId) {
            return { ...a, isActive: !a.isActive };
        }
        return a;
    });
    saveAlerts(alerts);
    return alerts;
}

/**
 * Evaluate price stream against active alerts.
 * Returns triggered alerts and fires browser notification, haptic, and audio chime.
 */
export function evaluatePriceAlerts(symbol: string, currentPrice: number): PriceAlert[] {
    if (!currentPrice || isNaN(currentPrice)) return [];
    const cleanSymbol = symbol.replace('/USD', '').replace('USDT', '').toUpperCase();

    const alerts = getStoredAlerts();
    const triggeredNow: PriceAlert[] = [];
    let hasUpdated = false;

    const updatedAlerts = alerts.map(alert => {
        if (alert.symbol === cleanSymbol && alert.isActive && !alert.isTriggered) {
            const isConditionMet = 
                (alert.condition === 'ABOVE' && currentPrice >= alert.targetPrice) ||
                (alert.condition === 'BELOW' && currentPrice <= alert.targetPrice);

            if (isConditionMet) {
                const triggered: PriceAlert = {
                    ...alert,
                    isActive: false,
                    isTriggered: true,
                    triggeredAt: new Date().toISOString()
                };
                triggeredNow.push(triggered);
                hasUpdated = true;
                return triggered;
            }
        }
        return alert;
    });

    if (hasUpdated) {
        saveAlerts(updatedAlerts);

        // Sound & Haptics
        playAlertChime();
        triggerAlertHaptic();

        // Browser Native Notification
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            triggeredNow.forEach(alert => {
                try {
                    const directionText = alert.condition === 'ABOVE' ? 'ha superato' : 'è sceso sotto';
                    new Notification(`TRADYX ALERT: ${alert.symbol} ${directionText} $${alert.targetPrice.toLocaleString()}`, {
                        body: alert.note || `Prezzo attuale: $${currentPrice.toLocaleString()}`,
                        icon: '/favicon.ico'
                    });
                } catch {
                    // ignore
                }
            });
        }
    }

    return triggeredNow;
}
