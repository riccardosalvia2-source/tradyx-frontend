// ============================================================================
// TRADYX LUXURY P&L STORY CARD GENERATOR (9:16 VERTICAL VIRAL CARD)
// (src/services/storyCardGenerator.ts)
// High-End Dark Fintech Aesthetics, Quasar Bubble Glow, Web Share API
// ============================================================================

import { Trade } from '../types/trade';

/**
 * Renders a pixel-perfect 1080x1920 9:16 story card on an HTML5 Canvas.
 */
export async function renderStoryCardCanvas(
    trade: Trade,
    formattedMoney: string
): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas 2d context');

    const pnl = Number(trade.pnl) || 0;
    const isProfit = pnl >= 0;
    const primaryColor = isProfit ? '#10B981' : '#DC2626';
    const secondaryColor = isProfit ? '#00FFFF' : '#FF5500';

    // 1. Sleek Dark Gradient Background (#06080C -> #0D111A)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1920);
    bgGrad.addColorStop(0, '#07090E');
    bgGrad.addColorStop(0.5, '#0B0F17');
    bgGrad.addColorStop(1, '#05070A');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // 2. Ambient Quasar Aura Glow
    const auraGrad = ctx.createRadialGradient(540, 750, 50, 540, 750, 550);
    auraGrad.addColorStop(0, isProfit ? 'rgba(16, 185, 129, 0.28)' : 'rgba(220, 38, 38, 0.28)');
    auraGrad.addColorStop(0.6, isProfit ? 'rgba(0, 240, 255, 0.10)' : 'rgba(255, 85, 0, 0.08)');
    auraGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = auraGrad;
    ctx.fillRect(0, 200, 1080, 1100);

    // 3. Subtle Hex/Grid Border & Card Frame
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 3;
    ctx.roundRect(40, 40, 1000, 1840, 48);
    ctx.stroke();

    // 4. Header: Tradyx Logo & Brand Header
    // Icon badge
    ctx.fillStyle = '#111622';
    ctx.roundRect(90, 90, 80, 80, 22);
    ctx.fill();
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = primaryColor;
    ctx.font = '900 48px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('T', 130, 148);

    // Brand Text
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 38px Inter, sans-serif';
    ctx.fillText('TRADYX PROTOCOL', 195, 130);

    ctx.fillStyle = '#9CA3AF';
    ctx.font = '600 20px monospace';
    ctx.fillText('INSTITUTIONAL EXECUTION AUDIT • PROTOCOL 4.2', 195, 162);

    // Verified Pill Top-Right
    ctx.fillStyle = isProfit ? 'rgba(16, 185, 129, 0.15)' : 'rgba(220, 38, 38, 0.15)';
    ctx.roundRect(800, 95, 190, 54, 27);
    ctx.fill();
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = primaryColor;
    ctx.font = '800 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(isProfit ? '● VERIFIED P&L' : '● RISK MANAGED', 895, 130);

    // 5. Central Quasar Bubble Orb Rendering
    const orbCenterX = 540;
    const orbCenterY = 580;
    const orbRadius = 190;

    // Outer Glow Ring
    ctx.save();
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 80;
    const orbGrad = ctx.createRadialGradient(
        orbCenterX - 50, orbCenterY - 50, 20,
        orbCenterX, orbCenterY, orbRadius
    );
    orbGrad.addColorStop(0, '#FFFFFF');
    orbGrad.addColorStop(0.3, primaryColor);
    orbGrad.addColorStop(0.8, secondaryColor);
    orbGrad.addColorStop(1, '#050B14');
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(orbCenterX, orbCenterY, orbRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Specular bubble highlight
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(orbCenterX - 60, orbCenterY - 70, 60, 30, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Center Orb Badge: Sentiment
    ctx.fillStyle = 'rgba(8, 12, 20, 0.75)';
    ctx.roundRect(orbCenterX - 110, orbCenterY + 80, 220, 50, 25);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`QUASAR • ${trade.psychology || trade.emotional_state || 'CALM'}`, orbCenterX, orbCenterY + 112);

    // 6. Asset & Direction Banner
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 64px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(trade.asset_pair, 540, 890);

    // Direction Pill
    const dirWidth = 200;
    const dirX = 540 - dirWidth / 2;
    ctx.fillStyle = trade.direction === 'LONG' ? '#10B981' : '#DC2626';
    ctx.roundRect(dirX, 920, dirWidth, 54, 16);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 24px monospace';
    ctx.fillText(`${trade.direction} ORDER`, 540, 956);

    // 7. Giant Net P&L & ROI Performance
    ctx.fillStyle = primaryColor;
    ctx.font = '900 108px Inter, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(formattedMoney, 540, 1110);

    const roiVal = trade.roi !== undefined ? `${trade.roi >= 0 ? '+' : ''}${trade.roi}%` : '+0.0%';
    ctx.fillStyle = isProfit ? 'rgba(16, 185, 129, 0.9)' : 'rgba(220, 38, 38, 0.9)';
    ctx.font = '800 36px monospace';
    ctx.fillText(`NET ROI: ${roiVal}`, 540, 1175);

    // 8. Execution Details Box
    const boxX = 110;
    const boxY = 1240;
    const boxW = 860;
    const boxH = 340;

    ctx.fillStyle = 'rgba(17, 23, 34, 0.85)';
    ctx.roundRect(boxX, boxY, boxW, boxH, 28);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Data rows inside the box
    const drawRow = (label: string, val: string, yPos: number) => {
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '600 24px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(label, boxX + 40, yPos);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '800 26px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(val, boxX + boxW - 40, yPos);
    };

    drawRow('ENTRY PRICE', trade.entry_price != null ? `$${trade.entry_price.toLocaleString()}` : 'MARKET', boxY + 70);
    drawRow('EXIT PRICE', trade.exit_price != null ? `$${trade.exit_price.toLocaleString()}` : 'IN EXECUTION', boxY + 140);
    drawRow('POSITION SIZE / R:R', `${trade.position_size ?? 1.0} • R:R ${trade.risk_reward || '1:3.0'}`, boxY + 210);
    drawRow('STRATEGY SETUP', trade.strategy || 'Trend Following / Breakout', boxY + 280);

    // 9. Discipline Badges Row
    const badgeY = 1630;
    const badge1 = trade.errors && trade.errors.length > 0 ? trade.errors[0] : 'CLEAN DISCIPLINE';
    const badgeColor1 = trade.errors && trade.errors.length > 0 ? '#DC2626' : '#10B981';

    // Badge 1
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.roundRect(110, badgeY, 410, 60, 16);
    ctx.fill();
    ctx.strokeStyle = badgeColor1;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = badgeColor1;
    ctx.font = '800 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`🛡️ ${badge1}`, 315, badgeY + 38);

    // Badge 2
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.roundRect(560, badgeY, 410, 60, 16);
    ctx.fill();
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#60A5FA';
    ctx.font = '800 20px monospace';
    ctx.fillText('⚡ 100% PROTOCOL RULES', 765, badgeY + 38);

    // 10. Footer / Brand Watermark
    ctx.fillStyle = '#6B7280';
    ctx.font = '500 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TRADYX ADVANCED QUANT JOURNAL • AI EMOTIONAL DISCIPLINE', 540, 1780);

    ctx.fillStyle = '#4B5563';
    ctx.font = '400 16px monospace';
    ctx.fillText('Verify session logs at tradyx.ai • Decentralized Behavioral Vault', 540, 1815);

    return canvas.toDataURL('image/png');
}

/**
 * Shares the 9:16 story card using Web Share API or triggers download fallback.
 */
export async function shareOrDownloadStoryCard(
    trade: Trade,
    dataUrl: string
): Promise<{ success: boolean; method: 'web-share' | 'download' }> {
    const filename = `tradyx-story-${trade.asset_pair.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.png`;

    try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], filename, { type: 'image/png' });

        if (
            typeof navigator !== 'undefined' &&
            navigator.canShare &&
            navigator.canShare({ files: [file] })
        ) {
            await navigator.share({
                title: `Tradyx Trade: ${trade.asset_pair} (${(Number(trade.pnl) || 0) >= 0 ? '+' : ''}$${trade.pnl})`,
                text: `Session log registrata su Tradyx Protocol con disciplina emotiva Quasar. #Tradyx #Trading #Fintech`,
                files: [file]
            });
            return { success: true, method: 'web-share' };
        }
    } catch (e: any) {
        if (e.name === 'AbortError') {
            return { success: false, method: 'web-share' };
        }
        console.warn('Web Share API not supported or declined, falling back to download:', e);
    }

    // Direct browser download fallback
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true, method: 'download' };
}
