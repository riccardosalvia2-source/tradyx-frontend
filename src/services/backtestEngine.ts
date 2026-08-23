// ============================================================================
// TRADYX QUANTITATIVE BACKTESTING ENGINE (src/services/backtestEngine.ts)
// Author: Senior Quantitative Developer & Front-End React/TypeScript Expert
// Description: Mathematically precise backtest engine processing OHLCV candles,
//              Buy Dip triggers, Take Profit/Stop Loss limits, Equity Curve,
//              and Risk Analytics (Max Drawdown, Profit Factor, ROI).
// ============================================================================

import { 
    Candle, 
    BacktestStrategyConfig, 
    SimulatedTrade, 
    BacktestResults, 
    EquityPoint 
} from '../types/backtest';
import { supabase } from '../store/useTradeStore';

/**
 * Generates realistic historical OHLCV candle data for backtesting.
 */
export function generateHistoricalCandles(asset: string, timeframe: '1h' | '4h' | '1d', count = 150): Candle[] {
    const candles: Candle[] = [];
    let basePrice = asset.includes('BTC') ? 60000 : asset.includes('ETH') ? 3200 : asset.includes('SOL') ? 180 : 100;
    let currentPrice = basePrice;
    const now = Date.now();
    const intervalMs = timeframe === '1h' ? 3600000 : timeframe === '4h' ? 14400000 : 86400000;

    for (let i = count; i >= 0; i--) {
        const timestamp = new Date(now - i * intervalMs).toISOString();
        const changePct = (Math.random() - 0.49) * 0.035; // Volatility walk
        const open = currentPrice;
        const close = Math.max(open * (1 + changePct), 1);
        const high = Math.max(open, close) * (1 + Math.random() * 0.015);
        const low = Math.min(open, close) * (1 - Math.random() * 0.015);
        const volume = Math.floor(Math.random() * 50000) + 10000;

        candles.push({ timestamp, open, high, low, close, volume });
        currentPrice = close;
    }

    return candles;
}

/**
 * Executes a quantitative backtest simulation over historical candles.
 * 
 * @param {Candle[]} candles OHLCV historical price data
 * @param {BacktestStrategyConfig} config Strategy rules and risk management parameters
 * @returns {BacktestResults} Complete performance analytics and simulated trades list
 */
