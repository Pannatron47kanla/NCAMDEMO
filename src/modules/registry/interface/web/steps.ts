import type { CSSProperties } from 'react';

// The progress bars of the register dialogs and the room scan, ported from the mockup (lines 2433-2444, 2731-2754, 2794-2803).
// Presentation only: they look at which steps are done and draw them.

export interface StepView {
  label: string;
  mark: string;
  /** The step can be clicked to go back to it. */
  canGo: boolean;
  current: boolean;
  btn: CSSProperties;
  bar: CSSProperties;
  dot: CSSProperties;
  lbl: CSSProperties;
}

/** Steps of a dialog (add asset, import): `step` is the current one, 1-based, and `allDone` marks all as done. */
export function dialogSteps(labels: string[], step: number, allDone: boolean): StepView[] {
  return labels.map((label, i) => {
    const n = i + 1;
    const done = allDone || n < step;
    const cur = !allDone && n === step;
    const canGo = !allDone && n < step;
    return {
      label, mark: done ? '✓' : String(n), canGo, current: cur,
      btn: { display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, padding: 0, border: 0, background: 'transparent', font: 'inherit', textAlign: 'left', color: 'inherit', cursor: canGo ? 'pointer' : 'default' },
      bar: { display: 'block', height: 6, borderRadius: 3, background: done ? '#0d6b66' : (cur ? '#8fd0c5' : '#e3e9eb') },
      dot: {
        flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '50%', fontSize: 11.5, fontWeight: 700, boxSizing: 'border-box',
        border: '1.5px solid ' + (done || cur ? '#0d6b66' : '#d3dcdf'), background: done ? '#0d6b66' : (cur ? '#fff' : '#eef2f3'), color: done ? '#fff' : (cur ? '#0b5e57' : '#7b8a90'),
      },
      lbl: {
        fontSize: 12.5, lineHeight: 1.3, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        ...(cur ? { color: '#0b5e57', fontWeight: 600 } : (done ? { color: '#2a3a40', textDecoration: 'underline', textDecorationColor: '#c9d3d7', textUnderlineOffset: 3 } : { color: '#7b8a90' })),
      },
    };
  });
}

export interface ScanProgressInput {
  hasRoom: boolean;
  itemCount: number;
  /** Moves still waiting for the officer's confirmation. */
  waitingMoves: number;
  /** What saving would change. */
  saveCount: number;
  /** Saved, and the list is empty again. */
  allDone: boolean;
}

export interface ScanProgress {
  now: string;
  pct: number;
  steps: { label: string; mark: string; bar: CSSProperties; dot: CSSProperties; lbl: CSSProperties }[];
}

const SCAN_STEPS = ['เลือกห้อง', 'สแกนป้ายครุภัณฑ์', 'ตรวจและยืนยันการย้าย', 'บันทึก'];

export function scanProgress(i: ScanProgressInput): ScanProgress {
  const done = i.allDone
    ? [true, true, true, true]
    : [i.hasRoom, i.itemCount > 0, i.itemCount > 0 && i.waitingMoves === 0 && i.saveCount > 0, false];
  const cur = done.indexOf(false);
  const wait = i.itemCount > 0 && i.waitingMoves > 0;
  const now = i.allDone
    ? 'บันทึกเรียบร้อย · เลือกห้องอื่นหรือสแกนต่อได้เลย'
    : 'ขั้นที่ ' + (cur + 1) + ' จาก 4 · ' + SCAN_STEPS[cur]
      + (cur === 2 && wait ? ' (มี ' + i.waitingMoves + ' ชิ้นรอยืนยันย้าย)' : (cur === 2 && i.saveCount === 0 && i.itemCount ? ' (ยังไม่มีรายการที่ต้องบันทึก)' : ''));
  const steps = SCAN_STEPS.map((label, k) => {
    const d = done[k]!;
    const isCur = k === cur;
    const warn = isCur && k === 2 && wait;
    return {
      label, mark: d ? '✓' : String(k + 1),
      bar: { height: 6, borderRadius: 3, background: d ? '#0d6b66' : (warn ? '#f0b46a' : (isCur ? '#8fd0c5' : '#e3e9eb')) } as CSSProperties,
      dot: {
        flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '50%', fontSize: 11.5, fontWeight: 700, boxSizing: 'border-box',
        border: '1.5px solid ' + (d || isCur ? (warn ? '#c77a1c' : '#0d6b66') : '#d3dcdf'), background: d ? '#0d6b66' : (isCur ? '#fff' : '#eef2f3'),
        color: d ? '#fff' : (isCur ? (warn ? '#8a4b00' : '#0b5e57') : '#7b8a90'),
      } as CSSProperties,
      lbl: { fontSize: 12.5, lineHeight: 1.3, minWidth: 0, ...(isCur ? { fontWeight: 600, color: warn ? '#8a4b00' : '#0b5e57' } : (d ? { color: '#2a3a40' } : { color: '#7b8a90' })) } as CSSProperties,
    };
  });
  return { now, pct: Math.round(done.filter(Boolean).length / 4 * 100), steps };
}
