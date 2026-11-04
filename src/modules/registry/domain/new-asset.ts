import { th, toIso } from '../../../shared/dates';
import { DomainError } from '../../../shared/domain-error';
import type { Asset, Part } from './asset';
import { CATS, CUST, LAB1, LABD, MAX_LOT_SIZE, V1 } from './constants';

// The add-asset wizard's rules, ported from the mockup (newForm, serialList, nfMissing; lines 1750-1753 and 1993-2032).
// Every field is the text the officer typed, exactly as in the mockup, so a rule never sees a number it did not parse itself.

/** One part row of the wizard (step 4). */
export interface PartDraft {
  name: string;
  qty: string;
  price: string;
}

export interface NewAssetForm {
  /** ซื้อ, รับโอน or รับบริจาค. */
  method: string;
  doc: string;
  /** YYYY-MM-DD, or empty. */
  acq: string;
  vendor: string;
  price: string;
  warranty: string;
  name: string;
  cat: string;
  life: string;
  brand: string;
  serial: string;
  /** One serial per line (or separated by , ; or tab). */
  serials: string;
  qty: string;
  /** Calibration cycle in months as the select gives it: '0', '6' or '12'. */
  calib: string;
  room: string;
  cust: string;
  parts: PartDraft[];
}

export const NEW_ASSET_STEPS = ['ที่มา', 'รายละเอียด', 'ที่ตั้งและผู้รับผิดชอบ', 'ชิ้นส่วน', 'ตรวจสอบและบันทึก'];

/** A blank wizard. The acquisition date starts on today (the mockup hard-codes 2026-10-28). */
export function newAssetForm(today: Date): NewAssetForm {
  return {
    method: 'ซื้อ', doc: '', acq: toIso(today), vendor: V1, price: '', warranty: '', name: '', cat: 'หุ่นจำลอง', life: '5', brand: '',
    serial: '', serials: '', qty: '1', calib: '0', room: LAB1, cust: CUST, parts: [],
  };
}

/** Serial numbers typed or pasted, one per line (also split on , ; and tab), blanks dropped. */
export function serialList(text: string | null | undefined): string[] {
  return String(text || '').split(/[\n,;\t]+/).map((x) => x.trim()).filter(Boolean);
}

/** What the number fields keep when typing: digits only. */
export function digitsOnly(text: string): string {
  return text.replace(/[^0-9]/g, '');
}

/** parseInt that never gives NaN: text with no leading digits is 0. */
function whole(text: string): number {
  const n = parseInt(text, 10);
  return Number.isNaN(n) ? 0 : n;
}

/** How many assets the lot makes as the screen shows it: at least 1, at most MAX_LOT_SIZE, and 1 for text that is not a number. */
export function lotSize(qty: string): number {
  return Math.min(MAX_LOT_SIZE, Math.max(1, whole(qty) || 1));
}

/** The fields still missing or wrong on a step, in the mockup's words (step 4 and 5 have none). */
export function missingFor(form: NewAssetForm, step: number): string[] {
  const miss: string[] = [];
  if (step === 1) {
    if (!form.doc.trim()) miss.push('เลขที่เอกสาร');
    if (!form.acq) miss.push('วันที่ได้มา');
    if (!(whole(form.price) > 0)) miss.push(form.method === 'ซื้อ' ? 'ราคา' : 'มูลค่าประเมิน');
    const qty = whole(form.qty);
    if (!(qty >= 1)) miss.push('จำนวน');
    else if (qty > MAX_LOT_SIZE) miss.push('จำนวน (ล็อตละไม่เกิน 200 ชิ้น)');
  } else if (step === 2) {
    const serials = serialList(form.serials);
    const seen = new Set<string>();
    const dup: string[] = [];
    serials.forEach((x) => { if (seen.has(x)) dup.push(x); seen.add(x); });
    if (dup.length) miss.push('serial ซ้ำกัน (' + dup.slice(0, 3).join(', ') + ')');
    const qty = whole(form.qty) || 1;
    if (qty > 1 && serials.length > qty) miss.push('serial มากกว่าจำนวนชิ้น');
    if (!form.name.trim()) miss.push('ชื่อครุภัณฑ์');
    if (!(whole(form.life) > 0)) miss.push('อายุการใช้งาน');
  } else if (step === 3) {
    if (!form.cust.trim()) miss.push('ผู้รับผิดชอบ');
  }
  return miss;
}

/** Lets the wizard leave `step`. Throws STEP_INCOMPLETE with the missing list (`missing`, joined by ", "). */
export function assertCanLeave(form: NewAssetForm, step: number): void {
  const miss = missingFor(form, step);
  if (miss.length) throw new DomainError('STEP_INCOMPLETE', { missing: miss.join(', ') });
}

/** Picking a category sets its default life, and the first calibration cycle for teaching medical tools (12 months). */
export function withCategory(form: NewAssetForm, cat: string): NewAssetForm {
  const category = CATS[cat];
  return { ...form, cat, life: category ? String(category.life) : form.life, calib: cat === 'เครื่องมือแพทย์ที่ใช้สอน' ? '12' : form.calib };
}

