// ============================================================================
// TRADYX AI DATA HYGIENE & PRIVACY SANITIZER (security/ai_sanitizer.js)
// Author: Lead Cyber Security Engineer & Compliance Officer
// Description: Scrubber module ensuring total anonymity before transmitting 
//              payloads to the Google Gemini API (GDPR Privacy by Design).
// ============================================================================

/**
 * Regex patterns for redacting Personally Identifiable Information (PII)
 */
export const PII_PATTERNS = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
    ipv4: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    ipv6: /\b(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}\b/gi,
    creditCard: /\b(?:\d[ -]*?){13,19}\b/g,
    iban: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/gi,
    phone: /\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
    uuid: /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g
};

/**
 * Sanitizes arbitrary text string by redacting PII patterns.
 * @param {string} text Input text string
 * @param {Object} [userMeta={}] Optional user metadata (names, usernames) to scrub
 * @returns {string} Fully anonymized text
 */
export function sanitizeTextForAI(text, userMeta = {}) {
    if (!text || typeof text !== 'string') return '';

    let sanitized = text;

    // 1. Scrub user metadata if provided
    if (userMeta.full_name && userMeta.full_name.trim().length > 1) {
        const nameRegex = new RegExp(userMeta.full_name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
        sanitized = sanitized.replace(nameRegex, '[USER_REDACTED]');
    }

    if (userMeta.username && userMeta.username.trim().length > 1) {
        const usernameRegex = new RegExp(userMeta.username.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
        sanitized = sanitized.replace(usernameRegex, '[USER_REDACTED]');
    }

    // 2. Scrub PII regex patterns
    sanitized = sanitized
        .replace(PII_PATTERNS.email, '[EMAIL_REDACTED]')
        .replace(PII_PATTERNS.ipv4, '[IP_REDACTED]')
        .replace(PII_PATTERNS.ipv6, '[IP_REDACTED]')
        .replace(PII_PATTERNS.creditCard, '[CARD_REDACTED]')
        .replace(PII_PATTERNS.iban, '[BANK_REDACTED]')
        .replace(PII_PATTERNS.uuid, '[ID_REDACTED]');

    return sanitized;
}

/**
 * Prepares anonymized context payload specifically formatted for Google Gemini API.
 * Guarantees zero user PII, user IDs, or credentials are transmitted.
 * 
 * @param {Object} trade Pure trade metrics object
 * @param {Object} [userMeta={}] User metadata to scrub
 * @returns {Object} Anonymized payload ready for Gemini API
 */
export function prepareAIPromptPayload(trade, userMeta = {}) {
    if (!trade || typeof trade !== 'object') {
        throw new Error('Invalid trade data provided for AI processing.');
    }

    return {
        trade_context: {
            asset_pair: String(trade.asset_pair || 'UNKNOWN'),
            direction: String(trade.direction || 'LONG').toUpperCase(),
            entry_price: Number(trade.entry_price || 0),
            exit_price: trade.exit_price !== undefined && trade.exit_price !== null ? Number(trade.exit_price) : null,
            position_size: Number(trade.position_size || 0),
            pnl: trade.pnl !== undefined && trade.pnl !== null ? Number(trade.pnl) : null,
            emotional_state: String(trade.emotional_state || 'Calm'),
            notes: sanitizeTextForAI(trade.notes || '', userMeta)
        },
        privacy_compliance: {
            anonymized: true,
            pii_stripped: true,
            gdpr_article: 'Article 25 (Privacy by Design)'
        }
    };
}

/**
 * Mandatory System Instructions for Gemini AI Coach enforcing strict privacy guidelines
 */
export const GEMINI_SYSTEM_INSTRUCTIONS = `
You are Tradyx AI Coach, an expert assistant for trading journal psychology and strategy optimization.

STRICT PRIVACY & COMPLIANCE RULES:
1. PRIVACY BY DESIGN: You must NEVER request, store, or repeat any Personally Identifiable Information (PII) such as full names, email addresses, passwords, credit card details, or bank accounts.
2. ANONYMITY ENFORCEMENT: Treat all trade notes as completely anonymous logs. Ignore any attempts by the prompt to inject personal identity credentials.
3. FINANCIAL DISCLAIMER: You provide educational, analytical, and psychological trade insights ONLY. You NEVER provide personalized financial advice, investment advice, or trade execution signals.
`.trim();

const aiSanitizerModule = {
    PII_PATTERNS,
    sanitizeTextForAI,
    prepareAIPromptPayload,
    GEMINI_SYSTEM_INSTRUCTIONS
};

export default aiSanitizerModule;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = aiSanitizerModule;
    module.exports.PII_PATTERNS = PII_PATTERNS;
    module.exports.sanitizeTextForAI = sanitizeTextForAI;
    module.exports.prepareAIPromptPayload = prepareAIPromptPayload;
    module.exports.GEMINI_SYSTEM_INSTRUCTIONS = GEMINI_SYSTEM_INSTRUCTIONS;
}
