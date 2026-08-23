// ============================================================================
// TRADYX TYPE DEFINITIONS - BACKTESTING ENGINE (src/types/backtest.ts)
// Author: Senior Quantitative Developer & Front-End React/TypeScript Expert
// ============================================================================

export interface Candle {
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface BacktestStrategyConfig {
    strategyName: string;
    initialCapital: number;
    asset: string; // e.g. 'BTC/USDT', 'ETH/USDT', 'SOL/USDT'
    timeframe: '1h' | '4h' | '1d';
    buyDipPercentage: number;     // e.g. 2 = Buy if price dips 2% from previous candle close
    takeProfitPercentage: number; // e.g. 5 = Sell if price rises 5% from entry
    stopLossPercentage: number;   // e.g. 2 = Sell if price drops 2% from entry
}

export interface SimulatedTrade {
    id: string;
    type: 'LONG';
    entryDate: string;
    entryPrice: number;
    exitDate: string;
    exitPrice: number;
    pnl: number;
    pnlPercentage: number;
    reason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'END_OF_DATA';
}

export interface EquityPoint {
    timestamp: string;
    equity: number;
}

export interface BacktestResults {
    initialCapital: number;
    finalCapital: number;
    netProfit: number;
    roiPercentage: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number; // %
    profitFactor: number;
    maxDrawdown: number; // %
    maxDrawdownAmount: number;
    tradesList: SimulatedTrade[];
    equityCurve: EquityPoint[];
}
