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
import { calculateYearRetrospective } from '../retrospectiveUtils';
import { formatDurationSeconds } from '../../../Stats/lib/statsCalculator';

export async function renderRetrospectiveCard(
  ctx: CanvasRenderingContext2D,
  options: CardRenderOptions
): Promise<void> {
  const { format, games, sessions, selectedYear, mapping, t } = options;
  const { width, height } = FORMAT_DIMENSIONS[format];

  // 1. Draw Retrospective Purple/Midnight Background
  drawBackground(ctx, width, height, 'retro');

  const yearTarget = selectedYear || 'all';
  const retro = calculateYearRetrospective(yearTarget, games, sessions);

  const marginX = format === 'horizontal' ? 56 : 64;
  const headerY = format === 'horizontal' ? 44 : 90;

  const yearLabel = yearTarget === 'all' ? t('stats.filter.periodAll').toUpperCase() : String(yearTarget);

  // 2. Draw Header
  ctx.save();
  // Pill Tag
  ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
  ctx.lineWidth = 1.5;
  const pillW = 240;
  const pillH = 34;
  ctx.beginPath();
  ctx.roundRect(marginX, headerY, pillW, pillH, 17);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#C084FC';
  ctx.font = '900 13px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`🎮 GAMEDIARY • ${yearLabel}`, marginX + pillW * 0.5, headerY + pillH * 0.52);

  // Main Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 ${format === 'horizontal' ? 36 : 48}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(yearTarget === 'all' ? t('share.model.retrospective') : `${t('share.model.retrospective')} • ${yearLabel}`, marginX, headerY + pillH + 12);
  ctx.restore();

  // If no data for this year
  if (!retro.hasData) {
    const emptyY = height * 0.38;
    const emptyW = width - marginX * 2;
    drawGlassCard(ctx, marginX, emptyY, emptyW, 260, 24, 'rgba(17, 24, 39, 0.85)');

    ctx.save();
    ctx.fillStyle = '#A855F7';
    ctx.font = '900 32px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t('stats.rankings.noData'), width * 0.5, emptyY + 80);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '600 18px Inter, system-ui, sans-serif';
    ctx.fillText(t('stats.evolution.noHistory'), width * 0.5, emptyY + 130);
    ctx.fillText('', width * 0.5, emptyY + 165);
    ctx.restore();

    drawBrandFooter(ctx, width, height);
    return;
  }

  // Pre-load top game cover
  let topCoverImg: HTMLImageElement | null = null;
  if (retro.topGame) {
    const { url } = getCoverData(retro.topGame.game.game_id, mapping);
    topCoverImg = await loadCoverImage(url);
  }


  // 3. Render Formats
  if (format === 'vertical') {
    // VERTICAL RECAP (1080 x 1920)
    // 3 Big Summary KPI Cards
    const kpiY = 270;
    const kpiW = (width - marginX * 2 - 32) / 3;
    const kpiH = 170;

    // KPI 1: Playtime
    drawGlassCard(ctx, marginX, kpiY, kpiW, kpiH, 22, 'rgba(17, 24, 39, 0.85)', 'rgba(168, 85, 247, 0.35)');
    ctx.save();
    ctx.fillStyle = '#C084FC';
    ctx.font = '800 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t('stats.overview.totalPlaytime').toUpperCase(), marginX + kpiW * 0.5, kpiY + 40);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 38px Inter, system-ui, sans-serif';
    ctx.fillText(formatDurationSeconds(retro.totalDuration), marginX + kpiW * 0.5, kpiY + 98);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '600 14px Inter, system-ui, sans-serif';
    ctx.fillText(`${retro.totalHours} hrs`, marginX + kpiW * 0.5, kpiY + 134);
    ctx.restore();

    // KPI 2: Games
    const kpi2X = marginX + kpiW + 16;
    drawGlassCard(ctx, kpi2X, kpiY, kpiW, kpiH, 22);
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = '800 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t('stats.overview.totalGames').toUpperCase(), kpi2X + kpiW * 0.5, kpiY + 40);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 46px Inter, system-ui, sans-serif';
    ctx.fillText(String(retro.uniqueGamesCount), kpi2X + kpiW * 0.5, kpiY + 104);
    ctx.restore();

    // KPI 3: Sessions
    const kpi3X = kpi2X + kpiW + 16;
    drawGlassCard(ctx, kpi3X, kpiY, kpiW, kpiH, 22);
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = '800 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t('stats.overview.totalSessions').toUpperCase(), kpi3X + kpiW * 0.5, kpiY + 40);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 46px Inter, system-ui, sans-serif';
    ctx.fillText(String(retro.totalSessions), kpi3X + kpiW * 0.5, kpiY + 104);
    ctx.restore();

    // Most Played Game Spotlight of the Year
    if (retro.topGame) {
      const topW = width - marginX * 2;
      const topH = 460;
      const topY = kpiY + kpiH + 34;
      drawGlassCard(ctx, marginX, topY, topW, topH, 28, 'rgba(17, 24, 39, 0.85)', 'rgba(245, 158, 11, 0.35)');

      // Top Tag
      ctx.save();
      ctx.fillStyle = '#F59E0B';
      ctx.font = '900 14px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`👑 ${t('stats.overview.topGame').toUpperCase()} • ${yearLabel}`, marginX + 36, topY + 44);

      // Cover
      const cW = 320;
      const cH = 280;
      const cX = marginX + 36;
      const cY = topY + 70;
      drawCoverArt(ctx, topCoverImg, cX, cY, cW, cH, 20, retro.topGame.game.game_name, retro.topGame.game.game_id, retro.topGame.game.category);

      // Info
      const infoX = cX + cW + 36;
      drawPlatformBadge(ctx, retro.topGame.game.category, infoX, topY + 78, 30);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 36px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const lines = wrapText(ctx, retro.topGame.game.game_name, topW - cW - 110);
      lines.slice(0, 2).forEach((l, idx) => {
        ctx.fillText(l, infoX, topY + 128 + idx * 44);
      });

      ctx.fillStyle = '#F59E0B';
      ctx.font = '900 42px Inter, system-ui, sans-serif';
      ctx.fillText(formatDurationSeconds(retro.topGame.duration), infoX, topY + 245);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.font = '600 17px Inter, system-ui, sans-serif';
      ctx.fillText(`${retro.topGame.sessions} ${t('stats.modal.totalSessions').toLowerCase()}`, infoX, topY + 300);
      ctx.restore();
    }

    // Milestones / Habits Grid (2 cards)
    const habitY = 980;
    const habitW = width - marginX * 2;
    const habitH = 150;

    // Card 1: Peak Month
    drawGlassCard(ctx, marginX, habitY, habitW, habitH, 24);
    ctx.save();
    ctx.fillStyle = '#A855F7';
    ctx.font = '800 14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`⚡ ${t('stats.overview.mostActiveMonth').toUpperCase()}`, marginX + 36, habitY + 42);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 36px Inter, system-ui, sans-serif';
    const monthStr = retro.mostActiveMonth ? t(`stats.months.${retro.mostActiveMonth.monthNumber}`) : '-';
    ctx.fillText(monthStr, marginX + 36, habitY + 92);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '800 24px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    const monthDur = retro.mostActiveMonth ? formatDurationSeconds(retro.mostActiveMonth.duration) : '-';
    ctx.fillText(monthDur, marginX + habitW - 36, habitY + 86);
    ctx.restore();

    // Card 2: Peak Day & Time
    const habit2Y = habitY + habitH + 20;
    drawGlassCard(ctx, marginX, habit2Y, habitW, habitH, 24);
    ctx.save();
    ctx.fillStyle = '#3B82F6';
    ctx.font = '800 14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`📅 ${t('stats.overview.gamingHabit').toUpperCase()}`, marginX + 36, habit2Y + 42);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 34px Inter, system-ui, sans-serif';
    const dayStr = retro.mostActiveDayOfWeek !== null ? t(`stats.days.${retro.mostActiveDayOfWeek}`) : '-';
    const timeStr = retro.mostActiveTimeOfDay ? t(`stats.timeOfDay.${retro.mostActiveTimeOfDay}`) : '-';
    ctx.fillText(`${dayStr}`, marginX + 36, habit2Y + 92);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '700 18px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(timeStr, marginX + habitW - 36, habit2Y + 88);
    ctx.restore();
  } else if (format === 'square') {
    // SQUARE RECAP (1080 x 1080)
    const margin = 64;

    // 3 Mini KPI cards in a row
    const kpiY = 190;
    const kpiW = (width - margin * 2 - 24) / 3;
    const kpiH = 130;

    // Hours
    drawGlassCard(ctx, margin, kpiY, kpiW, kpiH, 20, 'rgba(17, 24, 39, 0.85)', 'rgba(168, 85, 247, 0.35)');
    ctx.save();
    ctx.fillStyle = '#C084FC';
    ctx.font = '800 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t('stats.overview.totalPlaytime').toUpperCase(), margin + kpiW * 0.5, kpiY + 36);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 30px Inter, system-ui, sans-serif';
    ctx.fillText(formatDurationSeconds(retro.totalDuration), margin + kpiW * 0.5, kpiY + 84);
    ctx.restore();

    // Games
    const kpi2X = margin + kpiW + 12;
    drawGlassCard(ctx, kpi2X, kpiY, kpiW, kpiH, 20);
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = '800 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t('stats.overview.totalGames').toUpperCase(), kpi2X + kpiW * 0.5, kpiY + 36);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 36px Inter, system-ui, sans-serif';
    ctx.fillText(String(retro.uniqueGamesCount), kpi2X + kpiW * 0.5, kpiY + 86);
    ctx.restore();

    // Sessions
    const kpi3X = kpi2X + kpiW + 12;
    drawGlassCard(ctx, kpi3X, kpiY, kpiW, kpiH, 20);
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = '800 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t('stats.overview.totalSessions').toUpperCase(), kpi3X + kpiW * 0.5, kpiY + 36);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 36px Inter, system-ui, sans-serif';
    ctx.fillText(String(retro.totalSessions), kpi3X + kpiW * 0.5, kpiY + 86);
    ctx.restore();

    // Top Game Card
    if (retro.topGame) {
      const topY = 345;
      const topW = width - margin * 2;
      const topH = 290;
      drawGlassCard(ctx, margin, topY, topW, topH, 24, 'rgba(17, 24, 39, 0.85)', 'rgba(245, 158, 11, 0.35)');

      const cW = 240;
      const cH = 220;
      const cX = margin + 28;
      const cY = topY + 35;
      drawCoverArt(ctx, topCoverImg, cX, cY, cW, cH, 18, retro.topGame.game.game_name, retro.topGame.game.game_id, retro.topGame.game.category);

      const infoX = cX + cW + 28;
      ctx.save();
      ctx.fillStyle = '#F59E0B';
      ctx.font = '900 13px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`👑 ${t('stats.overview.topGame').toUpperCase()} • ${yearLabel}`, infoX, topY + 48);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 28px Inter, system-ui, sans-serif';
      ctx.textBaseline = 'top';
      const lines = wrapText(ctx, retro.topGame.game.game_name, topW - cW - 84);
      ctx.fillText(lines[0], infoX, topY + 74);

      drawPlatformBadge(ctx, retro.topGame.game.category, infoX, topY + 126, 26);

      ctx.fillStyle = '#F59E0B';
      ctx.font = '900 36px Inter, system-ui, sans-serif';
      ctx.fillText(formatDurationSeconds(retro.topGame.duration), infoX, topY + 172);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.font = '600 15px Inter, system-ui, sans-serif';
      ctx.fillText(`${retro.topGame.sessions} ${t('stats.modal.totalSessions').toLowerCase()}`, infoX, topY + 224);
      ctx.restore();
    }

    // Milestones Row
    const botY = 660;
    const botW = width - margin * 2;
    drawGlassCard(ctx, margin, botY, botW, 140, 22);

    ctx.save();
    ctx.fillStyle = '#A855F7';
    ctx.font = '800 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.evolution.title').toUpperCase(), margin + 32, botY + 42);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 28px Inter, system-ui, sans-serif';
    const mName = retro.mostActiveMonth ? t(`stats.months.${retro.mostActiveMonth.monthNumber}`) : '-';
    ctx.fillText(mName, margin + 32, botY + 84);

    ctx.fillStyle = '#3B82F6';
    ctx.font = '800 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(t('stats.overview.mostActiveDay').toUpperCase(), margin + botW - 32, botY + 42);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 28px Inter, system-ui, sans-serif';
    const dName = retro.mostActiveDayOfWeek !== null ? t(`stats.days.${retro.mostActiveDayOfWeek}`) : '-';
    ctx.fillText(dName, margin + botW - 32, botY + 84);
    ctx.restore();
  } else {
    // HORIZONTAL RECAP (1200 x 630)
    const margin = 56;
    const splitX = 580;

    // Left Side: Top Game (240x220)
    if (retro.topGame) {
      const cardW = splitX - margin - 20;
      const cardH = 430;
      const cardY = 120;
      drawGlassCard(ctx, margin, cardY, cardW, cardH, 24, 'rgba(17, 24, 39, 0.85)', 'rgba(168, 85, 247, 0.35)');

      const cW = cardW - 48;
      const cH = 200;
      const cX = margin + 24;
      const cY = cardY + 24;
      drawCoverArt(ctx, topCoverImg, cX, cY, cW, cH, 18, retro.topGame.game.game_name, retro.topGame.game.game_id, retro.topGame.game.category);

      ctx.save();
      ctx.fillStyle = '#F59E0B';
      ctx.font = '900 12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`👑 ${t('stats.overview.topGame').toUpperCase()} • ${yearLabel}`, cX, cardY + 254);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 24px Inter, system-ui, sans-serif';
      ctx.textBaseline = 'top';
      const lines = wrapText(ctx, retro.topGame.game.game_name, cardW - 48);
      ctx.fillText(lines[0], cX, cardY + 276);

      ctx.fillStyle = '#F59E0B';
      ctx.font = '900 32px Inter, system-ui, sans-serif';
      ctx.fillText(formatDurationSeconds(retro.topGame.duration), cX, cardY + 346);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.font = '600 13px Inter, system-ui, sans-serif';
      ctx.fillText(`${retro.topGame.sessions} ${t('stats.modal.totalSessions').toLowerCase()}`, cX, cardY + 386);
      ctx.restore();
    }

    // Right Side: Highlights & Stats
    const rightX = splitX + 16;
    const rightW = width - rightX - margin;
    const rightY = 120;

    // KPI row
    const kpiH = 120;
    drawGlassCard(ctx, rightX, rightY, rightW, kpiH, 20);
    ctx.save();
    ctx.fillStyle = '#C084FC';
    ctx.font = '800 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.overview.totalPlaytime').toUpperCase(), rightX + 28, rightY + 36);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 32px Inter, system-ui, sans-serif';
    ctx.fillText(formatDurationSeconds(retro.totalDuration), rightX + 28, rightY + 80);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '800 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(t('stats.overview.totalGames').toUpperCase(), rightX + rightW - 28, rightY + 36);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 36px Inter, system-ui, sans-serif';
    ctx.fillText(String(retro.uniqueGamesCount), rightX + rightW - 28, rightY + 82);
    ctx.restore();

    // Milestones Card 1: Peak Month
    drawGlassCard(ctx, rightX, rightY + kpiH + 16, rightW, 130, 20);
    ctx.save();
    ctx.fillStyle = '#A855F7';
    ctx.font = '800 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.overview.mostActiveMonth').toUpperCase(), rightX + 28, rightY + kpiH + 46);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 28px Inter, system-ui, sans-serif';
    const mName = retro.mostActiveMonth ? t(`stats.months.${retro.mostActiveMonth.monthNumber}`) : '-';
    ctx.fillText(mName, rightX + 28, rightY + kpiH + 86);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = '800 18px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    const mDur = retro.mostActiveMonth ? formatDurationSeconds(retro.mostActiveMonth.duration) : '-';
    ctx.fillText(mDur, rightX + rightW - 28, rightY + kpiH + 82);
    ctx.restore();

    // Milestones Card 2: Peak Habit
    drawGlassCard(ctx, rightX, rightY + kpiH + 162, rightW, 120, 20);
    ctx.save();
    ctx.fillStyle = '#3B82F6';
    ctx.font = '800 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.overview.mostActiveDay').toUpperCase(), rightX + 28, rightY + kpiH + 192);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 24px Inter, system-ui, sans-serif';
    const dName = retro.mostActiveDayOfWeek !== null ? t(`stats.days.${retro.mostActiveDayOfWeek}`) : '-';
    ctx.fillText(dName, rightX + 28, rightY + kpiH + 232);
    ctx.restore();
  }

  // 4. Draw Footer
  drawBrandFooter(ctx, width, height);
}
