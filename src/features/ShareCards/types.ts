import type { GameEntry, SessionEntry } from '../GameSessions/model/domain/types';
import type { OverallStats, PlatformFilter } from '../Stats/lib/statsCalculator';
import type { BrandAssets } from './lib/imageLoader';

export type CardModel = 'top5' | 'topGame' | 'library' | 'retrospective' | 'individual';

export type CardFormat = 'vertical' | 'square' | 'horizontal';

export interface FormatDimensions {
  width: number;
  height: number;
}

export const FORMAT_DIMENSIONS: Record<CardFormat, FormatDimensions> = {
  vertical: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  horizontal: { width: 1200, height: 630 },
};

export interface CardRenderOptions {
  model: CardModel;
  format: CardFormat;
  selectedGameUid?: number;
  selectedYear?: number | 'all';
  selectedCategory?: PlatformFilter;
  brandAssets?: BrandAssets;
  locale?: string;
  t: (key: string, params?: Record<string, any>) => string;
  games: GameEntry[];
  sessions: SessionEntry[];
  overallStats: OverallStats;
  mapping: Record<string, string>;
  isCancelled?: () => boolean;
}

export interface YearRetrospectiveStats {
  year: number | 'all';
  totalDuration: number;
  totalHours: number;
  totalSessions: number;
  uniqueGamesCount: number;
  topGame: {
    game: GameEntry;
    duration: number;
    hours: number;
    sessions: number;
  } | null;
  mostActiveMonth: {
    monthNumber: number;
    duration: number;
    hours: number;
  } | null;
  mostActiveDayOfWeek: number | null;
  mostActiveTimeOfDay: string | null;
  hasData: boolean;
}
