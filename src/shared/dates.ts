// Date helpers ported from the mockup (lines 1590-1604). All dates are local calendar dates.

const TM = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const TMF = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

/** Short Thai date with a 2-digit Buddhist year, e.g. 28 ต.ค. 69. */
export function thd(d: Date): string {
  return d.getDate() + ' ' + TM[d.getMonth()] + ' ' + String(d.getFullYear() + 543).slice(2);
}

/** Full Thai date, e.g. 28 ตุลาคม 2569. */
export function thFull(d: Date): string {
  return d.getDate() + ' ' + TMF[d.getMonth()] + ' ' + (d.getFullYear() + 543);
}

/** `thd` of the day `off` days from `now` (the mockup's `th(off)`, with today passed in from the Clock). */
export function th(now: Date, off: number): string {
  return thd(addDays(now, off));
}

/** Parses `YYYY-MM-DD` as a local date; empty gives null. */
export function iso(s: string | null | undefined): Date | null {
  if (!s) return null;
  const p = s.split('-');
  return new Date(+p[0]!, +p[1]! - 1, +p[2]!);
}

export function toIso(d: Date): string {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function addYears(d: Date, n: number): Date {
  return new Date(d.getFullYear() + n, d.getMonth(), d.getDate());
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
}

/** Whole days from a to b. Rounded, so a 23 or 25 hour day at a clock change still counts as one day. */
export function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 864e5);
}

/** Length of time in Thai, e.g. 1 ปี 2 เดือน. */
export function dur(days: number): string {
  const y = Math.floor(days / 365);
  const m = Math.floor((days % 365) / 30);
  if (y > 0) return y + ' ปี' + (m ? ' ' + m + ' เดือน' : '');
  if (m > 0) return m + ' เดือน';
  return days + ' วัน';
}
