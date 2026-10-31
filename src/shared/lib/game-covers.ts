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
 * Known overrides for games whose upstream mapping points to a Git symlink text file
 * (which raw.githubusercontent serves as plain text pointer instead of binary PNG)
 * or where a direct canonical image path is required.
 */
export const COVER_OVERRIDES: Record<string, string> = {
  // Gran Turismo 2 (Simulation Mode) - upstream symlink resolves to Rev 1 image
  SCUS94488: 'psx/Named_Titles/Gran Turismo 2 (USA) (Rev 1).png',
  SCUS94455: 'psx/Named_Titles/Gran Turismo 2 (USA).png',
  // Grand Theft Auto 2 - upstream symlink resolves to base Europe image
  SLES02453: 'psx/Named_Titles/Grand Theft Auto 2 (Europe) (En,Fr,De,Es,It).png',
};

/**
 * Returns the cover URL and platform for a given GameID.
 */
export const getCoverData = (gameId: string, mapping: Record<string, string>): { url: string | null, platform: Platform } => {
  const cleanedId = cleanGameId(gameId);
  const relativePath = COVER_OVERRIDES[cleanedId] || mapping[cleanedId];
  
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
