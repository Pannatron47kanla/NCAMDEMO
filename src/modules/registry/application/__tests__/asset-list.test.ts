import { describe, expect, it } from 'vitest';
import { setup } from './helpers';
import { ALL_CATEGORIES, ALL_STATUSES, filterAssets, NO_FILTER, pageWindow } from '../../domain/asset-list';

const assets = setup().assets();
const ids = (list: { id: string }[]) => list.map((a) => a.id);

describe('asset register list', () => {
  it('AC39: with no filter every asset is listed in register order', () => {
    expect(ids(filterAssets(assets, NO_FILTER))).toEqual(ids(assets));
  });

  it('AC39: search finds the code, the name or the room, in any letter case, ignoring spaces around it', () => {
    expect(ids(filterAssets(assets, { ...NO_FILTER, q: '  6515-002-0001 ' }))).toEqual(['A1']);
    expect(ids(filterAssets(assets, { ...NO_FILTER, q: 'โปรเจกเตอร์' }))).toEqual(['A9']);
    expect(ids(filterAssets(assets, { ...NO_FILTER, q: 'ห้องเรียน 205' }))).toEqual(['A9']);
    expect(ids(filterAssets(assets, { ...NO_FILTER, q: 'cpr' }))).toEqual(['A1', 'A2', 'A15']);
    expect(filterAssets(assets, { ...NO_FILTER, q: 'ไม่มีอะไรแบบนี้' })).toEqual([]);
  });

  it('AC39: category and status narrow the list and combine with the search', () => {
    expect(filterAssets(assets, { ...NO_FILTER, cat: 'คอมพิวเตอร์' }).map((a) => a.id)).toEqual(['A8', 'A17']);
    expect(ids(filterAssets(assets, { ...NO_FILTER, status: 'ถูกยืม' }))).toEqual(['A2']);
    expect(ids(filterAssets(assets, { q: 'แขน', cat: 'หุ่นจำลอง', status: 'รอซ่อม' }))).toEqual(['A4']);
    expect(ids(filterAssets(assets, { q: 'คอม', cat: ALL_CATEGORIES, status: ALL_STATUSES }))).toEqual(['A8', 'A17']);
  });

  it('AC39: the list pages by 10, and the last page holds the rest', () => {
    expect(pageWindow(17, 1, 10)).toEqual({ count: 2, cur: 1, start: 0, end: 10 });
    expect(pageWindow(17, 2, 10)).toEqual({ count: 2, cur: 2, start: 10, end: 17 });
    expect(pageWindow(17, 1, 20)).toEqual({ count: 1, cur: 1, start: 0, end: 17 });
  });

  it('AC39: a page outside the range falls back to the nearest page, and an empty list still has page 1', () => {
    expect(pageWindow(17, 9, 10).cur).toBe(2);
    expect(pageWindow(17, 0, 10).cur).toBe(1);
    expect(pageWindow(0, 3, 10)).toEqual({ count: 1, cur: 1, start: 0, end: 0 });
  });
});
