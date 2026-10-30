/**
 * Image loader with caching, CORS configuration, and graceful fallback
 */

const imageCache = new Map<string, HTMLImageElement>();

export interface BrandAssets {
  logo: HTMLImageElement | null;
  logoLetter: HTMLImageElement | null;
}

let brandAssetsPromise: Promise<BrandAssets> | null = null;

/**
 * Loads an image from a URL with crossOrigin anonymous, returning null if it fails or times out.
 */
export async function loadCoverImage(
  url: string | null,
  timeoutMs = 5000
): Promise<HTMLImageElement | null> {
  if (!url) return null;

  const cached = imageCache.get(url);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return cached;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  return new Promise((resolve) => {
    let hasResolved = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const timer = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        resolve(null);
      }
    }, timeoutMs);

    img.onload = () => {
      if (!hasResolved) {
        hasResolved = true;
        clearTimeout(timer);
        imageCache.set(url, img);
        resolve(img);
      }
    };

    img.onerror = () => {
      if (!hasResolved) {
        hasResolved = true;
        clearTimeout(timer);
        resolve(null);
      }
    };

    img.src = url;
  });
}

/**
 * Loads official vector SVG brand logos from public directory
 */
export async function loadBrandAssets(): Promise<BrandAssets> {
  if (brandAssetsPromise) {
    return brandAssetsPromise;
  }

  brandAssetsPromise = (async () => {
    try {
      const [logo, logoLetter] = await Promise.all([
        loadCoverImage('/logo.svg', 3000),
        loadCoverImage('/logo_letter.svg', 3000),
      ]);
      return { logo, logoLetter };
    } catch {
      return { logo: null, logoLetter: null };
    }
  })();

  return brandAssetsPromise;
}

/**
 * Clears the image memory cache
 */
export function clearImageCache(): void {
  imageCache.clear();
  brandAssetsPromise = null;
}
