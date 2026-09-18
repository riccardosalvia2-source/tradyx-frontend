// ============================================================================
// TRADYX INPUT SANITIZER & XSS / SQLi PREVENTION (security/input_sanitizer.js)
// Author: Lead Cyber Security Engineer & Compliance Officer
// Description: Input sanitization module preventing XSS and SQL injection.
// ============================================================================

/**
 * Sanitizes input text by removing HTML tags, XSS event handlers, and escaping characters.
 * @param {string} input Raw text input
 * @returns {string} Clean, safe text string
 */
export function sanitizeTextInput(input) {
    if (input === null || input === undefined) return '';
    if (typeof input !== 'string') return String(input);

    let clean = input;

    // 1. Remove script tags and embedded JavaScript execution patterns
    clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    clean = clean.replace(/javascript\s*:/gi, '');
    clean = clean.replace(/on\w+\s*=/gi, '');

    // 2. Strip raw HTML markup tags
    clean = clean.replace(/<\/?[^>]+(>|$)/g, '');

    // 3. Escape critical HTML entities
    clean = clean
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');

    // 4. Neutralize SQL Injection control sequences
    clean = clean
        .replace(/;\s*DROP\s+TABLE/gi, '')
        .replace(/;\s*DELETE\s+FROM/gi, '')
        .replace(/UNION\s+SELECT/gi, '')
        .replace(/--/g, '');

    return clean.trim();
}

/**
 * Validates and recursively sanitizes strategy JSON configuration objects.
 * @param {Object|Array|string} obj Input JSON payload
 * @returns {Object|Array|string} Sanitized JSON payload
 */
export function sanitizeJSONConfig(obj) {
    if (typeof obj === 'string') {
        return sanitizeTextInput(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeJSONConfig(item));
    }
    if (obj !== null && typeof obj === 'object') {
        const sanitizedObj = {};
        for (const [key, value] of Object.entries(obj)) {
            const cleanKey = sanitizeTextInput(key);
            sanitizedObj[cleanKey] = sanitizeJSONConfig(value);
        }
        return sanitizedObj;
    }
    return obj;
}

const inputSanitizerModule = {
    sanitizeTextInput,
    sanitizeJSONConfig
};

export default inputSanitizerModule;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = inputSanitizerModule;
    module.exports.sanitizeTextInput = sanitizeTextInput;
    module.exports.sanitizeJSONConfig = sanitizeJSONConfig;
}
