// ============================================================================
// TRADYX DISTRIBUTED CACHE (UPSTASH REDIS) & RATE LIMITER
// (api/_lib/cacheAndRateLimit.ts)
// Multi-tier caching (Upstash Redis REST -> warm in-memory Map fallback)
// + Per-user / Per-IP sliding-window rate limiting (HTTP 429 + Retry-After).
// ============================================================================

import { ApiRequest, ApiResponse, getClientIp } from './http';

export const CACHE_TTL = {
    MARKETS_SECONDS: 10, // 10 seconds for live market quotes
    NEWS_SECONDS: 900, // 15 minutes for country news + Gemini AI batch analysis
    MACRO_SECONDS: 43200 // 12 hours for World Bank / FRED macro indicators
} as const;

export const AI_RATE_LIMIT = {
    MAX_REQUESTS: 30,
    WINDOW_SECONDS: 60
} as const;

interface MemoryEntry<T = unknown> {
    value: T;
    expiresAt: number;
}

interface RateLimitBucket {
    count: number;
    resetAt: number;
}

// Warm serverless instance fallback cache & rate-limit buckets
const memoryCache = new Map<string, MemoryEntry>();
const memoryRateLimits = new Map<string, RateLimitBucket>();

function getUpstashConfig(): { url: string; token: string } | null {
    const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim().replace(/\/+$/, '');
    const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
    if (!url || !token || !url.startsWith('https://')) {
        return null;
    }
    return { url, token };
}

async function upstashCommand<T = unknown>(command: Array<string | number>): Promise<T | null> {
    const cfg = getUpstashConfig();
    if (!cfg) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1800);
    try {
        const res = await fetch(cfg.url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${cfg.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(command),
            signal: controller.signal
        });
        if (!res.ok) return null;
        const payload = (await res.json()) as { result?: T; error?: string };
        if (payload?.error) return null;
        return payload.result ?? null;
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
}

function pruneMemoryIfLarge(): void {
    const now = Date.now();
    if (memoryCache.size > 500) {
        for (const [k, entry] of memoryCache.entries()) {
            if (entry.expiresAt <= now) memoryCache.delete(k);
        }
    }
    if (memoryRateLimits.size > 2000) {
        for (const [k, bucket] of memoryRateLimits.entries()) {
            if (bucket.resetAt <= now) memoryRateLimits.delete(k);
        }
    }
}

export async function cacheGet<T>(key: string): Promise<{ data: T; layer: 'upstash_redis' | 'memory' } | null> {
    const now = Date.now();

    // 1. Fast L1 warm-instance hit
    const memHit = memoryCache.get(key);
    if (memHit && memHit.expiresAt > now) {
        return { data: memHit.value as T, layer: 'memory' };
    }

    // 2. L2 Upstash Redis distributed hit
    const raw = await upstashCommand<string | null>(['GET', key]);
    if (typeof raw === 'string' && raw.length > 0) {
        try {
            const parsed = JSON.parse(raw) as T;
            // Hydrate L1 briefly (max 10s) to avoid redundant Redis round-trips in hot bursts
            memoryCache.set(key, { value: parsed, expiresAt: now + 10_000 });
            return { data: parsed, layer: 'upstash_redis' };
        } catch {
            return null;
        }
    }

    return null;
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<'upstash_redis' | 'memory'> {
    pruneMemoryIfLarge();
    const ttlMs = Math.max(1, ttlSeconds) * 1000;
    memoryCache.set(key, { value, expiresAt: Date.now() + ttlMs });

    const serialized = JSON.stringify(value);
    const redisRes = await upstashCommand<string>(['SET', key, serialized, 'EX', Math.max(1, Math.round(ttlSeconds))]);
    return redisRes === 'OK' ? 'upstash_redis' : 'memory';
}

export async function withCache<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>
): Promise<{ data: T; hit: boolean; layer: 'upstash_redis' | 'memory' }> {
    const existing = await cacheGet<T>(key);
    if (existing) {
        return { data: existing.data, hit: true, layer: existing.layer };
    }

    const fresh = await fetcher();
    const layer = await cacheSet(key, fresh, ttlSeconds);
    return { data: fresh, hit: false, layer };
}

