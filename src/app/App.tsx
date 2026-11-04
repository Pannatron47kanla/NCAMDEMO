import { useState, type ReactNode } from 'react';
import { Login } from './Login';
import { INITIAL_NAV_OPEN, type NavGroup, type NavOpen } from './nav';
import { ROLES } from './roles';
import { Shell } from './Shell';

// Outer frame and title bar: mockup lines 339-348.
function Frame({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', boxSizing: 'border-box', padding: '20px 16px', background: '#dbe3e6', fontFamily: "'Anuphan', 'Sarabun', system-ui, sans-serif", color: '#15232a', fontSize: 14, lineHeight: 1.5 }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', background: '#f5f7f8', border: '1px solid #a9b8bd', borderRadius: 10, overflow: 'hidden', boxShadow: '0 10px 30px rgba(20, 40, 50, 0.18)', display: 'flex', flexDirection: 'column', minHeight: 900 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', height: 38, background: '#14262c', color: '#e8f0f2', fontSize: 13 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><rect x="1" y="1" width="16" height="16" rx="4" fill="#3fb5a8" /><path d="M5 6h8M5 9h8M5 12h5" stroke="#14262c" strokeWidth="1.6" strokeLinecap="round" /></svg>
          <span style={{ fontWeight: 600 }}>NCAM</span>
          <span style={{ color: '#a9c0c6' }}>ระบบจัดการครุภัณฑ์ วิทยาลัยพยาบาล [ชื่อวิทยาลัย]</span>
          <span style={{ marginLeft: 'auto', padding: '2px 8px', borderRadius: 4, background: '#2a4249', color: '#cfe3e7', fontSize: 12 }}>ต้นแบบ · ข้อมูลตัวอย่าง</span>
          <svg width="96" height="14" viewBox="0 0 96 14" aria-hidden="true"><path d="M8 7h10" stroke="#a9c0c6" strokeWidth="1.4" /><rect x="42" y="2" width="10" height="10" fill="none" stroke="#a9c0c6" strokeWidth="1.4" /><path d="M78 2l10 10M88 2L78 12" stroke="#a9c0c6" strokeWidth="1.4" /></svg>
        </div>
        {children}
      </div>
    </div>
  );
}

export function App() {
  const [loginRole, setLoginRole] = useState(ROLES[0] ?? '');
  const [role, setRole] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState<NavOpen>(INITIAL_NAV_OPEN);
  const toggleGroup = (g: NavGroup) => setNavOpen((o) => ({ ...o, [g]: !o[g] }));

  return (
    <Frame>
      {role === null
        ? <Login role={loginRole} onRole={setLoginRole} onLogin={() => setRole(loginRole)} />
        : <Shell role={role} navOpen={navOpen} onToggleGroup={toggleGroup} onLogout={() => setRole(null)} />}
    </Frame>
  );
}
