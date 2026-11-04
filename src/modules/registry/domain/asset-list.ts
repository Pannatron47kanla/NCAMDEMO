import type { Asset } from './asset';

// Search, filter and paging of the register list, ported from the mockup (lines 2351-2358).

export const ALL_CATEGORIES = 'ทุกหมวด';
export const ALL_STATUSES = 'ทุกสถานะ';
export const STATUS_FILTERS = [ALL_STATUSES, 'พร้อมใช้', 'ถูกยืม', 'รอซ่อม', 'ชิ้นส่วนไม่ครบ', 'สูญหาย / ไม่พบ', 'รอจำหน่าย', 'จำหน่ายแล้ว'];
export const PAGE_SIZES = [10, 20, 50];
export const DEFAULT_PAGE_SIZE = 10;

export interface AssetFilter {
  /** Text to find in the code, name or room, in any letter case. Spaces around it are ignored. */
  q: string;
  /** A category, or ALL_CATEGORIES. */
  cat: string;
  /** A status, or ALL_STATUSES. */
  status: string;
}

export const NO_FILTER: AssetFilter = { q: '', cat: ALL_CATEGORIES, status: ALL_STATUSES };

/** The assets that match all three controls, in register order. */
export function filterAssets(assets: readonly Asset[], filter: AssetFilter): Asset[] {
  const q = filter.q.trim().toLowerCase();
  return assets.filter((a) => (
    (!q || (a.code + ' ' + a.name + ' ' + a.room).toLowerCase().indexOf(q) >= 0)
    && (filter.cat === ALL_CATEGORIES || a.cat === filter.cat)
    && (filter.status === ALL_STATUSES || a.status === filter.status)
  ));
}

export interface PageWindow {
  /** Number of pages, at least 1. */
  count: number;
  /** The page shown: the asked one, kept between 1 and `count`. */
  cur: number;
  /** Index of the first row of the page. */
  start: number;
  /** Index after the last row of the page. */
  end: number;
}

/** Which rows a page shows. A page number outside the range (after a filter) falls back to the nearest page. */
export function pageWindow(total: number, page: number, pageSize: number): PageWindow {
  const size = pageSize || DEFAULT_PAGE_SIZE;
  const count = Math.max(1, Math.ceil(total / size));
  const cur = Math.min(Math.max(1, page || 1), count);
  const start = (cur - 1) * size;
  return { count, cur, start, end: Math.min(total, start + size) };
}