/** Fills the missing serials with sample scans, as the "จำลองการยิงสแกน" button does. */
export function withDemoSerials(form: NewAssetForm): NewAssetForm {
  const current = serialList(form.serials);
  const out = current.slice();
  for (let k = current.length + 1; k <= lotSize(form.qty); k++) out.push('LS' + String(240000 + k * 7));
  return { ...form, serials: out.join('\n') };
}

/** The asset codes a lot of `n` gets: consecutive, above the highest code with this category's prefix, 4 digits. */
export function nextCodes(existingCodes: readonly string[], cat: string, n: number): string[] {
  const pre = CATS[cat]!.prefix;
  let max = 0;
  existingCodes.forEach((code) => {
    if (code.indexOf(pre + '-') !== 0) return;
    const k = parseInt(code.slice(pre.length + 1), 10);
    if (k > max) max = k;
  });
  const out: string[] = [];
  for (let i = 1; i <= n; i++) out.push(pre + '-' + String(max + i).padStart(4, '0'));
  return out;
}

/** The fields every new asset gets, whichever way it enters the register (port of A(), lines 1707-1715). */
export interface AssetBase {
  id: string;
  code: string;
  name: string;
  cat: string;
  room: string;
  price: number;
  acq: string | null;
  method?: string;
  doc: string;
  vendor?: string;
  warranty?: string | null;
  life: number;
  parts?: Part[];
  calib?: Asset['calib'];
  custodian?: string;
  events: Asset['events'];
}

/** A registered asset: พร้อมใช้, in the lab's own department. A purchase keeps its vendor; a transfer or gift names how it came. */
export function newAsset(o: AssetBase): Asset {
  const method = o.method || 'ซื้อ';
  const buy = method === 'ซื้อ';
  return {
    id: o.id, code: o.code, name: o.name, cat: o.cat, dept: LABD, room: o.room, status: 'พร้อมใช้', price: o.price,
    acq: o.acq, method, doc: o.doc, vendor: buy ? (o.vendor || '-') : (method === 'รับโอน' ? 'รับโอน' : 'รับบริจาค'),
    warranty: o.warranty || null, life: o.life || 5, parts: o.parts || [], calib: o.calib || null, custodian: o.custodian || CUST, events: o.events,
  };
}

/**
 * Turns a finished wizard into its assets, one per item of the lot (port of submitNew, lines 2018-2043).
 * Throws SAVE_INCOMPLETE if a required field is empty and LOT_INVALID if step 1 or 2 no longer passes
 * (for example a quantity of 201); nothing is made in either case. `firstSeq` numbers the ids N<seq>, N<seq+1>, ...
 */
export function registerAssets(form: NewAssetForm, existingCodes: readonly string[], firstSeq: number, today: Date): Asset[] {
  const miss: string[] = [];
  if (!form.doc.trim()) miss.push('เลขที่เอกสาร');
  if (!form.acq) miss.push('วันที่ได้มา');
  if (!(whole(form.price) > 0)) miss.push(form.method === 'ซื้อ' ? 'ราคา' : 'มูลค่าประเมิน');
  if (!form.name.trim()) miss.push('ชื่อครุภัณฑ์');
  if (!(whole(form.life) > 0)) miss.push('อายุการใช้งาน');
  if (!form.cust.trim()) miss.push('ผู้รับผิดชอบ');
  if (miss.length) throw new DomainError('SAVE_INCOMPLETE', { missing: miss.join(', ') });
  const qty = Math.max(1, whole(form.qty) || 1);
  const lotMiss = missingFor(form, 1).concat(missingFor(form, 2));
  if (lotMiss.length) throw new DomainError('LOT_INVALID', { missing: lotMiss.join(', ') });

  const codes = nextCodes(existingCodes, form.cat, qty);
  const serials = serialList(form.serials);
  const parts: Part[] = form.parts.filter((p) => p.name.trim())
    .map((p, i) => ({ name: p.name.trim(), qty: whole(p.qty) || 1, price: i === 0 ? 0 : whole(p.price) }));
  const cycle = form.calib !== '0' ? whole(form.calib) : 0;
  const date = th(today, 0);
  const doc = form.doc.trim();
  const cust = form.cust.trim();
  return codes.map((code, i) => {
    const sn = qty > 1 ? (serials[i] || '') : form.serial.trim();
    const lot = qty > 1 ? ' · ล็อต ' + (i + 1) + '/' + qty : '';
    const text = (form.method === 'ซื้อ' ? 'ตรวจรับ' : form.method) + ' ขึ้นทะเบียน ติดป้าย QR และส่งมอบ ' + cust + lot
      + (sn ? ' · S/N ' + sn : (qty > 1 ? ' · S/N ยังไม่ระบุ' : ''));
    return newAsset({
      id: 'N' + (firstSeq + i), code, name: form.name.trim() + (form.brand.trim() ? ' (' + form.brand.trim() + ')' : ''), cat: form.cat, room: form.room,
      price: whole(form.price), acq: form.acq, method: form.method, doc, vendor: form.vendor, warranty: form.warranty || null, life: whole(form.life),
      parts: parts.map((p) => ({ ...p })), calib: cycle > 0 ? { last: form.acq, cycle } : null, custodian: cust,
      events: [{ date, text, doc }],
    });
  });
}
