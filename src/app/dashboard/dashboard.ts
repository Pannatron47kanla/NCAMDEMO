import { baht } from '../../shared/money';
import { diffDays, thd } from '../../shared/dates';
import { workInfo } from '../../shared/working-days';
import { auditCounts, type AuditRound } from '../../modules/audit';
import type { Borrower, Loan, LoanSettings } from '../../modules/circulation';
import { quarterColumns, type QuarterColumn } from '../../modules/disposal';
import type { RepairTicket } from '../../modules/maintenance';
import { assetInfo, iconOf, type Asset, type AssetInfo, type AssetStatus } from '../../modules/registry';
import { allEvents, type CalEvent, type EventSources } from '../calendar/events';
import type { ScreenKey } from '../navigation';

// The numbers on the dashboard, ported from renderVals (mockup lines 2210-2272 and 2879-2882).

export type TileGroup = 'A' | 'B' | 'C';

/** Where a tile goes: the register with a status filter, or another screen. */
export type TileTarget = { status: string } | { screen: ScreenKey };

export interface Tile {
  group: TileGroup;
  label: string;
  desc: string;
  n: number;
  /** The text under the title in the tooltip ("• name" lines). */
  example: string;
  target: TileTarget;
  /** The tooltip opens to the left. */
  alignRight: boolean;
  /** Inline style of the number. */
  numberColor: string;
}

export interface OverdueRow { who: string; items: string; due: string; late: string; fine: string }
export interface PendingRow { id: string; who: string; items: string }
export interface OpenTicketRow { id: string; name: string; status: string; need: string }
export interface VendorRow { name: string; count: number; value: string; percent: number }
export interface CategoryRow { name: string; n: number; icon: string; percent: number }
export interface UpcomingRow { event: CalEvent; date: string; flag: string }

export interface DashboardSources {
  assets: readonly Asset[];
  loans: readonly Loan[];
  borrowers: readonly Borrower[];
  tickets: readonly RepairTicket[];
  settings: LoanSettings;
  audit: AuditRound;
  /** Everything the calendar needs, for the "within 30 days" list. */
  events: EventSources;
}

export interface Dashboard {
  tiles: Tile[];
  overdue: OverdueRow[];
  pending: PendingRow[];
  openTickets: OpenTicketRow[];
  audit: { done: number; total: number; percent: number; used: number; left: number; due: string };
  quarters: QuarterColumn[];
  upcoming: UpcomingRow[];
  vendors: { total: string; nonPurchase: number; rows: VendorRow[] };
  categories: CategoryRow[];
}

const GROUP_COLOR: Record<TileGroup, string> = { A: '#0f7a43', B: '#2f3d43', C: '#d9620f' };
export const GROUP_BAR: Record<TileGroup, string> = { A: '#169a55', B: '#8796a0', C: '#f08a2c' };

function example(names: readonly string[]): string {
  if (!names.length) return '';
  const head = names.slice(0, 3).map((n) => '• ' + n).join('\n');
  return head + (names.length > 3 ? '\nและอีก ' + (names.length - 3) + ' รายการ' : '');
}

/** Colour of a tile number: the group colour, or grey for an empty "to follow up" tile. */
function numberColor(group: TileGroup, n: number): string {
  return n > 0 || group !== 'C' ? GROUP_COLOR[group] : '#8a979c';
}

