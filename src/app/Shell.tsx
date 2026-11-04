import { useState } from 'react';
import { buildNav, CHEV_DOWN, CHEV_UP, NAV_ICONS, screenLabel, type NavEntry, type NavGroup, type NavOpen } from './nav';
import { START_SCREEN, type Navigation, type ScreenKey, type ScreenParams } from './navigation';
import type { AppModules } from './modules';
import { SCREENS, type ScreenContext } from './screens';

interface Props {
  modules: AppModules;
  role: string;
  navOpen: NavOpen;
  onToggleGroup(group: NavGroup): void;
  onLogout(): void;
}

const svgProps = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;
const chevProps = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;

function NavIcon({ name }: { name: string }) {
  return <svg {...svgProps}><path d={NAV_ICONS[name] ?? ''} /></svg>;
}

function NavItem({ entry, go, toggle }: { entry: NavEntry; go(screen: ScreenKey): void; toggle(group: NavGroup): void }) {
  switch (entry.kind) {
    case 'head':
      return <div className="navhead">{entry.label}</div>;
    case 'headToggle':
      return (
        <button className="navhead" onClick={() => toggle(entry.group)} aria-expanded={entry.open}>
          <span>{entry.label}</span>
          <svg {...chevProps} style={{ marginLeft: 'auto', marginRight: 4 }}><path d={entry.open ? CHEV_UP : CHEV_DOWN} /></svg>
        </button>
      );
    case 'item':
      return (
        <button className={entry.on ? 'nav on' : 'nav'} onClick={() => go(entry.screen)}>
          <NavIcon name={entry.screen} /><span>{entry.label}</span>
        </button>
      );
    case 'folder':
      return (
        <button className={entry.grp ? 'nav grp' : 'nav'} onClick={() => toggle(entry.group)} aria-expanded={entry.open}>
          <NavIcon name="folder" /><span>{entry.label}</span>
          <svg {...chevProps} style={{ marginLeft: 'auto' }}><path d={entry.open ? CHEV_UP : CHEV_DOWN} /></svg>
        </button>
      );
    case 'child':
      return (
        <div style={{ position: 'relative', paddingLeft: 34 }}>
          <span aria-hidden="true" style={{ position: 'absolute', left: 20, top: -4, ...(entry.last ? { height: 'calc(50% + 4px)' } : { bottom: -4 }), borderLeft: '1px solid #c9d3d7' }} />
          <span aria-hidden="true" style={{ position: 'absolute', left: 20, top: '50%', width: 12, borderTop: '1px solid #c9d3d7' }} />
          <button className={entry.on ? 'nav on' : 'nav'} onClick={() => go(entry.screen)}>
            <NavIcon name={entry.screen} /><span>{entry.label}</span>
          </button>
        </div>
      );
  }
}

function Placeholder({ screen }: { screen: ScreenKey }) {
  return (
    <div>
      <h1 className="h1">{screenLabel(screen)}</h1>
      <div className="lbl">หน้านี้ยังไม่พร้อมใช้งาน</div>
    </div>
  );
}

// App shell: mockup lines 375-391 (menu) and 393 (main area).
export function Shell({ modules, role, navOpen, onToggleGroup, onLogout }: Props) {
  const [nav, setNav] = useState<Navigation>(START_SCREEN);
  const go = (screen: ScreenKey, params: ScreenParams = {}) => setNav({ screen, params });
  const ctx: ScreenContext = { modules, params: nav.params, go };
  const render = SCREENS[nav.screen];

  return (
    <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'stretch' }}>
      <nav aria-label="เมนูหลัก" style={{ flex: '1 1 236px', boxSizing: 'border-box', padding: '8px 10px 12px', background: '#fff', borderRight: '1px solid #d8e1e4', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {buildNav(nav.screen, navOpen).map((entry, i) => (
          <NavItem key={i} entry={entry} go={(s) => go(s)} toggle={onToggleGroup} />
        ))}
        <div style={{ marginTop: 'auto', padding: 12, borderTop: '1px solid #e3e9eb', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontWeight: 600 }}>lab.officer</div>
          <div className="lbl">{role}</div>
          <button className="btn sm" onClick={onLogout}>ออกจากระบบ</button>
        </div>
      </nav>
      <main style={{ flex: '999 1 560px', minWidth: 0, boxSizing: 'border-box', padding: '20px 24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {render ? render(ctx) : <Placeholder screen={nav.screen} />}
      </main>
    </div>
  );
}
