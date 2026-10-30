import type { CardRenderOptions } from '../types';
import { FORMAT_DIMENSIONS } from '../types';
import { loadBrandAssets } from './imageLoader';
import { renderTop5Card } from './cardRenderers/top5Renderer';
import { renderTopGameCard } from './cardRenderers/topGameRenderer';
import { renderLibraryCard } from './cardRenderers/libraryRenderer';
import { renderRetrospectiveCard } from './cardRenderers/retrospectiveRenderer';
import { renderIndividualGameCard } from './cardRenderers/individualGameRenderer';

/**
 * Renders the chosen card model to the specified canvas element
 */
export async function renderCardToCanvas(
  canvas: HTMLCanvasElement,
  options: CardRenderOptions
): Promise<void> {
  const { width, height } = FORMAT_DIMENSIONS[options.format];

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context could not be acquired');
  }

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Pre-load official brand logo assets
  const brandAssets = options.brandAssets || (await loadBrandAssets());
  const optionsWithBrand: CardRenderOptions = { ...options, brandAssets };

  switch (options.model) {
    case 'top5':
      await renderTop5Card(ctx, optionsWithBrand);
      break;
    case 'topGame':
      await renderTopGameCard(ctx, optionsWithBrand);
      break;
    case 'library':
      await renderLibraryCard(ctx, optionsWithBrand);
      break;
    case 'retrospective':
      await renderRetrospectiveCard(ctx, optionsWithBrand);
      break;
    case 'individual':
      await renderIndividualGameCard(ctx, optionsWithBrand);
      break;
    default:
      await renderTop5Card(ctx, optionsWithBrand);
  }
}

/**
 * Exports canvas to PNG Blob
 */
export function exportCanvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to generate PNG blob from canvas'));
        }
      }, 'image/png');
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Triggers browser download of canvas image as PNG
 */
export async function downloadCardImage(
  canvas: HTMLCanvasElement,
  filename = 'gamediary_card.png'
): Promise<boolean> {
  const blob = await exportCanvasToBlob(canvas);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

/**
 * Shares canvas image via Web Share API, falling back to download if unsupported or failed
 */
export async function shareOrDownloadCard(
  canvas: HTMLCanvasElement,
  title: string,
  filename = 'gamediary_card.png'
): Promise<{ shared: boolean; downloaded: boolean; cancelled?: boolean }> {
  const blob = await exportCanvasToBlob(canvas);
  const file = new File([blob], filename, { type: 'image/png' });

  // Test Web Share API with file support
  if (
    typeof navigator !== 'undefined' &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        title,
        text: 'My GameDiary PSP gaming stats!',
        files: [file],
      });
      return { shared: true, downloaded: false };
    } catch (err) {
      // User cancelled share dialog -> not an error
      if (err instanceof Error && err.name === 'AbortError') {
        return { shared: false, downloaded: false, cancelled: true };
      }
      // If native sharing failed for another reason, fallback to download
      console.warn('Native share failed, falling back to download:', err);
    }
  }

  // Fallback to PNG download
  await downloadCardImage(canvas, filename);
  return { shared: false, downloaded: true };
}
