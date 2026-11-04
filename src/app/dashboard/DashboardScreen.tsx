import type { CSSProperties } from 'react';
import { Icon } from '../../shared/web/Icon';
import { chip } from '../../shared/web/chip';
import { useStore } from '../../shared/web/useStore';
import { calLoans, eventTarget, kst, KIND, type CalEvent } from '../calendar/events';
import type { ScreenContext } from '../screens';
import { GROUP_BAR, buildDashboard, type Tile, type TileGroup } from './dashboard';

const GROUPS: { group: TileGroup; title: string; sub: string; style: CSSProperties }[] = [
  { group: 'A', title: 'พร้อมใช้งาน', sub: 'ครุภัณฑ์ที่พร้อมให้ใช้งานได้', style: { flex: '2 1 300px', background: '#eef8f1', border: '1px solid #d3eadb' } },
  { group: 'B', title: 'อยู่ระหว่างดำเนินการ', sub: 'ครุภัณฑ์ที่ถูกยืม หรืออยู่ระหว่างการตรวจสอบ', style: { flex: '3 1 380px', background: '#f0f3f6', border: '1px solid #dbe2e7' } },
  { group: 'C', title: 'ต้องติดตาม', sub: 'รายการที่มีความเสี่ยง / ต้องดำเนินการเพิ่มเติม', style: { flex: '3 1 380px', background: '#fff4ea', border: '1px solid #f5dac2' } },
];

const SECTION: CSSProperties = { minWidth: 0, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 };

