import type { GameEntry, SessionEntry, Category } from '../model/domain/types';
import { readFixedString, writeFixedString } from './binaryHelper';

// User prompt mentioned "84 bytes total", but the C struct lengths sum to 96:
// uid (4) + game_id (16) + game_name (64) + apitype (8) + category (1) + reserved (3) = 96.
// We strictly follow the C padding which yields 96 bytes.
export const GAME_HEADER_SIZE = 32;
export const GAME_ENTRY_SIZE = 96;
export const SESSION_ENTRY_SIZE = 12;

export const GAME_MAGIC = 0x444D4147; // "GAMD" in little-endian
export const DB_VERSION = 3;

export function parseGames(buffer: ArrayBuffer): { games: GameEntry[], nextUid: number } {
  const dataView = new DataView(buffer);
  
  if (buffer.byteLength < GAME_HEADER_SIZE) {
    throw new Error('Invalid games.dat: File too small');
  }

  const magic = dataView.getUint32(0, true);
  if (magic !== GAME_MAGIC) {
    throw new Error(`Invalid games.dat: Magic mismatch (expected GAMD, got 0x${magic.toString(16)})`);
  }

  const numEntries = dataView.getUint32(8, true);
  const nextUid = dataView.getUint32(12, true);
  
  const games: GameEntry[] = [];
  
  for (let i = 0; i < numEntries; i++) {
    const offset = GAME_HEADER_SIZE + (i * GAME_ENTRY_SIZE);
    if (offset + GAME_ENTRY_SIZE > buffer.byteLength) break;
    
    const uid = dataView.getUint32(offset, true);
    const game_id = readFixedString(dataView, offset + 4, 16);
    const game_name = readFixedString(dataView, offset + 20, 64);
    const apitype_str = readFixedString(dataView, offset + 84, 8);
    const category = dataView.getUint8(offset + 92) as Category;
    
    games.push({ uid, game_id, game_name, apitype_str, category });
  }
  return { games, nextUid };
}

function calculateFNVChecksum(dataView: DataView, len: number, skipOffset: number): number {
  let hash = 2166136261 >>> 0; // FNV offset basis (unsigned)
  const fnvPrime = 16777619;
  const uint8View = new Uint8Array(dataView.buffer, dataView.byteOffset, len);

  for (let i = 0; i < len; i++) {
    // Skip the 4-byte checksum field
    if (i >= skipOffset && i < skipOffset + 4) continue;
    
    hash ^= uint8View[i];
    // Use Math.imul for 32-bit integer multiplication in JS
    hash = Math.imul(hash, fnvPrime) >>> 0;
  }
  return hash;
}

export function exportGames(games: GameEntry[], nextUid: number): ArrayBuffer {
  // Size = Header + Entries + Backup Header (another 32 bytes)
  const totalSize = GAME_HEADER_SIZE + (games.length * GAME_ENTRY_SIZE) + GAME_HEADER_SIZE;
  const buffer = new ArrayBuffer(totalSize);
  const dataView = new DataView(buffer);
  
  if (games.length === 0) {
    console.warn('Exporting games.dat with 0 entries');
  }
  
  // 1. Write Initial Header Template
  dataView.setUint32(0, GAME_MAGIC, true);          
  dataView.setUint32(4, DB_VERSION, true);          
  dataView.setUint32(8, games.length, true);        
  dataView.setUint32(12, nextUid, true);            
  dataView.setUint32(16, GAME_MAGIC, true);         
  dataView.setUint32(20, 0, true);                  // Checksum placeholder
  dataView.setUint32(24, 0, true);                  
  dataView.setUint32(28, 0, true);                  

  // 2. Write Entries
  games.forEach((game, i) => {
    const offset = GAME_HEADER_SIZE + (i * GAME_ENTRY_SIZE);
    dataView.setUint32(offset, game.uid, true);
    writeFixedString(dataView, offset + 4, 16, game.game_id);
    writeFixedString(dataView, offset + 20, 64, game.game_name);
    writeFixedString(dataView, offset + 84, 8, game.apitype_str);
    dataView.setUint8(offset + 92, game.category);
  });
  
  // 3. Calculate Checksum for the Header (32 bytes, skip offset 20)
  const checksum = calculateFNVChecksum(dataView, GAME_HEADER_SIZE, 20);
  dataView.setUint32(20, checksum, true);

  // 4. Write Backup Header at the end
  const backupOffset = GAME_HEADER_SIZE + (games.length * GAME_ENTRY_SIZE);
  const headerSource = new Uint8Array(buffer, 0, GAME_HEADER_SIZE);
  const backupDest = new Uint8Array(buffer, backupOffset, GAME_HEADER_SIZE);
  backupDest.set(headerSource);
  
  return buffer;
}

export function parseSessions(buffer: ArrayBuffer): SessionEntry[] {
  const dataView = new DataView(buffer);
  const sessions: SessionEntry[] = [];
  const numSessions = Math.floor(buffer.byteLength / SESSION_ENTRY_SIZE);
  
  for (let i = 0; i < numSessions; i++) {
    const offset = i * SESSION_ENTRY_SIZE;
    const game_uid = dataView.getUint32(offset, true); // little-endian
    const duration = dataView.getUint32(offset + 4, true); // little-endian
    const timestamp = dataView.getUint32(offset + 8, true); // little-endian
    
    sessions.push({ game_uid, duration, timestamp });
  }
  return sessions;
}

export function exportSessions(sessions: SessionEntry[]): ArrayBuffer {
  const buffer = new ArrayBuffer(sessions.length * SESSION_ENTRY_SIZE);
  const dataView = new DataView(buffer);
  
  sessions.forEach((session, i) => {
    const offset = i * SESSION_ENTRY_SIZE;
    dataView.setUint32(offset, session.game_uid, true);
    dataView.setUint32(offset + 4, session.duration, true);
    dataView.setUint32(offset + 8, session.timestamp, true);
  });
  
  return buffer;
}