export function runBacktest(candles: Candle[], config: BacktestStrategyConfig): BacktestResults {
    if (!candles || candles.length < 2) {
        throw new Error('Insufficient historical candle data for backtesting.');
    }

    let capital = Number(config.initialCapital);
    const initialCapital = capital;
    let peakCapital = capital;
    let maxDrawdownPct = 0;
    let maxDrawdownAmount = 0;

    let position: {
        id: string;
        entryPrice: number;
        entryDate: string;
        units: number;
    } | null = null;

    const tradesList: SimulatedTrade[] = [];
    const equityCurve: EquityPoint[] = [
        { timestamp: candles[0].timestamp, equity: capital }
    ];

    let tradeCounter = 1;

    for (let i = 1; i < candles.length; i++) {
        const currentCandle = candles[i];
        const prevCandle = candles[i - 1];

        // 1. Calculate Current Equity & Track Drawdown
        let currentEquity = capital;
        if (position) {
            currentEquity = position.units * currentCandle.close;
        }

        if (currentEquity > peakCapital) {
            peakCapital = currentEquity;
        }

        const currentDrawdownAmt = peakCapital - currentEquity;
        const currentDrawdownPct = peakCapital > 0 ? (currentDrawdownAmt / peakCapital) * 100 : 0;

        if (currentDrawdownPct > maxDrawdownPct) {
            maxDrawdownPct = currentDrawdownPct;
            maxDrawdownAmount = currentDrawdownAmt;
        }

        equityCurve.push({
            timestamp: currentCandle.timestamp,
            equity: Number(currentEquity.toFixed(2))
        });

        // 2. Manage Active Position (Check TP and SL triggers)
        if (position) {
            const targetTP = position.entryPrice * (1 + config.takeProfitPercentage / 100);
            const targetSL = position.entryPrice * (1 - config.stopLossPercentage / 100);

            let exitPrice: number | null = null;
            let reason: 'TAKE_PROFIT' | 'STOP_LOSS' | null = null;

            // Check if High reached Take Profit
            if (currentCandle.high >= targetTP) {
                exitPrice = targetTP;
                reason = 'TAKE_PROFIT';
            } 
            // Check if Low hit Stop Loss
            else if (currentCandle.low <= targetSL) {
                exitPrice = targetSL;
                reason = 'STOP_LOSS';
            }

            if (exitPrice !== null && reason !== null) {
                const pnl = (exitPrice - position.entryPrice) * position.units;
                const pnlPercentage = ((exitPrice - position.entryPrice) / position.entryPrice) * 100;
                capital = position.units * exitPrice;

                tradesList.push({
                    id: `sim-trade-${tradeCounter++}`,
                    type: 'LONG',
                    entryDate: position.entryDate,
                    entryPrice: Number(position.entryPrice.toFixed(2)),
                    exitDate: currentCandle.timestamp,
                    exitPrice: Number(exitPrice.toFixed(2)),
                    pnl: Number(pnl.toFixed(2)),
                    pnlPercentage: Number(pnlPercentage.toFixed(2)),
                    reason
                });

                position = null; // Position closed
            }
        } 
        // 3. Evaluate Entry Signal (Buy Dip Condition)
        else {
            const dipPercentage = ((prevCandle.close - currentCandle.low) / prevCandle.close) * 100;

            if (dipPercentage >= config.buyDipPercentage) {
                const entryPrice = prevCandle.close * (1 - config.buyDipPercentage / 100);
                const units = capital / entryPrice;

                position = {
                    id: `pos-${i}`,
                    entryPrice,
                    entryDate: currentCandle.timestamp,
                    units
                };
                capital = 0; // Capital fully allocated to trade position
            }
        }
    }

    // Close any position remaining open at end of historical dataset
    if (position) {
        const lastCandle = candles[candles.length - 1];
        const exitPrice = lastCandle.close;
        const pnl = (exitPrice - position.entryPrice) * position.units;
        const pnlPercentage = ((exitPrice - position.entryPrice) / position.entryPrice) * 100;
        capital = position.units * exitPrice;

        tradesList.push({
            id: `sim-trade-${tradeCounter++}`,
            type: 'LONG',
            entryDate: position.entryDate,
            entryPrice: Number(position.entryPrice.toFixed(2)),
            exitDate: lastCandle.timestamp,
            exitPrice: Number(exitPrice.toFixed(2)),
            pnl: Number(pnl.toFixed(2)),
            pnlPercentage: Number(pnlPercentage.toFixed(2)),
            reason: 'END_OF_DATA'
        });
    }

    const finalCapital = Number(capital.toFixed(2));
    const netProfit = Number((finalCapital - initialCapital).toFixed(2));
    const roiPercentage = Number(((netProfit / initialCapital) * 100).toFixed(2));

    const totalTrades = tradesList.length;
    const winningTrades = tradesList.filter(t => t.pnl > 0).length;
    const losingTrades = tradesList.filter(t => t.pnl < 0).length;
    const winRate = totalTrades > 0 ? Number(((winningTrades / totalTrades) * 100).toFixed(2)) : 0;

    const grossProfit = tradesList.filter(t => t.pnl > 0).reduce((acc, t) => acc + t.pnl, 0);
    const grossLoss = tradesList.filter(t => t.pnl < 0).reduce((acc, t) => acc + t.pnl, 0);

    let profitFactor = 0;
    if (Math.abs(grossLoss) > 0) {
        profitFactor = Number((grossProfit / Math.abs(grossLoss)).toFixed(2));
    } else if (grossProfit > 0) {
        profitFactor = Number(grossProfit.toFixed(2));
    }

    return {
        initialCapital,
        finalCapital,
        netProfit,
        roiPercentage,
        totalTrades,
        winningTrades,
        losingTrades,
        winRate,
        profitFactor,
        maxDrawdown: Number(maxDrawdownPct.toFixed(2)),
        maxDrawdownAmount: Number(maxDrawdownAmount.toFixed(2)),
        tradesList,
        equityCurve
    };
}

/**
 * Persists a backtest strategy configuration to Supabase strategies table (rules_config JSONB).
 */
export async function saveStrategyToSupabase(
    config: BacktestStrategyConfig,
    results: BacktestResults,
    userId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const payload = {
            user_id: userId,
            strategy_name: config.strategyName,
            rules_config: {
                config,
                summary_metrics: {
                    initialCapital: results.initialCapital,
                    finalCapital: results.finalCapital,
                    netProfit: results.netProfit,
                    roiPercentage: results.roiPercentage,
                    winRate: results.winRate,
                    profitFactor: results.profitFactor,
                    maxDrawdown: results.maxDrawdown
                },
                saved_at: new Date().toISOString()
            }
        };

        const { data, error } = await supabase
            .from('strategies')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (err: any) {
        console.warn('Supabase strategy persistence warning:', err.message);
        return { success: false, error: err.message };
    }
}
