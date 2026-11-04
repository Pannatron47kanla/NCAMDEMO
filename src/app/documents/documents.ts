import { iso, thFull, thd } from '../../shared/dates';
import { baht } from '../../shared/money';
import { qr } from '../../shared/qr';
import type { Borrower, Loan, LoanSettings } from '../../modules/circulation';
import type { AuditReportSummary } from '../../modules/audit';
import type { DisposalCase } from '../../modules/disposal';
import { METHODS } from '../../modules/disposal';
import type { Asset } from '../../modules/registry';
import { STORE, assetInfo, locText } from '../../modules/registry';

/** The kinds of document the print screen can show (mockup PT, line 2867). */
export const PRINT_TITLES = {
  labels: (n: number) => 'พิมพ์ป้าย QR (' + n + ' ป้าย)',
  slip: 'พิมพ์ใบยืม',
  audit: 'รายงานผลการตรวจสอบพัสดุประจำปี',
  register: 'ทะเบียนคุมครุภัณฑ์',
  disposal: 'รายงานครุภัณฑ์ครบอายุการใช้งาน',
  calib: 'รายงานกำหนดสอบเทียบเครื่องมือ',
  auction: 'ร่างประกาศขายทอดตลาด',
  dispResult: 'รายงานผลการจำหน่ายพัสดุ',
} as const;

export function printTitle(kind: string, labelCount: number): string {
  if (kind === 'labels') return PRINT_TITLES.labels(labelCount);
  const t = (PRINT_TITLES as Record<string, unknown>)[kind];
  return typeof t === 'string' ? t : '';
}

// ---- QR labels (mockup lines 1203-1217 and 2822) ----

export interface LabelData {
  name: string;
  code: string;
  room: string;
  cells: boolean[];
}

export function labelsOf(ids: readonly string[], assets: readonly Asset[]): LabelData[] {
  return ids.flatMap((id) => {
    const a = assets.find((x) => x.id === id);
    return a ? [{ name: a.name, code: a.code, room: a.room, cells: qr(a.code) }] : [];
  });
}

// ---- Loan slip (mockup lines 1219-1238 and 2823-2829) ----

export interface SlipData {
  id: string;
  start: string;
  due: string;
  who: string;
  code: string;
  info: string;
  fine: number;
  loss: number;
  items: { no: number; name: string; code: string; parts: string }[];
}

export function slipOf(loanId: string, loans: readonly Loan[], borrowers: readonly Borrower[], assets: readonly Asset[], settings: LoanSettings): SlipData | null {
  const loan = loans.find((l) => l.id === loanId);
  if (!loan) return null;
  const b = borrowers.find((x) => x.code === loan.borrowerCode);
  return {
    id: loan.id, start: thd(loan.startedAt), due: thd(loan.due), who: b?.name ?? '', code: b?.code ?? '', info: b ? b.type + ' ' + b.info : '',
    fine: settings.finePerDay, loss: settings.lossPct,
    items: loan.items.map((i, n) => {
      const a = assets.find((x) => x.id === i.assetId);
      return {
        no: n + 1, name: a?.name ?? '', code: a?.code ?? '',
        parts: a && a.parts.length ? a.parts.map((p) => p.name + ' × ' + p.qty).join(', ') + ' (' + i.note + ')' : 'เครื่องเดี่ยว',
      };
    }),
  };
}

// ---- Formal reports on the register (mockup lines 1240-1262 and 2830-2862) ----

export interface FormalCell { v: string | number; right: boolean }
export interface FormalData {
  formNo: string;
  title: string;
  sub: string;
  intro: string | null;
  cols: string[];
  rows: FormalCell[][];
  total: string | null;
  outro: string | null;
  signs: { name: string; role: string }[];
}

const FORM_NO = 'รูปแบบตัวอย่าง (ปรับตามแบบของวิทยาลัย)';
const SIGNS_SUPPLY = [{ name: 'นางสาวอรุณี แสงจันทร์', role: 'เจ้าหน้าที่พัสดุ ผู้จัดทำ' }, { name: '[ชื่อหัวหน้าเจ้าหน้าที่]', role: 'หัวหน้าเจ้าหน้าที่ ผู้ตรวจ' }];
const num = (n: number) => n.toLocaleString('th-TH');
const cellsOf = (vals: (string | number)[], rightIdx: number[]): FormalCell[] => vals.map((v, i) => ({ v, right: rightIdx.includes(i) }));