export interface RateLimitResult {
    allowed: boolean;
    limit: number;
    remaining: number;
    retryAfterSeconds: number;
    backend: 'upstash_redis' | 'memory';
}

/**
 * Fixed-window distributed rate limiter backed by Upstash Redis INCR/EXPIRE,
 * with automatic warm in-memory fallback when Upstash env vars are absent.
 */
export async function checkRateLimit(
    scope: string,
    identifier: string,
    maxRequests: number = AI_RATE_LIMIT.MAX_REQUESTS,
    windowSeconds: number = AI_RATE_LIMIT.WINDOW_SECONDS
): Promise<RateLimitResult> {
    const windowBucket = Math.floor(Date.now() / (windowSeconds * 1000));
    const redisKey = `tradyx:rl:${scope}:${identifier}:${windowBucket}`;
    const secondsIntoWindow = Math.floor((Date.now() / 1000) % windowSeconds);
    const retryAfterSeconds = Math.max(1, windowSeconds - secondsIntoWindow);

    // 1. Try Upstash Redis distributed counter
    if (getUpstashConfig()) {
        const count = await upstashCommand<number>(['INCR', redisKey]);
        if (typeof count === 'number') {
            if (count === 1) {
                await upstashCommand(['EXPIRE', redisKey, windowSeconds + 5]);
            }
            const remaining = Math.max(0, maxRequests - count);
            return {
                allowed: count <= maxRequests,
                limit: maxRequests,
                remaining,
                retryAfterSeconds: count <= maxRequests ? 0 : retryAfterSeconds,
                backend: 'upstash_redis'
            };
        }
    }

    // 2. Warm in-memory fallback
    pruneMemoryIfLarge();
    const now = Date.now();
    const existing = memoryRateLimits.get(redisKey);
    if (!existing || existing.resetAt <= now) {
        memoryRateLimits.set(redisKey, {
            count: 1,
            resetAt: now + windowSeconds * 1000
        });
        return {
            allowed: true,
            limit: maxRequests,
            remaining: Math.max(0, maxRequests - 1),
            retryAfterSeconds: 0,
            backend: 'memory'
        };
    }

    existing.count += 1;
    const remaining = Math.max(0, maxRequests - existing.count);
    const retrySec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

    return {
        allowed: existing.count <= maxRequests,
        limit: maxRequests,
        remaining,
        retryAfterSeconds: existing.count <= maxRequests ? 0 : retrySec,
        backend: 'memory'
    };
}

/**
 * Applies rate limiting to an API route. Returns `true` if allowed, or sends
 * HTTP 429 Too Many Requests with `Retry-After` header and returns `false`.
 */
export async function applyRateLimitOrReject(
    req: ApiRequest,
    res: ApiResponse,
    scope: string,
    userId?: string | null,
    maxRequests: number = AI_RATE_LIMIT.MAX_REQUESTS,
    windowSeconds: number = AI_RATE_LIMIT.WINDOW_SECONDS
): Promise<boolean> {
    const ip = getClientIp(req);
    const identifier = userId ? `uid:${userId}` : `ip:${ip}`;
    const result = await checkRateLimit(scope, identifier, maxRequests, windowSeconds);

    res.setHeader('X-RateLimit-Limit', String(result.limit));
    res.setHeader('X-RateLimit-Remaining', String(result.remaining));
    res.setHeader('X-RateLimit-Backend', result.backend);

    if (!result.allowed) {
        res.setHeader('Retry-After', String(result.retryAfterSeconds));
        res.status(429).json({
            error: 'TOO_MANY_REQUESTS',
            message: `Limite di richieste superato (${result.limit} richieste/minuto). Riprova tra ${result.retryAfterSeconds} secondi.`,
            retryAfterSeconds: result.retryAfterSeconds
        });
        return false;
    }

    return true;
}
