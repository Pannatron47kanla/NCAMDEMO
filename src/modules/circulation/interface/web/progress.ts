import type { CSSProperties } from 'react';

// Progress bar of the counter, ported from the mockup (lines 2303-2328). Presentation only.

export interface ProgressInput {
  mode: 'borrow' | 'return';
  /** Borrow mode: a borrower is chosen and not blocked. */
  borrowerOk: boolean;
  blocked: boolean;
  cartCount: number;
  /** Every part of every cart item is ticked. */
  partsOk: boolean;
  /** The loan was saved. */
  loanDone: boolean;
  /** Return mode: an item to return is chosen, and the return was saved. */
  returnChosen: boolean;
  returnDone: boolean;
}

export interface ProgressStep {
  label: string;
  mark: string;
  bar: CSSProperties;
  dot: CSSProperties;
  lbl: CSSProperties;
}

export interface Progress {
  title: string;
  now: string;
  pct: number;
  steps: ProgressStep[];
}

export function counterProgress(i: ProgressInput): Progress {
  const isBorrow = i.mode === 'borrow';
  let defs: string[];
  let done: boolean[];
  let errAt = -1;
  if (isBorrow) {
    defs = ['สแกนบัตรผู้ยืม', 'สแกนครุภัณฑ์', 'ตรวจชิ้นส่วน', 'ยืนยันและพิมพ์ใบยืม'];
    done = [i.borrowerOk, i.cartCount > 0, i.partsOk, i.loanDone];
    if (i.loanDone) done = [true, true, true, true];
    if (i.blocked) errAt = 0;
  } else {
    defs = ['สแกนของที่นำมาคืน', 'ตรวจชิ้นส่วนและสภาพ', 'ยืนยันการรับคืน'];
    done = [i.returnChosen || i.returnDone, i.returnDone, i.returnDone];
  }
  const cur = done.indexOf(false);
  const nDone = done.filter(Boolean).length;
  const steps = defs.map((label, k): ProgressStep => {
    const isDone = done[k]!;
    const isCur = k === cur;
    const isErr = k === errAt;
    const barCol = isErr ? '#c0392b' : (isDone ? '#0d6b66' : (isCur ? '#8fd0c5' : '#e3e9eb'));
    const dotBg = isErr ? '#c0392b' : (isDone ? '#0d6b66' : (isCur ? '#fff' : '#eef2f3'));
    const dotFg = (isErr || isDone) ? '#fff' : (isCur ? '#0b5e57' : '#7b8a90');
    const dotBd = isErr ? '#c0392b' : (isDone || isCur ? '#0d6b66' : '#d3dcdf');
    return {
      label,
      mark: isErr ? '!' : (isDone ? '✓' : String(k + 1)),
      bar: { height: 6, borderRadius: 3, background: barCol },
      dot: {
        flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '50%',
        fontSize: 11.5, fontWeight: 700, boxSizing: 'border-box', border: '1.5px solid ' + dotBd, background: dotBg, color: dotFg,
      },
      lbl: {
        fontSize: 12.5, lineHeight: 1.3, minWidth: 0,
        ...(isErr ? { color: '#a3191f', fontWeight: 600 } : (isCur ? { color: '#0b5e57', fontWeight: 600 } : (isDone ? { color: '#2a3a40' } : { color: '#7b8a90' }))),
      },
    };
  });
  return {
    title: isBorrow ? 'ขั้นตอนการยืม' : 'ขั้นตอนการรับคืน',
    now: errAt >= 0 ? 'ผู้ยืมค้างคืนของ ยืมเพิ่มไม่ได้จนกว่าจะคืน' : (cur < 0 ? 'ทำรายการครบแล้ว' : 'ขั้นที่ ' + (cur + 1) + ' จาก ' + defs.length + ' · ' + defs[cur]),
    pct: Math.round(nDone / defs.length * 100),
    steps,
  };
}
