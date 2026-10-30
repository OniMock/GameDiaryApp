import type { CardRenderOptions } from '../../types';
import { FORMAT_DIMENSIONS } from '../../types';
import {
  drawBackground,
  drawGlassCard,
  drawCoverArt,
  drawBrandFooter,
} from '../canvasUtils';
import { loadCoverImage } from '../imageLoader';
import { getCoverData } from '../../../../shared/lib/game-covers';
import { formatDurationSeconds, type GameStatItem, type PlatformStatItem } from '../../../Stats/lib/statsCalculator';

export async function renderLibraryCard(
  ctx: CanvasRenderingContext2D,
  options: CardRenderOptions
): Promise<void> {
  const { format, games, overallStats, mapping, t } = options;
  const { width, height } = FORMAT_DIMENSIONS[format];

  // 1. Draw Mosaic Background
  drawBackground(ctx, width, height, 'mosaic');

  // Games to display in mosaic: prefer ranked games with playtime, then remaining games
  const sortedGames = [...overallStats.rankings.map((r: GameStatItem) => r.game)];
  for (const g of games) {
    if (!sortedGames.some((sg) => sg.uid === g.uid)) {
      sortedGames.push(g);
    }
  }

  // Determine grid capacity based on format and library size
  let cols = 3;
  let rows = 4;
  if (format === 'vertical') {
    if (sortedGames.length <= 6) {
      cols = 2;
      rows = 3;
    } else if (sortedGames.length <= 12) {
      cols = 3;
      rows = 4;
    } else {
      cols = 4;
      rows = 5;
    }
  } else if (format === 'square') {
    if (sortedGames.length <= 4) {
      cols = 2;
      rows = 2;
    } else if (sortedGames.length <= 9) {
      cols = 3;
      rows = 3;
    } else {
      cols = 4;
      rows = 4;
    }
  } else {
    // Horizontal (1200 x 630)
    if (sortedGames.length <= 8) {
      cols = 4;
      rows = 2;
    } else {
      cols = 6;
      rows = 3;
    }
  }

  const maxCells = cols * rows;
  const displayGames = sortedGames.slice(0, maxCells);

  // Pre-load covers in parallel
  const coverPromises = displayGames.map(async (g) => {
    const { url } = getCoverData(g.game_id, mapping);
    const img = await loadCoverImage(url);
    return { game: g, img };
  });

  const loadedCovers = await Promise.all(coverPromises);

  // Layout bounds
  const marginX = format === 'horizontal' ? 56 : 64;
  const gridStartY = format === 'horizontal' ? 130 : 220;
  const footerH = 80;
  const gridW = width - marginX * 2;
  const gridH = height - gridStartY - footerH;

  const gap = format === 'horizontal' ? 12 : 16;
  const cellW = (gridW - (cols - 1) * gap) / cols;
  const cellH = (gridH - (rows - 1) * gap) / rows;

  // 2. Draw Mosaic Covers
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const cellX = marginX + c * (cellW + gap);
      const cellY = gridStartY + r * (cellH + gap);

      if (idx < loadedCovers.length) {
        const { game, img } = loadedCovers[idx];
        drawCoverArt(ctx, img, cellX, cellY, cellW, cellH, 16, game.game_name, game.game_id, game.category);
      } else {
        // Subtle empty placeholder
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(cellX, cellY, cellW, cellH, 16);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // 3. Header Glass Banner
  const bannerY = format === 'horizontal' ? 36 : 60;
  drawGlassCard(ctx, marginX, bannerY, gridW, format === 'horizontal' ? 76 : 126, 24, 'rgba(11, 17, 32, 0.88)', 'rgba(59, 130, 246, 0.35)');

  ctx.save();
  if (format === 'horizontal') {
    // Horizontal Single-line Header
    ctx.fillStyle = '#60A5FA';
    ctx.font = '900 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('GAMEDIARY', marginX + 28, bannerY + 18);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 24px Inter, system-ui, sans-serif';
    ctx.fillText(t('share.model.library'), marginX + 28, bannerY + 38);

    // Stats on right
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 22px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${games.length} ${t('stats.overview.totalGames')} • ${formatDurationSeconds(overallStats.totalDuration)}`, marginX + gridW - 28, bannerY + 26);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = '600 13px Inter, system-ui, sans-serif';
    const platStr = overallStats.platforms.filter((p: PlatformStatItem) => p.gameCount > 0).map((p: PlatformStatItem) => `${p.gameCount} ${p.key.toUpperCase()}`).join(' • ');
    ctx.fillText(platStr, marginX + gridW - 28, bannerY + 52);
  } else {
    // Vertical / Square 2-row Header
    ctx.fillStyle = '#60A5FA';
    ctx.font = '900 14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`GAMEDIARY • ${t('share.model.library').toUpperCase()}`, marginX + 32, bannerY + 22);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `900 ${format === 'square' ? 32 : 36}px Inter, system-ui, sans-serif`;
    ctx.fillText(t('share.model.library'), marginX + 32, bannerY + 48);

    // Badges on right side of banner
    ctx.fillStyle = '#3B82F6';
    ctx.font = '900 28px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${games.length} ${t('stats.overview.totalGames')}`, marginX + gridW - 32, bannerY + 36);

    ctx.fillStyle = '#F59E0B';
    ctx.font = '800 20px Inter, system-ui, sans-serif';
    ctx.fillText(formatDurationSeconds(overallStats.totalDuration), marginX + gridW - 32, bannerY + 74);

    // Platform breakdown subtitle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '600 14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    const platStr = overallStats.platforms.filter((p: PlatformStatItem) => p.gameCount > 0).map((p: PlatformStatItem) => `${p.gameCount} ${p.key.toUpperCase()}`).join(' • ');
    ctx.fillText(platStr, marginX + 32, bannerY + 92);
  }
  ctx.restore();

  // 4. Draw Footer
  drawBrandFooter(ctx, width, height);
}
