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
import { calculateYearRetrospective } from '../retrospectiveUtils';
import { formatDurationSeconds, formatHours } from '../../../Stats/lib/statsCalculator';

export async function renderRetrospectiveCard(
  ctx: CanvasRenderingContext2D,
  options: CardRenderOptions
): Promise<void> {
  const { format, games, sessions, selectedYear, mapping, t, locale, brandAssets } = options;
  const { width, height } = FORMAT_DIMENSIONS[format];

  // 1. Draw Retrospective Purple/Midnight Background
  drawBackground(ctx, width, height, 'retro');

  const yearTarget = selectedYear || 'all';
  const retro = calculateYearRetrospective(yearTarget, games, sessions);

  const marginX = format === 'horizontal' ? 56 : 64;
  const headerY = format === 'horizontal' ? 24 : 90;

  const yearLabel = yearTarget === 'all' ? t('stats.filter.periodAll').toUpperCase() : String(yearTarget);

  // 2. Draw Header
  ctx.save();
  // Pill Tag
  ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
  ctx.lineWidth = 1.5;
  const pillW = format === 'horizontal' ? 210 : 240;
  const pillH = format === 'horizontal' ? 26 : 34;
  ctx.beginPath();
  ctx.roundRect(marginX, headerY, pillW, pillH, pillH * 0.5);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#C084FC';
  ctx.font = `900 ${format === 'horizontal' ? 11 : 13}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`🎮 GAMEDIARY • ${yearLabel}`, marginX + pillW * 0.5, headerY + pillH * 0.52);

  // Main Title (Guaranteed vertical breathing room above cards)
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 ${format === 'horizontal' ? 28 : 48}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(
    yearTarget === 'all' ? t('share.model.retrospective') : `${t('share.model.retrospective')} • ${yearLabel}`,
    marginX,
    headerY + pillH + (format === 'horizontal' ? 6 : 12)
  );
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

    drawBrandFooter(ctx, width, height, brandAssets);
    return;
  }

  // Pre-load top game cover
  let topCoverImg: HTMLImageElement | null = null;
  if (retro.topGame) {
    const { url } = getCoverData(retro.topGame.game.game_id, mapping);
    topCoverImg = await loadCoverImage(url);
    if (options.isCancelled?.()) return;
  }

  // 3. Render Formats
  if (format === 'vertical') {
    // VERTICAL RECAP (1080 x 1920)
    // 3 Big Summary KPI Cards
    const kpiY = 250;
    const kpiW = (width - marginX * 2 - 32) / 3;
    const kpiH = 190;

    // KPI 1: Playtime (Strict 3-zone architecture)
    const durStr = formatDurationSeconds(retro.totalDuration, locale);
    drawPlaytimeHeroBlock(ctx, {
      x: marginX,
      y: kpiY,
      w: kpiW,
      h: kpiH,
      label: t('stats.overview.totalPlaytime'),
      value: durStr,
      subtext: formatHours(retro.totalHours, locale),
      align: 'center',
      labelColor: '#C084FC',
      valueColor: '#FFFFFF',
      subtextColor: 'rgba(255, 255, 255, 0.55)',
      cardRadius: 22,
      cardBg: 'rgba(17, 24, 39, 0.85)',
      cardBorder: 'rgba(168, 85, 247, 0.35)',
      maxHeroFontSize: 38,
      paddingX: 16,
      paddingY: 20,
    });

    // KPI 2: Games
    const kpi2X = marginX + kpiW + 16;
    drawGlassCard(ctx, kpi2X, kpiY, kpiW, kpiH, 22);
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = '800 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t('stats.overview.totalGames').toUpperCase(), kpi2X + kpiW * 0.5, kpiY + 44);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 48px Inter, system-ui, sans-serif';
    ctx.fillText(String(retro.uniqueGamesCount), kpi2X + kpiW * 0.5, kpiY + 112);
    ctx.restore();

    // KPI 3: Sessions
    const kpi3X = kpi2X + kpiW + 16;
    drawGlassCard(ctx, kpi3X, kpiY, kpiW, kpiH, 22);
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = '800 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t('stats.overview.totalSessions').toUpperCase(), kpi3X + kpiW * 0.5, kpiY + 44);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 48px Inter, system-ui, sans-serif';
    ctx.fillText(String(retro.totalSessions), kpi3X + kpiW * 0.5, kpiY + 112);
    ctx.restore();

    // Most Played Game Spotlight of the Year
    if (retro.topGame) {
      const topW = width - marginX * 2;
      const topH = 510;
      const topY = kpiY + kpiH + 34;
      drawGlassCard(ctx, marginX, topY, topW, topH, 28, 'rgba(17, 24, 39, 0.85)', 'rgba(245, 158, 11, 0.35)');

      // Top Tag
      ctx.save();
      ctx.fillStyle = '#F59E0B';
      ctx.font = '900 14px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`👑 ${t('stats.overview.topGame').toUpperCase()} • ${yearLabel}`, marginX + 36, topY + 46);

      // Cover
      const cW = 340;
      const cH = 310;
      const cX = marginX + 36;
      const cY = topY + 76;
      drawCoverArt(ctx, topCoverImg, cX, cY, cW, cH, 22, retro.topGame.game.game_name, retro.topGame.game.game_id, retro.topGame.game.category);

      // Info
      const infoX = cX + cW + 36;
      drawPlatformBadge(ctx, retro.topGame.game.category, infoX, topY + 82, 30);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 36px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const lines = wrapText(ctx, retro.topGame.game.game_name, topW - cW - 110);
      lines.slice(0, 2).forEach((l, idx) => {
        ctx.fillText(l, infoX, topY + 132 + idx * 44);
      });

      const topGameDurStr = formatDurationSeconds(retro.topGame.duration, locale);
      let tgDurSize = 42;
      ctx.font = `900 ${tgDurSize}px Inter, system-ui, sans-serif`;
      while (ctx.measureText(topGameDurStr).width > topW - cW - 100 && tgDurSize > 24) {
        tgDurSize -= 2;
        ctx.font = `900 ${tgDurSize}px Inter, system-ui, sans-serif`;
      }
      ctx.fillStyle = '#F59E0B';
      ctx.fillText(topGameDurStr, infoX, topY + 258);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.font = '600 17px Inter, system-ui, sans-serif';
      ctx.fillText(`${retro.topGame.sessions} ${t('stats.modal.totalSessions').toLowerCase()}`, infoX, topY + 316);
      ctx.restore();
    }

    // Milestones & Gaming Habits (2x2 Grid + Summary Ribbon)
    const habitY = 1024;
    const cardHalfW = (width - marginX * 2 - 20) * 0.5;
    const cardH = 185;

    // Row 1 - Card 1: Peak Month
    drawGlassCard(ctx, marginX, habitY, cardHalfW, cardH, 22);
    ctx.save();
    ctx.fillStyle = '#A855F7';
    ctx.font = '800 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`⚡ ${t('stats.overview.mostActiveMonth').toUpperCase()}`, marginX + 28, habitY + 40);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 34px Inter, system-ui, sans-serif';
    const monthStr = retro.mostActiveMonth ? t(`stats.months.${retro.mostActiveMonth.monthNumber}`) : '-';
    ctx.fillText(monthStr, marginX + 28, habitY + 90);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '800 18px Inter, system-ui, sans-serif';
    const monthDur = retro.mostActiveMonth ? formatDurationSeconds(retro.mostActiveMonth.duration, locale) : '-';
    ctx.fillText(monthDur, marginX + 28, habitY + 138);
    ctx.restore();

    // Row 1 - Card 2: Gaming Pace (Average Session Duration)
    drawGlassCard(ctx, marginX + cardHalfW + 20, habitY, cardHalfW, cardH, 22);
    ctx.save();
    ctx.fillStyle = '#60A5FA';
    ctx.font = '800 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`⏱ ${t('stats.modal.avgSession').toUpperCase()}`, marginX + cardHalfW + 48, habitY + 40);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 34px Inter, system-ui, sans-serif';
    const avgRetro = retro.totalSessions > 0 ? Math.round(retro.totalDuration / retro.totalSessions) : 0;
    ctx.fillText(formatDurationSeconds(avgRetro, locale), marginX + cardHalfW + 48, habitY + 90);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '800 18px Inter, system-ui, sans-serif';
    ctx.fillText(`${retro.totalSessions} ${t('stats.modal.totalSessions').toLowerCase()}`, marginX + cardHalfW + 48, habitY + 138);
    ctx.restore();

    // Row 2 - Card 3: Peak Day of the Week
    const habit2Y = habitY + cardH + 20;
    drawGlassCard(ctx, marginX, habit2Y, cardHalfW, cardH, 22);
    ctx.save();
    ctx.fillStyle = '#3B82F6';
    ctx.font = '800 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`📅 ${t('stats.overview.mostActiveDay').toUpperCase()}`, marginX + 28, habit2Y + 40);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 32px Inter, system-ui, sans-serif';
    const dayStr = retro.mostActiveDayOfWeek !== null ? t(`stats.days.${retro.mostActiveDayOfWeek}`) : '-';
    ctx.fillText(`${dayStr}`, marginX + 28, habit2Y + 90);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '700 16px Inter, system-ui, sans-serif';
    ctx.fillText(t('stats.overview.gamingHabit'), marginX + 28, habit2Y + 138);
    ctx.restore();

    // Row 2 - Card 4: Peak Period / Time of Day
    drawGlassCard(ctx, marginX + cardHalfW + 20, habit2Y, cardHalfW, cardH, 22);
    ctx.save();
    ctx.fillStyle = '#F59E0B';
    ctx.font = '800 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`⏰ ${t('stats.overview.peakHour').toUpperCase()}`, marginX + cardHalfW + 48, habit2Y + 40);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 32px Inter, system-ui, sans-serif';
    const timeStr = retro.mostActiveTimeOfDay ? t(`stats.timeOfDay.${retro.mostActiveTimeOfDay}`) : '-';
    ctx.fillText(timeStr, marginX + cardHalfW + 48, habit2Y + 90);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '700 16px Inter, system-ui, sans-serif';
    ctx.fillText(`${retro.uniqueGamesCount} ${t('stats.overview.totalGames').toLowerCase()}`, marginX + cardHalfW + 48, habit2Y + 138);
    ctx.restore();

    // Bottom Summary Banner Ribbon
    const ribbonY = habit2Y + cardH + 24;
    const ribbonW = width - marginX * 2;
    const ribbonH = 140;
    drawGlassCard(ctx, marginX, ribbonY, ribbonW, ribbonH, 22, 'rgba(17, 24, 39, 0.85)', 'rgba(168, 85, 247, 0.35)');

    ctx.save();
    ctx.fillStyle = '#C084FC';
    ctx.font = '900 14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🎮 GAMEDIARY • ${t('share.model.retrospective').toUpperCase()} • ${yearLabel}`, marginX + 32, ribbonY + 42);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 28px Inter, system-ui, sans-serif';
    ctx.fillText(`${formatDurationSeconds(retro.totalDuration, locale)} • ${retro.uniqueGamesCount} ${t('stats.overview.totalGames')} • ${retro.totalSessions} ${t('stats.modal.totalSessions').toLowerCase()}`, marginX + 32, ribbonY + 86);
    ctx.restore();
  } else if (format === 'square') {
    // SQUARE RECAP (1080 x 1080)
    const margin = 64;

    // 3 Mini KPI cards in a row
    const kpiY = 190;
    const kpiW = (width - margin * 2 - 24) / 3;
    const kpiH = 130;

    // Hours (Strict 3-zone architecture)
    const durStr = formatDurationSeconds(retro.totalDuration, locale);
    drawPlaytimeHeroBlock(ctx, {
      x: margin,
      y: kpiY,
      w: kpiW,
      h: kpiH,
      label: t('stats.overview.totalPlaytime'),
      value: durStr,
      align: 'center',
      labelColor: '#C084FC',
      valueColor: '#FFFFFF',
      cardRadius: 20,
      cardBg: 'rgba(17, 24, 39, 0.85)',
      cardBorder: 'rgba(168, 85, 247, 0.35)',
      maxHeroFontSize: 30,
      paddingX: 12,
      paddingY: 16,
    });

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
      const topY = 336;
      const topW = width - margin * 2;
      const topH = 276;
      drawGlassCard(ctx, margin, topY, topW, topH, 24, 'rgba(17, 24, 39, 0.85)', 'rgba(245, 158, 11, 0.35)');

      const cW = 240;
      const cH = 210;
      const cX = margin + 28;
      const cY = topY + 33;
      drawCoverArt(ctx, topCoverImg, cX, cY, cW, cH, 18, retro.topGame.game.game_name, retro.topGame.game.game_id, retro.topGame.game.category);

      const infoX = cX + cW + 28;
      ctx.save();
      ctx.fillStyle = '#F59E0B';
      ctx.font = '900 13px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`👑 ${t('stats.overview.topGame').toUpperCase()} • ${yearLabel}`, infoX, topY + 44);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 28px Inter, system-ui, sans-serif';
      ctx.textBaseline = 'top';
      const lines = wrapText(ctx, retro.topGame.game.game_name, topW - cW - 84);
      ctx.fillText(lines[0], infoX, topY + 68);

      drawPlatformBadge(ctx, retro.topGame.game.category, infoX, topY + 118, 26);

      const tgDur = formatDurationSeconds(retro.topGame.duration, locale);
      let tgSize = 34;
      ctx.font = `900 ${tgSize}px Inter, system-ui, sans-serif`;
      while (ctx.measureText(tgDur).width > topW - cW - 84 && tgSize > 22) {
        tgSize -= 2;
        ctx.font = `900 ${tgSize}px Inter, system-ui, sans-serif`;
      }
      ctx.fillStyle = '#F59E0B';
      ctx.fillText(tgDur, infoX, topY + 162);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.font = '600 15px Inter, system-ui, sans-serif';
      ctx.fillText(`${retro.topGame.sessions} ${t('stats.modal.totalSessions').toLowerCase()}`, infoX, topY + 214);
      ctx.restore();
    }

    // Milestones 2x2 Grid (Filling Y: 630 to 920 gracefully)
    const botY1 = 628;
    const botCardW = (width - margin * 2 - 16) * 0.5;
    const botCardH = 136;

    // Card 1: Peak Month
    drawGlassCard(ctx, margin, botY1, botCardW, botCardH, 20);
    ctx.save();
    ctx.fillStyle = '#A855F7';
    ctx.font = '800 11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`⚡ ${t('stats.overview.mostActiveMonth').toUpperCase()}`, margin + 24, botY1 + 32);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 24px Inter, system-ui, sans-serif';
    const mName = retro.mostActiveMonth ? t(`stats.months.${retro.mostActiveMonth.monthNumber}`) : '-';
    ctx.fillText(mName, margin + 24, botY1 + 68);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = '700 15px Inter, system-ui, sans-serif';
    const mDur = retro.mostActiveMonth ? formatDurationSeconds(retro.mostActiveMonth.duration, locale) : '-';
    ctx.fillText(mDur, margin + 24, botY1 + 102);
    ctx.restore();

    // Card 2: Peak Day
    drawGlassCard(ctx, margin + botCardW + 16, botY1, botCardW, botCardH, 20);
    ctx.save();
    ctx.fillStyle = '#3B82F6';
    ctx.font = '800 11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`📅 ${t('stats.overview.mostActiveDay').toUpperCase()}`, margin + botCardW + 40, botY1 + 32);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 24px Inter, system-ui, sans-serif';
    const dName = retro.mostActiveDayOfWeek !== null ? t(`stats.days.${retro.mostActiveDayOfWeek}`) : '-';
    ctx.fillText(dName, margin + botCardW + 40, botY1 + 68);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = '700 15px Inter, system-ui, sans-serif';
    ctx.fillText(t('stats.overview.gamingHabit'), margin + botCardW + 40, botY1 + 102);
    ctx.restore();

    // Row 2: Peak Time & Average Session
    const botY2 = botY1 + botCardH + 14;

    // Card 3: Peak Time
    drawGlassCard(ctx, margin, botY2, botCardW, botCardH, 20);
    ctx.save();
    ctx.fillStyle = '#F59E0B';
    ctx.font = '800 11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`⏰ ${t('stats.overview.peakHour').toUpperCase()}`, margin + 24, botY2 + 32);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 24px Inter, system-ui, sans-serif';
    const timeStr = retro.mostActiveTimeOfDay ? t(`stats.timeOfDay.${retro.mostActiveTimeOfDay}`) : '-';
    ctx.fillText(timeStr, margin + 24, botY2 + 68);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = '700 15px Inter, system-ui, sans-serif';
    ctx.fillText(`${retro.uniqueGamesCount} ${t('stats.overview.totalGames').toLowerCase()}`, margin + 24, botY2 + 102);
    ctx.restore();

    // Card 4: Average Session Pace
    drawGlassCard(ctx, margin + botCardW + 16, botY2, botCardW, botCardH, 20);
    ctx.save();
    ctx.fillStyle = '#60A5FA';
    ctx.font = '800 11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`⏱ ${t('stats.modal.avgSession').toUpperCase()}`, margin + botCardW + 40, botY2 + 32);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 24px Inter, system-ui, sans-serif';
    const avgRetro = retro.totalSessions > 0 ? Math.round(retro.totalDuration / retro.totalSessions) : 0;
    ctx.fillText(formatDurationSeconds(avgRetro, locale), margin + botCardW + 40, botY2 + 68);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = '700 15px Inter, system-ui, sans-serif';
    ctx.fillText(`${retro.totalSessions} ${t('stats.modal.totalSessions').toLowerCase()}`, margin + botCardW + 40, botY2 + 102);
    ctx.restore();
  } else {
    // HORIZONTAL RECAP (1200 x 630) - Perfect vertical alignment & centering
    const margin = 56;
    const splitX = 580;
    const cardY = 104;
    const totalH = 440; // Both columns end at Y = 104 + 440 = 544

    // Left Side: Top Game Spotlight Card (504 x 440)
    if (retro.topGame) {
      const cardW = splitX - margin - 20;
      drawGlassCard(ctx, margin, cardY, cardW, totalH, 24, 'rgba(17, 24, 39, 0.85)', 'rgba(168, 85, 247, 0.35)');

      const cW = cardW - 48;
      const cH = 205;
      const cX = margin + 24;
      const cY = cardY + 24;
      drawCoverArt(ctx, topCoverImg, cX, cY, cW, cH, 18, retro.topGame.game.game_name, retro.topGame.game.game_id, retro.topGame.game.category);

      ctx.save();
      ctx.fillStyle = '#F59E0B';
      ctx.font = '900 12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`👑 ${t('stats.overview.topGame').toUpperCase()} • ${yearLabel}`, cX, cardY + 258);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 24px Inter, system-ui, sans-serif';
      ctx.textBaseline = 'top';
      const lines = wrapText(ctx, retro.topGame.game.game_name, cardW - 48);
      ctx.fillText(lines[0], cX, cardY + 280);

      const tgDur = formatDurationSeconds(retro.topGame.duration, locale);
      ctx.fillStyle = '#F59E0B';
      ctx.font = '900 32px Inter, system-ui, sans-serif';
      ctx.fillText(tgDur, cX, cardY + 346);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.font = '600 13px Inter, system-ui, sans-serif';
      ctx.fillText(`${retro.topGame.sessions} ${t('stats.modal.totalSessions').toLowerCase()}`, cX, cardY + 392);
      ctx.restore();
    }

    // Right Side: Highlights & Stats (Stacked 3 cards totaling exactly 440px from Y=104 to Y=544)
    const rightX = splitX + 16;
    const rightW = width - rightX - margin;
    const kpiH = 126;
    const cardGap = 14;
    const mH = 143;
    const dH = 143;

    // Card 1: KPI row (Playtime & Total Games)
    drawGlassCard(ctx, rightX, cardY, rightW, kpiH, 20);
    ctx.save();
    ctx.fillStyle = '#C084FC';
    ctx.font = '800 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.overview.totalPlaytime').toUpperCase(), rightX + 28, cardY + 36);

    const durStr = formatDurationSeconds(retro.totalDuration, locale);
    let durSize = 32;
    ctx.font = `900 ${durSize}px Inter, system-ui, sans-serif`;
    while (ctx.measureText(durStr).width > (rightW * 0.5) - 36 && durSize > 20) {
      durSize -= 2;
      ctx.font = `900 ${durSize}px Inter, system-ui, sans-serif`;
    }
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(durStr, rightX + 28, cardY + 80);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '800 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(t('stats.overview.totalGames').toUpperCase(), rightX + rightW - 28, cardY + 36);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 36px Inter, system-ui, sans-serif';
    ctx.fillText(String(retro.uniqueGamesCount), rightX + rightW - 28, cardY + 82);
    ctx.restore();

    // Card 2: Peak Month
    const mY = cardY + kpiH + cardGap;
    drawGlassCard(ctx, rightX, mY, rightW, mH, 20);
    ctx.save();
    ctx.fillStyle = '#A855F7';
    ctx.font = '800 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.overview.mostActiveMonth').toUpperCase(), rightX + 28, mY + 44);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 28px Inter, system-ui, sans-serif';
    const mName = retro.mostActiveMonth ? t(`stats.months.${retro.mostActiveMonth.monthNumber}`) : '-';
    ctx.fillText(mName, rightX + 28, mY + 86);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = '800 18px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    const mDur = retro.mostActiveMonth ? formatDurationSeconds(retro.mostActiveMonth.duration, locale) : '-';
    ctx.fillText(mDur, rightX + rightW - 28, mY + 84);
    ctx.restore();

    // Card 3: Peak Day & Peak Hour (Symmetrical & balanced)
    const dY = mY + mH + cardGap;
    drawGlassCard(ctx, rightX, dY, rightW, dH, 20);
    ctx.save();
    ctx.fillStyle = '#3B82F6';
    ctx.font = '800 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('stats.overview.mostActiveDay').toUpperCase(), rightX + 28, dY + 44);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 28px Inter, system-ui, sans-serif';
    const dName = retro.mostActiveDayOfWeek !== null ? t(`stats.days.${retro.mostActiveDayOfWeek}`) : '-';
    ctx.fillText(dName, rightX + 28, dY + 86);

    ctx.fillStyle = '#F59E0B';
    ctx.font = '800 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(t('stats.overview.peakHour').toUpperCase(), rightX + rightW - 28, dY + 44);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 24px Inter, system-ui, sans-serif';
    const timeStr = retro.mostActiveTimeOfDay ? t(`stats.timeOfDay.${retro.mostActiveTimeOfDay}`) : '-';
    ctx.fillText(timeStr, rightX + rightW - 28, dY + 86);
    ctx.restore();
  }

  // 4. Draw Footer with official brand SVG logos
  drawBrandFooter(ctx, width, height, brandAssets);
}
