import { CLASS, COUNTER, LAB1, LAB2, STORE, SUPPLY } from './constants';

// Buildings and rooms, ported from the mockup (lines 1589-1750).

export interface Building {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  d: number;
  floors: number;
}

export interface Room {
  name: string;
  /** Building id */
  b: string;
  /** Floor */
  f: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const BLD: Building[] = [
  { id: 'B1', name: 'อาคารปฏิบัติการพยาบาล', x: 40, y: 40, w: 300, d: 170, floors: 3 },
  { id: 'B2', name: 'อาคารเรียนรวม', x: 400, y: 50, w: 230, d: 130, floors: 2 },
  { id: 'B3', name: 'อาคารอำนวยการ', x: 60, y: 290, w: 250, d: 130, floors: 2 },
];

/** Rooms that can hold assets. */
export const ROOMS: Room[] = [
  { name: COUNTER, b: 'B1', f: 1, x: 20, y: 20, w: 400, h: 230 }, { name: STORE, b: 'B1', f: 1, x: 440, y: 20, w: 420, h: 230 },
  { name: LAB1, b: 'B1', f: 2, x: 20, y: 20, w: 420, h: 230 }, { name: LAB2, b: 'B1', f: 2, x: 460, y: 20, w: 400, h: 230 },
  { name: CLASS, b: 'B2', f: 2, x: 20, y: 20, w: 420, h: 230 },
  { name: SUPPLY, b: 'B3', f: 1, x: 20, y: 20, w: 420, h: 230 },
];

/** Rooms drawn on the floor plan that never hold assets. */
export const DECOR: Room[] = [
  { name: 'โถงทางเข้า', b: 'B1', f: 1, x: 20, y: 340, w: 840, h: 130 },
  { name: 'ห้องเตรียมอุปกรณ์', b: 'B1', f: 2, x: 20, y: 340, w: 400, h: 130 }, { name: 'ห้องพักอาจารย์', b: 'B1', f: 2, x: 440, y: 340, w: 420, h: 130 },
  { name: 'ห้องจำลองสถานการณ์ (ปรับปรุง)', b: 'B1', f: 3, x: 20, y: 20, w: 840, h: 230 }, { name: 'ห้องประชุมย่อย', b: 'B1', f: 3, x: 20, y: 340, w: 840, h: 130 },
  { name: 'ห้องเรียน 101', b: 'B2', f: 1, x: 20, y: 20, w: 420, h: 230 }, { name: 'ห้องเรียน 102', b: 'B2', f: 1, x: 460, y: 20, w: 400, h: 230 },
  { name: 'ห้องเรียน 206', b: 'B2', f: 2, x: 460, y: 20, w: 400, h: 230 },
  { name: 'งานการเงินและบัญชี', b: 'B3', f: 1, x: 460, y: 20, w: 400, h: 230 },
  { name: 'ห้องผู้อำนวยการ', b: 'B3', f: 2, x: 20, y: 20, w: 420, h: 230 }, { name: 'ห้องประชุมใหญ่', b: 'B3', f: 2, x: 460, y: 20, w: 400, h: 230 },
];

/** [x, y, kind, scale]; kind r = round bush, s = tall bush, b = low bush. */
export type Tree = [x: number, y: number, kind: 'r' | 's' | 'b', scale: number];

export const TREES: Tree[] = [
  [655, 40, 'r', 1.1], [662, 100, 's', 1], [655, 160, 'r', 0.95], [662, 212, 'b', 1],
  [418, 24, 'b', 0.9], [470, 22, 'r', 0.85], [540, 24, 'b', 0.9], [610, 22, 's', 0.9], [20, 22, 'r', 0.9], [120, 22, 'b', 0.8], [250, 22, 'b', 0.8],
  [392, 212, 'r', 0.9], [470, 208, 'b', 0.8], [545, 210, 'r', 0.95], [622, 208, 'b', 0.8],
  [22, 70, 's', 1], [22, 140, 'r', 1], [22, 200, 'b', 0.9],
  [30, 278, 'b', 0.8], [130, 276, 'b', 0.75], [230, 276, 'b', 0.75], [330, 278, 'b', 0.8],
  [24, 310, 'r', 1], [20, 370, 's', 1.05], [24, 430, 'r', 0.95],
  [334, 320, 's', 1], [334, 385, 'r', 1], [334, 445, 'b', 0.9],
  [100, 455, 'r', 1], [190, 458, 'b', 0.85], [270, 455, 's', 0.95],
  [392, 300, 'r', 0.9], [392, 462, 'b', 0.85], [660, 300, 'r', 1], [664, 380, 's', 1], [660, 460, 'r', 0.95], [470, 466, 'b', 0.8], [580, 466, 'b', 0.8],
];

export function roomOf(name: string): Room | null {
  return ROOMS.find((r) => r.name === name) ?? null;
}

export function bldOf(id: string): Building | undefined {
  return BLD.find((b) => b.id === id);
}

/** Where a room is, in words; a room that is not on the map says so. */
export function locText(name: string): string {
  const r = roomOf(name);
  return r ? bldOf(r.b)!.name + ' ชั้น ' + r.f + ' · ' + name : name + ' (ยังไม่ระบุตำแหน่ง)';
}

/** Room code, e.g. RM-B1-201. */
export function roomCode(r: Room): string {
  const same = ROOMS.filter((x) => x.b === r.b && x.f === r.f);
  return 'RM-' + r.b + '-' + r.f + String(same.indexOf(r) + 1).padStart(2, '0');
}
