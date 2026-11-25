// ============================================================================
// TRADYX SERVERLESS HTTP TYPES & SECURITY HELPERS (api/_lib/http.ts)
// Self-contained Vercel Node.js serverless request/response interfaces.
// ============================================================================

export interface ApiRequest {
    method?: string;
    url?: string;
    headers: Record<string, string | string[] | undefined>;
    query?: Record<string, string | string[] | undefined>;
    body?: unknown;
    socket?: {
        remoteAddress?: string;
    };
}

export interface ApiResponse {
    status: (code: number) => ApiResponse;
    json: (body: unknown) => ApiResponse | void;
    send: (body: unknown) => ApiResponse | void;
    end: (body?: unknown) => ApiResponse | void;
    setHeader: (name: string, value: string | number | readonly string[]) => ApiResponse | void;
}

export function getHeader(req: ApiRequest, name: string): string | undefined {
    const lower = name.toLowerCase();
    for (const [k, v] of Object.entries(req.headers || {})) {
        if (k.toLowerCase() === lower) {
            if (Array.isArray(v)) return v[0];
            return v;
        }
    }
    return undefined;
}

export function getClientIp(req: ApiRequest): string {
    const xff = getHeader(req, 'x-forwarded-for');
    if (xff) {
        const first = xff.split(',')[0]?.trim();
        if (first) return first;
    }
    const realIp = getHeader(req, 'x-real-ip');
    if (realIp) return realIp.trim();
    return req.socket?.remoteAddress || 'unknown-ip';
}

export function getQueryParam(req: ApiRequest, key: string): string | undefined {
    const val = req.query?.[key];
    if (Array.isArray(val)) return val[0];
    return typeof val === 'string' ? val : undefined;
}

export function parseJsonBody(req: ApiRequest): unknown {
    if (req.body === undefined || req.body === null) return {};
    if (typeof req.body === 'string') {
        try {
            return JSON.parse(req.body);
        } catch {
            return null;
        }
    }
    return req.body;
}

export function applySecurityHeaders(res: ApiResponse): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    res.setHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=(self)');
}

export function handleCorsAndMethod(
    req: ApiRequest,
    res: ApiResponse,
    allowedMethods: string[]
): boolean {
    applySecurityHeaders(res);

    const origin = getHeader(req, 'origin');
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', `${allowedMethods.join(', ')}, OPTIONS`);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tradyx-Session');

    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return false;
    }

    if (!req.method || !allowedMethods.includes(req.method.toUpperCase())) {
        res.setHeader('Allow', allowedMethods.join(', '));
        res.status(405).json({
            error: 'METHOD_NOT_ALLOWED',
            message: `Metodo HTTP non consentito. Metodi supportati: ${allowedMethods.join(', ')}`
        });
        return false;
    }

    return true;
}
