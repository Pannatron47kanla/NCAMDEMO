import type { Asset, Room } from '../../modules/registry';
import { ROOMS, assetInfo, roomOf } from '../../modules/registry';
import type { MapView } from '../views';

/**
 * What "ดูบนแผนที่" sets (mockup locate, line 2127): select the asset, show every category, and open
 * the floor plan of the asset's room. An asset whose room is not on the map opens the 3D view and
 * keeps the building and floor that were showing.
 */
export function locate(asset: Asset | undefined): Partial<MapView> {
  const room = asset ? roomOf(asset.room) : null;
  return {
    sel: asset ? asset.id : null,
    cat: 'ทั้งหมด',
    view: room ? 'floor' : '3d',
    ...(room ? { building: room.b, floor: room.f } : {}),
  };
}

/** A red dot or a warning count: end of life is near, or the status needs attention (mockup alertOf, line 2496). */
export function needsCare(a: Asset, now: Date): boolean {
  const b = assetInfo(a, now).bucket;
  return b === 'เกินอายุใช้งาน' || b === 'ครบภายใน 6 เดือน' || ['รอซ่อม', 'ชิ้นส่วนไม่ครบ', 'สูญหาย / ไม่พบ', 'รอจำหน่าย'].includes(a.status);
}

/** The red dot on a marker (mockup hasDot): end of life is near. */
export function nearEndOfLife(a: Asset, now: Date): boolean {
  const b = assetInfo(a, now).bucket;
  return b === 'เกินอายุใช้งาน' || b === 'ครบภายใน 6 เดือน';
}

/** The ring around a marker (mockup ringOf, line 2457). */
export function ringOf(a: Asset): string {
  if (a.status === 'สูญหาย / ไม่พบ' || a.status === 'รอจำหน่าย') return '2px dashed #82193a';
  if (a.status === 'ถูกยืม') return '2px solid #1d4a99';
  if (a.status === 'รอซ่อม' || a.status === 'ชิ้นส่วนไม่ครบ') return '2px solid #b45309';
  return '2px solid #d8e1e4';
}

/** Assets that count on the map: not yet disposed of, and in the chosen category. */
export function mapAssets(assets: readonly Asset[], cat: string): Asset[] {
  return assets.filter((a) => a.status !== 'จำหน่ายแล้ว' && (cat === 'ทั้งหมด' || a.cat === cat));
}

/** Asset count and care count of one floor (mockup floorStat, line 2497). */
export function floorStat(shown: readonly Asset[], b: string, f: number, now: Date): { n: number; alerts: number } {
  const names = ROOMS.filter((r) => r.b === b && r.f === f).map((r) => r.name);
  const xs = shown.filter((a) => names.includes(a.room));
  return { n: xs.length, alerts: xs.filter((a) => needsCare(a, now)).length };
}

/** Assets whose room is not on the map (mockup unplaced, line 2493). */
export function unplaced(assets: readonly Asset[]): Asset[] {
  return assets.filter((a) => a.status !== 'จำหน่ายแล้ว' && !ROOMS.some((r) => r.name === a.room));
}

/** Where each marker sits on a floor plan (mockup lines 2477-2480): a grid of 46 px cells inside the room. */
export function markerSpot(r: Room, index: number): { x: number; y: number } {
  const per = Math.max(1, Math.floor((r.w - 20) / 46));
  return { x: r.x + 12 + (index % per) * 46, y: r.y + 34 + Math.floor(index / per) * 46 };
}
