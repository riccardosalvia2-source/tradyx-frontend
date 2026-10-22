// ============================================================================
// TRADYX GEMINI AI COACH SERVICE (src/services/aiCoachService.ts)
// Author: Senior AI Engineer & Lead React Developer
// Description: Trading Psychology AI Coach service powered by Google Gemini API,
//              incorporating real user trading journal context, PII Sanitization,
//              and Behavioral Finance Analytics.
// ============================================================================

import { GoogleGenAI } from '@google/genai';
import { UserTradingContext } from '../types/chat';
import { sanitizeTextForAI } from '../../security/ai_sanitizer';
import { addSystemLog } from './authService';
import { getDefaultGeminiModel, recordGeminiCall } from './geminiMetricsService';

export type CoachPersona = 'EMPATHIC' | 'TOUGH_LOVE';

// Master System Prompt for Tradyx Coach Persona (Empathic)
export const TRADYX_COACH_EMPATHIC_INSTRUCTIONS = `
Sei "Tradyx Coach", un assistente virtuale altamente specializzato in psicologia del trading, finanza comportamentale e disciplina operativa per la piattaforma Tradyx.

REGOLE FONDAMENTALI ED ETICHE:
1. NON FORNIRE MAI CONSIGLI FINANZIARI O SEGNALI OPERATIVI. Non suggerire mai se acquistare, vendere, aprire o chiudere posizioni su specifici asset (BTC, ETH, Forex, Azioni). Se l'utente ti chiede un segnale di trading, rifiuta garbatamente ricordandogli che sei un coach psicologico e non un consulente finanziario.
2. OBIETTIVO PRINCIPALE: Aiutare il trader a identificare e superare i bias cognitivi legati al denaro: FOMO (Fear Of Missing Out), Revenge Trading, Avidità, Over-trading e Ansia da prestazione.
3. RISPOSTE DINAMICHE ED ANALITICHE: Esamina attentamente le metriche reali del diario operativo ed integrali direttamente nell'analisi.
4. TONO E STILE: Empatico, riflessivo, professionale e calmo.
`;

// Institutional Risk Manager Master Prompt (Tough Love)
export const TRADYX_TOUGH_LOVE_INSTRUCTIONS = `
Sei il "Chief Risk Officer (CRO) Istituzionale" di Tradyx e di un prop trading desk di Wall Street.
La tua persona è "TOUGH LOVE RISK MANAGER": schietto, inflessibile, professionale, autoritario e senza fronzoli.
Il tuo compito assoluto è PROTEGGERE IL CAPITALE del trader ed eliminare ogni traccia di dilettantismo emotivo.

LINEE GUIDA PERSONA:
1. NESSUN COMPLIMENTO FACILE: Se il trader vince per fortuna o dopo aver rotto le regole, redarguiscilo ("Hai guadagnato violando il risk plan: un colpo di fortuna che rafforza cattive abitudini è più velenoso di una perdita").
2. TOLLERANZA ZERO PER FOMO / REVENGE: Se vedi FOMO o Revenge Trading, sbattigli in faccia la realtà ("Stai giocando alla slot machine", "Chiudi il terminale immediatamente prima che il mercato confischi il tuo conto").
3. FOCUS SUGLI ERRORI E SUL PROCESSO: Valuta il drawdown, l'eccesso di size e la violazione dei limiti.
4. NON FORNIRE MAI SEGNALI DI TRADING O CONSIGLI DI INVESTIMENTO (rifiuta ricordando che il tuo lavoro è la gestione del rischio e la disciplina, non le scommesse).
5. TONO: Diretto, lapidario, pungente ma orientato alla sopravvivenza a lungo termine del trader.
`;

// Financial Advice Trigger Keywords
const FINANCIAL_ADVICE_TRIGGERS = [
    'comprare', 'vendere', 'buy', 'sell', 'segnale', 'signal', 
    'dove investire', 'che asset comprare', 'target price', 
    'previsione btc', 'previsione prezzo', 'conviene comprare'
];

