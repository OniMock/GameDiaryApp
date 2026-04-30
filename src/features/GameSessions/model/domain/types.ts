export const CAT_PSP = 0;
export const CAT_PS1 = 1;
export const CAT_HOMEBREW = 2;
export const CAT_VSH = 3;
export const CAT_UNKNOWN = 4;

export type Category = 0 | 1 | 2 | 3 | 4;

export const CATEGORY_DEFAULTS: Record<Category, string> = {
  [CAT_PSP]: '0x120',
  [CAT_PS1]: '0x144',
  [CAT_HOMEBREW]: '0x141',
  [CAT_VSH]: '0x200',
  [CAT_UNKNOWN]: '0x000',
};

export interface GameEntry {
  uid: number; // 4 bytes uint32
  game_id: string; // 16 bytes string
  game_name: string; // 64 bytes string
  apitype_str: string; // 8 bytes string
  category: Category; // 1 byte uint8
  // reserved: 3 bytes padding/reserved
}

export interface SessionEntry {
  game_uid: number; // 4 bytes uint32
  duration: number; // 4 bytes uint32
  timestamp: number; // 4 bytes uint32
}
