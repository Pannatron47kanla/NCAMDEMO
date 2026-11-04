import { th } from '../../../shared/dates';
import type { Asset } from './asset';
import { CATS, PENDING_ROOM, type ImportRow } from './constants';
import { newAsset } from './new-asset';

// Import of the legacy register, ported from the mockup (previewImport and doImport, lines 1959-1979).

export type ImportVerdict = 'ผ่าน' | 'ผิด: รหัสซ้ำกับทะเบียน' | 'ผิด: ไม่มีราคา' | 'ข้าม (มีแล้ว)';

/** The file the sample import stands for. */
export const IMPORT_FILE = 'ทะเบียนครุภัณฑ์เดิม_2568.xlsx';

/** What one row would do. A code imported earlier is skipped before anything else is checked. */
export function classifyRow(row: ImportRow, importedCodes: readonly string[], assetCodes: readonly string[]): ImportVerdict {
  if (importedCodes.includes(row.code)) return 'ข้าม (มีแล้ว)';
  if (assetCodes.includes(row.code)) return 'ผิด: รหัสซ้ำกับทะเบียน';
  if (row.price === null) return 'ผิด: ไม่มีราคา';
  return 'ผ่าน';
}

export interface ImportPreview {
  row: number;
  verdict: ImportVerdict;
}

/** The check of step 2: every row with its verdict, changing nothing. */
export function previewImport(rows: readonly ImportRow[], importedCodes: readonly string[], assets: readonly Asset[]): ImportPreview[] {
  const codes = assets.map((a) => a.code);
  return rows.map((r) => ({ row: r.row, verdict: classifyRow(r, importedCodes, codes) }));
}

export interface ImportOutcome {
  /** The assets to add: only ผ่าน rows, in the room รอระบุห้อง. */
  added: Asset[];
  importedCodes: string[];
  ok: number;
  skip: number;
  bad: number;
  results: ImportPreview[];
}

/** Imports the rows that pass. A row is judged against the register as it grows, so repeated codes in one file are caught. */
export function importRows(rows: readonly ImportRow[], importedCodes: readonly string[], assets: readonly Asset[], today: Date): ImportOutcome {
  const imported = importedCodes.slice();
  const codes = assets.map((a) => a.code);
  const added: Asset[] = [];
  const results: ImportPreview[] = [];
  let ok = 0;
  let skip = 0;
  let bad = 0;
  rows.forEach((r) => {
    const verdict = classifyRow(r, imported, codes);
    results.push({ row: r.row, verdict });
    if (verdict === 'ข้าม (มีแล้ว)') { skip++; return; }
    if (verdict !== 'ผ่าน') { bad++; return; }
    ok++;
    imported.push(r.code);
    codes.push(r.code);
    added.push(newAsset({
      id: 'X' + r.row, code: r.code, name: r.name, cat: r.cat, room: PENDING_ROOM, price: r.price!, acq: null, doc: 'นำเข้าจากทะเบียนเดิม',
      vendor: 'ไม่ระบุ (นำเข้า)', life: CATS[r.cat]!.life,
      events: [{ date: th(today, 0), text: 'นำเข้าจากทะเบียนเดิม (Excel) แถว ' + r.row, doc: IMPORT_FILE }],
    }));
  });
  return { added, importedCodes: imported, ok, skip, bad, results };
}
