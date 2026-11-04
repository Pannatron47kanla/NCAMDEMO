import type { ReactNode } from 'react';

// Category icon, ported from Icon.dc.html. `kind` is one of the keys below.
const ICON_COLORS: Record<string, [bg: string, fg: string, title: string]> = {
  manikin: ['#f1f4f5', '#2f3d43', 'หุ่นจำลอง'],
  medical: ['#f1f4f5', '#2f3d43', 'เครื่องมือแพทย์ที่ใช้สอน'],
  bed: ['#f1f4f5', '#2f3d43', 'เตียงและครุภัณฑ์ห้องฝึก'],
  computer: ['#f1f4f5', '#2f3d43', 'คอมพิวเตอร์'],
  av: ['#f1f4f5', '#2f3d43', 'โสตทัศนูปกรณ์'],
  furniture: ['#f1f4f5', '#2f3d43', 'สำนักงาน'],
  other: ['#f1f4f5', '#2f3d43', 'อื่น ๆ'],
};

const SHAPES: Record<string, ReactNode> = {
  manikin: <><circle cx="12" cy="5.5" r="2" /><path d="M12 9v5.5M8.5 11h7M12 14.5 9.5 20M12 14.5l2.5 5.5" /></>,
  medical: <path d="M3.5 12h4l2-4.5 4 9 2-4.5h5" />,
  bed: <path d="M3.5 18V7M3.5 14h17v4M20.5 14v-1.5a2 2 0 0 0-2-2h-7v3.5" />,
  computer: <><rect x="4.5" y="5.5" width="15" height="10" rx="1" /><path d="M9 19h6M12 15.5V19" /></>,
  av: <><rect x="3.5" y="8" width="17" height="8.5" rx="1.5" /><circle cx="15.5" cy="12.25" r="2" /><path d="M6.5 12.25h3" /></>,
  furniture: <><rect x="6" y="3.5" width="12" height="17" rx="1" /><path d="M6 12h12M11 8h2M11 16h2" /></>,
  other: <><path d="M12 3.5 19.5 7.5v9L12 20.5 4.5 16.5v-9z" /><path d="M4.5 7.5 12 11.5l7.5-4M12 11.5v9" /></>,
};

export function Icon({ kind, size }: { kind?: string; size?: number }) {
  const k = kind && ICON_COLORS[kind] ? kind : (kind ? 'other' : 'manikin');
  const px = Number(size) || 28;
  const [bg, fg, title] = ICON_COLORS[k] ?? ICON_COLORS.other!;
  const inner = Math.round(px * 0.62);
  return (
    <span title={title} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxSizing: 'border-box', width: px, height: px, borderRadius: Math.round(px * 0.3), background: bg, border: '1px solid #e3e8ea', color: fg }}>
      <svg width={inner} height={inner} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{SHAPES[k]}</svg>
    </span>
  );
}
