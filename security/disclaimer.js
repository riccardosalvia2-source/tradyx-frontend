// ============================================================================
// TRADYX FINANCIAL LEGAL DISCLAIMER (security/disclaimer.js)
// Author: Lead Cyber Security Engineer & Compliance Officer
// Description: Mandatory Fintech Legal Disclaimer and Compliance Notice.
// ============================================================================

export const FINANCIAL_DISCLAIMER_IT = 
    "Tradyx è uno strumento software per il tracciamento personale e il supporto psicologico. Non fornisce in alcun modo consulenza finanziaria o sollecitazione all'investimento.";

export const FINANCIAL_DISCLAIMER_EN = 
    "Tradyx is a personal trading tracking and psychological support software tool. It does not provide financial advice, investment recommendations, or trade solicitations in any way.";

export const DISCLAIMER_CONFIG = {
    mandatory: true,
    jurisdiction: "EU / GDPR / MiFID II Compliance",
    footer_text: FINANCIAL_DISCLAIMER_IT,
    en_translation: FINANCIAL_DISCLAIMER_EN,
    display_locations: [
        "onboarding_screen",
        "journal_footer",
        "ai_coach_chat_window",
        "analytics_dashboard"
    ]
};

export function getFinancialDisclaimer(lang = 'it') {
    return lang.toLowerCase() === 'en' ? FINANCIAL_DISCLAIMER_EN : FINANCIAL_DISCLAIMER_IT;
}

const disclaimerModule = {
    FINANCIAL_DISCLAIMER_IT,
    FINANCIAL_DISCLAIMER_EN,
    DISCLAIMER_CONFIG,
    getFinancialDisclaimer
};

export default disclaimerModule;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = disclaimerModule;
    module.exports.FINANCIAL_DISCLAIMER_IT = FINANCIAL_DISCLAIMER_IT;
    module.exports.FINANCIAL_DISCLAIMER_EN = FINANCIAL_DISCLAIMER_EN;
    module.exports.DISCLAIMER_CONFIG = DISCLAIMER_CONFIG;
    module.exports.getFinancialDisclaimer = getFinancialDisclaimer;
}
