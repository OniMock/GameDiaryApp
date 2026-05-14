import { useState, useEffect } from 'react';

type GameMapping = Record<string, string>;

/**
 * Hook to load the game cover mapping from full_game_map.json
 */
export const useGameCovers = () => {
  const [mapping, setMapping] = useState<GameMapping>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMapping = async () => {
      try {
        setIsLoading(true);
        // Fetching the mapping directly from the GitHub CDN
        const response = await fetch('https://raw.githubusercontent.com/OniMock/Games-Thumbnail/main/full_game_map.json');
        if (!response.ok) {
          throw new Error('Failed to load game mapping');
        }
        const data = await response.json();
        setMapping(data);
        setError(null);
      } catch (err) {
        console.error('Error loading game cover mapping:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    loadMapping();
  }, []);

  return { mapping, isLoading, error };
};
