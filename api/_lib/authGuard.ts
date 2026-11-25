// ============================================================================
// TRADYX SERVERLESS AUTH GUARD (api/_lib/authGuard.ts)
// Validates Supabase Auth JWT (`Authorization: Bearer <token>`) on protected
// serverless endpoints (e.g. Gemini AI Coach) before running costly calls.
// ============================================================================

import { ApiRequest, ApiResponse, getClientIp, getHeader } from './http';

export interface AuthContext {
    authenticated: boolean;
    userId: string | null;
    email: string | null;
    mode: 'supabase_jwt' | 'local_demo' | 'anonymous';
}

interface CachedTokenEntry {
    userId: string;
    email: string | null;
    expiresAt: number;
}

// Short 60s token verification cache to avoid hitting Supabase Auth on every burst request
const verifiedTokenCache = new Map<string, CachedTokenEntry>();

function getSupabaseServerConfig(): { url: string; anonKey: string } | null {
    const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
    const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();

    if (
        !url ||
        !anonKey ||
        url.includes('dummy-tradyx.supabase.co') ||
        anonKey === 'dummy_anon_key' ||
        !url.startsWith('https://')
    ) {
        return null;
    }

    return { url, anonKey };
}

function extractBearerToken(req: ApiRequest): string | null {
    const authHeader = getHeader(req, 'authorization');
    if (!authHeader) return null;
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    return match?.[1]?.trim() || null;
}

/**
 * Verifies the caller's Supabase JWT via Supabase Auth `/auth/v1/user`.
 * - When Supabase is configured in production and `requireAuth: true`, invalid/missing JWTs
 *   receive HTTP 401 Unauthorized.
 * - When Supabase is not yet configured (local/preview without env vars), allows authenticated
 *   local session header (`X-Tradyx-Session`) or IP-scoped rate-limited access so dev/preview stays functional.
 */
export async function verifyAuth(
    req: ApiRequest,
    res: ApiResponse,
    options: { requireAuth: boolean } = { requireAuth: true }
): Promise<AuthContext | null> {
    const token = extractBearerToken(req);
    const supabaseCfg = getSupabaseServerConfig();

    // Case 1: Real Supabase configured in environment
    if (supabaseCfg) {
        if (!token) {
            if (options.requireAuth) {
                res.status(401).json({
                    error: 'UNAUTHORIZED',
                    message: 'Autenticazione richiesta. Effettua il login con un account Tradyx valido.'
                });
                return null;
            }
            return {
                authenticated: false,
                userId: null,
                email: null,
                mode: 'anonymous'
            };
        }

        // Check short-lived verification cache
        const cached = verifiedTokenCache.get(token);
        if (cached && cached.expiresAt > Date.now()) {
            return {
                authenticated: true,
                userId: cached.userId,
                email: cached.email,
                mode: 'supabase_jwt'
            };
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        try {
            const verifyRes = await fetch(`${supabaseCfg.url}/auth/v1/user`, {
                method: 'GET',
                headers: {
                    apikey: supabaseCfg.anonKey,
                    Authorization: `Bearer ${token}`
                },
                signal: controller.signal
            });

            if (!verifyRes.ok) {
                if (options.requireAuth) {
                    res.status(401).json({
                        error: 'INVALID_TOKEN',
                        message: 'Sessione scaduta o token JWT non valido. Effettua nuovamente il login.'
                    });
                    return null;
                }
                return {
                    authenticated: false,
                    userId: null,
                    email: null,
                    mode: 'anonymous'
                };
            }

            const user = (await verifyRes.json()) as { id?: string; email?: string };
            if (!user?.id) {
                if (options.requireAuth) {
                    res.status(401).json({
                        error: 'INVALID_TOKEN',
                        message: 'Token utente non verificabile.'
                    });
                    return null;
                }
                return {
                    authenticated: false,
                    userId: null,
                    email: null,
                    mode: 'anonymous'
                };
            }

            if (verifiedTokenCache.size > 1000) {
                verifiedTokenCache.clear();
            }
            verifiedTokenCache.set(token, {
                userId: user.id,
                email: user.email || null,
                expiresAt: Date.now() + 60_000
            });

            return {
                authenticated: true,
                userId: user.id,
                email: user.email || null,
                mode: 'supabase_jwt'
            };
        } catch {
            if (options.requireAuth) {
                res.status(401).json({
                    error: 'AUTH_VERIFICATION_FAILED',
                    message: 'Impossibile verificare la sessione di autenticazione.'
                });
                return null;
            }
            return {
                authenticated: false,
                userId: null,
                email: null,
                mode: 'anonymous'
            };
        } finally {
            clearTimeout(timer);
        }
    }

    // Case 2: Supabase not yet provisioned (preview/staging mode)
    const localSessionId = getHeader(req, 'x-tradyx-session')?.trim();
    if (localSessionId && localSessionId.length >= 3 && localSessionId.length <= 128) {
        return {
            authenticated: true,
            userId: `local:${localSessionId}`,
            email: null,
            mode: 'local_demo'
        };
    }

    return {
        authenticated: !options.requireAuth,
        userId: `ip:${getClientIp(req)}`,
        email: null,
        mode: 'local_demo'
    };
}
