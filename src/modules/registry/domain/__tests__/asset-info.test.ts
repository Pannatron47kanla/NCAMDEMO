import { describe, expect, it } from 'vitest';
import { addYears, thd, toIso } from '../../../../shared/dates';
import { assetInfo } from '../asset-info';
import type { Asset } from '../asset';

// The demo date, passed in the way the Clock supplies it.
const NOW = new Date(2026, 9, 28);
const dayOffset = (off: number) => new Date(2026, 9, 28 + off);

function asset(patch: Partial<Asset> = {}): Asset {
  return {
    id: 'T1', code: '0000-000-0001', name: 'ทดสอบ', cat: 'หุ่นจำลอง', dept: 'งานห้องปฏิบัติการพยาบาล', room: 'ห้องปฏิบัติการพยาบาล 1',
    status: 'พร้อมใช้', price: 1000, acq: '2023-01-01', method: 'ซื้อ', doc: 'เอกสาร', vendor: '-', warranty: null,
    life: 5, parts: [], calib: null, custodian: 'ผู้รับผิดชอบ', events: [],
    ...patch,
  };
}

/** An asset whose end of life falls `off` days after the demo date. */
function endingIn(off: number): Asset {
  return asset({ life: 5, acq: toIso(addYears(dayOffset(off), -5)) });
}

describe('assetInfo', () => {
  it.each([
    [-1, 'เกินอายุใช้งาน'],
    [0, 'ครบภายใน 6 เดือน'],
    [182, 'ครบภายใน 6 เดือน'],
    [183, 'ครบภายใน 6–12 เดือน'],
    [365, 'ครบภายใน 6–12 เดือน'],
    [366, 'มากกว่า 1 ปี'],
  ])('AC30: life buckets and calibration: %i days to end of life is "%s"', (off, bucket) => {
    const info = assetInfo(endingIn(off), NOW);
    expect(info.off).toBe(off);
    expect(info.bucket).toBe(bucket);
  });

  it('AC30: life buckets and calibration: remaining time reads as in the mockup', () => {
    expect(assetInfo(endingIn(-1), NOW).remain).toBe('เกินมา 1 วัน');
    expect(assetInfo(endingIn(0), NOW).remain).toBe('อีก 0 วัน');
    expect(assetInfo(endingIn(45), NOW).remain).toBe('อีก 1 เดือน');
    expect(assetInfo(endingIn(400), NOW).remain).toBe('อีก 1 ปี 1 เดือน');
    expect(assetInfo(endingIn(-1), NOW).dispText).toBe(thd(dayOffset(-1)));
  });

  it('AC30: life buckets and calibration: an asset with no acquisition date is not specified', () => {
    const info = assetInfo(asset({ acq: null }), NOW);
    expect(info.bucket).toBe('ยังไม่ระบุ');
    expect(info.off).toBeNull();
    expect(info.pct).toBe(0);
    expect(info.remain).toBe('เติมวันที่ได้มาก่อน');
    expect(info.dispText).toBe('ยังไม่ระบุ');
  });

  it('AC30: life buckets and calibration: the share of life used is clamped between 0 and 100', () => {
    expect(assetInfo(endingIn(-400), NOW).pct).toBe(100);
    expect(assetInfo(asset({ acq: '2027-01-01' }), NOW).pct).toBe(0);
    expect(assetInfo(asset({ acq: '2024-10-28', life: 4 }), NOW).pct).toBe(50);
  });

  it('AC30: life buckets and calibration: calNext is last plus cycle months', () => {
    const next = assetInfo(asset({ calib: { last: '2026-05-20', cycle: 6 } }), NOW);
    expect(toIso(next.calNext!)).toBe('2026-11-20');
    expect(next.calOff).toBe(23);

    const late = assetInfo(asset({ calib: { last: '2025-10-20', cycle: 12 } }), NOW);
    expect(toIso(late.calNext!)).toBe('2026-10-20');
    expect(late.calOff).toBe(-8);

    const across = assetInfo(asset({ calib: { last: '2025-11-10', cycle: 12 } }), NOW);
    expect(toIso(across.calNext!)).toBe('2026-11-10');

    const none = assetInfo(asset({ calib: null }), NOW);
    expect(none.calNext).toBeNull();
    expect(none.calOff).toBeNull();
  });

  // Review focus 3: the US clock change is on 1 November 2026. `npm test` runs this file with
  // TZ=America/New_York and TZ=UTC, and the answers must be the same in both.
  it('AC30: life buckets and calibration: day counts stay exact across the 1 November 2026 clock change', () => {
    expect(assetInfo(endingIn(3), NOW).off).toBe(3);
    expect(assetInfo(endingIn(4), NOW).off).toBe(4);
    expect(assetInfo(endingIn(5), NOW).off).toBe(5);
    expect(assetInfo(asset({ calib: { last: '2026-05-01', cycle: 6 } }), NOW).calOff).toBe(4);
    expect(assetInfo(asset({ calib: { last: '2026-05-02', cycle: 6 } }), NOW).calOff).toBe(5);
  });
});
