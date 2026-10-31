/**
 * Canvas drawing utilities for GameDiary shareable cards
 */

export function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number | number[]
): void {
  const r = typeof radius === 'number' ? radius : radius[0] || 0;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  // Fallback for older browsers
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Draws the gamer background with deep midnight colors and ambient glows
 */
export function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  variant: 'default' | 'spotlight' | 'mosaic' | 'retro' | 'collector' = 'default'
): void {
  ctx.save();

  // Base deep background
  ctx.fillStyle = '#070A14';
  ctx.fillRect(0, 0, width, height);

  // Large ambient radial glow 1 (top-left / top)
  const glow1X = variant === 'spotlight' ? width * 0.5 : width * 0.2;
  const glow1Y = height * 0.15;
  const rad1 = Math.max(width, height) * 0.6;
  const grad1 = ctx.createRadialGradient(glow1X, glow1Y, 0, glow1X, glow1Y, rad1);
  if (variant === 'spotlight') {
    grad1.addColorStop(0, 'rgba(245, 158, 11, 0.16)'); // Warm amber for spotlight
    grad1.addColorStop(0.5, 'rgba(59, 130, 246, 0.08)');
  } else if (variant === 'retro') {
    grad1.addColorStop(0, 'rgba(168, 85, 247, 0.16)'); // Purple for retrospective
    grad1.addColorStop(0.5, 'rgba(59, 130, 246, 0.08)');
  } else {
    grad1.addColorStop(0, 'rgba(59, 130, 246, 0.18)'); // Classic primary blue
    grad1.addColorStop(0.5, 'rgba(14, 165, 233, 0.06)');
  }
  grad1.addColorStop(1, 'rgba(7, 10, 20, 0)');
  ctx.fillStyle = grad1;
  ctx.fillRect(0, 0, width, height);

  // Ambient radial glow 2 (bottom-right)
  const glow2X = width * 0.85;
  const glow2Y = height * 0.85;
  const rad2 = Math.max(width, height) * 0.5;
  const grad2 = ctx.createRadialGradient(glow2X, glow2Y, 0, glow2X, glow2Y, rad2);
  grad2.addColorStop(0, 'rgba(99, 102, 241, 0.12)');
  grad2.addColorStop(1, 'rgba(7, 10, 20, 0)');
  ctx.fillStyle = grad2;
  ctx.fillRect(0, 0, width, height);

  // Subtle grid/dot pattern overlay
  ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
  const step = 48;
  for (let x = 24; x < width; x += step) {
    for (let y = 24; y < height; y += step) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Vignette border
  const vig = ctx.createLinearGradient(0, 0, 0, height);
  vig.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
  vig.addColorStop(0.2, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(0.8, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}

/**
 * Draws a glassmorphic card container with subtle border
 */
export function drawGlassCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius = 24,
  bgColor = 'rgba(17, 24, 39, 0.75)',
  borderColor = 'rgba(255, 255, 255, 0.08)',
  shadow = true
): void {
  ctx.save();
  if (shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 10;
  }

  ctx.fillStyle = bgColor;
  roundRectPath(ctx, x, y, w, h, radius);
  ctx.fill();

  if (borderColor) {
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = borderColor;
    roundRectPath(ctx, x, y, w, h, radius);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws cover art with aspect-ratio preservation or procedural fallback
 */
export function drawCoverArt(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
  radius = 16,
  title = '',
  serial = '',
  category = 0
): void {
  ctx.save();

  // Create rounded clipping region
  roundRectPath(ctx, x, y, w, h, radius);
  ctx.clip();

  if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
    // Fill container with subtle dark gradient matching card theme
    const bgGrad = ctx.createLinearGradient(x, y, x, y + h);
    bgGrad.addColorStop(0, '#0F172A');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(x, y, w, h);

    // Aspect ratio calculation: object-fit contain (no crop, no distortion)
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const boxRatio = w / h;

    let destW = w;
    let destH = h;
    let destX = x;
    let destY = y;

    if (imgRatio > boxRatio) {
      // Image is wider relative to box -> fit width, center vertically
      destW = w;
      destH = w / imgRatio;
      destY = y + (h - destH) / 2;
    } else {
      // Image is taller relative to box -> fit height, center horizontally
      destH = h;
      destW = h * imgRatio;
      destX = x + (w - destW) / 2;
    }

    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, destX, destY, destW, destH);

    // Subtle dark gradient at bottom of cover for depth
    const grad = ctx.createLinearGradient(x, y + h * 0.7, x, y + h);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y + h * 0.7, w, h * 0.3);
  } else {
    // Procedural Fallback Cover
    const fallbackGrad = ctx.createLinearGradient(x, y, x + w, y + h);
    fallbackGrad.addColorStop(0, '#1E293B');
    fallbackGrad.addColorStop(1, '#0F172A');
    ctx.fillStyle = fallbackGrad;
    ctx.fillRect(x, y, w, h);

    // Left accent bar based on platform
    let accentColor = '#3B82F6';
    if (category === 1) accentColor = '#6366F1';
    else if (category === 2) accentColor = '#10B981';
    else if (category > 2) accentColor = '#71717A';

    ctx.fillStyle = accentColor;
    ctx.fillRect(x, y, Math.max(6, w * 0.04), h);

    // Stylized Gamepad Silhouette
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    const iconSize = Math.min(w, h) * 0.35;
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y + h * 0.42, iconSize * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Fallback Title & Serial
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = `bold ${Math.max(12, Math.min(18, Math.floor(w * 0.09)))}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const shortTitle = title ? (title.length > 20 ? title.substring(0, 18) + '...' : title) : 'GAME';
    ctx.fillText(shortTitle, x + w * 0.5, y + h * 0.72);

    if (serial) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = `600 ${Math.max(9, Math.min(13, Math.floor(w * 0.065)))}px monospace`;
      ctx.fillText(serial, x + w * 0.5, y + h * 0.85);
    }
  }

  ctx.restore();

  // Subtle border around cover
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;
  roundRectPath(ctx, x, y, w, h, radius);
  ctx.stroke();
  ctx.restore();
}

/**
 * Word wrap helper for canvas text with support for spaces and CJK/unbroken strings
 */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (!text) return [''];
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? currentLine + ' ' + word : word;
    const width = ctx.measureText(testLine).width;

    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = '';
      }

      // If the single word itself is wider than maxWidth (e.g. continuous Japanese/Chinese or long title)
      if (ctx.measureText(word).width > maxWidth) {
        let chunk = '';
        for (const char of word) {
          if (ctx.measureText(chunk + char).width <= maxWidth) {
            chunk += char;
          } else {
            if (chunk) lines.push(chunk);
            chunk = char;
          }
        }
        currentLine = chunk;
      } else {
        currentLine = word;
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [text];
}

/**
 * Draws platform pill badge
 */
export function drawPlatformBadge(
  ctx: CanvasRenderingContext2D,
  category: number,
  x: number,
  y: number,
  height = 28
): void {
  ctx.save();
  let text = 'PSP';
  let bg = 'rgba(59, 130, 246, 0.2)';
  let fg = '#60A5FA';
  let border = 'rgba(59, 130, 246, 0.4)';

  if (category === 1) {
    text = 'PS1';
    bg = 'rgba(99, 102, 241, 0.2)';
    fg = '#818CF8';
    border = 'rgba(99, 102, 241, 0.4)';
  } else if (category === 2) {
    text = 'HOMEBREW';
    bg = 'rgba(16, 185, 129, 0.2)';
    fg = '#34D399';
    border = 'rgba(16, 185, 129, 0.4)';
  } else if (category > 2) {
    text = 'SYSTEM';
    bg = 'rgba(113, 113, 122, 0.2)';
    fg = '#A1A1AA';
    border = 'rgba(113, 113, 122, 0.4)';
  }

  const fontSize = Math.floor(height * 0.46);
  ctx.font = `800 ${fontSize}px Inter, system-ui, sans-serif`;
  const textWidth = ctx.measureText(text).width;
  const paddingX = Math.floor(height * 0.45);
  const width = textWidth + paddingX * 2;
  const radius = height * 0.5;

  ctx.fillStyle = bg;
  roundRectPath(ctx, x, y, width, height, radius);
  ctx.fill();

  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  roundRectPath(ctx, x, y, width, height, radius);
  ctx.stroke();

  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + width * 0.5, y + height * 0.52);

  ctx.restore();
}

/**
 * Draws rank indicator circle / medal
 */
export function drawRankMedal(
  ctx: CanvasRenderingContext2D,
  rank: number,
  x: number,
  y: number,
  diameter = 44
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, diameter * 0.5, 0, Math.PI * 2);

  let bg = '#1F2937';
  let fg = '#9CA3AF';
  let border = 'rgba(255, 255, 255, 0.15)';

  if (rank === 1) {
    bg = '#F59E0B'; // Gold
    fg = '#000000';
    border = '#FDE68A';
    ctx.shadowColor = 'rgba(245, 158, 11, 0.5)';
    ctx.shadowBlur = 12;
  } else if (rank === 2) {
    bg = '#94A3B8'; // Silver
    fg = '#0F172A';
    border = '#F1F5F9';
    ctx.shadowColor = 'rgba(148, 163, 184, 0.4)';
    ctx.shadowBlur = 10;
  } else if (rank === 3) {
    bg = '#B45309'; // Bronze
    fg = '#FFFFFF';
    border = '#FCD34D';
    ctx.shadowColor = 'rgba(180, 83, 9, 0.4)';
    ctx.shadowBlur = 8;
  }

  ctx.fillStyle = bg;
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = fg;
  ctx.font = `900 ${Math.floor(diameter * 0.44)}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`#${rank}`, x, y + 1);

  ctx.restore();
}

/**
 * Draws GameDiary branding footer at bottom safe area
 */
export function drawBrandFooter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  brandAssets?: { logo: HTMLImageElement | null; logoLetter: HTMLImageElement | null } | null
): void {
  ctx.save();
  const isCompact = height <= 700;
  const y = height - (isCompact ? 42 : 62);

  if (brandAssets && (brandAssets.logo || brandAssets.logoLetter)) {
    const emblem = brandAssets.logo;
    const wordmark = brandAssets.logoLetter;

    // Proportional, clearly legible brand dimensions
    const emblemH = isCompact ? 34 : 44;
    const emblemW = emblem ? Math.round(emblemH * (23.03 / 26.15)) : 0;

    const wordmarkH = isCompact ? 24 : 32;
    const wordmarkW = wordmark ? Math.round(wordmarkH * (47.62 / 12.21)) : 0;

    const domainFontSize = isCompact ? 15 : 18;
    ctx.font = `600 ${domainFontSize}px Inter, monospace`;
    const domainText = 'gamediary.onimock.com';
    const domainWidth = ctx.measureText(domainText).width;

    const spacing = isCompact ? 14 : 18;
    const totalW = (emblem ? emblemW + spacing : 0) + (wordmark ? wordmarkW + spacing : 0) + domainWidth;
    let currentX = Math.round((width - totalW) / 2);

    if (emblem) {
      ctx.drawImage(emblem, currentX, y - emblemH * 0.5, emblemW, emblemH);
      currentX += emblemW + spacing;
    }

    if (wordmark) {
      ctx.drawImage(wordmark, currentX, y - wordmarkH * 0.5, wordmarkW, wordmarkH);
      currentX += wordmarkW + spacing;
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(domainText, currentX, y);

    ctx.restore();
    return;
  }

  // Fallback if SVG assets not yet loaded
  const logoSize = isCompact ? 32 : 40;
  const logoX = width * 0.5 - 140;
  const logoY = y - logoSize * 0.5;

  ctx.fillStyle = '#3B82F6';
  roundRectPath(ctx, logoX, logoY, logoSize, logoSize, 9);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 ${isCompact ? 18 : 22}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('G', logoX + logoSize * 0.5, logoY + logoSize * 0.52);

  // Brand Name
  ctx.font = `800 ${isCompact ? 18 : 22}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Game', logoX + logoSize + 12, y);

  const gameWidth = ctx.measureText('Game').width;
  ctx.fillStyle = '#3B82F6';
  ctx.fillText('Diary', logoX + logoSize + 12 + gameWidth, y);

  // URL subtitle
  ctx.font = '600 13px Inter, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillText('gamediary.onimock.com', logoX + logoSize + 10 + gameWidth + 58, y);

  ctx.restore();
}

/**
 * Options for rendering the 3-zone Playtime Hero Block
 */
export interface PlaytimeHeroBlockOptions {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  value: string;
  subtext?: string;
  labelColor?: string;
  valueColor?: string;
  subtextColor?: string;
  maxHeroFontSize?: number;
  minHeroFontSize?: number;
  align?: 'left' | 'center' | 'right';
  paddingX?: number;
  paddingY?: number;
  cardRadius?: number;
  cardBg?: string;
  cardBorder?: string;
  drawCard?: boolean;
}

/**
 * Renders a strictly segmented 3-zone playtime block preventing any visual collisions:
 * - Zone 1 (Top): Supporting label in uppercase
 * - Zone 2 (Middle): Headline hero value vertically centered in dedicated middle slot
 * - Zone 3 (Bottom): Complementary info auto-scaled to prevent truncation or overlap
 */
export function drawPlaytimeHeroBlock(
  ctx: CanvasRenderingContext2D,
  options: PlaytimeHeroBlockOptions
): void {
  const {
    x,
    y,
    w,
    h,
    label,
    value,
    subtext,
    labelColor = 'rgba(255, 255, 255, 0.55)',
    valueColor = '#3B82F6',
    subtextColor = 'rgba(255, 255, 255, 0.65)',
    maxHeroFontSize = 54,
    minHeroFontSize = 24,
    align = 'left',
    paddingX = 28,
    paddingY = 20,
    cardRadius = 24,
    cardBg = 'rgba(17, 24, 39, 0.85)',
    cardBorder = 'rgba(59, 130, 246, 0.35)',
    drawCard = true,
  } = options;

  ctx.save();

  // 1. Optional background card
  if (drawCard) {
    drawGlassCard(ctx, x, y, w, h, cardRadius, cardBg, cardBorder);
  }

  const innerX = align === 'left' ? x + paddingX : align === 'right' ? x + w - paddingX : x + w * 0.5;
  const maxContentW = w - paddingX * 2;

  // --- ZONE 1: TOP SUPPORTING LABEL ---
  const labelFontSize = 13;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.fillStyle = labelColor;
  ctx.font = `800 ${labelFontSize}px Inter, system-ui, sans-serif`;
  ctx.fillText(label.toUpperCase(), innerX, y + paddingY);

  const zone1Bottom = y + paddingY + labelFontSize;

  // --- ZONE 3: BOTTOM COMPLEMENTARY SUBTEXT ---
  let zone3Top = y + h - paddingY;
  if (subtext) {
    let subFontSize = 15;
    ctx.font = `600 ${subFontSize}px Inter, system-ui, sans-serif`;
    while (ctx.measureText(subtext).width > maxContentW && subFontSize > 11) {
      subFontSize -= 1;
      ctx.font = `600 ${subFontSize}px Inter, system-ui, sans-serif`;
    }
    const subY = y + h - paddingY - subFontSize;
    zone3Top = subY;

    ctx.fillStyle = subtextColor;
    ctx.textBaseline = 'top';
    ctx.fillText(subtext, innerX, subY);
  }

  // --- ZONE 2: MIDDLE HERO VALUE ---
  const verticalGap = 8;
  const heroSlotTop = zone1Bottom + verticalGap;
  const heroSlotBottom = zone3Top - verticalGap;
  const heroSlotH = Math.max(heroSlotBottom - heroSlotTop, 24);
  const heroCenterY = heroSlotTop + heroSlotH * 0.5;

  let heroFontSize = Math.min(maxHeroFontSize, Math.floor(heroSlotH * 0.82));
  ctx.font = `900 ${heroFontSize}px Inter, system-ui, sans-serif`;
  while ((ctx.measureText(value).width > maxContentW || heroFontSize > heroSlotH) && heroFontSize > minHeroFontSize) {
    heroFontSize -= 2;
    ctx.font = `900 ${heroFontSize}px Inter, system-ui, sans-serif`;
  }

  ctx.fillStyle = valueColor;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, innerX, Math.round(heroCenterY));

  ctx.restore();
}
