import type { CardRenderOptions } from '../../types';
import { FORMAT_DIMENSIONS } from '../../types';
import {
  drawBackground,
  drawGlassCard,
  drawCoverArt,
  drawPlatformBadge,
  drawBrandFooter,
  wrapText,
} from '../canvasUtils';
import { loadCoverImage } from '../imageLoader';
import { getCoverData } from '../../../../shared/lib/game-covers';
import { formatDurationSeconds, formatUnixDate } from '../../../Stats/lib/statsCalculator';

export async function renderTopGameCard(
  ctx: CanvasRenderingContext2D,
  options: CardRenderOptions
): Promise<void> {
  const { format, overallStats, mapping, t } = options;
  const { width, height } = FORMAT_DIMENSIONS[format];

  // 1. Draw Spotlight background
  drawBackground(ctx, width, height, 'spotlight');

  const topGame = overallStats.topGame;
  if (!topGame || topGame.totalDuration <= 0) {
    // Empty state card
    drawGlassCard(ctx, 80, height * 0.35, width - 160, 240, 24, 'rgba(17, 24, 39, 0.9)');
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 28px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t('stats.rankings.noData'), width * 0.5, height * 0.45);
    drawBrandFooter(ctx, width, height);
    return;
  }

  // Pre-load cover
  const { url } = getCoverData(topGame.game.game_id, mapping);
  const coverImg = await loadCoverImage(url);

  // 2. Vertical Poster Layout (1080 x 1920)
  if (format === 'vertical') {
    const marginX = 72;

    // Top Trophy Tag
    ctx.save();
    ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(marginX, 96, 260, 38, 19);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#F59E0B';
    ctx.font = '900 14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`👑 #1 ${t('stats.overview.topGame').toUpperCase()}`, marginX + 130, 96 + 20);

    // Header Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 52px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(t('share.model.topGame'), marginX, 154);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = '600 18px Inter, system-ui, sans-serif';
    ctx.fillText(t('stats.rankings.subtitle'), marginX, 222);
    ctx.restore();

    // Giant Poster Cover Container
    const coverW = width - marginX * 2;
    const coverH = 680;
    const coverY = 280;

    // Glowing backlight under cover
    ctx.save();
    ctx.shadowColor = 'rgba(245, 158, 11, 0.25)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 16;
    drawCoverArt(ctx, coverImg, marginX, coverY, coverW, coverH, 32, topGame.game.game_name, topGame.game.game_id, topGame.game.category);
    ctx.restore();

    // Game Title & Platform
    const infoY = coverY + coverH + 48;
    drawPlatformBadge(ctx, topGame.game.category, marginX, infoY, 36);

    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 48px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const titleLines = wrapText(ctx, topGame.game.game_name, width - marginX * 2);
    titleLines.slice(0, 2).forEach((l, i) => {
      ctx.fillText(l, marginX, infoY + 54 + i * 56);
    });

    const titleBottomY = infoY + 54 + Math.min(titleLines.length, 2) * 56;

    // Serial
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '600 18px monospace';
    ctx.fillText(`${t('stats.modal.serial')}: ${topGame.game.game_id}`, marginX, titleBottomY + 12);

    // Hero Playtime Box
    const boxY = titleBottomY + 56;
    const boxW = width - marginX * 2;
    const boxH = 180;
    drawGlassCard(ctx, marginX, boxY, boxW, boxH, 28, 'rgba(17, 24, 39, 0.85)', 'rgba(245, 158, 11, 0.35)');

    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = '800 14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.overview.totalPlaytime').toUpperCase(), marginX + 36, boxY + 44);

    ctx.fillStyle = '#F59E0B';
    ctx.font = '900 64px Inter, system-ui, sans-serif';
    ctx.fillText(formatDurationSeconds(topGame.totalDuration), marginX + 36, boxY + 118);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '800 22px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${topGame.percentageOfTotal}%`, marginX + boxW - 36, boxY + 86);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '600 13px Inter, system-ui, sans-serif';
    ctx.fillText(t('stats.overview.ofTotalTime').toUpperCase(), marginX + boxW - 36, boxY + 114);

    // Extra Stats 2-column grid
    const extraY = boxY + boxH + 24;
    const cardHalfW = (boxW - 20) * 0.5;
    const cardHalfH = 110;

    // Card 1: Sessions
    drawGlassCard(ctx, marginX, extraY, cardHalfW, cardHalfH, 20);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '800 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.overview.totalSessions').toUpperCase(), marginX + 24, extraY + 36);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 32px Inter, system-ui, sans-serif';
    ctx.fillText(String(topGame.sessionCount), marginX + 24, extraY + 80);

    // Card 2: First Played
    drawGlassCard(ctx, marginX + cardHalfW + 20, extraY, cardHalfW, cardHalfH, 20);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '800 13px Inter, system-ui, sans-serif';
    ctx.fillText(t('stats.modal.firstPlayed').toUpperCase(), marginX + cardHalfW + 44, extraY + 36);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 20px Inter, system-ui, sans-serif';
    ctx.fillText(topGame.firstPlayed ? formatUnixDate(topGame.firstPlayed) : '-', marginX + cardHalfW + 44, extraY + 76);

    ctx.restore();
  } else if (format === 'square') {
    // SQUARE COLLECTOR ALBUM (1080 x 1080)
    const margin = 64;

    // Top Header
    ctx.save();
    ctx.fillStyle = '#F59E0B';
    ctx.font = '900 14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`👑 #1 ${t('stats.overview.topGame').toUpperCase()}`, margin, 74);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 38px Inter, system-ui, sans-serif';
    const topLines = wrapText(ctx, topGame.game.game_name, width - margin * 2);
    ctx.fillText(topLines[0], margin, 122);
    ctx.restore();

    // Central Showcase: Left Cover (420x420) / Right Metrics
    const coverW = 460;
    const coverH = 460;
    const coverY = 170;

    drawCoverArt(ctx, coverImg, margin, coverY, coverW, coverH, 28, topGame.game.game_name, topGame.game.game_id, topGame.game.category);

    const rightX = margin + coverW + 36;
    const rightW = width - rightX - margin;

    // Big Hours Box
    drawGlassCard(ctx, rightX, coverY, rightW, 215, 24, 'rgba(17, 24, 39, 0.85)', 'rgba(245, 158, 11, 0.4)');
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '800 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.overview.totalPlaytime').toUpperCase(), rightX + 28, coverY + 42);

    ctx.fillStyle = '#F59E0B';
    ctx.font = '900 46px Inter, system-ui, sans-serif';
    ctx.fillText(formatDurationSeconds(topGame.totalDuration), rightX + 28, coverY + 104);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '600 15px Inter, system-ui, sans-serif';
    ctx.fillText(`${topGame.percentageOfTotal}% ${t('stats.overview.ofTotalTime')}`, rightX + 28, coverY + 152);
    ctx.restore();

    // Stats Grid on Right
    drawGlassCard(ctx, rightX, coverY + 235, rightW, 225, 24);
    ctx.save();
    drawPlatformBadge(ctx, topGame.game.category, rightX + 28, coverY + 265, 28);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '800 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.modal.serial').toUpperCase(), rightX + 28, coverY + 330);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 18px monospace';
    ctx.fillText(topGame.game.game_id, rightX + 28, coverY + 356);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '800 12px Inter, system-ui, sans-serif';
    ctx.fillText(t('stats.overview.totalSessions').toUpperCase(), rightX + 28, coverY + 395);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 24px Inter, system-ui, sans-serif';
    ctx.fillText(`${topGame.sessionCount}`, rightX + 28, coverY + 426);
    ctx.restore();

    // Bottom Quote / Summary strip
    const stripY = coverY + coverH + 34;
    const stripW = width - margin * 2;
    drawGlassCard(ctx, margin, stripY, stripW, 140, 22);

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '700 18px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${t('stats.modal.firstPlayed')}: ${topGame.firstPlayed ? formatUnixDate(topGame.firstPlayed) : '-'}`, margin + 32, stripY + 54);
    ctx.fillText(`${t('stats.modal.lastPlayed')}: ${topGame.lastPlayed ? formatUnixDate(topGame.lastPlayed) : '-'}`, margin + 32, stripY + 94);

    ctx.fillStyle = '#3B82F6';
    ctx.font = '800 22px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(t('stats.rankings.gold'), margin + stripW - 32, stripY + 74);
    ctx.restore();
  } else {
    // HORIZONTAL POSTER (1200 x 630)
    const margin = 56;
    const coverW = 440;
    const coverH = 430;
    const coverY = 100;

    drawCoverArt(ctx, coverImg, margin, coverY, coverW, coverH, 26, topGame.game.game_name, topGame.game.game_id, topGame.game.category);

    // Right Side Info
    const rightX = margin + coverW + 42;
    const rightW = width - rightX - margin;

    ctx.save();
    // Badge
    ctx.fillStyle = '#F59E0B';
    ctx.font = '900 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`👑 #1 ${t('stats.overview.topGame').toUpperCase()}`, rightX, 114);

    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 40px Inter, system-ui, sans-serif';
    ctx.textBaseline = 'top';
    const lines = wrapText(ctx, topGame.game.game_name, rightW);
    ctx.fillText(lines[0], rightX, 134);

    drawPlatformBadge(ctx, topGame.game.category, rightX, 195, 26);

    // Playtime Glass Box
    const boxY = 240;
    drawGlassCard(ctx, rightX, boxY, rightW, 160, 22, 'rgba(17, 24, 39, 0.85)', 'rgba(245, 158, 11, 0.35)');

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '800 12px Inter, system-ui, sans-serif';
    ctx.fillText(t('stats.overview.totalPlaytime').toUpperCase(), rightX + 28, boxY + 36);

    ctx.fillStyle = '#F59E0B';
    ctx.font = '900 44px Inter, system-ui, sans-serif';
    ctx.fillText(formatDurationSeconds(topGame.totalDuration), rightX + 28, boxY + 92);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '600 14px Inter, system-ui, sans-serif';
    ctx.fillText(`${topGame.percentageOfTotal}% ${t('stats.overview.ofTotalTime')} • ${topGame.sessionCount} ${t('stats.modal.totalSessions').toLowerCase()}`, rightX + 28, boxY + 130);

    // Bottom detail row (stacked to avoid collision)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '600 13px monospace';
    ctx.fillText(`${t('stats.modal.serial')}: ${topGame.game.game_id}`, rightX, 430);
    ctx.fillText(`${t('stats.modal.firstPlayed')}: ${topGame.firstPlayed ? formatUnixDate(topGame.firstPlayed) : '-'}`, rightX, 454);
    ctx.restore();
  }

  // 3. Draw Watermark Footer
  drawBrandFooter(ctx, width, height);
}