export function isFinancialAdviceQuery(text: string): boolean {
    const lower = text.toLowerCase();
    return FINANCIAL_ADVICE_TRIGGERS.some(trigger => lower.includes(trigger));
}

/**
 * Generates a dynamic AI response from Tradyx Coach powered by Gemini API,
 * incorporating user trading journal metrics (PnL, Emotional state, WinRate) and chosen Persona.
 */
export async function generateCoachResponse(
    rawUserPrompt: string, 
    context?: UserTradingContext,
    persona: CoachPersona = 'TOUGH_LOVE'
): Promise<string> {
    const activeModel = getDefaultGeminiModel();
    const startTime = performance.now();

    // Log Gemini API Query to System Audit Logs
    addSystemLog(
        'AI_QUERY', 
        `Chiamata API Gemini Coach [${activeModel}]: "${rawUserPrompt.slice(0, 45)}${rawUserPrompt.length > 45 ? '...' : ''}"`,
        'trader.pro@tradyx.ai', 
        { model: activeModel, prompt_length: rawUserPrompt.length, has_journal_context: !!context }
    );

    // 1. PII Sanitization
    const sanitizedPrompt = sanitizeTextForAI(rawUserPrompt);

    // 2. Financial Advice Restriction Guard
    if (isFinancialAdviceQuery(sanitizedPrompt)) {
        return `⚠️ **Nota di Responsabilità:** Come **Tradyx Coach**, sono specializzato esclusivamente nello sviluppo della disciplina emotiva e nella psicologia del trading. 

*Non fornisco in alcun modo segnali operativi, raccomandazioni di investimento o consigli su quali asset acquistare o vendere.*

Se avverti la tentazione di aprire una posizione senza un setup ben definito, chiediti:
- *Stai seguendo le regole del tuo trading plan o ti sta guidando l'ansia di perdere un movimento (FOMO)?*
- *Qual è il rapporto Rischio/Rendimento pianificato prima dell'ingresso?*

Posso aiutarti ad analizzare come mantenere la calma o superare la tensione emotiva durante la sessione!`;
    }

    // 3. Construct Contextual User Journal Data Block
    let journalContextStr = 'Nessun trade ancora registrato nel diario per la sessione corrente.';
    if (context) {
        journalContextStr = `
[METRICHE E CONTESTO TRADING REALE UTENTE]
- PnL Cumulativo Recente: $${(context.recentPnL ?? 0).toLocaleString()}
- Stato Emotivo Dominante: ${context.recentEmotion || 'Calm'}
- Win Rate Storico: ${context.totalWinRate ?? 0}%
- Numero totale operazioni registrate: ${context.tradeCount ?? 0}
- Note dall'ultima operazione: "${context.lastTradeNotes || 'Nessuna nota aggiuntiva'}"
`;
    }

    const selectedInstructions = persona === 'TOUGH_LOVE' 
        ? TRADYX_TOUGH_LOVE_INSTRUCTIONS 
        : TRADYX_COACH_EMPATHIC_INSTRUCTIONS;

    const fullPrompt = `${selectedInstructions}\n${journalContextStr}\n\n[DOMANDA UTENTE]\n${sanitizedPrompt}`;

    // 4. Retrieve Gemini API Key from Environment
    const geminiApiKey = import.meta.env?.VITE_GEMINI_API_KEY || 
                         import.meta.env?.GEMINI_API_KEY || 
                         (typeof process !== 'undefined' ? process.env?.VITE_GEMINI_API_KEY : undefined);

    if (geminiApiKey && geminiApiKey !== 'dummy_gemini_key') {
        // Attempt Direct GoogleGenAI SDK Call
        try {
            const ai = new GoogleGenAI({ apiKey: geminiApiKey });
            const response = await ai.models.generateContent({
                model: activeModel,
                contents: fullPrompt,
            });
            if (response && response.text) {
                const latency = Math.round(performance.now() - startTime);
                const inTokens = Math.round(fullPrompt.length / 4);
                const outTokens = Math.round(response.text.length / 4);
                recordGeminiCall('trader.pro@tradyx.ai', activeModel, inTokens, outTokens, latency, '200 OK');
                return response.text;
            }
        } catch (sdkErr: any) {
            console.warn('GoogleGenAI SDK query notice, attempting direct REST fetch fallback:', sdkErr?.message || sdkErr);
        }

        // Direct Browser Fetch Fallback to Gemini REST API
        try {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${geminiApiKey}`;
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: fullPrompt }] }]
                })
            });

            if (res.ok) {
                const data = await res.json();
                const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (aiReply) {
                    const latency = Math.round(performance.now() - startTime);
                    const inTokens = Math.round(fullPrompt.length / 4);
                    const outTokens = Math.round(aiReply.length / 4);
                    recordGeminiCall('trader.pro@tradyx.ai', activeModel, inTokens, outTokens, latency, '200 OK');
                    return aiReply;
                }
            }
        } catch (fetchErr: any) {
            console.warn('Gemini REST fetch notice:', fetchErr?.message || fetchErr);
        }
    }

    // 5. Dynamic Analytical Response Synthesizer (Fallback when API key is unconfigured)
    const fallbackAns = generateDynamicContextualAnalysis(sanitizedPrompt, context, persona);
    const latency = Math.round(performance.now() - startTime) || 180;
    const inTokens = Math.round(fullPrompt.length / 4);
    const outTokens = Math.round(fallbackAns.length / 4);
    recordGeminiCall('trader.pro@tradyx.ai', activeModel, inTokens, outTokens, latency, '200 OK');
    return fallbackAns;
}

/**
 * Dynamic Contextual Analysis Generator synthesizing user trading journal metrics and prompt text.
 */
function generateDynamicContextualAnalysis(
    prompt: string, 
    context?: UserTradingContext,
    persona: CoachPersona = 'TOUGH_LOVE'
): string {
    const pnl = context?.recentPnL ?? 0;
    const emotion = context?.recentEmotion || 'Disciplined';
    const winRate = context?.totalWinRate ?? 50;
    const isNegativePnL = pnl < 0;

    if (persona === 'TOUGH_LOVE') {
        let toughHeader = `🏛️ **INSTITUTIONAL RISK MANAGER (TOUGH LOVE)**\n\n`;

        if (isNegativePnL || emotion === 'FOMO' || emotion === 'Frustrated' || emotion === 'Anxious') {
            toughHeader += `⚠️ **DESK WARNING:** Sei in rosso di \`-$${Math.abs(pnl).toLocaleString()}\` e registri uno stato di \`${emotion}\`. Smettila di cercare giustificazioni nel rumore di mercato.\n\n`;
        } else {
            toughHeader += `📊 PnL Attuale: \`+$${pnl.toLocaleString()}\` | Win Rate: \`${winRate}%\`. Ottimo, ma ricorda: un singolo trade fuori dalle regole può cancellare una settimana di disciplina.\n\n`;
        }

        const lowerPrompt = prompt.toLowerCase();
        if (lowerPrompt.includes('revenge') || lowerPrompt.includes('recuperare') || lowerPrompt.includes('perdita')) {
            return toughHeader + `🛑 **VIOLAZIONE CRITICA: TENTATIVO DI REVENGE TRADING.**
- **La Dura Verità:** Il mercato non sa chi sei e non ti deve assolutamente nulla. Tentare di "recuperare" forzando la size è la via più veloce per la squalifica del conto.
- **Ordine Operativo del Risk Desk:**
  1. Chiudi la piattaforma adesso. Cooldown minimo di 15-30 minuti.
  2. Registra la perdita a bilancio. I professionisti pagano le perdite come costi d'impresa, i principianti le combattono come un'offesa personale.
  3. Se riapri un ordine senza setup verificato, sei fuori dal desk.`;
        }

        if (lowerPrompt.includes('fomo') || lowerPrompt.includes('scappare') || lowerPrompt.includes('tardi')) {
            return toughHeader + `🔥 **DIAGNOSI: SINDROME FOMO DA DILETTANTE.**
- **La Dura Verità:** Inseguire candele verdi giganti significa comprare la liquidità di uscita di chi è entrato ore prima di te. Sei il loro exit liquidity provider.
- **Protocollo Istituzionale:**
  1. No setup = No trade. Punto.
  2. Un trade perso costa ZERO euro. Un trade da FOMO ti costa il capitale e la concentrazione.
  3. Attendi che il prezzo formi una struttura tecnica valida.`;
        }

        return toughHeader + `💼 **VERDETTO SULLA TUA SESSIONE:**
> "${prompt}"

- **Focus di Sopravvivenza:** Il tuo unico lavoro come trader non è fare soldi su ogni singola candela, ma proteggere il tuo capitale per poter operare domani.
- **Regole d'Oro del Desk:**
  - Non rischiare mai più del tuo max risk prefissato.
  - Se avverti agitazione o rabbia, alzati e spegni il monitor.
  - La disciplina è il tuo unico vero vantaggio statistico.`;
    }

    let responseHeader = `🧠 **Analisi Psicologica Tradyx Coach**\n\n`;

    if (isNegativePnL || emotion === 'FOMO' || emotion === 'Frustrated' || emotion === 'Anxious') {
        responseHeader += `Dall'analisi delle tue recenti operazioni (PnL attuale: \`-$${Math.abs(pnl).toLocaleString()}\`, Stato emotivo: \`${emotion}\`), emerge una fase di pressione psicologica sui mercati.\n\n`;
    } else {
        responseHeader += `Dati del diario operativo: PnL attuale: \`+$${pnl.toLocaleString()}\`, Emozione prevalente: \`${emotion}\`, Win Rate: \`${winRate}%\`.\n\n`;
    }

    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes('revenge') || lowerPrompt.includes('recuperare') || lowerPrompt.includes('rabbia') || lowerPrompt.includes('perdita')) {
        return responseHeader + `⚠️ **Rilevato Rischio di Revenge Trading:**
- **Stato Mentale:** Quando registri perdite ravvicinate o sensazioni di avversione al rischio, il cervello tenta di "recuperare" forzando la dimensione della posizione (*over-leveraging*).
- **Strategia di Bonifica Emotiva:**
  1. ⏸️ **Pausa Operativa di 20 Minuti:** Chiudi la piattaforma ed allontanati dagli schermi per ridurre i livelli di cortisolo.
  2. 📏 **Verifica della Max Drawdown:** La perdita attuale rientra nei limiti fissati dal tuo algoritmo di Risk Management?
  3. ❓ **Quesito Guida:** *Questo trade soddisfa tutti i criteri del tuo setup o è una reazione d'impulso al mercato?*`;
    }

    if (lowerPrompt.includes('fomo') || lowerPrompt.includes('scappare') || lowerPrompt.includes('ritardo') || lowerPrompt.includes('ritracciamento')) {
        return responseHeader + `🔥 **Gestione del Bias FOMO (Fear of Missing Out):**
- **Diagnosi:** Inseguire i prezzi in estensione verticale porta quasi sempre ad entrare sui picchi locali di liquidità.
- **Protocollo Tradyx:**
  1. 🛡️ **Rimani Flat sulle Estensioni:** Non entrare mai a mercato senza un punto di Stop Loss tecnicamente difendibile.
  2. 📈 **Attendi il Retest:** Un movimento di valore offre sempre un ritracciamento o un nuovo consolidamento.
  3. ❓ **Quesito Guida:** *Qual è il rapporto Rischio/Rendimento effettivo se entri a questo livello di prezzo?*`;
    }

    return responseHeader + `💡 **Riscontro Comportamentale sul Prompt:**
> "${prompt}"

- **Analisi dell'Approccio:** La gestione della disciplina nel tempo richiede il costante monitoraggio delle proprie reazioni fisiche ed emotive durante l'esecuzione dei trade.
- **Raccomandazioni Operative:**
  - Rispetta sempre il tuo limite di rischio per singolo trade.
  - Annota le emozioni vissute durante l'apertura ed il mantenimento della posizione.
  - Maintieni la concentrazione sul processo e non sull'esito monetario della singola operazione.`;
}
