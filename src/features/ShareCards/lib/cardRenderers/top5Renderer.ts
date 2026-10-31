import type { CardRenderOptions } from '../../types';
import { FORMAT_DIMENSIONS } from '../../types';
import {
  drawBackground,
  drawGlassCard,
  drawCoverArt,
  drawPlatformBadge,
  drawRankMedal,
  drawBrandFooter,
  wrapText,
  roundRectPath,
} from '../canvasUtils';
import { loadCoverImage } from '../imageLoader';
import { getCoverData } from '../../../../shared/lib/game-covers';
import { formatDurationSeconds, type GameStatItem } from '../../../Stats/lib/statsCalculator';

export async function renderTop5Card(
  ctx: CanvasRenderingContext2D,
  options: CardRenderOptions
): Promise<void> {
  const { format, overallStats, mapping, t, locale, brandAssets } = options;
  const { width, height } = FORMAT_DIMENSIONS[format];

  // 1. Draw gamer background
  drawBackground(ctx, width, height, 'default');

  // 2. Select top 5 games
  const top5 = overallStats.rankings.slice(0, 5);

  // Pre-load covers in parallel
  const coverPromises = top5.map(async (item: GameStatItem) => {
    const { url } = getCoverData(item.game.game_id, mapping);
    const img = await loadCoverImage(url);
    return { item, img };
  });

  const loadedItems = await Promise.all(coverPromises);
  if (options.isCancelled?.()) return;

  // 3. Draw Header
  const headerY = format === 'horizontal' ? 22 : 90;
  const marginX = format === 'horizontal' ? 60 : 64;

  ctx.save();
  // Category Pill
  ctx.fillStyle = 'rgba(59, 130, 246, 0.18)';
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
  ctx.lineWidth = 1.5;
  const pillW = format === 'horizontal' ? 190 : 220;
  const pillH = format === 'horizontal' ? 26 : 34;
  roundRectPath(ctx, marginX, headerY, pillW, pillH, pillH * 0.5);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#60A5FA';
  ctx.font = `800 ${format === 'horizontal' ? 11 : 13}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GAMEDIARY • HALL OF FAME', marginX + pillW * 0.5, headerY + pillH * 0.52);

  // Main Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 ${format === 'horizontal' ? 28 : 46}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(t('share.model.top5'), marginX, headerY + pillH + (format === 'horizontal' ? 6 : 12));

  // Subtitle with total library time
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = `600 ${format === 'horizontal' ? 13 : 17}px Inter, system-ui, sans-serif`;
  const subText = `${formatDurationSeconds(overallStats.totalDuration, locale)} • ${overallStats.totalSessions} ${t('stats.modal.totalSessions').toLowerCase()}`;
  ctx.fillText(subText, marginX, headerY + pillH + (format === 'horizontal' ? 40 : 72));
  ctx.restore();

  // 4. Render Layouts by Format
  if (format === 'vertical') {
    // VERTICAL LAYOUT (1080 x 1920)
    // #1 Champion Spotlight Hero Box
    const heroY = 280;
    const heroW = width - marginX * 2;
    const heroH = 390;

    if (loadedItems[0]) {
      const { item: first, img: firstImg } = loadedItems[0];
      drawGlassCard(ctx, marginX, heroY, heroW, heroH, 28, 'rgba(17, 24, 39, 0.85)', 'rgba(245, 158, 11, 0.4)');

      // Champion Banner Tag
      ctx.save();
      ctx.fillStyle = '#F59E0B';
      ctx.font = '900 13px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`👑 #1 ${t('stats.overview.topGame').toUpperCase()}`, marginX + 32, heroY + 36);
      ctx.restore();

      // Cover
      const coverW = 290;
      const coverH = 250;
      const coverX = marginX + 32;
      const coverY = heroY + 68;
      drawCoverArt(ctx, firstImg, coverX, coverY, coverW, coverH, 20, first.game.game_name, first.game.game_id, first.game.category);

      // Info
      const infoX = coverX + coverW + 36;
      ctx.save();
      drawPlatformBadge(ctx, first.game.category, infoX, heroY + 76, 30);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 32px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const lines = wrapText(ctx, first.game.game_name, heroW - coverW - 100);
      lines.slice(0, 2).forEach((l, idx) => {
        ctx.fillText(l, infoX, heroY + 120 + idx * 38);
      });

      // Playtime (auto-scaled with guaranteed vertical clearance)
      const firstDurStr = formatDurationSeconds(first.totalDuration, locale);
      let firstDurSize = 36;
      ctx.font = `900 ${firstDurSize}px Inter, system-ui, sans-serif`;
      while (ctx.measureText(firstDurStr).width > heroW - coverW - 90 && firstDurSize > 24) {
        firstDurSize -= 2;
        ctx.font = `900 ${firstDurSize}px Inter, system-ui, sans-serif`;
      }
      ctx.fillStyle = '#F59E0B';
      ctx.textBaseline = 'middle';
      ctx.fillText(firstDurStr, infoX, heroY + 215);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.font = '600 15px Inter, system-ui, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${first.percentageOfTotal}% ${t('stats.overview.ofTotalTime')} • ${first.sessionCount} ${t('stats.modal.totalSessions').toLowerCase()}`, infoX, heroY + 260);
      ctx.restore();
    }

    // Rows for #2, #3, #4, #5
    const rowsStartY = heroY + heroH + 34;
    const rowH = 230;
    const rowGap = 22;

    for (let i = 1; i < 5; i++) {
      const entry = loadedItems[i];
      if (!entry) continue;
      const { item, img } = entry;
      const rowY = rowsStartY + (i - 1) * (rowH + rowGap);
      const isPodium = i < 3;
      const borderColor = i === 1 ? 'rgba(148, 163, 184, 0.4)' : i === 2 ? 'rgba(180, 83, 9, 0.4)' : 'rgba(255, 255, 255, 0.08)';

      drawGlassCard(ctx, marginX, rowY, heroW, rowH, 22, 'rgba(17, 24, 39, 0.75)', borderColor);

      // Rank Medal
      drawRankMedal(ctx, item.rank, marginX + 48, rowY + rowH * 0.5, 52);

      // Cover
      const cW = 210;
      const cH = 158;
      const cX = marginX + 96;
      const cY = rowY + (rowH - cH) * 0.5;
      drawCoverArt(ctx, img, cX, cY, cW, cH, 18, item.game.game_name, item.game.game_id, item.game.category);

      // Title & Platform
      const textX = cX + cW + 28;
      ctx.save();
      drawPlatformBadge(ctx, item.game.category, textX, rowY + 50, 28);

      // Measure duration first to prevent title/hours collision
      const durStr = formatDurationSeconds(item.totalDuration, locale);
      ctx.font = '900 28px Inter, system-ui, sans-serif';
      const durW = ctx.measureText(durStr).width;
      const availableTitleW = heroW - (textX - marginX) - durW - 48;

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 24px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const rLines = wrapText(ctx, item.game.game_name, Math.max(availableTitleW, 140));
      ctx.fillText(rLines[0], textX, rowY + 92);

      // Hours on right
      ctx.fillStyle = isPodium ? '#F8FAFC' : '#E2E8F0';
      ctx.font = '900 28px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(durStr, marginX + heroW - 32, rowY + 86);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '600 15px Inter, system-ui, sans-serif';
      ctx.fillText(`${item.percentageOfTotal}%`, marginX + heroW - 32, rowY + 124);
      ctx.restore();
    }
  } else if (format === 'square') {
    // SQUARE LAYOUT (1080 x 1080)
    const rowsStartY = 240;
    const rowH = 132;
    const rowGap = 16;
    const cardW = width - marginX * 2;

    for (let i = 0; i < Math.min(5, loadedItems.length); i++) {
      const { item, img } = loadedItems[i];
      const rowY = rowsStartY + i * (rowH + rowGap);
      const isRank1 = i === 0;
      const borderColor = isRank1
        ? 'rgba(245, 158, 11, 0.4)'
        : i === 1
        ? 'rgba(148, 163, 184, 0.4)'
        : i === 2
        ? 'rgba(180, 83, 9, 0.4)'
        : 'rgba(255, 255, 255, 0.08)';

      drawGlassCard(ctx, marginX, rowY, cardW, rowH, 20, 'rgba(17, 24, 39, 0.75)', borderColor);

      // Medal
      drawRankMedal(ctx, item.rank, marginX + 42, rowY + rowH * 0.5, 42);

      // Cover
      const cW = 140;
      const cH = 98;
      const cX = marginX + 82;
      const cY = rowY + (rowH - cH) * 0.5;
      drawCoverArt(ctx, img, cX, cY, cW, cH, 14, item.game.game_name, item.game.game_id, item.game.category);

      // Text & safe duration spacing
      const textX = cX + cW + 24;
      ctx.save();
      drawPlatformBadge(ctx, item.game.category, textX, rowY + 22, 24);

      const durStr = formatDurationSeconds(item.totalDuration, locale);
      ctx.font = '900 24px Inter, system-ui, sans-serif';
      const durW = ctx.measureText(durStr).width;
      const availableTitleW = cardW - (textX - marginX) - durW - 48;

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 20px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const titleLines = wrapText(ctx, item.game.game_name, Math.max(availableTitleW, 120));
      ctx.fillText(titleLines[0], textX, rowY + 56);

      // Hours
      ctx.fillStyle = isRank1 ? '#F59E0B' : '#FFFFFF';
      ctx.font = '900 24px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(durStr, marginX + cardW - 28, rowY + 44);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '600 14px Inter, system-ui, sans-serif';
      ctx.fillText(`${item.percentageOfTotal}%`, marginX + cardW - 28, rowY + 76);
      ctx.restore();
    }
  } else {
    // HORIZONTAL LAYOUT (1200 x 630)
    const splitX = 520;

    // Left spotlight for #1
    if (loadedItems[0]) {
      const { item: first, img: firstImg } = loadedItems[0];
      const spotW = splitX - marginX - 24;
      const spotH = 430;
      const spotY = 120;

      drawGlassCard(ctx, marginX, spotY, spotW, spotH, 24, 'rgba(17, 24, 39, 0.85)', 'rgba(245, 158, 11, 0.4)');

      // Cover
      const cW = spotW - 48;
      const cH = 190;
      const cX = marginX + 24;
      const cY = spotY + 24;
      drawCoverArt(ctx, firstImg, cX, cY, cW, cH, 18, first.game.game_name, first.game.game_id, first.game.category);

      // Badge & Rank
      drawRankMedal(ctx, 1, cX + 28, cY + 28, 38);

      ctx.save();
      drawPlatformBadge(ctx, first.game.category, cX, spotY + 230, 24);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 24px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const lines = wrapText(ctx, first.game.game_name, spotW - 48);
      ctx.fillText(lines[0], cX, spotY + 266);

      const firstDur = formatDurationSeconds(first.totalDuration, locale);
      ctx.fillStyle = '#F59E0B';
      ctx.font = '900 28px Inter, system-ui, sans-serif';
      ctx.fillText(firstDur, cX, spotY + 316);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.font = '600 14px Inter, system-ui, sans-serif';
      ctx.fillText(`${first.percentageOfTotal}% • ${first.sessionCount} ${t('stats.modal.totalSessions').toLowerCase()}`, cX, spotY + 356);
      ctx.restore();
    }

    // Right list for #2 to #5
    const listX = splitX + 16;
    const listW = width - listX - marginX;
    const listStartY = 120;
    const rowH = 94;
    const rowGap = 14;

    for (let i = 1; i < 5; i++) {
      const entry = loadedItems[i];
      if (!entry) continue;
      const { item, img } = entry;
      const rowY = listStartY + (i - 1) * (rowH + rowGap);

      drawGlassCard(ctx, listX, rowY, listW, rowH, 18, 'rgba(17, 24, 39, 0.75)', 'rgba(255, 255, 255, 0.08)');

      drawRankMedal(ctx, item.rank, listX + 32, rowY + rowH * 0.5, 34);

      const cW = 100;
      const cH = 68;
      const cX = listX + 64;
      const cY = rowY + (rowH - cH) * 0.5;
      drawCoverArt(ctx, img, cX, cY, cW, cH, 12, item.game.game_name, item.game.game_id, item.game.category);

      const textX = cX + cW + 18;
      ctx.save();
      const durStr = formatDurationSeconds(item.totalDuration, locale);
      ctx.font = '900 20px Inter, system-ui, sans-serif';
      const durW = ctx.measureText(durStr).width;
      const availableTitleW = listW - (textX - listX) - durW - 32;

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 17px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const tLines = wrapText(ctx, item.game.game_name, Math.max(availableTitleW, 100));
      ctx.fillText(tLines[0], textX, rowY + 24);

      drawPlatformBadge(ctx, item.game.category, textX, rowY + 52, 20);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 20px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(durStr, listX + listW - 20, rowY + 28);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '600 13px Inter, system-ui, sans-serif';
      ctx.fillText(`${item.percentageOfTotal}%`, listX + listW - 20, rowY + 54);
      ctx.restore();
    }
  }

  // 5. Draw Watermark Footer with official brand SVG logos
  drawBrandFooter(ctx, width, height, brandAssets);
}
