// ============================================================================
// TRADYX QUASAR BUBBLE SENTIMENT SERVERLESS FUNCTION
// (api/quasar-sentiment.ts)
// Secure Serverless Endpoint for Quasar Sentiment Analysis & 3D Matrix
// ============================================================================

export interface TradeInput {
    id?: string;
    pnl?: number | string;
    emotional_state?: string;
    [key: string]: any;
}

export interface QuasarSentimentResponse {
    sentimentScore: number;
    status: 'BULLISH_DISCIPLINED' | 'LOSS_UNSTABLE';
    label: string;
    isProfitable: boolean;
    headline: string;
    summary: string;
    aiAdvice: string;
    totalPnl: number;
    dominantEmotion: string;
    bubbleConfig: {
        primaryColor: string;
        secondaryColor: string;
        speed: number;
        turbulence: number;
        pulseRate: number;
        glowIntensity: number;
    };
}

const DEFAULT_BUBBLE_CONFIG = {
    primaryColor: '#8A2BE2',
    secondaryColor: '#00FFFF',
    speed: 0.8,
    turbulence: 0.2,
    pulseRate: 1.0,
    glowIntensity: 1.0
};

function computeBubbleConfigInternal(trades: TradeInput[]) {
    if (!trades || !Array.isArray(trades) || trades.length === 0) {
        return DEFAULT_BUBBLE_CONFIG;
    }

    const recentTrades = trades.slice(0, 10);
    const totalPnl = recentTrades.reduce((acc, t) => acc + (Number(t?.pnl) || 0), 0);

    const emotionCounts: Record<string, number> = {
        Calm: 0,
        Disciplined: 0,
        Greedy: 0,
        Anxious: 0,
        FOMO: 0,
        Frustrated: 0
    };

    recentTrades.forEach(t => {
        if (t && t.emotional_state && emotionCounts[t.emotional_state] !== undefined) {
            emotionCounts[t.emotional_state]++;
        }
    });

    let dominantEmotion = 'Calm';
    let maxCount = -1;
    Object.keys(emotionCounts).forEach(e => {
        if (emotionCounts[e] > maxCount) {
            maxCount = emotionCounts[e];
            dominantEmotion = e;
        }
    });

    const isProfitable = totalPnl >= 0;

    if (isProfitable && (dominantEmotion === 'Calm' || dominantEmotion === 'Disciplined')) {
        return {
            primaryColor: '#00F0FF',
            secondaryColor: '#0047FF',
            speed: 0.5,
            turbulence: 0.1,
            pulseRate: 0.8,
            glowIntensity: 1.2
        };
    }

    if (isProfitable && dominantEmotion === 'Greedy') {
        return {
            primaryColor: '#00FF88',
            secondaryColor: '#FFD700',
            speed: 1.2,
            turbulence: 0.4,
            pulseRate: 1.4,
            glowIntensity: 1.5
        };
    }

    if (!isProfitable || dominantEmotion === 'FOMO' || dominantEmotion === 'Anxious' || dominantEmotion === 'Frustrated') {
        return {
            primaryColor: '#FF0055',
            secondaryColor: '#FF5500',
            speed: 2.5,
            turbulence: 0.85,
            pulseRate: 2.2,
            glowIntensity: 1.8
        };
    }

    return DEFAULT_BUBBLE_CONFIG;
}

export default function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    let trades: TradeInput[] = [];

    try {
        if (req.method === 'POST') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            if (body && Array.isArray(body.trades)) {
                trades = body.trades;
            }
        }
    } catch (e) {
        trades = [];
    }

    const recentTrades = Array.isArray(trades) ? trades.slice(0, 10) : [];
    const totalPnl = recentTrades.reduce((acc, t) => acc + (Number(t?.pnl) || 0), 0);
    const isProfitable = totalPnl >= 0;

    const emotionCounts: Record<string, number> = {
        Calm: 0,
        Disciplined: 0,
        Greedy: 0,
        Anxious: 0,
        FOMO: 0,
        Frustrated: 0
    };
    recentTrades.forEach(t => {
        if (t && t.emotional_state && emotionCounts[t.emotional_state] !== undefined) {
            emotionCounts[t.emotional_state]++;
        }
    });

    let dominantEmotion = 'Calm';
    let maxCount = -1;
    Object.keys(emotionCounts).forEach(e => {
        if (emotionCounts[e] > maxCount) {
            maxCount = emotionCounts[e];
            dominantEmotion = e;
        }
    });

    const sentimentScore = isProfitable ? 85 : 70;
    const status: 'BULLISH_DISCIPLINED' | 'LOSS_UNSTABLE' = isProfitable ? 'BULLISH_DISCIPLINED' : 'LOSS_UNSTABLE';
    const label = isProfitable ? '• 85% Bullish & Disciplinato' : '• 70% Loss & Instabile';
    const headline = isProfitable
        ? '✨ La galassia operativa mostra un’eccellente stabilità ed aderenza al trading plan.'
        : '⚠️ La galassia oggi è fortemente in perdita. Il mercato è instabile ed incerto.';
    const summary = isProfitable
        ? 'Stai battendo il mercato: mantieni il focus e sfrutta le inefficienze senza cedere all\'avidità.'
        : 'Aumento della volatilità generale. L\'algoritmo raccomanda di non forzare entrate di recupero impulsivo.';
    const aiAdvice = isProfitable
        ? 'Mantenere il piano di Risk Management. In presenza di profitti superiori al 3% giornaliero, valutare la presa di profitto parziale.'
        : 'Pausa tattica raccomandata. Non tentare il Revenge Trading per recuperare i drawdown della sessione.';

    const bubbleConfig = computeBubbleConfigInternal(trades);

    const payload: QuasarSentimentResponse = {
        sentimentScore,
        status,
        label,
        isProfitable,
        headline,
        summary,
        aiAdvice,
        totalPnl,
        dominantEmotion,
        bubbleConfig
    };

    return res.status(200).json(payload);
}
