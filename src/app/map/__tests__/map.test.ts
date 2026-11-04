import { describe, expect, it } from 'vitest';
import { fixedClock } from '../../../shared/clock';
import { roomOf } from '../../../modules/registry';
import { createAppModules } from '../../modules';
import { css } from '../css';
import { floorStat, locate, mapAssets, markerSpot, needsCare, ringOf, unplaced } from '../map-logic';

const NOW = new Date(2026, 9, 28);

describe('map logic', () => {
  it('AC41: locate selects the asset, shows every category and opens the floor of its room', () => {
    const m = createAppModules(fixedClock(NOW));
    const a = m.registry.catalog.findById('A3')!;
    const room = roomOf(a.room)!;
    expect(locate(a)).toEqual({ sel: 'A3', cat: 'ทั้งหมด', view: 'floor', building: room.b, floor: room.f });
  });

  it('AC41: an asset in a room that is not on the map opens the 3D view and keeps the floor', () => {
    const m = createAppModules(fixedClock(NOW));
    const a = { ...m.registry.catalog.findById('A3')!, room: 'ห้องที่ไม่มี' };
    const next = locate(a);
    expect(next).toEqual({ sel: 'A3', cat: 'ทั้งหมด', view: '3d' });
    expect(next).not.toHaveProperty('building');
    expect(unplaced([a]).map((x) => x.id)).toEqual(['A3']);
  });

  it('AC41: floor counts follow the category filter and count the assets that need care', () => {
    const m = createAppModules(fixedClock(NOW));
    const assets = m.registry.assets.get();
    const all = mapAssets(assets, 'ทั้งหมด');
    const total = [['B1', 1], ['B1', 2], ['B1', 3], ['B2', 1], ['B2', 2], ['B3', 1], ['B3', 2]].reduce((n, [b, f]) => n + floorStat(all, b as string, f as number, NOW).n, 0);
    expect(total).toBe(all.length - unplaced(assets).length);
    const one = mapAssets(assets, 'หุ่นจำลอง');
    expect(one.every((a) => a.cat === 'หุ่นจำลอง')).toBe(true);
    const alerts = [['B1', 1], ['B1', 2], ['B2', 2], ['B3', 1]].reduce((n, [b, f]) => n + floorStat(all, b as string, f as number, NOW).alerts, 0);
    expect(alerts).toBe(all.filter((a) => needsCare(a, NOW) && !unplaced(assets).includes(a)).length);
  });

  it('AC41: ring, marker place and style text follow the mockup', () => {
    const base = createAppModules(fixedClock(NOW)).registry.assets.get()[0]!;
    expect(ringOf({ ...base, status: 'ถูกยืม' })).toBe('2px solid #1d4a99');
    expect(ringOf({ ...base, status: 'รอจำหน่าย' })).toBe('2px dashed #82193a');
    expect(ringOf({ ...base, status: 'พร้อมใช้' })).toBe('2px solid #d8e1e4');
    const r = roomOf(base.room)!;
    expect(markerSpot(r, 0)).toEqual({ x: r.x + 12, y: r.y + 34 });
    const per = Math.floor((r.w - 20) / 46);
    expect(markerSpot(r, per + 1)).toEqual({ x: r.x + 12 + 46, y: r.y + 34 + 46 });
    expect(css('left:10px;transform-origin:0 0;transition:transform .7s ease;')).toEqual({ left: '10px', transformOrigin: '0 0', transition: 'transform .7s ease' });
  });
});
