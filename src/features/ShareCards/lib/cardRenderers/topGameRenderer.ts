import type { CardRenderOptions } from '../../types';
import { FORMAT_DIMENSIONS } from '../../types';
import {
  drawBackground,
  drawGlassCard,
  drawCoverArt,
  drawPlatformBadge,
  drawBrandFooter,
  drawPlaytimeHeroBlock,
  wrapText,
} from '../canvasUtils';
import { loadCoverImage } from '../imageLoader';
import { getCoverData } from '../../../../shared/lib/game-covers';
import { formatDurationSeconds, formatUnixDate } from '../../../Stats/lib/statsCalculator';

export async function renderTopGameCard(
  ctx: CanvasRenderingContext2D,
  options: CardRenderOptions
): Promise<void> {
  const { format, overallStats, mapping, t, locale, brandAssets } = options;
  const { width, height } = FORMAT_DIMENSIONS[format];

  // 1. Draw Spotlight background
  drawBackground(ctx, width, height, 'spotlight');

  const topGame = overallStats.topGame;
  if (!topGame || topGame.totalDuration < 60) {
    // Empty state card
    drawGlassCard(ctx, 80, height * 0.35, width - 160, 240, 24, 'rgba(17, 24, 39, 0.9)');
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 28px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t('stats.rankings.noData'), width * 0.5, height * 0.45);
    drawBrandFooter(ctx, width, height, brandAssets);
    return;
  }

  // Pre-load cover
  const { url } = getCoverData(topGame.game.game_id, mapping);
  const coverImg = await loadCoverImage(url);
  if (options.isCancelled?.()) return;

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

    // Hero Playtime Box (Strict 3-zone architecture)
    const boxY = titleBottomY + 56;
    const boxW = width - marginX * 2;
    const boxH = 190;
    const durStr = formatDurationSeconds(topGame.totalDuration, locale);
    const subtext = `${topGame.percentageOfTotal}% ${t('stats.overview.ofTotalTime')} • ${topGame.sessionCount} ${t('stats.modal.totalSessions').toLowerCase()}`;

    drawPlaytimeHeroBlock(ctx, {
      x: marginX,
      y: boxY,
      w: boxW,
      h: boxH,
      label: t('stats.overview.totalPlaytime'),
      value: durStr,
      subtext,
      valueColor: '#F59E0B',
      cardRadius: 28,
      cardBg: 'rgba(17, 24, 39, 0.85)',
      cardBorder: 'rgba(245, 158, 11, 0.35)',
      maxHeroFontSize: 58,
      paddingX: 36,
      paddingY: 22,
    });

    // Extra Stats 2x2 grid (filling vertical space gracefully)
    const extraY = boxY + boxH + 24;
    const cardHalfW = (boxW - 20) * 0.5;
    const cardHalfH = 115;

    // Row 1 - Card 1: Total Sessions
    drawGlassCard(ctx, marginX, extraY, cardHalfW, cardHalfH, 20);
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '800 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.overview.totalSessions').toUpperCase(), marginX + 28, extraY + 36);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 32px Inter, system-ui, sans-serif';
    ctx.fillText(String(topGame.sessionCount), marginX + 28, extraY + 80);
    ctx.restore();

    // Row 1 - Card 2: Average Session Duration
    drawGlassCard(ctx, marginX + cardHalfW + 20, extraY, cardHalfW, cardHalfH, 20);
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '800 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.modal.avgSession').toUpperCase(), marginX + cardHalfW + 48, extraY + 36);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 28px Inter, system-ui, sans-serif';
    const avgTopGame = topGame.sessionCount > 0 ? Math.round(topGame.totalDuration / topGame.sessionCount) : 0;
    ctx.fillText(formatDurationSeconds(avgTopGame, locale), marginX + cardHalfW + 48, extraY + 80);
    ctx.restore();

    // Row 2 - Card 3: First Played
    const extraY2 = extraY + cardHalfH + 16;
    drawGlassCard(ctx, marginX, extraY2, cardHalfW, cardHalfH, 20);
    ctx.save();
    ctx.fillStyle = '#60A5FA';
    ctx.font = '800 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.modal.firstPlayed').toUpperCase(), marginX + 28, extraY2 + 36);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 20px Inter, system-ui, sans-serif';
    ctx.fillText(topGame.firstPlayed ? formatUnixDate(topGame.firstPlayed, locale) : '-', marginX + 28, extraY2 + 80);
    ctx.restore();

    // Row 2 - Card 4: Last Played
    drawGlassCard(ctx, marginX + cardHalfW + 20, extraY2, cardHalfW, cardHalfH, 20);
    ctx.save();
    ctx.fillStyle = '#60A5FA';
    ctx.font = '800 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.modal.lastPlayed').toUpperCase(), marginX + cardHalfW + 48, extraY2 + 36);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 20px Inter, system-ui, sans-serif';
    ctx.fillText(topGame.lastPlayed ? formatUnixDate(topGame.lastPlayed, locale) : '-', marginX + cardHalfW + 48, extraY2 + 80);
    ctx.restore();
  } else if (format === 'square') {
    // SQUARE COLLECTOR ALBUM (1080 x 1080)
    const margin = 64;

    // Top Header
    ctx.save();
    ctx.fillStyle = '#F59E0B';
    ctx.font = '900 14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`👑 #1 ${t('stats.overview.topGame').toUpperCase()}`, margin, 64);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 38px Inter, system-ui, sans-serif';
    const topLines = wrapText(ctx, topGame.game.game_name, width - margin * 2);
    ctx.fillText(topLines[0], margin, 104);
    ctx.restore();

    // Central Showcase: Left Cover (460x440) / Right Metrics
    const coverW = 460;
    const coverH = 440;
    const coverY = 146;

    drawCoverArt(ctx, coverImg, margin, coverY, coverW, coverH, 28, topGame.game.game_name, topGame.game.game_id, topGame.game.category);

    const rightX = margin + coverW + 32;
    const rightW = width - rightX - margin;

    // Big Hours Box (Strict 3-zone architecture)
    const durStr = formatDurationSeconds(topGame.totalDuration, locale);
    const subtext = `${topGame.percentageOfTotal}% ${t('stats.overview.ofTotalTime')}`;
    drawPlaytimeHeroBlock(ctx, {
      x: rightX,
      y: coverY,
      w: rightW,
      h: 215,
      label: t('stats.overview.totalPlaytime'),
      value: durStr,
      subtext,
      valueColor: '#F59E0B',
      cardRadius: 24,
      cardBg: 'rgba(17, 24, 39, 0.85)',
      cardBorder: 'rgba(245, 158, 11, 0.4)',
      maxHeroFontSize: 46,
      paddingX: 24,
      paddingY: 18,
    });

    // Stats Card on Right below Hero Box
    drawGlassCard(ctx, rightX, coverY + 230, rightW, 210, 24);
    ctx.save();
    drawPlatformBadge(ctx, topGame.game.category, rightX + 24, coverY + 256, 28);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '800 11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.modal.serial').toUpperCase(), rightX + 24, coverY + 316);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 17px monospace';
    ctx.fillText(topGame.game.game_id, rightX + 24, coverY + 338);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '800 11px Inter, system-ui, sans-serif';
    ctx.fillText(t('stats.overview.totalSessions').toUpperCase(), rightX + 24, coverY + 372);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 24px Inter, system-ui, sans-serif';
    ctx.fillText(`${topGame.sessionCount}`, rightX + 24, coverY + 400);
    ctx.restore();

    // Bottom Stats 2x2 Balanced Cards (Y: 618 to 920, removing the empty void)
    const botY1 = coverY + coverH + 32;
    const botCardW = (width - margin * 2 - 20) * 0.5;
    const botCardH = 130;

    // Card 1: First Played
    drawGlassCard(ctx, margin, botY1, botCardW, botCardH, 20);
    ctx.save();
    ctx.fillStyle = '#60A5FA';
    ctx.font = '800 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.modal.firstPlayed').toUpperCase(), margin + 28, botY1 + 40);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 24px Inter, system-ui, sans-serif';
    ctx.fillText(topGame.firstPlayed ? formatUnixDate(topGame.firstPlayed, locale) : '-', margin + 28, botY1 + 82);
    ctx.restore();

    // Card 2: Average Session Duration
    const avgTopGame = topGame.sessionCount > 0 ? Math.round(topGame.totalDuration / topGame.sessionCount) : 0;
    drawGlassCard(ctx, margin + botCardW + 20, botY1, botCardW, botCardH, 20);
    ctx.save();
    ctx.fillStyle = '#60A5FA';
    ctx.font = '800 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.modal.avgSession').toUpperCase(), margin + botCardW + 48, botY1 + 34);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 26px Inter, system-ui, sans-serif';
    ctx.fillText(formatDurationSeconds(avgTopGame, locale), margin + botCardW + 48, botY1 + 72);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '600 13px Inter, system-ui, sans-serif';
    ctx.fillText(`${topGame.sessionCount} ${t('stats.modal.totalSessions').toLowerCase()}`, margin + botCardW + 48, botY1 + 104);
    ctx.restore();

    // Row 2: Last Played & Gold Medal Badge
    const botY2 = botY1 + botCardH + 16;
    drawGlassCard(ctx, margin, botY2, botCardW, botCardH, 20);
    ctx.save();
    ctx.fillStyle = '#60A5FA';
    ctx.font = '800 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.modal.lastPlayed').toUpperCase(), margin + 28, botY2 + 40);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 24px Inter, system-ui, sans-serif';
    ctx.fillText(topGame.lastPlayed ? formatUnixDate(topGame.lastPlayed, locale) : '-', margin + 28, botY2 + 82);
    ctx.restore();

    // Card 4: Hall of Fame Status
    drawGlassCard(ctx, margin + botCardW + 20, botY2, botCardW, botCardH, 20, 'rgba(17, 24, 39, 0.85)', 'rgba(245, 158, 11, 0.35)');
    ctx.save();
    ctx.fillStyle = '#F59E0B';
    ctx.font = '800 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`👑 ${t('stats.rankings.gold').toUpperCase()}`, margin + botCardW + 48, botY2 + 34);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 24px Inter, system-ui, sans-serif';
    ctx.fillText(`${topGame.percentageOfTotal}% ${t('stats.overview.ofTotalTime')}`, margin + botCardW + 48, botY2 + 72);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '600 13px Inter, system-ui, sans-serif';
    ctx.fillText(t('share.model.topGame'), margin + botCardW + 48, botY2 + 104);
    ctx.restore();
  } else {
    // HORIZONTAL POSTER (1200 x 630)
    const margin = 56;
    const coverW = 450;
    const coverH = 440;
    const coverY = 74;

    drawCoverArt(ctx, coverImg, margin, coverY, coverW, coverH, 26, topGame.game.game_name, topGame.game.game_id, topGame.game.category);

    // Right Side Info
    const rightX = margin + coverW + 36;
    const rightW = width - rightX - margin;

    ctx.save();
    // Badge
    ctx.fillStyle = '#F59E0B';
    ctx.font = '900 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`👑 #1 ${t('stats.overview.topGame').toUpperCase()}`, rightX, 84);

    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 36px Inter, system-ui, sans-serif';
    ctx.textBaseline = 'top';
    const lines = wrapText(ctx, topGame.game.game_name, rightW);
    ctx.fillText(lines[0], rightX, 104);

    drawPlatformBadge(ctx, topGame.game.category, rightX, 156, 26);
    ctx.restore();

    // Playtime Glass Box (Strict 3-zone architecture)
    const boxY = 194;
    const durStr = formatDurationSeconds(topGame.totalDuration, locale);
    const subtext = `${topGame.percentageOfTotal}% ${t('stats.overview.ofTotalTime')} • ${topGame.sessionCount} ${t('stats.modal.totalSessions').toLowerCase()}`;
    drawPlaytimeHeroBlock(ctx, {
      x: rightX,
      y: boxY,
      w: rightW,
      h: 140,
      label: t('stats.overview.totalPlaytime'),
      value: durStr,
      subtext,
      valueColor: '#F59E0B',
      cardRadius: 22,
      cardBg: 'rgba(17, 24, 39, 0.85)',
      cardBorder: 'rgba(245, 158, 11, 0.35)',
      maxHeroFontSize: 40,
      paddingX: 24,
      paddingY: 16,
    });

    // 2-card bottom grid filling right side seamlessly down to Y=514
    const botY = boxY + 140 + 14;
    const halfCardW = (rightW - 14) * 0.5;
    const cardH = 132;

    const avgTopGame = topGame.sessionCount > 0 ? Math.round(topGame.totalDuration / topGame.sessionCount) : 0;

    // Card 1: Sessions & Average
    drawGlassCard(ctx, rightX, botY, halfCardW, cardH, 18);
    ctx.save();
    ctx.fillStyle = '#60A5FA';
    ctx.font = '800 11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.modal.avgSession').toUpperCase(), rightX + 18, botY + 28);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 22px Inter, system-ui, sans-serif';
    ctx.fillText(formatDurationSeconds(avgTopGame, locale), rightX + 18, botY + 60);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '600 12px monospace';
    ctx.fillText(`${t('stats.modal.serial')}: ${topGame.game.game_id}`, rightX + 18, botY + 98);
    ctx.restore();

    // Card 2: History (First & Last Played)
    drawGlassCard(ctx, rightX + halfCardW + 14, botY, halfCardW, cardH, 18);
    ctx.save();
    ctx.fillStyle = '#60A5FA';
    ctx.font = '800 11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.modal.firstPlayed').toUpperCase(), rightX + halfCardW + 32, botY + 28);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 17px Inter, system-ui, sans-serif';
    ctx.fillText(topGame.firstPlayed ? formatUnixDate(topGame.firstPlayed, locale) : '-', rightX + halfCardW + 32, botY + 56);

    ctx.fillStyle = '#60A5FA';
    ctx.font = '800 11px Inter, system-ui, sans-serif';
    ctx.fillText(t('stats.modal.lastPlayed').toUpperCase(), rightX + halfCardW + 32, botY + 84);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 17px Inter, system-ui, sans-serif';
    ctx.fillText(topGame.lastPlayed ? formatUnixDate(topGame.lastPlayed, locale) : '-', rightX + halfCardW + 32, botY + 110);
    ctx.restore();
  }

  // 3. Draw Watermark Footer with official brand SVG logos
  drawBrandFooter(ctx, width, height, brandAssets);
}
