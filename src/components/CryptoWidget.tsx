// ============================================================================
// TRADYX LIVE CRYPTO WIDGET COMPONENT (src/components/CryptoWidget.tsx)
// Author: Senior Front-End Developer & API Integration Expert
// Description: Glassmorphic live market widget for BTC, ETH, SOL with 60s cache
//              TTL counter, manual refresh button, and offline fallback badge.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { fetchCryptoPrices } from '../services/cryptoService';
import { CryptoPrice, CryptoFetchResult } from '../types/market';
import { RefreshCw, TrendingUp, TrendingDown, Coins, ShieldAlert } from 'lucide-react';

export const CryptoWidget: React.FC = () => {
    const [prices, setPrices] = useState<CryptoPrice[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [isFallback, setIsFallback] = useState<boolean>(false);
    const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
    const [secondsAgo, setSecondsAgo] = useState<number>(0);

    useEffect(() => {
        let isMounted = true;
        const initPrices = async () => {
            setIsLoading(true);
            const result: CryptoFetchResult = await fetchCryptoPrices(false);
            if (isMounted) {
                setPrices(result.data);
                setIsFallback(result.isFallback);
                setLastUpdated(result.lastUpdated);
                setIsLoading(false);
            }
        };
        initPrices();
        return () => { isMounted = false; };
    }, []);

    const loadPrices = async (force = false) => {
        if (force) setIsRefreshing(true);
        else setIsLoading(true);

        const result: CryptoFetchResult = await fetchCryptoPrices(force);
        setPrices(result.data);
        setIsFallback(result.isFallback);
        setLastUpdated(result.lastUpdated);
        setIsLoading(false);
        setIsRefreshing(false);
    };

    // Timer updating "Updated X seconds ago" counter every second
    useEffect(() => {
        const interval = setInterval(() => {
            setSecondsAgo(Math.floor((Date.now() - lastUpdated) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [lastUpdated]);


    return (
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl shadow-2xl space-y-4">
            
            {/* Widget Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-tr from-amber-500 to-yellow-600 rounded-xl shadow-lg shadow-amber-500/20 text-slate-950">
                        <Coins className="w-5 h-5 font-bold" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                            Crypto Market Ticker
                        </h3>
                        <div className="text-[11px] text-slate-400 font-mono">
                            Top Assets • 60s Cache Protection
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Fallback / Offline Notice */}
                    {isFallback && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-800 text-[10px] text-amber-300 font-semibold shadow">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                            Modalità Cache / Offline
                        </div>
                    )}

                    {/* Seconds Ago Counter & Refresh Button */}
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                        <span className="hidden sm:inline">Aggiornato {secondsAgo}s fa</span>
                        <button
                            type="button"
                            onClick={() => loadPrices(true)}
                            disabled={isRefreshing || isLoading}
                            className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 transition active:scale-95 disabled:opacity-50"
                            title="Forza Aggiornamento Prezzi"
                        >
                            <RefreshCw className={`w-4 h-4 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Asset Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-24 bg-slate-950/60 border border-slate-800/80 rounded-2xl animate-pulse" />
                    ))
                ) : (
                    prices.map((asset) => {
                        const isPositive = asset.price_change_percentage_24h >= 0;

                        return (
                            <div
                                key={asset.id}
                                className="bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 p-4 rounded-2xl flex flex-col justify-between transition shadow-lg group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        {asset.image ? (
                                            <img src={asset.image} alt={asset.name} className="w-7 h-7 rounded-full shadow" />
                                        ) : (
                                            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                                                {asset.symbol.toUpperCase().slice(0, 2)}
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-extrabold text-sm text-slate-100 group-hover:text-cyan-400 transition">
                                                {asset.symbol.toUpperCase()}
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-medium">{asset.name}</div>
                                        </div>
                                    </div>

                                    {/* 24h Change Badge */}
                                    <div className={`px-2 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 ${
                                        isPositive ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800' : 'bg-rose-950/80 text-rose-400 border border-rose-800'
                                    }`}>
                                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        {isPositive ? `+${asset.price_change_percentage_24h.toFixed(2)}%` : `${asset.price_change_percentage_24h.toFixed(2)}%`}
                                    </div>
                                </div>

                                <div className="mt-3">
                                    <div className="text-lg font-black font-mono text-slate-100 tracking-tight">
                                        ${asset.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
