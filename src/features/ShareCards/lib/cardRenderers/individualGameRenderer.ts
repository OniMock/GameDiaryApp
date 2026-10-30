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
import { getGameDetailedStats, formatDurationSeconds, formatUnixDate } from '../../../Stats/lib/statsCalculator';

export async function renderIndividualGameCard(
  ctx: CanvasRenderingContext2D,
  options: CardRenderOptions
): Promise<void> {
  const { format, games, sessions, selectedGameUid, overallStats, mapping, t } = options;
  const { width, height } = FORMAT_DIMENSIONS[format];

  // 1. Draw Collector Background
  drawBackground(ctx, width, height, 'collector');

  // Find target game
  const targetUid = selectedGameUid || (overallStats.topGame ? overallStats.topGame.game.uid : (games[0]?.uid ?? 1));
  const details = getGameDetailedStats(targetUid, games, sessions, overallStats);

  if (!details) {
    drawGlassCard(ctx, 80, height * 0.4, width - 160, 200, 20);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 28px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t('stats.rankings.noData'), width * 0.5, height * 0.48);
    drawBrandFooter(ctx, width, height);
    return;
  }

  const { game } = details;

  // Pre-load cover
  const { url } = getCoverData(game.game_id, mapping);
  const coverImg = await loadCoverImage(url);

  const marginX = format === 'horizontal' ? 56 : 64;

  // 2. Render Formats
  if (format === 'vertical') {
    // VERTICAL COLLECTOR CARD (1080 x 1920)
    // Outer Trading Card Frame
    const frameX = marginX;
    const frameY = 80;
    const frameW = width - marginX * 2;
    const frameH = height - 170;

    drawGlassCard(ctx, frameX, frameY, frameW, frameH, 32, 'rgba(15, 23, 42, 0.88)', 'rgba(59, 130, 246, 0.35)');

    // Card Header Tag
    ctx.save();
    ctx.fillStyle = '#3B82F6';
    ctx.font = '900 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`GAMEDIARY • ${t('stats.modal.title').toUpperCase()}`, frameX + 36, frameY + 46);

    if (details.rank > 0) {
      ctx.fillStyle = details.rank === 1 ? '#F59E0B' : '#60A5FA';
      ctx.font = '900 16px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(t('stats.modal.rank').replace('{rank}', String(details.rank)), frameX + frameW - 36, frameY + 46);
    }
    ctx.restore();

    // Giant Cover in Card Center
    const cW = frameW - 72;
    const cH = 620;
    const cX = frameX + 36;
    const cY = frameY + 74;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 12;
    drawCoverArt(ctx, coverImg, cX, cY, cW, cH, 24, game.game_name, game.game_id, game.category);
    ctx.restore();

    // Title & Platform Badge
    const textY = cY + cH + 40;
    drawPlatformBadge(ctx, game.category, frameX + 36, textY, 32);

    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 44px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const lines = wrapText(ctx, game.game_name, frameW - 72);
    lines.slice(0, 2).forEach((l, idx) => {
      ctx.fillText(l, frameX + 36, textY + 48 + idx * 52);
    });

    const linesBottom = textY + 48 + Math.min(lines.length, 2) * 52;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '600 18px monospace';
    ctx.fillText(`${t('stats.modal.serial')}: ${game.game_id}  •  UID: ${game.uid}`, frameX + 36, linesBottom + 12);

    // Playtime Hero Box
    const boxY = linesBottom + 48;
    const boxW = frameW - 72;
    const boxH = 145;
    drawGlassCard(ctx, frameX + 36, boxY, boxW, boxH, 22, 'rgba(30, 41, 59, 0.65)', 'rgba(59, 130, 246, 0.3)');

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '800 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.modal.totalPlaytime').toUpperCase(), frameX + 64, boxY + 38);

    ctx.fillStyle = '#3B82F6';
    ctx.font = '900 52px Inter, system-ui, sans-serif';
    ctx.fillText(formatDurationSeconds(details.totalDuration), frameX + 64, boxY + 98);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.font = '800 20px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${details.percentageOfTotal}%`, frameX + 36 + boxW - 32, boxY + 76);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '600 12px Inter, system-ui, sans-serif';
    ctx.fillText(t('stats.overview.ofTotalTime').toUpperCase(), frameX + 36 + boxW - 32, boxY + 100);

    // 4 Stats Capsules
    const gridY = boxY + boxH + 18;
    const capW = (boxW - 16) * 0.5;
    const capH = 92;

    // Sessions
    drawGlassCard(ctx, frameX + 36, gridY, capW, capH, 18);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '700 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.modal.totalSessions').toUpperCase(), frameX + 54, gridY + 30);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 26px Inter, system-ui, sans-serif';
    ctx.fillText(String(details.sessionCount), frameX + 54, gridY + 68);

    // Avg Session
    drawGlassCard(ctx, frameX + 36 + capW + 16, gridY, capW, capH, 18);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '700 12px Inter, system-ui, sans-serif';
    ctx.fillText(t('stats.modal.avgSession').toUpperCase(), frameX + 54 + capW + 16, gridY + 30);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 24px Inter, system-ui, sans-serif';
    ctx.fillText(formatDurationSeconds(details.avgSessionDuration), frameX + 54 + capW + 16, gridY + 68);

    // First Played
    drawGlassCard(ctx, frameX + 36, gridY + capH + 14, capW, capH, 18);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '700 12px Inter, system-ui, sans-serif';
    ctx.fillText(t('stats.modal.firstPlayed').toUpperCase(), frameX + 54, gridY + capH + 44);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 16px Inter, system-ui, sans-serif';
    ctx.fillText(details.firstPlayed ? formatUnixDate(details.firstPlayed) : '-', frameX + 54, gridY + capH + 78);

    // Longest Session
    drawGlassCard(ctx, frameX + 36 + capW + 16, gridY + capH + 14, capW, capH, 18);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '700 12px Inter, system-ui, sans-serif';
    ctx.fillText(t('stats.modal.longestSession').toUpperCase(), frameX + 54 + capW + 16, gridY + capH + 44);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 24px Inter, system-ui, sans-serif';
    ctx.fillText(formatDurationSeconds(details.longestSessionDuration), frameX + 54 + capW + 16, gridY + capH + 78);

    ctx.restore();
  } else if (format === 'square') {
    // SQUARE COLLECTOR (1080 x 1080)
    const margin = 64;

    // Header
    ctx.save();
    ctx.fillStyle = '#3B82F6';
    ctx.font = '900 14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`GAMEDIARY • ${t('stats.modal.title').toUpperCase()}`, margin, 74);

    if (details.rank > 0) {
      ctx.fillStyle = '#60A5FA';
      ctx.font = '900 15px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(t('stats.modal.rank').replace('{rank}', String(details.rank)), width - margin, 74);
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 38px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    const lines = wrapText(ctx, game.game_name, width - margin * 2);
    ctx.fillText(lines[0], margin, 124);
    ctx.restore();

    // Center Left: Cover (440x440) / Right: Metrics
    const coverW = 440;
    const coverH = 440;
    const coverY = 170;

    drawCoverArt(ctx, coverImg, margin, coverY, coverW, coverH, 24, game.game_name, game.game_id, game.category);

    const rightX = margin + coverW + 36;
    const rightW = width - rightX - margin;

    // Big Playtime Box
    drawGlassCard(ctx, rightX, coverY, rightW, 200, 24, 'rgba(17, 24, 39, 0.85)', 'rgba(59, 130, 246, 0.35)');
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '800 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.modal.totalPlaytime').toUpperCase(), rightX + 28, coverY + 40);

    ctx.fillStyle = '#3B82F6';
    ctx.font = '900 48px Inter, system-ui, sans-serif';
    ctx.fillText(formatDurationSeconds(details.totalDuration), rightX + 28, coverY + 102);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '600 15px Inter, system-ui, sans-serif';
    ctx.fillText(`${details.percentageOfTotal}% ${t('stats.overview.ofTotalTime')}`, rightX + 28, coverY + 146);
    ctx.restore();

    // Stats Grid on Right
    drawGlassCard(ctx, rightX, coverY + 225, rightW, 215, 24);
    ctx.save();
    drawPlatformBadge(ctx, game.category, rightX + 28, coverY + 255, 28);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '700 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.modal.serial').toUpperCase(), rightX + 28, coverY + 318);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 18px monospace';
    ctx.fillText(game.game_id, rightX + 28, coverY + 342);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '700 12px Inter, system-ui, sans-serif';
    ctx.fillText(t('stats.modal.totalSessions').toUpperCase(), rightX + 28, coverY + 382);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 24px Inter, system-ui, sans-serif';
    ctx.fillText(`${details.sessionCount} (${formatDurationSeconds(details.avgSessionDuration)})`, rightX + 28, coverY + 412);
    ctx.restore();

    // Bottom dates strip
    const stripY = coverY + coverH + 34;
    const stripW = width - margin * 2;
    drawGlassCard(ctx, margin, stripY, stripW, 140, 22);

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '700 18px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${t('stats.modal.firstPlayed')}: ${details.firstPlayed ? formatUnixDate(details.firstPlayed) : '-'}`, margin + 32, stripY + 54);
    ctx.fillText(`${t('stats.modal.lastPlayed')}: ${details.lastPlayed ? formatUnixDate(details.lastPlayed) : '-'}`, margin + 32, stripY + 94);

    ctx.fillStyle = '#3B82F6';
    ctx.font = '900 22px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${t('stats.modal.longestSession')}: ${formatDurationSeconds(details.longestSessionDuration)}`, margin + stripW - 32, stripY + 74);
    ctx.restore();
  } else {
    // HORIZONTAL (1200 x 630)
    const margin = 56;
    const coverW = 440;
    const coverH = 430;
    const coverY = 100;

    drawCoverArt(ctx, coverImg, margin, coverY, coverW, coverH, 26, game.game_name, game.game_id, game.category);

    const rightX = margin + coverW + 42;
    const rightW = width - rightX - margin;

    ctx.save();
    // Pill
    ctx.fillStyle = '#3B82F6';
    ctx.font = '900 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`GAMEDIARY • ${t('stats.modal.rank').replace('{rank}', String(details.rank))}`, rightX, 114);

    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 40px Inter, system-ui, sans-serif';
    ctx.textBaseline = 'top';
    const lines = wrapText(ctx, game.game_name, rightW);
    ctx.fillText(lines[0], rightX, 134);

    drawPlatformBadge(ctx, game.category, rightX, 195, 26);

    // Playtime Box
    const boxY = 240;
    drawGlassCard(ctx, rightX, boxY, rightW, 160, 22, 'rgba(17, 24, 39, 0.85)', 'rgba(59, 130, 246, 0.35)');

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '800 12px Inter, system-ui, sans-serif';
    ctx.fillText(t('stats.modal.totalPlaytime').toUpperCase(), rightX + 28, boxY + 36);

    ctx.fillStyle = '#3B82F6';
    ctx.font = '900 44px Inter, system-ui, sans-serif';
    ctx.fillText(formatDurationSeconds(details.totalDuration), rightX + 28, boxY + 92);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '600 14px Inter, system-ui, sans-serif';
    ctx.fillText(`${details.percentageOfTotal}% ${t('stats.overview.ofTotalTime')} • ${details.sessionCount} ${t('stats.modal.totalSessions').toLowerCase()}`, rightX + 28, boxY + 130);

    // Bottom detail row (stacked cleanly)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '600 13px monospace';
    ctx.fillText(`${t('stats.modal.serial')}: ${game.game_id}`, rightX, 430);
    ctx.fillText(`${t('stats.modal.firstPlayed')}: ${details.firstPlayed ? formatUnixDate(details.firstPlayed) : '-'}`, rightX, 454);
    ctx.restore();
  }

  // 3. Draw Footer
  drawBrandFooter(ctx, width, height);
}
