// ============================================================================
// TRADYX STORY CARD MODAL (9:16 SHAREABLE PREVIEW)
// (src/components/StoryCardModal.tsx)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Trade } from '../types/trade';
import { useSettingsStore } from '../store/useSettingsStore';
import { renderStoryCardCanvas, shareOrDownloadStoryCard } from '../services/storyCardGenerator';
import { triggerHaptic } from '../services/circuitBreakerService';
import { X, Share2, Download, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';

interface StoryCardModalProps {
    trade: Trade;
    onClose: () => void;
}

export const StoryCardModal: React.FC<StoryCardModalProps> = ({ trade, onClose }) => {
    const { formatMoney } = useSettingsStore();
    const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);
    const [isRendering, setIsRendering] = useState<boolean>(true);
    const [isSharing, setIsSharing] = useState<boolean>(false);
    const [actionNotice, setActionNotice] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const generate = async () => {
            setIsRendering(true);
            try {
                const formatted = formatMoney(Number(trade.pnl) || 0, true);
                const url = await renderStoryCardCanvas(trade, formatted);
                if (isMounted) setCardDataUrl(url);
            } catch (err) {
                console.error('Failed to render story card:', err);
            } finally {
                if (isMounted) setIsRendering(false);
            }
        };

        generate();
        return () => { isMounted = false; };
    }, [trade, formatMoney]);

    const handleShare = async () => {
        if (!cardDataUrl || isSharing) return;
        setIsSharing(true);
        triggerHaptic('calm');
        try {
            const res = await shareOrDownloadStoryCard(trade, cardDataUrl);
            if (res.success) {
                setActionNotice(res.method === 'web-share' ? 'Card inviata allo share di sistema!' : 'Story Card scaricata con successo!');
                setTimeout(() => setActionNotice(null), 3500);
            }
        } catch {
            setActionNotice('Errore durante la condivisione');
            setTimeout(() => setActionNotice(null), 3000);
        } finally {
            setIsSharing(false);
        }
    };

    const handleDownload = () => {
        if (!cardDataUrl) return;
        triggerHaptic('click');
        const filename = `tradyx-story-${trade.asset_pair.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        const link = document.createElement('a');
        link.href = cardDataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setActionNotice('Immagine PNG salvata nella cartella Download!');
        setTimeout(() => setActionNotice(null), 3000);
    };

    return (
        <div 
            className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-sm sm:max-w-md bg-[#0D111A]/95 border border-white/[0.12] rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col items-center max-h-[95dvh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="w-full flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#10B981]" />
                        <h3 className="text-xs sm:text-sm font-extrabold text-white font-mono uppercase tracking-wider">
                            Luxury Story Card (9:16)
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full glass-subcard flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer active:scale-95"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Toast Notification */}
                {actionNotice && (
                    <div className="w-full mb-3 p-2.5 rounded-xl bg-[#10B981]/15 border border-[#10B981]/40 flex items-center gap-2 text-xs font-mono font-bold text-[#10B981] animate-in slide-in-from-top-1">
                        <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                        <span>{actionNotice}</span>
                    </div>
                )}

                {/* Card Canvas Preview Container */}
                <div className="w-full relative aspect-[9/16] max-h-[58dvh] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#06080C] flex items-center justify-center">
                    {isRendering ? (
                        <div className="flex flex-col items-center gap-2 text-xs font-mono text-slate-400">
                            <RefreshCw className="w-6 h-6 text-[#10B981] animate-spin" />
                            <span>Generazione Luxury Card 9:16...</span>
                        </div>
                    ) : cardDataUrl ? (
                        <img 
                            src={cardDataUrl} 
                            alt="Tradyx Story Card" 
                            className="w-full h-full object-contain select-none"
                        />
                    ) : (
                        <span className="text-xs font-mono text-rose-400">Errore di rendering</span>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="w-full grid grid-cols-2 gap-2 pt-3">
                    <button
                        type="button"
                        onClick={handleShare}
                        disabled={isRendering || isSharing}
                        className="min-h-[48px] px-3 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-sans font-black text-xs uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-1.5 shadow-lg shadow-[#10B981]/25 cursor-pointer disabled:opacity-50"
                    >
                        <Share2 className="w-4 h-4 shrink-0" />
                        <span>Condividi Story</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleDownload}
                        disabled={isRendering}
                        className="min-h-[48px] px-3 py-2.5 rounded-xl glass-subcard hover:bg-white/10 text-white font-mono font-bold text-xs uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 border border-white/10"
                    >
                        <Download className="w-4 h-4 shrink-0 text-cyan-400" />
                        <span>Scarica PNG</span>
                    </button>
                </div>

                <p className="text-[10px] font-mono text-slate-500 pt-2 text-center">
                    Formato ottimizzato 1080x1920 per Instagram Stories, X (Twitter) e Telegram.
                </p>
            </div>
        </div>
    );
};
