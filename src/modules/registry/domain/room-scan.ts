import { ROOMS, roomCode, type Room } from './locations';

// Room assignment by scanning, ported from the mockup (rsNew, rsScan, rsSave; lines 1752 and 1928-1957).
// Every function takes the state and gives back a new one.

export type ScanKind = 'new' | 'same' | 'move' | 'block';

/** One scanned asset. `from` is the room it was in when scanned; `ok` is the officer's confirmation of a move. */
export interface ScanItem {
  id: string;
  from: string;
  to: string;
  kind: ScanKind;
  /** Why a blocked asset cannot change room; empty for the others. */
  why: string;
  ok: boolean;
}

/** What the screen says under the scan box. The web layer turns `code` + `params` into Thai text. */
export interface ScanMessage {
  kind: 'ok' | 'warn' | 'err';
  code: string;
  params?: Record<string, string | number>;
}

export interface RoomScanState {
  /** The destination room's name, or null before one is chosen. */
  room: string | null;
  /** Text in the scan box. */
  scan: string;
  /** Newest first. */
  items: ScanItem[];
  msg: ScanMessage | null;
  /** The last save: how many assets changed, and the first one that did. */
  done: { n: number; lastId: string | null } | null;
}

export function newRoomScan(): RoomScanState {
  return { room: null, scan: '', items: [], msg: null, done: null };
}

/** What a scanner or keyboard gives, cleaned up the same way for every code: spaces cut off, upper case. */
export function normalizeCode(raw: string | null | undefined): string {
  return String(raw || '').trim().toUpperCase();
}

/** The room a scanned code names, by room code (RM-B1-201) or by name. */
export function roomFor(code: string): Room | undefined {
  return ROOMS.find((r) => roomCode(r) === code || r.name.toUpperCase() === code);
}

/** Chooses the destination from the select. An empty value clears it and the message. */
export function chooseRoom(state: RoomScanState, room: string): RoomScanState {
  return room
    ? { ...state, room, done: null, msg: { kind: 'ok', code: 'ROOM_PICKED', params: { room } } }
    : { ...state, room: null, msg: null };
}

/** Handles one scan. An empty code does nothing; a room code or name changes the destination. */
export function scanCode(state: RoomScanState, raw: string | null | undefined): RoomScanState {
  const code = normalizeCode(raw);
  if (!code) return state;
  const room = roomFor(code);
  if (room) {
    return { ...state, room: room.name, scan: '', done: null, msg: { kind: 'ok', code: 'ROOM_CHANGED', params: { room: room.name } } };
  }
  if (!state.room) return { ...state, scan: '', msg: { kind: 'warn', code: 'ROOM_REQUIRED' } };
  return state;
}
