export const QR_SIZE = 21;

/**
 * The look-alike QR pattern from the mockup (lines 1630-1645): a 21 x 21 grid, row by row,
 * where true is a dark cell. It is a picture for the label, not a scannable code.
 * The view draws each cell as a 4 x 4 px square.
 */
export function qr(code: string): boolean[] {
  const n = QR_SIZE;
  const m: number[][] = [];
  let h = 7;
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) >>> 0;
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      h = (Math.imul(h, 1103515245) + 12345) >>> 0;
      row.push((h >>> 16) & 1);
    }
    m.push(row);
  }
  const finder = (r: number, c: number) => {
    for (let a = -1; a <= 7; a++) {
      for (let b = -1; b <= 7; b++) {
        const rr = r + a, cc = c + b;
        if (rr < 0 || cc < 0 || rr >= n || cc >= n) continue;
        const edge = a === -1 || a === 7 || b === -1 || b === 7;
        m[rr]![cc] = (!edge && (a === 0 || a === 6 || b === 0 || b === 6 || (a >= 2 && a <= 4 && b >= 2 && b <= 4))) ? 1 : 0;
      }
    }
  };
  finder(0, 0);
  finder(0, 14);
  finder(14, 0);
  const cells: boolean[] = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) cells.push(m[i]![j] === 1);
  return cells;
}
