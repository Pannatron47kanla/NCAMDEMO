import type { CSSProperties } from 'react';
import { diffDays, thd, toIso } from '../../shared/dates';
import { useStore } from '../../shared/web/useStore';
import type { ScreenContext } from '../screens';
import { allEvents, calLoans, eventTarget, KIND, KIND_KEYS, kst, upcoming60, type CalEvent, type EventKind } from './events';

const TMF = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const DAY_NAMES = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

// Calendar screen: mockup lines 871-908 and the values built at lines 2274-2279 and 2560-2577.
export function CalendarScreen({ modules, go }: ScreenContext) {
  const now = modules.clock.now();
  const view = useStore(modules.views.calendar);
  const assets = useStore(modules.registry.assets);
  const loans = useStore(modules.circulation.loans);
  const borrowers = useStore(modules.circulation.borrowers);
  const tickets = useStore(modules.maintenance.tickets);
  const current = useStore(modules.disposal.current);
  const auction = useStore(modules.disposal.auction);
  const events = allEvents({ assets, loans: calLoans(loans, borrowers), tickets, auction, current }, now);
  const patch = (p: Partial<typeof view>) => modules.views.calendar.set((v) => ({ ...v, ...p }));

  const open = (e: CalEvent) => () => {
    const t = eventTarget(e);
    if (t.ticketId) modules.maintenance.repairs.select(t.ticketId);
    go(t.screen, t.params);
  };

  const mStart = new Date(2026, 9 + view.monthOffset, 1);
  const mY = mStart.getFullYear();
  const mM = mStart.getMonth();
  const gridStart = new Date(mY, mM, 1 - mStart.getDay());
  const byDay: Record<string, CalEvent[]> = {};
  events.forEach((e) => { if (!view.kinds[e.kind]) return; (byDay[toIso(e.date)] ??= []).push(e); });

  const weeks: { cells: { key: string; n: number; inMonth: boolean; today: boolean; events: CalEvent[] }[] }[] = [];
  for (let wk = 0; wk < 6; wk++) {
    const cells = [];
    for (let dw = 0; dw < 7; dw++) {
      const dt = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + wk * 7 + dw);
      cells.push({ key: toIso(dt), n: dt.getDate(), inMonth: dt.getMonth() === mM, today: toIso(dt) === toIso(now), events: byDay[toIso(dt)] ?? [] });
    }
    if (wk === 5 && !cells[0]!.inMonth && new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + 35).getMonth() !== mM) break;
    weeks.push({ cells });
  }

  const side = upcoming60(events, view.kinds, now);

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
        <h1 className="h1" style={{ marginRight: 'auto' }}>ปฏิทินกำหนดการ</h1>
        <button className="btn sm" onClick={() => patch({ monthOffset: view.monthOffset - 1 })} aria-label="เดือนก่อนหน้า">‹</button>
        <span style={{ fontWeight: 600, minWidth: 130, textAlign: 'center' }}>{TMF[mM] + ' ' + (mY + 543)}</span>
        <button className="btn sm" onClick={() => patch({ monthOffset: view.monthOffset + 1 })} aria-label="เดือนถัดไป">›</button>
        <button className="btn sm" onClick={() => patch({ monthOffset: 0 })}>เดือนนี้</button>
      </div>
      <div className="card" style={{ padding: '10px 12px', display: 'flex', flexWrap: 'wrap', gap: '6px 16px', alignItems: 'center' }}>
        {KIND_KEYS.map((k: EventKind) => (
          <label key={k} htmlFor={'ck-' + k} style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 30 }}>
            <input id={'ck-' + k} type="checkbox" checked={!!view.kinds[k]} onChange={() => patch({ kinds: { ...view.kinds, [k]: !view.kinds[k] } })} />
            <span className="chip" style={kst(k)}>{KIND[k].label}</span>
          </label>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
        <div className="card" style={{ flex: '3 1 560px', minWidth: 0, overflowX: 'auto' }}>
          <div style={{ minWidth: 700 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', background: '#f1f5f6', borderBottom: '1px solid #d8e1e4' }}>
              {DAY_NAMES.map((d) => <div key={d} className="lbl" style={{ padding: '6px 8px' }}>{d}</div>)}
            </div>
            {weeks.map((w, wi) => (
              <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
                {w.cells.map((c) => <DayCell key={c.key} cell={c} open={open} />)}
              </div>
            ))}
          </div>
        </div>
        <aside className="card" style={{ flex: '1 1 280px', minWidth: 0, padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h2 className="h3">กำหนดการ 60 วันข้างหน้า (รวมที่เลยกำหนด)</h2>
          {side.map((e, i) => {
            const o = diffDays(now, e.date);
            const flag = o < 0 ? 'เลยกำหนด ' + (-o) + ' วัน' : (o === 0 ? 'วันนี้' : '');
            return (
              <button key={i} className="pill" style={ROW_STYLE} onClick={open(e)}>
                <span style={{ display: 'inline-block', width: 64, fontVariantNumeric: 'tabular-nums' }}>{thd(e.date)}</span>{' '}
                <span className="chip" style={kst(e.kind)}>{KIND[e.kind].label}</span> {e.label} <span style={{ color: '#82193a' }}>{flag}</span>
              </button>
            );
          })}
        </aside>
      </div>
    </>
  );
}

const ROW_STYLE: CSSProperties = { padding: '6px 4px', borderBottom: '1px solid #edf1f2', borderRadius: 0, background: 'transparent', color: '#15232a', fontSize: 13, whiteSpace: 'normal' };

function DayCell({ cell, open }: { cell: { n: number; inMonth: boolean; today: boolean; events: CalEvent[] }; open(e: CalEvent): () => void }) {
  const numStyle: CSSProperties = {
    fontSize: 12, fontWeight: 600, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
    ...(cell.today ? { background: '#0d6b66', color: '#fff' } : (cell.inMonth ? { color: '#15232a' } : { color: '#9aa8ad' })),
  };
  return (
    <div style={{ minHeight: 96, boxSizing: 'border-box', padding: 4, borderRight: '1px solid #edf1f2', borderBottom: '1px solid #edf1f2', display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, background: cell.inMonth ? '#fff' : '#f6f8f8' }}>
      <div style={numStyle}>{cell.n}</div>
      {cell.events.slice(0, 3).map((e, i) => (
        <button key={i} className="pill" style={kst(e.kind)} title={KIND[e.kind].label + ': ' + e.label} onClick={open(e)}>{e.label}</button>
      ))}
      {cell.events.length > 3 ? <div className="lbl" style={{ fontSize: 11, paddingLeft: 4 }}>{'+' + (cell.events.length - 3) + ' รายการ'}</div> : null}
    </div>
  );
}
