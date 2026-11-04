import { thd, toIso } from './dates';

// Working-day helpers ported from the mockup (lines 1605-1615).

export const HOLIDAYS: ReadonlySet<string> = new Set(['2026-10-13', '2026-10-23', '2026-12-07', '2026-12-10', '2026-12-31', '2027-01-01']);

/** Monday to Friday, and not a listed holiday. */
export function isWork(d: Date): boolean {
  const w = d.getDay();
  return w !== 0 && w !== 6 && !HOLIDAYS.has(toIso(d));
}

export function addWorkDays(d: Date, n: number): Date {
  const c = new Date(d.getTime());
  let k = 0;
  while (k < n) {
    c.setDate(c.getDate() + 1);
    if (isWork(c)) k++;
  }
  return c;
}

/** Working days used and left in the audit window that starts on 1 October (30 working days). */
export function workInfo(now: Date): { used: number; left: number; due: string; dueDate: Date } {
  let used = 0;
  const d = new Date(2026, 9, 1);
  while (d <= now) {
    if (isWork(d)) used++;
    d.setDate(d.getDate() + 1);
  }
  let n = 0;
  const c = new Date(2026, 9, 1);
  let due: Date | null = null;
  while (!due) {
    if (isWork(c)) {
      n++;
      if (n === 30) due = new Date(c.getTime());
    }
    c.setDate(c.getDate() + 1);
  }
  return { used, left: Math.max(0, 30 - used), due: thd(due), dueDate: due };
}
