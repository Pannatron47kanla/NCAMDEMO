import type { Asset } from './asset';
import { PENDING_ROOM } from './constants';
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

/** Why an asset in this status cannot change room, in the mockup's words; undefined when it can. */
export function blockReason(asset: Asset): string | undefined {
  if (asset.status === 'ถูกยืม') return 'ถูกยืมอยู่ ต้องรับคืนก่อน';
  if (asset.status === 'จำหน่ายแล้ว') return 'ลงจ่ายออกจากทะเบียนแล้ว';
  if (asset.status === 'รอจำหน่าย') return 'อยู่ระหว่างเรื่องจำหน่าย';
  return undefined;
}

/** What scanning this asset into `room` means: blocked, placed for the first time, already there, or a move. */
export function classify(asset: Asset, room: string): Pick<ScanItem, 'kind' | 'why'> {
  const why = blockReason(asset);
  if (why) return { kind: 'block', why };
  if (asset.room === PENDING_ROOM) return { kind: 'new', why: '' };
  if (asset.room === room) return { kind: 'same', why: '' };
  return { kind: 'move', why: '' };
}

/**
 * Handles one scan against the register. An empty code does nothing; a room code or name changes the destination;
 * an asset code (any letter case, spaces cut off) is added to the list. An unknown code is an error and a code
 * already in the list is a warning and is not counted again.
 */
export function scanCode(state: RoomScanState, raw: string | null | undefined, assets: readonly Asset[]): RoomScanState {
  const code = normalizeCode(raw);
  if (!code) return state;
  const room = roomFor(code);
  if (room) {
    return { ...state, room: room.name, scan: '', done: null, msg: { kind: 'ok', code: 'ROOM_CHANGED', params: { room: room.name } } };
  }
  if (!state.room) return { ...state, scan: '', msg: { kind: 'warn', code: 'ROOM_REQUIRED' } };
  const asset = assets.find((x) => x.code.toUpperCase() === code);
  if (!asset) return { ...state, scan: '', msg: { kind: 'err', code: 'ASSET_UNKNOWN', params: { code } } };
  if (state.items.some((i) => i.id === asset.id)) {
    return { ...state, scan: '', msg: { kind: 'warn', code: 'SCAN_DUPLICATE', params: { name: asset.name } } };
  }
  const { kind, why } = classify(asset, state.room);
  const params = { name: asset.name, room: state.room, from: asset.room, why };
  const msg: Record<ScanKind, ScanMessage> = {
    block: { kind: 'err', code: 'SCAN_BLOCKED', params },
    new: { kind: 'ok', code: 'SCAN_NEW', params },
    same: { kind: 'ok', code: 'SCAN_SAME', params },
    move: { kind: 'warn', code: 'SCAN_MOVE', params },
  };
  const item: ScanItem = { id: asset.id, from: asset.room, to: state.room, kind, why, ok: false };
  return { ...state, scan: '', done: null, items: [item].concat(state.items), msg: msg[kind] };
}
