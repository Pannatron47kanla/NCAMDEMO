import { thd } from '../../../../shared/dates';
import { baht } from '../../../../shared/money';
import { chip } from '../../../../shared/web/chip';
import { Icon } from '../../../../shared/web/Icon';
import { useStore } from '../../../../shared/web/useStore';
import { assetInfo, iconOf, type Asset, type LifeBucket } from '../../../registry';
import { caseDates, casePlan } from '../../domain/plan';
import { METHODS } from '../../domain/methods';
import type { DisposalModule } from '../../module';
import { CaseDialog } from './CaseDialog';
import { messageText } from './messages';
import { quarterColumns } from './quarters';

export interface DisposalScreenProps {
  disposal: DisposalModule;
  /** Current assets, read by the app from the registry. */
  assets: Asset[];
  /** Today, from the Clock. */
  now: Date;
  /** Opens a printed document: the auction notice or the disposal result report. */
  onPrint(kind: 'auction' | 'dispResult'): void;
}

const BUCKETS: LifeBucket[] = ['เกินอายุใช้งาน', 'ครบภายใน 6 เดือน', 'ครบภายใน 6–12 เดือน', 'มากกว่า 1 ปี'];
const DT_COL: Record<string, [string, string]> = { 'เกินอายุใช้งาน': ['#c0262d', '#e05a5f'], 'ครบภายใน 6 เดือน': ['#d9620f', '#f08a2c'], 'ครบภายใน 6–12 เดือน': ['#a16207', '#e0b324'], 'มากกว่า 1 ปี': ['#0f7a43', '#169a55'] };
const DT_DESC: Record<string, string> = { 'เกินอายุใช้งาน': 'เลยกำหนดพิจารณาจำหน่ายแล้ว ควรตรวจสภาพและพิจารณาสร้างเรื่องขอจำหน่าย', 'ครบภายใน 6 เดือน': 'จะครบอายุใช้งานภายใน 6 เดือน ควรเริ่มเตรียมเรื่องและงบจัดหาทดแทน', 'ครบภายใน 6–12 เดือน': 'จะครบอายุใช้งานในอีก 6–12 เดือน ใช้วางแผนงบประมาณปีถัดไป', 'มากกว่า 1 ปี': 'ยังเหลืออายุใช้งานมากกว่า 1 ปี' };
const STAGE = ['เสนอจำหน่าย', 'สอบข้อเท็จจริง', 'อนุมัติวิธี', 'ดำเนินการ', 'ลงจ่าย', 'แจ้ง สตง.'];
const STAGE_LONG = ['เสนอจำหน่ายและแต่งตั้งกรรมการ', 'กรรมการสอบหาข้อเท็จจริง', 'เลือกวิธีจำหน่ายและขออนุมัติ', 'ดำเนินการจำหน่าย', 'ลงจ่ายออกจากทะเบียน', 'แจ้ง สตง.'];

