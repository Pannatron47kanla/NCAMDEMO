import { toIso } from '../../../shared/dates';
import { DomainError } from '../../../shared/domain-error';
import { CATS, CUST, LAB1, MAX_LOT_SIZE, V1 } from './constants';

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