/** The report for register, disposal and calib. Returns null for any other kind. */
export function formalOf(kind: string, assets: readonly Asset[], now: Date): FormalData | null {
  const live = assets.filter((a) => a.status !== 'จำหน่ายแล้ว');
  const info = (a: Asset) => assetInfo(a, now);
  if (kind === 'register') {
    const total = live.reduce((t, a) => t + a.price, 0);
    return {
      formNo: FORM_NO, title: 'ทะเบียนคุมครุภัณฑ์', sub: 'ทุกหน่วยงาน', intro: null,
      cols: ['ลำดับ', 'รหัสครุภัณฑ์', 'รายการ', 'วิธีได้มา / ผู้ขาย', 'วันที่ได้มา', 'ราคา (บาท)', 'อายุ (ปี)', 'ที่ตั้ง', 'สถานะ', 'กำหนดพิจารณาจำหน่าย'],
      rows: live.map((a, i) => { const f = info(a); return cellsOf([i + 1, a.code, a.name, a.method + (a.method === 'ซื้อ' ? ' / ' + a.vendor : ''), f.acq ? thd(f.acq) : '-', num(a.price), a.life, a.room, a.status, f.dispText], [5, 6]); }),
      total: 'รวม ' + live.length + ' รายการ มูลค่า ' + baht(total), outro: null, signs: SIGNS_SUPPLY,
    };
  }
  if (kind === 'disposal') {
    const dl = live.filter((a) => info(a).disp).sort((x, y) => info(x).disp!.getTime() - info(y).disp!.getTime()).filter((a) => info(a).off! <= 365);
    return {
      formNo: FORM_NO, title: 'รายงานครุภัณฑ์ครบอายุการใช้งาน', sub: 'เกินอายุแล้วและจะครบภายใน 12 เดือน',
      intro: 'งานพัสดุขอรายงานครุภัณฑ์ที่ครบอายุการใช้งานแล้วหรือจะครบภายใน 12 เดือน เพื่อประกอบการพิจารณาจำหน่ายตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 หมวด 9 และวางแผนจัดหาทดแทน รายละเอียดดังนี้',
      cols: ['ลำดับ', 'รหัสครุภัณฑ์', 'รายการ', 'วันที่ได้มา', 'อายุ (ปี)', 'ราคา (บาท)', 'ครบอายุ', 'สถานะการพิจารณา'],
      rows: dl.map((a, i) => { const f = info(a); return cellsOf([i + 1, a.code, a.name, thd(f.acq!), a.life, num(a.price), f.dispText + ' (' + f.remain + ')', a.status === 'รอจำหน่าย' ? 'เสนอขายทอดตลาดแล้ว' : f.bucket], [4, 5]); }),
      total: 'รวม ' + dl.length + ' รายการ มูลค่าตามบัญชีเดิม ' + baht(dl.reduce((t, a) => t + a.price, 0)), outro: 'จึงเรียนมาเพื่อโปรดพิจารณา',
      signs: [{ name: 'นางสาวอรุณี แสงจันทร์', role: 'เจ้าหน้าที่พัสดุ' }, { name: '[ชื่อผู้อำนวยการ]', role: 'ผู้อำนวยการ' }],
    };
  }
  if (kind === 'calib') {
    const cl = live.filter((a) => a.calib).sort((x, y) => info(x).calNext!.getTime() - info(y).calNext!.getTime());
    return {
      formNo: FORM_NO, title: 'รายงานกำหนดสอบเทียบเครื่องมือ', sub: 'เครื่องมือแพทย์ที่ใช้สอน', intro: null,
      cols: ['ลำดับ', 'รหัสครุภัณฑ์', 'รายการ', 'ที่ตั้ง', 'รอบ (เดือน)', 'สอบเทียบล่าสุด', 'ครั้งถัดไป', 'สถานะ'],
      rows: cl.map((a, i) => {
        const f = info(a);
        return cellsOf([i + 1, a.code, a.name, a.room, a.calib!.cycle, thd(iso(a.calib!.last)!), thd(f.calNext!), f.calOff! < 0 ? 'เลยกำหนด ' + (-f.calOff!) + ' วัน' : (f.calOff! <= 30 ? 'ภายใน 30 วัน' : 'ปกติ')], [4]);
      }),
      total: null, outro: null, signs: SIGNS_SUPPLY,
    };
  }
  return null;
}

/** The case the result report is about: the open case once it reached step 5, else the latest finished case (mockup RC, line 2699). */
export function resultCase(current: DisposalCase | null, done: readonly DisposalCase[]): DisposalCase | undefined {
  return current && current.data.step >= 5 ? current : done[done.length - 1];
}

