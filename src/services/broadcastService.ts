// ============================================================================
// TRADYX BROADCAST & GLOBAL ANNOUNCEMENT SERVICE (src/services/broadcastService.ts)
// ============================================================================

import { SystemBroadcast, BroadcastStyle } from '../types/auth';

const BROADCAST_STORAGE_KEY = 'tradyx_global_broadcast';

// Initial default active broadcast for demo
const defaultBroadcast: SystemBroadcast = {
    id: 'bcast-001',
    title: '🚀 Aggiornamento Tradyx v2.4 Disponibile!',
    message: 'Nuovo modulo AI Coach Gemini Flash integrato con analisi della psicologia di trading in tempo reale.',
    style: 'PROMO',
    active: true,
    created_at: new Date().toISOString()
};

let listeners: Array<(broadcast: SystemBroadcast | null) => void> = [];

export function getStoredBroadcast(): SystemBroadcast | null {
    try {
        const raw = localStorage.getItem(BROADCAST_STORAGE_KEY);
        if (raw) {
            return JSON.parse(raw);
        }
    } catch (e) {
        console.warn('Failed to parse broadcast from localStorage', e);
    }
    return defaultBroadcast;
}

export function saveBroadcast(broadcast: SystemBroadcast | null): void {
    try {
        if (broadcast) {
            localStorage.setItem(BROADCAST_STORAGE_KEY, JSON.stringify(broadcast));
        } else {
            localStorage.removeItem(BROADCAST_STORAGE_KEY);
        }
    } catch (e) {
        console.warn('Failed to save broadcast to localStorage', e);
    }
    listeners.forEach(fn => fn(broadcast));
}

export function createOrUpdateBroadcast(title: string, message: string, style: BroadcastStyle, active: boolean): SystemBroadcast {
    const newBroadcast: SystemBroadcast = {
        id: `bcast-${Date.now()}`,
        title,
        message,
        style,
        active,
        created_at: new Date().toISOString()
    };
    saveBroadcast(newBroadcast);
    return newBroadcast;
}

export function subscribeBroadcast(callback: (broadcast: SystemBroadcast | null) => void): () => void {
    listeners.push(callback);
    callback(getStoredBroadcast());
    return () => {
        listeners = listeners.filter(fn => fn !== callback);
    };
}
