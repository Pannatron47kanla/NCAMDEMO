import type { ScreenKey } from './navigation';

// Ported from renderVals() in the mockup (lines 2174-2207).

export const NAV_ICONS: Record<string, string> = {
  dash: 'M4 4h6.5v6.5H4zM13.5 4H20v6.5h-6.5zM4 13.5h6.5V20H4zM13.5 13.5H20V20h-6.5z',
  counter: 'M4 8h15M15.5 4.5 19 8l-3.5 3.5M20 16H5M8.5 12.5 5 16l3.5 3.5',
  repair: 'M9 3.5h6v3H9zM8 5H5.5v15.5h13V5H16M9 13.5l2.2 2.2L15.5 11',
  folder: 'M3 7.5a1.5 1.5 0 0 1 1.5-1.5H9l2 2.2h8.5A1.5 1.5 0 0 1 21 9.7v8.8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z',
  assets: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9M8 5.3l8 4.5',
  add: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M12 8v8M8 12h8',
  map: 'M12 21.5s-7-6.3-7-11.8a7 7 0 0 1 14 0c0 5.5-7 11.8-7 11.8zM12 7.2a2.4 2.4 0 1 0 0 4.8a2.4 2.4 0 1 0 0-4.8',
  import: 'M12 15V4M7.5 8.5 12 4l4.5 4.5M4 14.5V20h16v-5.5',
  roomscan: 'M4 8.5V5h3.5M16.5 5H20v3.5M20 15.5V19h-3.5M7.5 19H4v-3.5M7.5 12h9',
  cal: 'M4 5.5h16V20H4zM4 10h16M8.5 3v4.5M15.5 3v4.5M8 13.5h.01M12 13.5h.01M16 13.5h.01M8 16.5h.01M12 16.5h.01',
  disp: 'M4 7h16M9.5 7V4h5v3M6 7l1 13.5h10L18 7M10 11v6M14 11v6',
  audit: 'M20 11.5V20H4V4h11M8.5 11.5l3 3L20 6',
  reports: 'M5 20v-5M9.5 20V9M14 20v-7M18.5 20V4',
  settings: 'M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1',
};

export const CHEV_UP = 'M6 15l6-6 6 6';
export const CHEV_DOWN = 'M6 9l6 6 6-6';

export type NavGroup = 'reg' | 'plan';
export type NavOpen = Record<NavGroup, boolean>;
export const INITIAL_NAV_OPEN: NavOpen = { reg: true, plan: true };

export type NavEntry =
  | { kind: 'head'; label: string }
  | { kind: 'headToggle'; label: string; group: NavGroup; open: boolean }
  | { kind: 'item'; label: string; screen: ScreenKey; on: boolean }
  | { kind: 'folder'; label: string; group: NavGroup; open: boolean; grp: boolean }
  | { kind: 'child'; label: string; screen: ScreenKey; on: boolean; last: boolean };

const REG: [ScreenKey, string][] = [
  ['assets', 'ทะเบียนครุภัณฑ์'], ['add', 'ขึ้นทะเบียนใหม่'], ['roomscan', 'กำหนดห้อง'], ['map', 'แผนที่ตำแหน่ง'], ['import', 'นำเข้าข้อมูลเดิม'],
];
const PLAN: [ScreenKey, string][] = [
  ['cal', 'ปฏิทินกำหนดการ'], ['disp', 'แผนจำหน่าย'], ['audit', 'ตรวจสอบพัสดุประจำปี'], ['reports', 'รายงาน'],
];

/** The menu for the current screen. The asset detail screen highlights the register, as in the mockup. */
export function buildNav(screen: ScreenKey, navOpen: NavOpen): NavEntry[] {
  const isOn = (k: ScreenKey) => screen === k || (k === 'assets' && screen === 'asset');
  const item = (screen: ScreenKey, label: string): NavEntry => ({ kind: 'item', label, screen, on: isOn(screen) });
  const nav: NavEntry[] = [
    { kind: 'head', label: 'งานประจำวัน' },
    item('dash', 'แดชบอร์ด'), item('counter', 'เคาน์เตอร์ยืม-คืน'), item('repair', 'แจ้งซ่อม / ใบงาน'),
  ];
  const regOn = REG.some((r) => isOn(r[0]));
  nav.push({ kind: 'folder', label: 'ทะเบียนและตำแหน่ง', group: 'reg', open: navOpen.reg, grp: navOpen.reg || regOn });
  if (navOpen.reg) {
    REG.forEach(([key, label], i) => nav.push({ kind: 'child', label, screen: key, on: isOn(key), last: i === REG.length - 1 }));
  }
  nav.push({ kind: 'headToggle', label: 'วางแผนและรายงาน', group: 'plan', open: navOpen.plan });
  if (navOpen.plan) PLAN.forEach(([key, label]) => nav.push(item(key, label)));
  nav.push({ kind: 'head', label: 'ตั้งค่า' }, item('settings', 'ตั้งค่ากติกายืม'));
  return nav;
}

/** Text of a screen's menu entry, used for the placeholder heading of screens not ported yet. */
export function screenLabel(screen: ScreenKey): string {
  const all = [...buildNav(screen, { reg: true, plan: true })];
  for (const e of all) if ((e.kind === 'item' || e.kind === 'child') && e.screen === screen) return e.label;
  return screen;
}
