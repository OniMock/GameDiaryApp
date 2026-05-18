/**
 * Utility for handling game covers from the GitHub CDN
 */

export const RAW_URL_BASE = 'https://raw.githubusercontent.com/OniMock/Games-Thumbnail/main/';

/**
 * Cleans a GameID (Serial) by removing hyphens and converting to uppercase.
 * Example: SLPS-00068 -> SLPS00068
 */
export const cleanGameId = (gameId: string): string => {
  if (!gameId) return '';
  return gameId.replace(/-/g, '').toUpperCase().trim();
};

export type Platform = 'psx' | 'psp' | 'unknown';

/**
 * Returns the cover URL and platform for a given GameID.
 */
export const getCoverData = (gameId: string, mapping: Record<string, string>): { url: string | null, platform: Platform } => {
  const cleanedId = cleanGameId(gameId);
  const relativePath = mapping[cleanedId];
  
  if (!relativePath) {
    return { url: null, platform: 'unknown' };
  }

  const platform: Platform = 
    relativePath.startsWith('psx/') ? 'psx' : 
    relativePath.startsWith('psp/') ? 'psp' : 
    relativePath.startsWith('homebrew/') ? 'psp' : // Homebrews use the same landscape aspect ratio
    'unknown';
  
  return { 
    url: `${RAW_URL_BASE}${relativePath}`,
    platform 
  };
};