// Disposal plan screen, ported from mockup lines 910-994 and the view values (lines 2574-2606, 2650-2680, 2938-2955).
export function DisposalScreen({ disposal, assets, now, onPrint }: DisposalScreenProps) {
  const svc = disposal.disposal;
  const desk = useStore(svc.desk);
  const current = useStore(disposal.current);
  const done = useStore(disposal.done);

  const live = assets.filter((a) => a.status !== 'จำหน่ายแล้ว');
  const infos = new Map(live.map((a) => [a.id, assetInfo(a, now)]));
  const selN = svc.eligibleIds().length;
  const step = current ? current.data.step : 0;

  const tiles = BUCKETS.map((b, i) => {
    const xs = live.filter((a) => infos.get(a.id)!.bucket === b);
    const col = DT_COL[b]!;
    const ex = xs.slice(0, 3).map((a) => '• ' + a.name).join('\n') + (xs.length > 3 ? '\nและอีก ' + (xs.length - 3) + ' รายการ' : '');
    return { b, i, n: xs.length, col, ex, value: baht(xs.reduce((t, a) => t + a.price, 0)) };
  });

  const rowsAll = live.filter((a) => infos.get(a.id)!.disp)
    .sort((x, y) => infos.get(x.id)!.disp!.getTime() - infos.get(y.id)!.disp!.getTime())
    .filter((a) => desk.filter === 'ทั้งหมด' || infos.get(a.id)!.bucket === desk.filter);
  const count = Math.max(1, Math.ceil(rowsAll.length / desk.pageSize));
  const cur = Math.min(Math.max(1, desk.page), count);
  const start = (cur - 1) * desk.pageSize;
  const pageRows = rowsAll.slice(start, start + desk.pageSize);

  const qCols = quarterColumns(live.map((a) => infos.get(a.id)!), now);

  const stageDates = (() => {
    const d = current ? current.dates : caseDates(casePlan(now), 'auction');
    return [d.created, d.fact, d.approve, d.done, d.writeoff, d.oagSent];
  })();

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 14px' }}>
        <h1 className="h1">แผนจำหน่ายครุภัณฑ์</h1>
        <span className="lbl" style={{ flex: '1 1 300px' }}>กำหนดพิจารณาจำหน่าย = วันที่ได้มา + อายุการใช้งาน · เตือนล่วงหน้า 6 เดือน · ชี้ที่กล่องเพื่อดูคำอธิบาย คลิกเพื่อกรองตาราง</span>
        <button className="btn pri" disabled={!current && selN === 0} onClick={() => svc.openDialog()}>{current ? 'เปิดเรื่อง ' + current.data.id : 'สร้างเรื่องขอจำหน่าย (' + selN + ')'}</button>
      </div>
      <div className="card" style={{ padding: 14, background: '#f7f9fa', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {[{ title: 'ต้องเตรียมจำหน่าย', sub: 'เกินอายุแล้ว หรือจะครบภายใน 6 เดือน', bg: '#fff3ec', bd: '#f5d6c4', list: tiles.slice(0, 2) }, { title: 'ยังใช้งานได้', sub: 'ครบกำหนดในอีก 6 เดือนขึ้นไป', bg: '#eef8f1', bd: '#d3eadb', list: tiles.slice(2) }].map((g) => (
          <section key={g.title} className="kgrp" style={{ flex: '2 1 320px', background: g.bg, border: '1px solid ' + g.bd }}>
            <div><h2 className="h3" style={{ fontSize: 17, fontWeight: 700 }}>{g.title}</h2><div className="lbl">{g.sub}</div></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {g.list.map((t) => (
                <button key={t.b} className="kt" onClick={() => svc.setFilter(desk.filter === t.b ? 'ทั้งหมด' : t.b)} aria-label={t.b + ' ' + t.n + ' รายการ. ' + DT_DESC[t.b]} style={desk.filter === t.b ? { borderColor: '#15232a', boxShadow: '0 0 0 1px #15232a' } : undefined}>
                  <span style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.15, fontVariantNumeric: 'tabular-nums', color: t.n > 0 ? t.col[0] : '#8a979c' }}>{t.n}</span>
                  <span className="kl">{t.b}</span>
                  <span className="lbl" style={{ fontVariantNumeric: 'tabular-nums' }}>{t.value}</span>
                  <span className="kbar" style={{ background: t.col[1] }}></span>
                  <span className={t.i % 2 === 1 ? 'tip r' : 'tip'} role="tooltip">
                    <span className="tip-t">{t.b} · {t.n} รายการ</span>
                    <span>{DT_DESC[t.b]}</span>
                    {t.n > 0 && <span className="tip-ex">{t.ex}</span>}
                    <span className="tip-go">คลิกเพื่อกรองตาราง →</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <section className="card" style={{ flex: '3 1 440px', minWidth: 0, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 className="h3">จำนวนที่ครบอายุใช้งานรายไตรมาส (ปีงบประมาณ)</h2>
          <div style={{ overflowX: 'auto' }}><div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 170, minWidth: 560, paddingTop: 8 }}>
            {qCols.map((q, i) => (
              <div key={i} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 4 }}>
                <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{q.n}</span>
                <div style={q.bar}></div>
                <span className="lbl" style={{ textAlign: 'center', lineHeight: 1.25, fontSize: 11.5, whiteSpace: 'pre-line' }}>{q.label}</span>
              </div>
            ))}
          </div></div>
          <div className="lbl">แท่งแดง = เกินอายุใช้งานแล้ว · แท่งส้ม = ครบภายใน 6 เดือน</div>
        </section>
        <section className="card" style={{ flex: '2 1 320px', minWidth: 0, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 className="h3">เรื่องจำหน่ายที่ดำเนินการอยู่</h2>
          {current && (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px 10px' }}><span className="mono" style={{ fontSize: 16, fontWeight: 600 }}>{current.data.id}</span><span className="lbl">{current.data.ids.length} รายการ · {METHODS[current.data.method].label}</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 4 }}>
                {STAGE.map((t, i) => <span key={t} title={t} style={{ display: 'block', height: 8, borderRadius: 4, background: i < step ? '#0d6b66' : (i === step ? '#8fd0c5' : '#e3e9eb') }}></span>)}
              </div>
              <div><div style={{ fontWeight: 600 }}>{step >= 6 ? 'จำหน่ายเสร็จสมบูรณ์' : 'ขั้นที่ ' + (step + 1) + ' จาก 6 · ' + STAGE_LONG[step]}</div><div className="lbl">{step < 6 ? 'กำหนด ' + thd(stageDates[step]!) : ''}</div></div>
              <button className="btn pri" style={{ alignSelf: 'flex-start' }} onClick={() => svc.openDialog()}>เปิดเรื่อง</button>
            </>
          )}
          {!current && <div className="lbl">ยังไม่มีเรื่องที่ดำเนินการ · ติ๊กเลือกรายการในตารางด้านล่าง แล้วกด "สร้างเรื่องขอจำหน่าย"</div>}
          <div className="lbl" style={{ borderTop: '1px solid #edf1f2', paddingTop: 8 }}>เรื่องที่เสร็จแล้ว {done.length} เรื่อง</div>
        </section>
      </div>
      <section className="card" style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 12px', padding: '12px 14px', borderBottom: '1px solid #e3e9eb' }}>
          <h2 className="h3" style={{ marginRight: 'auto' }}>รายการตามกำหนดพิจารณาจำหน่าย</h2>
          <label htmlFor="d-filter" className="lbl">ช่วงเวลา</label>
          <select id="d-filter" className="inp" style={{ width: 'auto', height: 32 }} value={desk.filter} onChange={(e) => svc.setFilter(e.target.value)}>
            {['ทั้งหมด'].concat(BUCKETS).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        {selN > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 12px', padding: '8px 14px', background: '#e8f4f2', borderBottom: '1px solid #cfe5e0', color: '#0b5e57' }}>
            <span style={{ fontWeight: 600 }}>เลือกไว้ {selN} รายการ</span>
            <span className="lbl">ระบบไม่ให้เลือกของที่ถูกยืมหรือมีงานซ่อมค้าง</span>
            <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={() => svc.clearSelection()}>ล้างที่เลือก</button>
            <button className="btn sm pri" disabled={!!current || selN === 0} onClick={() => svc.openDialog()}>สร้างเรื่องขอจำหน่าย</button>
          </div>
        )}
        <table className="t">
          <thead><tr><th style={{ width: 36 }}></th><th></th><th>ครุภัณฑ์</th><th>ได้มา</th><th style={{ minWidth: 180 }}>อายุใช้งานที่ใช้ไป</th><th>กำหนดพิจารณาจำหน่าย</th><th>สถานะ</th></tr></thead>
          <tbody>
            {pageRows.map((a) => {
              const f = infos.get(a.id)!;
              const block = svc.blockReasonOf(a.id);
              const col = f.off! < 0 ? '#c0262d' : (f.off! <= 182 ? '#d97706' : (f.off! <= 365 ? '#ca8a04' : '#0d6b66'));
              const checked = !!desk.sel[a.id] && !block;
              const why = a.status === 'รอจำหน่าย' && current ? 'อยู่ในเรื่อง ' + current.data.id : messageText(block);
              return (
                <tr key={a.id} className={checked ? 'on' : ''}>
                  <td><label htmlFor={'ds-' + a.id} style={{ position: 'absolute', left: -9999 }}>เลือก {a.name}</label><input id={'ds-' + a.id} type="checkbox" checked={checked} disabled={!!current || !!block} onChange={() => svc.toggle(a.id)} style={{ width: 16, height: 16 }} /></td>
                  <td><Icon kind={iconOf(a.cat)} size={28} /></td>
                  <td><div>{a.name}</div><div className="mono" style={{ color: '#56666d' }}>{a.code}</div></td>
                  <td>{thd(f.acq!)}<div className="lbl">อายุ {a.life} ปี</div></td>
                  <td><div style={{ height: 10, borderRadius: 5, background: '#e6ecee', overflow: 'hidden' }}><div style={{ height: '100%', width: f.pct + '%', background: col }}></div></div><div className="lbl">{f.pct}% · {f.remain}</div></td>
                  <td><div>{f.dispText}</div><span className="chip" style={chip(f.bucket)}>{f.bucket}</span></td>
                  <td><span className="chip" style={chip(a.status)}>{a.status}</span><div className="lbl">{why}</div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rowsAll.length === 0 && <div className="lbl" style={{ padding: '20px 16px' }}>ไม่มีรายการในช่วงเวลานี้</div>}
        <nav aria-label="เปลี่ยนหน้ารายการแผนจำหน่าย" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 14px', padding: '10px 12px', borderTop: '1px solid #e3e9eb' }}>
          <span className="lbl" style={{ fontVariantNumeric: 'tabular-nums' }}>แสดง {rowsAll.length ? start + 1 : 0}–{start + pageRows.length} จาก {rowsAll.length} รายการ</span>
          <label htmlFor="dpgsize" className="lbl" style={{ marginLeft: 'auto' }}>ต่อหน้า</label>
          <select id="dpgsize" className="inp" style={{ width: 'auto', height: 32 }} value={desk.pageSize} onChange={(e) => svc.setPageSize(Number(e.target.value))}><option value="10">10</option><option value="20">20</option><option value="50">50</option></select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button className="btn sm pg" disabled={cur === 1} onClick={() => svc.setPage(Math.max(1, cur - 1))} aria-label="หน้าก่อนหน้า">‹</button>
            {Array.from({ length: count }, (_, i) => i + 1).map((n) => <button key={n} className={n === cur ? 'btn sm pg cur' : 'btn sm pg'} aria-current={n === cur ? 'page' : undefined} aria-label={'หน้า ' + n} onClick={() => svc.setPage(n)}>{n}</button>)}
            <button className="btn sm pg" disabled={cur === count} onClick={() => svc.setPage(Math.min(count, cur + 1))} aria-label="หน้าถัดไป">›</button>
          </div>
        </nav>
      </section>
      {done.length > 0 && (
        <section className="card" style={{ overflowX: 'auto' }}>
          <div style={{ padding: '12px 12px 4px' }}><h2 className="h3">ประวัติเรื่องจำหน่าย</h2></div>
          <table className="t">
            <thead><tr><th>เลขเรื่อง</th><th>รายการ</th><th>วิธี</th><th>เงินที่ได้</th><th>ลงจ่าย</th><th>แจ้ง สตง.</th></tr></thead>
            <tbody>
              {done.slice().reverse().map((c) => {
                const m = METHODS[c.data.method];
                return (
                  <tr key={c.data.id}>
                    <td className="mono">{c.data.id}</td>
                    <td>{c.data.ids.map((id) => assets.find((a) => a.id === id)?.name ?? id).join(', ')}</td>
                    <td>{m.label}</td>
                    <td>{m.sale ? baht(c.data.ids.reduce((t, id) => t + (c.data.soldP[id] ?? 0), 0)) : '-'}</td>
                    <td>{thd(c.dates.writeoff)}</td>
                    <td>{c.data.oag}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
      {desk.modal && <CaseDialog disposal={disposal} assets={assets} now={now} stageDates={stageDates} onPrint={onPrint} />}
    </>
  );
}
