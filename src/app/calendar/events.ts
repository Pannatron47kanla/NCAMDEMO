import type { CSSProperties } from 'react';
import { diffDays } from '../../shared/dates';
import { workInfo } from '../../shared/working-days';
import type { AuctionRequest, DisposalCase } from '../../modules/disposal';
import { auctionPlan } from '../../modules/disposal';
import type { Asset } from '../../modules/registry';
import { assetInfo } from '../../modules/registry';
import type { Borrower, Loan } from '../../modules/circulation';
import type { RepairTicket } from '../../modules/maintenance';
import type { ScreenKey, ScreenParams } from '../navigation';

export type EventKind = 'cal' | 'disp' | 'loan' | 'repair' | 'audit' | 'auction';

// Event kinds and their colours (mockup KIND and kst, lines 1634-1642).
export const KIND: Record<EventKind, { label: string; bg: string; fg: string }> = {
  cal: { label: 'สอบเทียบ', bg: '#e4ecfa', fg: '#1d4a99' },
  disp: { label: 'ครบอายุใช้งาน', bg: '#fbe2e3', fg: '#a3191f' },
  loan: { label: 'ครบกำหนดคืน', bg: '#e3f2ee', fg: '#0b5e57' },
  repair: { label: 'งานซ่อมต้องเสร็จ', bg: '#fcefd9', fg: '#7a4300' },
  audit: { label: 'ตรวจสอบพัสดุ', bg: '#efe8fb', fg: '#5b2d9e' },
  auction: { label: 'งานจำหน่าย', bg: '#ece6dc', fg: '#4a3b1f' },
};
export const KIND_KEYS = Object.keys(KIND) as EventKind[];

export function kst(k: EventKind): CSSProperties {
  return { background: KIND[k].bg, color: KIND[k].fg };
}

export interface CalEvent {
  date: Date;
  kind: EventKind;
  label: string;
  assetId?: string;
  ticketId?: string;
  go?: ScreenKey;
}

/** A loan as the calendar needs it. */
export interface CalLoan {
  due: Date;
  borrowerName: string;
  openItems: number;
}

export interface EventSources {
  assets: readonly Asset[];
  loans: readonly CalLoan[];
  tickets: readonly RepairTicket[];
  /** The older auction proposal, if any. */
  auction: AuctionRequest | null;
  /** The disposal case being worked on, if any. */
  current: DisposalCase | null;
}

/** Every dated event, earliest first (port of allEvents, mockup line 2137). */
export function allEvents(src: EventSources, now: Date): CalEvent[] {
  const ev: CalEvent[] = [];
  src.assets.forEach((a) => {
    if (a.status === 'จำหน่ายแล้ว') return;
    const f = assetInfo(a, now);
    const short = a.name.replace(/ \(.*\)/, '');
    if (f.calNext) ev.push({ date: f.calNext, kind: 'cal', label: short, assetId: a.id });
    if (f.disp) ev.push({ date: f.disp, kind: 'disp', label: short, assetId: a.id });
  });
  src.loans.forEach((l) => {
    if (l.openItems) ev.push({ date: l.due, kind: 'loan', label: l.borrowerName.replace(/^(นางสาว|นาย|นาง|อ\.ดร\.|อ\.)/, '') + ' (' + l.openItems + ' รายการ)', go: 'counter' });
  });
  src.tickets.forEach((t) => {
    if (t.status !== 'ปิดงาน') {
      const asset = src.assets.find((a) => a.id === t.assetId);
      ev.push({ date: t.needDate, kind: 'repair', label: (asset?.name ?? t.assetId).replace(/ \(.*\)/, ''), go: 'repair', ticketId: t.id });
    }
  });
  ev.push({ date: workInfo(now).dueDate, kind: 'audit', label: 'ครบกำหนดรายงานผลตรวจสอบพัสดุ', go: 'audit' });
  if (src.auction) {
    const p = auctionPlan(now);
    ev.push({ date: p.ann, kind: 'auction', label: 'ปิดประกาศขายทอดตลาด', go: 'disp' });
    ev.push({ date: p.day, kind: 'auction', label: 'วันขายทอดตลาด', go: 'disp' });
  }
  const c = src.current;
  if (c && c.data.step < 6) {
    const cd = c.dates;
    const cid = c.data.id;
    const stp = c.data.step;
    if (stp <= 1) ev.push({ date: cd.fact, kind: 'auction', label: cid + ' กรรมการรายงานข้อเท็จจริง', go: 'disp' });
    if (c.data.method === 'auction' && stp <= 3) {
      ev.push({ date: cd.ann, kind: 'auction', label: cid + ' ปิดประกาศขายทอดตลาด', go: 'disp' });
      ev.push({ date: cd.sale, kind: 'auction', label: cid + ' วันขายทอดตลาด', go: 'disp' });
    }
    if (stp <= 3) ev.push({ date: cd.deadline, kind: 'auction', label: cid + ' ครบ 60 วันต้องจำหน่ายเสร็จ', go: 'disp' });
    if (stp === 5) ev.push({ date: cd.oagDue, kind: 'auction', label: cid + ' ครบกำหนดแจ้ง สตง.', go: 'disp' });
  }
  return ev.sort((x, y) => x.date.getTime() - y.date.getTime());
}

export interface EventTarget {
  screen: ScreenKey;
  params: ScreenParams;
  /** Repair events first select this ticket. */
  ticketId?: string;
}

/** Where opening an event goes (mockup evOpen, line 2166). */
export function eventTarget(e: CalEvent): EventTarget {
  if (e.assetId) return { screen: 'asset', params: { selAsset: e.assetId } };
  if (e.ticketId) return { screen: 'repair', params: {}, ticketId: e.ticketId };
  return { screen: e.go ?? 'dash', params: {} };
}

/** The "60 days ahead" list for the side panel (mockup upcoming60, line 2279). */
export function upcoming60(events: readonly CalEvent[], kinds: Record<EventKind, boolean>, now: Date): CalEvent[] {
  return events
    .filter((e) => { const o = diffDays(now, e.date); return kinds[e.kind] && o <= 60 && (o >= -30 || e.kind === 'cal'); })
    .filter((e) => !(e.kind === 'disp' && diffDays(now, e.date) < 0));
}

/** Loans reduced to what the calendar shows: due date, borrower name, and the items still out. */
export function calLoans(loans: readonly Loan[], borrowers: readonly Borrower[]): CalLoan[] {
  return loans.map((l) => ({
    due: l.due,
    borrowerName: borrowers.find((b) => b.code === l.borrowerCode)?.name ?? '',
    openItems: l.openItems().length,
  }));
}