export function buildDashboard(src: DashboardSources, now: Date): Dashboard {
  const { assets, loans, borrowers, tickets, settings } = src;
  const live = assets.filter((a) => a.status !== 'จำหน่ายแล้ว');
  const infos = new Map<string, AssetInfo>(live.map((a) => [a.id, assetInfo(a, now)]));
  const nameOf = (id: string) => assets.find((a) => a.id === id)?.name ?? id;
  const borName = (code: string) => borrowers.find((b) => b.code === code)?.name ?? '';
  const openItemsText = (l: Loan) => l.openItems().map((i) => nameOf(i.assetId)).join(', ');
  const count = (status: AssetStatus) => assets.filter((a) => a.status === status).length;
  const byStatus = (...xs: AssetStatus[]) => live.filter((a) => xs.includes(a.status));

  const openLoans = loans.filter((l) => l.openItems().length > 0);
  const overdue = openLoans.filter((l) => !l.pending && diffDays(now, l.due) < 0);
  const calList = live.filter((a) => { const f = infos.get(a.id)!; return f.calOff !== null && f.calOff <= 30; });
  const dispList = live.filter((a) => { const b = infos.get(a.id)!.bucket; return b === 'เกินอายุใช้งาน' || b === 'ครบภายใน 6 เดือน'; });
  const broken = byStatus('ชิ้นส่วนไม่ครบ', 'สูญหาย / ไม่พบ');
  const nm = (a: Asset) => a.name;

  const tile = (group: TileGroup, label: string, desc: string, n: number, names: readonly string[], target: TileTarget, alignRight = false): Tile =>
    ({ group, label, desc, n, example: example(names), target, alignRight, numberColor: numberColor(group, n) });
  const toAssets = (status: string): TileTarget => ({ status });

  const tiles: Tile[] = [
    tile('A', 'ครุภัณฑ์ทั้งหมด', 'จำนวนครุภัณฑ์ทั้งหมดในระบบ ไม่นับรายการที่ลงจ่ายจำหน่ายแล้ว', live.length, [], toAssets('ทุกสถานะ')),
    tile('A', 'พร้อมใช้งาน', 'สามารถใช้งานหรือให้ยืมได้ตามปกติ', count('พร้อมใช้'), byStatus('พร้อมใช้').map(nm), toAssets('พร้อมใช้')),
    tile('B', 'ถูกยืม', 'อยู่ระหว่างการใช้งานโดยผู้ยืม ยังไม่ถึงหรือเลยกำหนดคืน', count('ถูกยืม'), byStatus('ถูกยืม').map(nm), toAssets('ถูกยืม')),
    tile('B', 'รอซ่อม', 'อยู่ระหว่างดำเนินการซ่อม มีใบงานที่ยังไม่ปิด', count('รอซ่อม'), byStatus('รอซ่อม').map(nm), toAssets('รอซ่อม')),
    tile('B', 'ชิ้นส่วนไม่ครบ / ไม่พบ', 'ยังไม่สามารถใช้งานได้ เนื่องจากชิ้นส่วนไม่ครบ หรือหาไม่พบตอนตรวจนับ', broken.length, broken.map((a) => a.name + ' (' + a.status + ')'), toAssets('ชิ้นส่วนไม่ครบ'), true),
    tile('C', 'เกินกำหนดคืน', 'เลยกำหนดคืนจากผู้ยืม ระบบคิดค่าปรับรายวันตามกติกายืม', overdue.length, overdue.map((l) => borName(l.borrowerCode) + ' · ช้า ' + -diffDays(now, l.due) + ' วัน'), { screen: 'counter' }),
    tile('C', 'สอบเทียบภายใน 30 วัน', 'ต้องดำเนินการสอบเทียบภายใน 30 วัน รวมรายการที่เลยกำหนดแล้ว', calList.length, calList.map(nm), { screen: 'cal' }, true),
    tile('C', 'ครบอายุ / ภายใน 6 เดือน', 'เกินอายุใช้งานแล้ว หรือจะครบภายใน 6 เดือน ควรเริ่มเตรียมเรื่องขอจำหน่าย', dispList.length, dispList.map(nm), { screen: 'disp' }, true),
  ];

  const overdueRows = overdue.map((l): OverdueRow => {
    const late = -diffDays(now, l.due);
    return { who: borName(l.borrowerCode), items: openItemsText(l), due: thd(l.due), late: late + ' วัน', fine: baht(late * settings.finePerDay) };
  });
  const pending = loans.filter((l) => l.pending).map((l): PendingRow => ({ id: l.id, who: borName(l.borrowerCode), items: openItemsText(l) }));
  const openTickets = tickets.filter((t) => t.status !== 'ปิดงาน').map((t): OpenTicketRow => ({ id: t.id, name: nameOf(t.assetId), status: t.status, need: thd(t.needDate) }));

  // Vendors: purchases only. Everything else counts as "not a purchase".
  const vmap = new Map<string, { v: number; n: number }>();
  let vTotal = 0;
  let nonPurchase = 0;
  live.forEach((a) => {
    if (a.method !== 'ซื้อ') { nonPurchase++; return; }
    const key = a.vendor || 'ไม่ระบุ';
    const cur = vmap.get(key) ?? { v: 0, n: 0 };
    cur.v += a.price; cur.n++;
    vmap.set(key, cur);
    vTotal += a.price;
  });
  const vKeys = [...vmap.keys()].sort((x, y) => vmap.get(y)!.v - vmap.get(x)!.v);
  const vMax = vKeys.length ? vmap.get(vKeys[0]!)!.v : 1;
  const vendorRows = vKeys.map((k): VendorRow => ({ name: k, count: vmap.get(k)!.n, value: baht(vmap.get(k)!.v), percent: Math.max(2, Math.round(vmap.get(k)!.v / vMax * 100)) }));

  const cmap = new Map<string, number>();
  live.forEach((a) => cmap.set(a.cat, (cmap.get(a.cat) ?? 0) + 1));
  const cKeys = [...cmap.keys()].sort((x, y) => cmap.get(y)! - cmap.get(x)!);
  const cMax = cKeys.length ? cmap.get(cKeys[0]!)! : 1;
  const categories = cKeys.map((k): CategoryRow => ({ name: k, n: cmap.get(k)!, icon: iconOf(k), percent: Math.round(cmap.get(k)! / cMax * 100) }));

  const upcoming = allEvents(src.events, now)
    .filter((e) => { const o = diffDays(now, e.date); return o <= 30 && (o >= 0 || e.kind === 'cal' || e.kind === 'loan' || e.kind === 'repair'); })
    .map((e): UpcomingRow => { const o = diffDays(now, e.date); return { event: e, date: thd(e.date), flag: o < 0 ? 'เลยกำหนด ' + -o + ' วัน' : (o === 0 ? 'วันนี้' : '') }; });

  const counts = auditCounts(src.audit);
  const wi = workInfo(now);
  return {
    tiles, overdue: overdueRows, pending, openTickets,
    audit: { done: counts.done, total: counts.total, percent: Math.round(counts.done / counts.total * 100), used: wi.used, left: wi.left, due: wi.due },
    quarters: quarterColumns(live.map((a) => infos.get(a.id)!), now),
    upcoming,
    vendors: { total: baht(vTotal), nonPurchase, rows: vendorRows },
    categories,
  };
}
