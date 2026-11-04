export interface QuarterColumn {
  label: string;
  n: number;
  /** Inline bar style, as the mockup draws it. */
  bar: { width: string; maxWidth: number; borderRadius: string; background: string; height: number };
}

/** What the quarter chart needs from an asset's life: the end-of-life date and the days left (negative when past). */
export interface LifeEnd {
  disp: Date | null;
  off: number | null;
}

const Q_MON = ['ต.ค.–ธ.ค.', 'ม.ค.–มี.ค.', 'เม.ย.–มิ.ย.', 'ก.ค.–ก.ย.'];

function fiscalQuarter(d: Date): { fy: number; q: number } {
  const m = d.getMonth();
  const y = d.getFullYear();
  return { fy: (m >= 9 ? y + 1 : y) + 543, q: Math.floor(((m - 9 + 12) % 12) / 3) + 1 };
}

/**
 * Number of assets reaching end of life per fiscal quarter (mockup qCols, lines 2266-2272): those already past,
 * the next 8 quarters, then everything later. Used by the plan screen and the dashboard.
 */
export function quarterColumns(ends: LifeEnd[], now: Date): QuarterColumn[] {
  const list: { key: string; label: string; n: number; soon?: boolean }[] = [{ key: 'over', label: 'เกินอายุ\nแล้ว', n: 0 }];
  const cur = fiscalQuarter(now);
  for (let qi = 0; qi < 8; qi++) {
    const fy = cur.fy + Math.floor((cur.q - 1 + qi) / 4);
    const q = ((cur.q - 1 + qi) % 4) + 1;
    list.push({ key: fy + '-' + q, label: 'Q' + q + '/' + String(fy).slice(2) + '\n' + Q_MON[q - 1], n: 0, soon: qi < 2 });
  }
  list.push({ key: 'later', label: 'หลังจาก\nนั้น', n: 0 });
  ends.forEach((e) => {
    if (!e.disp || e.off === null) return;
    if (e.off < 0) { list[0]!.n++; return; }
    const k = fiscalQuarter(e.disp);
    const hit = list.find((x) => x.key === k.fy + '-' + k.q);
    if (hit) hit.n++; else list[list.length - 1]!.n++;
  });
  const max = Math.max(1, ...list.map((x) => x.n));
  return list.map((x, i) => ({
    label: x.label, n: x.n,
    bar: { width: '70%', maxWidth: 44, borderRadius: '4px 4px 0 0', background: i === 0 ? '#c0262d' : (x.soon ? '#d97706' : '#3d6f78'), height: Math.max(2, Math.round(x.n / max * 110)) },
  }));
}
