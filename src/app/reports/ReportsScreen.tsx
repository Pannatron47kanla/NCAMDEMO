import { useStore } from '../../shared/web/useStore';
import type { ScreenContext } from '../screens';
import { buildReports } from './reports';

// Reports screen: mockup lines 1102-1114.
export function ReportsScreen({ modules, go }: ScreenContext) {
  const assets = useStore(modules.registry.assets);
  const audit = useStore(modules.audit.round);
  const current = useStore(modules.disposal.current);
  const done = useStore(modules.disposal.done);
  const cards = buildReports({ assets, audit, current, done }, modules.clock.now());
  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '8px 16px' }}>
        <h1 className="h1">รายงาน</h1>
        <span className="lbl">ตัวอย่างก่อนพิมพ์ในรูปแบบหนังสือราชการ · ระบบจริงส่งออก PDF และ Excel ได้</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {cards.map((r) => (
          <section key={r.kind} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 className="h3">{r.title}</h2>
            <div className="lbl" style={{ flex: 1 }}>{r.desc}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <button className="btn sm pri" disabled={r.off} onClick={() => go('print', { print: { kind: r.kind, ids: [], loanId: '', back: 'reports' } })}>ดูตัวอย่างก่อนพิมพ์</button>
              <span className="lbl">{r.note}</span>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
