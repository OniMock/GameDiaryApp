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
import { getGameDetailedStats, formatDurationSeconds, formatUnixDate } from '../../../Stats/lib/statsCalculator';

export async function renderIndividualGameCard(
  ctx: CanvasRenderingContext2D,
  options: CardRenderOptions
): Promise<void> {
  const { format, games, sessions, selectedGameUid, overallStats, mapping, t, locale, brandAssets } = options;
  const { width, height } = FORMAT_DIMENSIONS[format];

  // 1. Draw Collector Background
  drawBackground(ctx, width, height, 'collector');

  // Find target game
  const targetUid = selectedGameUid || (overallStats.topGame ? overallStats.topGame.game.uid : (games[0]?.uid ?? 1));
  const details = getGameDetailedStats(targetUid, games, sessions, overallStats);

  if (!details || details.totalDuration < 60) {
    drawGlassCard(ctx, 80, height * 0.4, width - 160, 200, 20);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 28px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t('stats.rankings.noData'), width * 0.5, height * 0.48);
    drawBrandFooter(ctx, width, height, brandAssets);
    return;
  }

  const { game } = details;

  // Pre-load cover
  const { url } = getCoverData(game.game_id, mapping);
  const coverImg = await loadCoverImage(url);
  if (options.isCancelled?.()) return;

  const marginX = format === 'horizontal' ? 48 : 64;

  // 2. Render Formats
  if (format === 'vertical') {
    // VERTICAL COLLECTOR CARD (1080 x 1920)
    const frameX = marginX;
    const frameY = 70;
    const frameW = width - marginX * 2; // 952
    const innerW = frameW - 72; // 880

    // Frame height hugs content comfortably down to ~1690px
    const frameH = 1630;
    drawGlassCard(ctx, frameX, frameY, frameW, frameH, 32, 'rgba(15, 23, 42, 0.88)', 'rgba(59, 130, 246, 0.35)');

    // Card Header Tag
    ctx.save();
    ctx.fillStyle = '#3B82F6';
    ctx.font = '900 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`GAMEDIARY • ${t('stats.modal.title').toUpperCase()}`, frameX + 36, frameY + 44);

    if (details.rank > 0) {
      ctx.fillStyle = details.rank === 1 ? '#F59E0B' : '#60A5FA';
      ctx.font = '900 16px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(t('stats.modal.rank').replace('{rank}', String(details.rank)), frameX + frameW - 36, frameY + 44);
    }
    ctx.restore();

    // Giant Cover in Card Center (16:9 ratio friendly)
    const cW = innerW;
    const cH = 520;
    const cX = frameX + 36;
    const cY = frameY + 68;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 12;
    drawCoverArt(ctx, coverImg, cX, cY, cW, cH, 24, game.game_name, game.game_id, game.category);
    ctx.restore();

    // Title & Platform Badge
    const textY = cY + cH + 32;
    drawPlatformBadge(ctx, game.category, frameX + 36, textY, 32);

    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 42px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const lines = wrapText(ctx, game.game_name, innerW);
    lines.slice(0, 2).forEach((l, idx) => {
      ctx.fillText(l, frameX + 36, textY + 46 + idx * 50);
    });

    const linesBottom = textY + 46 + Math.min(lines.length, 2) * 50;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '600 18px monospace';
    ctx.fillText(`${t('stats.modal.serial')}: ${game.game_id}  •  UID: ${game.uid}`, frameX + 36, linesBottom + 12);
    ctx.restore();

    // Playtime Hero Box (Strict 3-zone architecture preventing collision)
    const boxY = linesBottom + 36;
    const boxW = innerW;
    const boxH = 175;
    const durStr = formatDurationSeconds(details.totalDuration, locale);
    const subtext = `${details.percentageOfTotal}% ${t('stats.overview.ofTotalTime')}`;

    drawPlaytimeHeroBlock(ctx, {
      x: frameX + 36,
      y: boxY,
      w: boxW,
      h: boxH,
      label: t('stats.modal.totalPlaytime'),
      value: durStr,
      subtext,
      valueColor: '#3B82F6',
      cardRadius: 22,
      cardBg: 'rgba(30, 41, 59, 0.65)',
      cardBorder: 'rgba(59, 130, 246, 0.3)',
      maxHeroFontSize: 52,
      paddingX: 28,
      paddingY: 20,
    });

    // 2 Summary Capsules (Total Sessions & Average Session Duration)
    const capsY = boxY + boxH + 18;
    const capW = (innerW - 18) * 0.5;
    const capH = 110;

    // Capsule 1: Total Sessions
    drawGlassCard(ctx, frameX + 36, capsY, capW, capH, 20);
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '800 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.modal.totalSessions').toUpperCase(), frameX + 60, capsY + 34);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 36px Inter, system-ui, sans-serif';
    ctx.fillText(String(details.sessionCount), frameX + 60, capsY + 80);
    ctx.restore();

    // Capsule 2: Average Session Duration
    drawGlassCard(ctx, frameX + 36 + capW + 18, capsY, capW, capH, 20);
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '800 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.modal.avgSession').toUpperCase(), frameX + 60 + capW + 18, capsY + 34);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 32px Inter, system-ui, sans-serif';
    ctx.fillText(formatDurationSeconds(details.avgSessionDuration, locale), frameX + 60 + capW + 18, capsY + 80);
    ctx.restore();

    // 4 History & Records Cards in 2x2 Grid
    const recY = capsY + capH + 18;
    const recW = capW;
    const recH = 145;

    // Card 1: Primeira Sessão (Top-Left)
    drawGlassCard(ctx, frameX + 36, recY, recW, recH, 20);
    ctx.save();
    ctx.fillStyle = '#60A5FA';
    ctx.font = '800 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.modal.firstPlayed').toUpperCase(), frameX + 60, recY + 34);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 24px Inter, system-ui, sans-serif';
    ctx.fillText(details.firstPlayed ? formatUnixDate(details.firstPlayed, locale) : '-', frameX + 60, recY + 80);
    ctx.restore();

    // Card 2: Última Sessão (Top-Right: Data + Duração)
    drawGlassCard(ctx, frameX + 36 + recW + 18, recY, recW, recH, 20);
    ctx.save();
    ctx.fillStyle = '#60A5FA';
    ctx.font = '800 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.modal.lastPlayed').toUpperCase(), frameX + 60 + recW + 18, recY + 34);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 24px Inter, system-ui, sans-serif';
    ctx.fillText(details.lastPlayed ? formatUnixDate(details.lastPlayed, locale) : '-', frameX + 60 + recW + 18, recY + 80);
    if (details.lastSessionDuration > 0) {
      ctx.fillStyle = '#38BDF8';
      ctx.font = '700 17px Inter, system-ui, sans-serif';
      ctx.fillText(formatDurationSeconds(details.lastSessionDuration, locale), frameX + 60 + recW + 18, recY + 116);
    }
    ctx.restore();

    // Card 3: Sessão Mais Longa (Bottom-Left: Duração + Data)
    const recY2 = recY + recH + 16;
    drawGlassCard(ctx, frameX + 36, recY2, recW, recH, 20);
    ctx.save();
    ctx.fillStyle = '#F59E0B';
    ctx.font = '800 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.modal.longestSession').toUpperCase(), frameX + 60, recY2 + 34);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 26px Inter, system-ui, sans-serif';
    ctx.fillText(formatDurationSeconds(details.longestSessionDuration, locale), frameX + 60, recY2 + 80);
    if (details.longestSessionTimestamp) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.font = '700 16px Inter, system-ui, sans-serif';
      ctx.fillText(formatUnixDate(details.longestSessionTimestamp, locale), frameX + 60, recY2 + 116);
    }
    ctx.restore();

    // Card 4: Maior Dia de Jogo (Bottom-Right: Data + Tempo acumulado jogado)
    drawGlassCard(ctx, frameX + 36 + recW + 18, recY2, recW, recH, 20);
    ctx.save();
    ctx.fillStyle = '#A855F7';
    ctx.font = '800 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.modal.bestDay').toUpperCase(), frameX + 60 + recW + 18, recY2 + 34);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 24px Inter, system-ui, sans-serif';
    ctx.fillText(details.bestDayDate ? formatUnixDate(details.bestDayDate, locale) : '-', frameX + 60 + recW + 18, recY2 + 80);
    if (details.bestDayDuration > 0) {
      ctx.fillStyle = '#C084FC';
      ctx.font = '700 17px Inter, system-ui, sans-serif';
      ctx.fillText(`${formatDurationSeconds(details.bestDayDuration, locale)} ${t('stats.modal.played')}`, frameX + 60 + recW + 18, recY2 + 116);
    }
    ctx.restore();

  } else if (format === 'square') {
    // SQUARE COLLECTOR (1080 x 1080)
    const margin = 56;

    // Header
    ctx.save();
    ctx.fillStyle = '#3B82F6';
    ctx.font = '900 14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`GAMEDIARY • ${t('stats.modal.title').toUpperCase()}`, margin, 54);

    if (details.rank > 0) {
      ctx.fillStyle = details.rank === 1 ? '#F59E0B' : '#60A5FA';
      ctx.font = '900 15px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(t('stats.modal.rank').replace('{rank}', String(details.rank)), width - margin, 54);
    }
    ctx.restore();

    // Top Section: Left Cover (440x390) / Right Metrics
    const coverW = 440;
    const coverH = 390;
    const coverY = 82;

    drawCoverArt(ctx, coverImg, margin, coverY, coverW, coverH, 24, game.game_name, game.game_id, game.category);

    // Platform Badge & Serial under cover
    const underCoverY = coverY + coverH + 14;
    drawPlatformBadge(ctx, game.category, margin, underCoverY, 26);
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '600 15px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${t('stats.modal.serial')}: ${game.game_id}`, margin + 110, underCoverY + 13);
    ctx.restore();

    const rightX = margin + coverW + 28;
    const rightW = width - rightX - margin;

    // Game Title on Right
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 32px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const lines = wrapText(ctx, game.game_name, rightW);
    lines.slice(0, 2).forEach((l, i) => {
      ctx.fillText(l, rightX, coverY + i * 38);
    });
    const titleBottomY = coverY + Math.min(lines.length, 2) * 38;
    ctx.restore();

    // Playtime Hero Box on Right
    const boxY = Math.max(titleBottomY + 12, coverY + 84);
    const boxH = 175;
    const durStr = formatDurationSeconds(details.totalDuration, locale);
    const subtext = `${details.percentageOfTotal}% ${t('stats.overview.ofTotalTime')}`;

    drawPlaytimeHeroBlock(ctx, {
      x: rightX,
      y: boxY,
      w: rightW,
      h: boxH,
      label: t('stats.modal.totalPlaytime'),
      value: durStr,
      subtext,
      valueColor: '#3B82F6',
      cardRadius: 22,
      cardBg: 'rgba(17, 24, 39, 0.85)',
      cardBorder: 'rgba(59, 130, 246, 0.35)',
      maxHeroFontSize: 46,
      paddingX: 24,
      paddingY: 18,
    });

    // 2 Summary Capsules on Right (Sessions & Avg Duration)
    const capsY = boxY + boxH + 14;
    const capW = (rightW - 12) * 0.5;
    const capH = 95;

    // Sessions Capsule
    drawGlassCard(ctx, rightX, capsY, capW, capH, 18);
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '800 11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.modal.totalSessions').toUpperCase(), rightX + 18, capsY + 28);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 28px Inter, system-ui, sans-serif';
    ctx.fillText(String(details.sessionCount), rightX + 18, capsY + 68);
    ctx.restore();

    // Avg Session Capsule
    drawGlassCard(ctx, rightX + capW + 12, capsY, capW, capH, 18);
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '800 11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.modal.avgSession').toUpperCase(), rightX + capW + 30, capsY + 28);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 24px Inter, system-ui, sans-serif';
    ctx.fillText(formatDurationSeconds(details.avgSessionDuration, locale), rightX + capW + 30, capsY + 68);
    ctx.restore();

    // Bottom Half: 4 History & Records Cards in 2x2 Grid
    const botY = underCoverY + 36;
    const totalW = width - margin * 2;
    const botCardW = (totalW - 16) * 0.5;
    const botCardH = 170;

    // Card 1: Primeira Sessão
    drawGlassCard(ctx, margin, botY, botCardW, botCardH, 20);
    ctx.save();
    ctx.fillStyle = '#60A5FA';
    ctx.font = '800 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.modal.firstPlayed').toUpperCase(), margin + 28, botY + 44);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 24px Inter, system-ui, sans-serif';
    ctx.fillText(details.firstPlayed ? formatUnixDate(details.firstPlayed, locale) : '-', margin + 28, botY + 94);
    ctx.restore();

    // Card 2: Última Sessão (Data + Duração)
    drawGlassCard(ctx, margin + botCardW + 16, botY, botCardW, botCardH, 20);
    ctx.save();
    ctx.fillStyle = '#60A5FA';
    ctx.font = '800 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.modal.lastPlayed').toUpperCase(), margin + botCardW + 40, botY + 36);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 24px Inter, system-ui, sans-serif';
    ctx.fillText(details.lastPlayed ? formatUnixDate(details.lastPlayed, locale) : '-', margin + botCardW + 40, botY + 82);
    if (details.lastSessionDuration > 0) {
      ctx.fillStyle = '#38BDF8';
      ctx.font = '700 17px Inter, system-ui, sans-serif';
      ctx.fillText(formatDurationSeconds(details.lastSessionDuration, locale), margin + botCardW + 40, botY + 124);
    }
    ctx.restore();

    // Card 3: Sessão Mais Longa (Duração + Data)
    const botY2 = botY + botCardH + 16;
    drawGlassCard(ctx, margin, botY2, botCardW, botCardH, 20);
    ctx.save();
    ctx.fillStyle = '#F59E0B';
    ctx.font = '800 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.modal.longestSession').toUpperCase(), margin + 28, botY2 + 36);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 26px Inter, system-ui, sans-serif';
    ctx.fillText(formatDurationSeconds(details.longestSessionDuration, locale), margin + 28, botY2 + 82);
    if (details.longestSessionTimestamp) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.font = '700 15px Inter, system-ui, sans-serif';
      ctx.fillText(formatUnixDate(details.longestSessionTimestamp, locale), margin + 28, botY2 + 124);
    }
    ctx.restore();

    // Card 4: Maior Dia de Jogo (Data + Tempo acumulado jogado)
    drawGlassCard(ctx, margin + botCardW + 16, botY2, botCardW, botCardH, 20);
    ctx.save();
    ctx.fillStyle = '#A855F7';
    ctx.font = '800 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.modal.bestDay').toUpperCase(), margin + botCardW + 40, botY2 + 36);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 24px Inter, system-ui, sans-serif';
    ctx.fillText(details.bestDayDate ? formatUnixDate(details.bestDayDate, locale) : '-', margin + botCardW + 40, botY2 + 82);
    if (details.bestDayDuration > 0) {
      ctx.fillStyle = '#C084FC';
      ctx.font = '700 16px Inter, system-ui, sans-serif';
      ctx.fillText(`${formatDurationSeconds(details.bestDayDuration, locale)} ${t('stats.modal.played')}`, margin + botCardW + 40, botY2 + 124);
    }
    ctx.restore();

  } else {
    // HORIZONTAL (1200 x 630)
    const margin = 48;
    const coverW = 440;
    const coverH = 430;
    const coverY = 54;

    drawCoverArt(ctx, coverImg, margin, coverY, coverW, coverH, 26, game.game_name, game.game_id, game.category);

    // Platform Badge & Serial under cover
    const underCoverY = coverY + coverH + 16;
    drawPlatformBadge(ctx, game.category, margin, underCoverY, 26);
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '600 14px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${t('stats.modal.serial')}: ${game.game_id}  •  UID: ${game.uid}`, margin + 110, underCoverY + 13);
    ctx.restore();

    const rightX = margin + coverW + 36;
    const rightW = width - rightX - margin;

    ctx.save();
    // Header Tag
    ctx.fillStyle = '#3B82F6';
    ctx.font = '900 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`GAMEDIARY • ${t('stats.modal.title').toUpperCase()}`, rightX, 62);

    if (details.rank > 0) {
      ctx.fillStyle = details.rank === 1 ? '#F59E0B' : '#60A5FA';
      ctx.font = '900 14px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(t('stats.modal.rank').replace('{rank}', String(details.rank)), rightX + rightW, 62);
    }

    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 32px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const lines = wrapText(ctx, game.game_name, rightW);
    ctx.fillText(lines[0], rightX, 84);
    ctx.restore();

    // Playtime Hero Box
    const boxY = 130;
    const durStr = formatDurationSeconds(details.totalDuration, locale);
    const subtext = `${details.percentageOfTotal}% ${t('stats.overview.ofTotalTime')} • ${details.sessionCount} ${t('stats.modal.totalSessions').toLowerCase()} • ${t('stats.modal.avgSession')}: ${formatDurationSeconds(details.avgSessionDuration, locale)}`;
    drawPlaytimeHeroBlock(ctx, {
      x: rightX,
      y: boxY,
      w: rightW,
      h: 122,
      label: t('stats.modal.totalPlaytime'),
      value: durStr,
      subtext,
      valueColor: '#3B82F6',
      cardRadius: 20,
      cardBg: 'rgba(17, 24, 39, 0.85)',
      cardBorder: 'rgba(59, 130, 246, 0.35)',
      maxHeroFontSize: 38,
      paddingX: 24,
      paddingY: 14,
    });

    // 4 History & Records Cards in 2x2 Grid
    const gridY = boxY + 122 + 14;
    const cardW = (rightW - 14) * 0.5;
    const cardH = 104;

    // Card 1: Primeira Sessão
    drawGlassCard(ctx, rightX, gridY, cardW, cardH, 18);
    ctx.save();
    ctx.fillStyle = '#60A5FA';
    ctx.font = '800 11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.modal.firstPlayed').toUpperCase(), rightX + 18, gridY + 26);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 18px Inter, system-ui, sans-serif';
    ctx.fillText(details.firstPlayed ? formatUnixDate(details.firstPlayed, locale) : '-', rightX + 18, gridY + 58);
    ctx.restore();

    // Card 2: Última Sessão (Data + Duração)
    drawGlassCard(ctx, rightX + cardW + 14, gridY, cardW, cardH, 18);
    ctx.save();
    ctx.fillStyle = '#60A5FA';
    ctx.font = '800 11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.modal.lastPlayed').toUpperCase(), rightX + cardW + 32, gridY + 26);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 18px Inter, system-ui, sans-serif';
    ctx.fillText(details.lastPlayed ? formatUnixDate(details.lastPlayed, locale) : '-', rightX + cardW + 32, gridY + 58);
    if (details.lastSessionDuration > 0) {
      ctx.fillStyle = '#38BDF8';
      ctx.font = '700 14px Inter, system-ui, sans-serif';
      ctx.fillText(formatDurationSeconds(details.lastSessionDuration, locale), rightX + cardW + 32, gridY + 84);
    }
    ctx.restore();

    // Card 3: Sessão Mais Longa (Duração + Data)
    const gridY2 = gridY + cardH + 12;
    drawGlassCard(ctx, rightX, gridY2, cardW, cardH, 18);
    ctx.save();
    ctx.fillStyle = '#F59E0B';
    ctx.font = '800 11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.modal.longestSession').toUpperCase(), rightX + 18, gridY2 + 26);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 19px Inter, system-ui, sans-serif';
    ctx.fillText(formatDurationSeconds(details.longestSessionDuration, locale), rightX + 18, gridY2 + 58);
    if (details.longestSessionTimestamp) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.font = '700 13px Inter, system-ui, sans-serif';
      ctx.fillText(formatUnixDate(details.longestSessionTimestamp, locale), rightX + 18, gridY2 + 84);
    }
    ctx.restore();

    // Card 4: Maior Dia de Jogo (Data + Tempo acumulado jogado)
    drawGlassCard(ctx, rightX + cardW + 14, gridY2, cardW, cardH, 18);
    ctx.save();
    ctx.fillStyle = '#A855F7';
    ctx.font = '800 11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.modal.bestDay').toUpperCase(), rightX + cardW + 32, gridY2 + 26);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 18px Inter, system-ui, sans-serif';
    ctx.fillText(details.bestDayDate ? formatUnixDate(details.bestDayDate, locale) : '-', rightX + cardW + 32, gridY2 + 58);
    if (details.bestDayDuration > 0) {
      ctx.fillStyle = '#C084FC';
      ctx.font = '700 14px Inter, system-ui, sans-serif';
      ctx.fillText(`${formatDurationSeconds(details.bestDayDuration, locale)} ${t('stats.modal.played')}`, rightX + cardW + 32, gridY2 + 84);
    }
    ctx.restore();
  }

  // 3. Draw Footer with official brand SVG logos
  drawBrandFooter(ctx, width, height, brandAssets);
}