/** The disposal result report (kind dispResult), or null when there is no case to report. */
export function dispResultOf(rc: DisposalCase | undefined, assets: readonly Asset[]): FormalData | null {
  if (!rc) return null;
  const d = rc.data;
  const rcd = rc.dates;
  const RM = METHODS[d.method];
  const sold = (x: string) => d.soldP[x] ?? 0;
  return {
    formNo: FORM_NO, title: 'รายงานผลการจำหน่ายพัสดุและบัญชีลงจ่าย', sub: 'เรื่องที่ ' + d.id,
    intro: 'ตามที่ผู้อำนวยการอนุมัติให้จำหน่ายครุภัณฑ์ จำนวน ' + d.ids.length + ' รายการ โดยวิธี' + RM.label + ' เมื่อวันที่ ' + thFull(rcd.approve) + ' บัดนี้ได้ดำเนินการเสร็จแล้ว และลงจ่ายออกจากทะเบียนเมื่อวันที่ ' + thFull(rcd.writeoff) + ' ตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 ข้อ 218 รายละเอียดดังนี้',
    cols: ['ลำดับ', 'รหัสครุภัณฑ์', 'รายการ', 'วันที่ได้มา', 'ราคาซื้อ (บาท)', RM.sale ? 'ราคาที่จำหน่ายได้ (บาท)' : 'ผู้รับ / วิธีดำเนินการ', 'วันที่ลงจ่าย'],
    rows: d.ids.map((x, i) => {
      const a = assets.find((y) => y.id === x);
      return cellsOf([i + 1, a?.code ?? '', a?.name ?? '', a?.acq ? thd(iso(a.acq)!) : '-', num(a?.price ?? 0), RM.sale ? num(sold(x)) : d.party, thd(rcd.writeoff)], RM.sale ? [4, 5] : [4]);
    }),
    total: RM.sale ? 'รวมเงินที่ได้จากการจำหน่าย ' + baht(d.ids.reduce((t, x) => t + sold(x), 0)) + ' นำส่งเป็นรายได้ ใบเสร็จเลขที่ ' + d.receipt : null,
    outro: d.oag ? 'ได้แจ้งสำนักงานการตรวจเงินแผ่นดินแล้ว ตามหนังสือที่ ' + d.oag : 'จะแจ้งสำนักงานการตรวจเงินแผ่นดินภายในวันที่ ' + thFull(rcd.oagDue) + ' (30 วันทำการนับจากวันลงจ่าย)',
    signs: [{ name: 'นางสาวอรุณี แสงจันทร์', role: 'เจ้าหน้าที่พัสดุ ผู้จัดทำ' }, { name: '[ชื่อผู้อำนวยการ]', role: 'ผู้อำนวยการ' }],
  };
}

// ---- Audit report (mockup lines 1264-1278 and 2863-2866) ----

export interface AuditDocData {
  summary: { label: string; n: number }[];
  exceptions: { code: string; name: string; r: string }[];
}

export function auditDocOf(s: AuditReportSummary, assets: readonly Asset[]): AuditDocData {
  return {
    summary: [
      { label: 'ครุภัณฑ์ในทะเบียน ณ 30 ก.ย. 69', n: s.total }, { label: 'ตรวจนับและยืนยันผลแล้ว', n: s.confirmed }, { label: 'พบ สภาพปกติ', n: s.found },
      { label: 'ไม่พบ (สูญไป)', n: s.notFound }, { label: 'ชำรุด / เสื่อมสภาพ', n: s.damaged }, { label: 'ไม่จำเป็นต้องใช้', n: s.notNeeded }, { label: 'พบแต่ไม่มีในทะเบียน', n: s.unknown },
    ],
    exceptions: [
      ...s.exceptions.map((e) => { const a = assets.find((x) => x.id === e.id); return { code: a?.code ?? '', name: a?.name ?? '', r: e.r }; }),
      ...s.unknownFinds.map((u) => ({ code: u.code, name: '(ไม่ทราบรายการ)', r: 'พบแต่ไม่มีในทะเบียน' })),
    ],
  };
}

// ---- Auction notice (mockup lines 1280-1292 and 2647) ----

export interface AuctionDocData {
  n: number;
  items: { no: number; name: string; code: string; min: string }[];
  viewFrom: string;
  viewTo: string;
  day: string;
  annDate: string;
  place: string;
}

/**
 * The notice for the open case. The mockup shows it only while a case with the auction method is open; the older
 * proposal (`modules.disposal.auction`) is never drawn, because the mockup's document needs that case.
 */
export function auctionDocOf(current: DisposalCase | null, assets: readonly Asset[]): AuctionDocData | null {
  if (!current || current.data.method !== 'auction') return null;
  const d = current.data;
  const cd = current.dates;
  return {
    n: d.ids.length, viewFrom: thFull(cd.ann), viewTo: thFull(cd.viewTo), day: thFull(cd.sale), annDate: thFull(cd.ann),
    place: STORE + ' ' + locText(STORE).split(' · ')[0],
    items: d.ids.map((x, i) => {
      const a = assets.find((y) => y.id === x);
      const mp = d.minP[x] ?? 0;
      return { no: i + 1, name: a?.name ?? '', code: a?.code ?? '', min: mp > 0 ? num(mp) : '[รอคณะกรรมการประเมิน]' };
    }),
  };
}
