import { addMonths, addYears, diffDays, dur, iso, thd } from '../../../shared/dates';
import type { Asset } from './asset';

export type LifeBucket = 'เกินอายุใช้งาน' | 'ครบภายใน 6 เดือน' | 'ครบภายใน 6–12 เดือน' | 'มากกว่า 1 ปี' | 'ยังไม่ระบุ';

export interface AssetInfo {
  acq: Date | null;
  /** End of life: acquisition plus service life. */
  disp: Date | null;
  /** Days from now to end of life. Negative when past. */
  off: number | null;
  bucket: LifeBucket;
  /** Share of life used, 0 to 100. */
  pct: number;
  calNext: Date | null;
  /** Days from now to the next calibration. Negative when late. */
  calOff: number | null;
  dispText: string;
  remain: string;
}

/** Life bucket, remaining time and calibration for an asset (port of info(), mockup lines 1785-1792). */
export function assetInfo(asset: Asset, now: Date): AssetInfo {
  const acq = iso(asset.acq);
  const disp = acq ? addYears(acq, asset.life) : null;
  const off = disp ? diffDays(now, disp) : null;
  const bucket: LifeBucket = off === null ? 'ยังไม่ระบุ' : (off < 0 ? 'เกินอายุใช้งาน' : (off <= 182 ? 'ครบภายใน 6 เดือน' : (off <= 365 ? 'ครบภายใน 6–12 เดือน' : 'มากกว่า 1 ปี')));
  const pct = (acq && disp) ? Math.max(0, Math.min(100, Math.round(diffDays(acq, now) / Math.max(1, diffDays(acq, disp)) * 100))) : 0;
  const last = asset.calib ? iso(asset.calib.last) : null;
  const calNext = asset.calib && last ? addMonths(last, asset.calib.cycle) : null;
  return {
    acq, disp, off, bucket, pct, calNext,
    calOff: calNext ? diffDays(now, calNext) : null,
    dispText: disp ? thd(disp) : 'ยังไม่ระบุ',
    remain: off === null ? 'เติมวันที่ได้มาก่อน' : (off < 0 ? 'เกินมา ' + dur(-off) : 'อีก ' + dur(off)),
  };
}