// Dashboard: mockup lines 395-508, values from lines 2210-2272.
export function DashboardScreen({ modules, go }: ScreenContext) {
  const now = modules.clock.now();
  const assets = useStore(modules.registry.assets);
  const loans = useStore(modules.circulation.loans);
  const borrowers = useStore(modules.circulation.borrowers);
  const settings = useStore(modules.circulation.settings);
  const tickets = useStore(modules.maintenance.tickets);
  const audit = useStore(modules.audit.round);
  const current = useStore(modules.disposal.current);
  const auction = useStore(modules.disposal.auction);
  const d = buildDashboard({
    assets, loans, borrowers, tickets, settings, audit,
    events: { assets, loans: calLoans(loans, borrowers), tickets, auction, current },
  }, now);

  const openTile = (t: Tile) => () => {
    if ('status' in t.target) { modules.registry.list.show({ status: t.target.status }); go('assets'); } else go(t.target.screen);
  };
  const openEvent = (e: CalEvent) => () => {
    const t = eventTarget(e);
    if (t.ticketId) modules.maintenance.repairs.select(t.ticketId);
    go(t.screen, t.params);
  };

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 14px' }}>
        <span aria-hidden="true" style={{ display: 'inline-flex', width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '1px solid #d8e1e4', alignItems: 'center', justifyContent: 'center', color: '#0b5e57' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M5 20v-5M9.5 20V9M14 20v-7M18.5 20V4" />
          </svg>
        </span>
        <h1 className="h1">แดชบอร์ด</h1>
        <span className="lbl">ข้อมูล ณ 28 ต.ค. 69 · ชี้ที่กล่องเพื่อดูคำอธิบาย คลิกเพื่อดูรายการ</span>
      </div>
      <div className="card" style={{ padding: 14, background: '#f7f9fa', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {GROUPS.map((g) => (
          <section key={g.group} className="kgrp" style={g.style}>
            <div><h2 className="h3" style={{ fontSize: 17, fontWeight: 700 }}>{g.title}</h2><div className="lbl">{g.sub}</div></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {d.tiles.filter((t) => t.group === g.group).map((t) => (
                <button key={t.label} className="kt" onClick={openTile(t)} aria-label={t.label + ' ' + t.n + ' รายการ. ' + t.desc}>
                  <span style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.15, fontVariantNumeric: 'tabular-nums', color: t.numberColor }}>{t.n}</span>
                  <span className="kl">{t.label}</span>
                  <span className="kbar" style={{ background: GROUP_BAR[t.group] }} />
                  <span className={t.alignRight ? 'tip r' : 'tip'} role="tooltip">
                    <span className="tip-t">{t.label + ' · ' + t.n + ' รายการ'}</span>
                    <span>{t.desc}</span>
                    {t.example ? <span className="tip-ex">{t.example}</span> : null}
                    <span className="tip-go">คลิกเพื่อดูรายการ →</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <section className="card" style={{ ...SECTION, flex: '3 1 440px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><h2 className="h3">รายการยืมเกินกำหนดคืน</h2><span className="chip" style={{ background: '#f4e3ea', color: '#82193a' }}>{d.overdue.length}</span></div>
          {d.overdue.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="t">
                <thead><tr><th>ผู้ยืม</th><th>ครุภัณฑ์</th><th>กำหนดคืน</th><th>ช้า</th><th>ค่าปรับสะสม</th></tr></thead>
                <tbody>{d.overdue.map((o, i) => <tr key={i}><td>{o.who}</td><td>{o.items}</td><td>{o.due}</td><td>{o.late}</td><td>{o.fine}</td></tr>)}</tbody>
              </table>
            </div>
          ) : <div className="lbl">ไม่มีรายการเกินกำหนด</div>}
        </section>
        <section className="card" style={{ ...SECTION, flex: '2 1 320px' }}>
          <h2 className="h3">คำขอยืมรออาจารย์อนุมัติ</h2>
          {d.pending.length > 0 ? d.pending.map((p) => (
            <div key={p.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #edf1f2' }}>
              <div style={{ flex: '1 1 160px', minWidth: 0 }}><div style={{ fontWeight: 600 }}>{p.who}</div><div className="lbl">{p.id + ' · ' + p.items}</div></div>
              <button className="btn sm pri" onClick={() => modules.circulation.counter.approve(p.id)}>อนุมัติ</button>
            </div>
          )) : <div className="lbl">ไม่มีคำขอรออนุมัติ (เปิดการอนุมัติได้ในหน้าตั้งค่ากติกายืม)</div>}
        </section>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <section className="card" style={{ ...SECTION, flex: '3 1 440px' }}>
          <h2 className="h3">งานซ่อมค้าง</h2>
          {d.openTickets.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="t">
                <thead><tr><th>ใบงาน</th><th>ครุภัณฑ์</th><th>สถานะ</th><th>ต้องใช้สอน</th><th></th></tr></thead>
                <tbody>{d.openTickets.map((k) => (
                  <tr key={k.id}><td className="mono">{k.id}</td><td>{k.name}</td><td><span className="chip" style={chip(k.status)}>{k.status}</span></td><td>{k.need}</td>
                    <td><button className="btn sm" onClick={() => { modules.maintenance.repairs.select(k.id); go('repair'); }}>เปิด</button></td></tr>
                ))}</tbody>
              </table>
            </div>
          ) : <div className="lbl">ไม่มีงานซ่อมค้าง</div>}
        </section>
        <section className="card" style={{ ...SECTION, flex: '2 1 320px', gap: 8 }}>
          <h2 className="h3">รอบตรวจสอบพัสดุประจำปี 2569</h2>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><span style={{ fontSize: 26, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{d.audit.done}</span><span className="lbl">{'จาก ' + d.audit.total + ' รายการยืนยันแล้ว'}</span></div>
          <div style={{ height: 8, borderRadius: 4, background: '#e6ecee', overflow: 'hidden' }}><div style={{ height: '100%', background: '#0d6b66', width: d.audit.percent + '%' }} /></div>
          <div className="lbl">{'ใช้ไป ' + d.audit.used + ' วันทำการ เหลือ ' + d.audit.left + ' วันทำการ · ครบกำหนดรายงาน ' + d.audit.due}</div>
          <button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => go('audit')}>ไปที่การตรวจสอบ</button>
        </section>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <section className="card" style={{ ...SECTION, flex: '3 1 440px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '6px 12px' }}><h2 className="h3">ครุภัณฑ์ครบอายุใช้งาน (กำหนดพิจารณาจำหน่าย) รายไตรมาส</h2><button className="btn sm" style={{ marginLeft: 'auto' }} onClick={() => go('disp')}>ไปที่แผนจำหน่าย</button></div>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 170, minWidth: 560, paddingTop: 8 }}>
              {d.quarters.map((q, i) => (
                <div key={i} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 4 }}>
                  <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{q.n}</span>
                  <div style={q.bar} />
                  <span className="lbl" style={{ textAlign: 'center', lineHeight: 1.25, fontSize: 11.5, whiteSpace: 'pre-line' }}>{q.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="lbl">แท่งแดง = เกินอายุใช้งานแล้ว · แท่งส้ม = ครบภายใน 6 เดือน ควรเริ่มเตรียมขั้นตอนจำหน่าย</div>
        </section>
        <section className="card" style={{ ...SECTION, flex: '2 1 320px', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><h2 className="h3">ต้องเตรียมภายใน 30 วัน</h2><button className="btn sm" style={{ marginLeft: 'auto' }} onClick={() => go('cal')}>ดูปฏิทิน</button></div>
          {d.upcoming.map((u, i) => (
            <button key={i} className="pill" style={{ padding: '6px 4px', borderBottom: '1px solid #edf1f2', borderRadius: 0, background: 'transparent', color: '#15232a', fontSize: 13, whiteSpace: 'normal' }} onClick={openEvent(u.event)}>
              <span style={{ display: 'inline-block', width: 64, fontVariantNumeric: 'tabular-nums' }}>{u.date}</span>{' '}
              <span className="chip" style={kst(u.event.kind)}>{KIND[u.event.kind].label}</span> {u.event.label} <span style={{ color: '#82193a' }}>{u.flag}</span>
            </button>
          ))}
        </section>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <section className="card" style={{ ...SECTION, flex: '3 1 440px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '6px 12px' }}><h2 className="h3">มูลค่าการจัดซื้อตามผู้ขาย</h2><span className="lbl">{'รวม ' + d.vendors.total + ' · ไม่รวมของรับโอน/รับบริจาค ' + d.vendors.nonPurchase + ' รายการ'}</span></div>
          {d.vendors.rows.map((v) => (
            <div key={v.name} style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 230px) minmax(0, 1fr)', gap: '4px 12px', alignItems: 'center' }}>
              <div style={{ minWidth: 0 }}><div style={{ fontWeight: 500 }}>{v.name}</div><div className="lbl">{v.count + ' รายการ'}</div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <div style={{ flex: 1, height: 14, background: '#eef2f3', borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', background: '#0d6b66', width: v.percent + '%' }} /></div>
                <span style={{ fontVariantNumeric: 'tabular-nums', minWidth: 96, textAlign: 'right' }}>{v.value}</span>
              </div>
            </div>
          ))}
        </section>
        <section className="card" style={{ ...SECTION, flex: '2 1 320px', gap: 8 }}>
          <h2 className="h3">ครุภัณฑ์ตามหมวด</h2>
          {d.categories.map((c) => (
            <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon kind={c.icon} size={26} />
              <div className="lbl" style={{ flex: '0 0 150px', minWidth: 0 }}>{c.name}</div>
              <div style={{ flex: 1, height: 12, background: '#eef2f3', borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', background: '#3d6f78', width: c.percent + '%' }} /></div>
              <span style={{ fontVariantNumeric: 'tabular-nums', width: 24, textAlign: 'right' }}>{c.n}</span>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
