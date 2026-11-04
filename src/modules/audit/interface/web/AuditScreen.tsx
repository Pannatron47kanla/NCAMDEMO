import { Fragment } from 'react';
import { workInfo } from '../../../../shared/working-days';
import { chip } from '../../../../shared/web/chip';
import { Icon } from '../../../../shared/web/Icon';
import { useStore } from '../../../../shared/web/useStore';
import { iconOf, type Asset } from '../../../registry';
import type { AuditModule } from '../../module';
import { AUDIT_OPTIONS, AUDIT_SNAPSHOT, auditCounts, rowState } from '../../domain/round';

export interface AuditScreenProps {
  audit: AuditModule;
  /** Current assets, read by the app from the registry. */
  assets: Asset[];
  /** Today, from the Clock. */
  now: Date;
  /** Opens the audit report document. */
  onPrint(): void;
}

// Annual audit screen, ported from mockup lines 1051-1100.
export function AuditScreen({ audit, assets, now, onPrint }: AuditScreenProps) {
  const round = useStore(audit.round);
  const svc = audit.audit;
  const wi = workInfo(now);
  const c = auditCounts(round);
  const res = round.res;
  const noSync = round.offline || c.unsynced === 0;
  const afterCut = assets.filter((a) => AUDIT_SNAPSHOT.indexOf(a.id) < 0)
    .map((a) => ({ code: a.code, name: a.name, how: a.id.charAt(0) === 'X' ? 'นำเข้า 28 ต.ค. 69' : 'ขึ้นทะเบียน 28 ต.ค. 69' }));

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
        <h1 className="h1" style={{ marginRight: 'auto' }}>ตรวจสอบพัสดุประจำปี 2569</h1>
        <button className="btn pri" onClick={onPrint}>ดูรายงานผลการตรวจสอบ</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <section className="card" style={{ flex: '2 1 380px', minWidth: 0, padding: 16, display: 'grid', gridTemplateColumns: 'minmax(120px, 170px) minmax(0, 1fr)', gap: '6px 16px' }}>
          <div className="lbl">งวดที่ตรวจ</div><div>1 ต.ค. 68 – 30 ก.ย. 69 (ยอด ณ 30 ก.ย. 69)</div>
          <div className="lbl">คำสั่งแต่งตั้ง</div><div>คำสั่งวิทยาลัยฯ ที่ [เลขที่]/2569 ลงวันที่ 15 ก.ย. 69</div>
          <div className="lbl">ผู้ตรวจสอบ</div><div>อ.ดร.สุภาวดี วงศ์ใหญ่ (ประธาน) · นายวีระพงษ์ ทองดี · นางสาวอรุณี แสงจันทร์</div>
          <div className="lbl">เริ่มตรวจ</div><div>1 ต.ค. 69 (วันทำการแรกของปีงบประมาณ)</div>
        </section>
        <section className="card" style={{ flex: '1 1 260px', minWidth: 0, padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="lbl">ครบกำหนดรายงาน (30 วันทำการ)</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{wi.due}</div>
          <div>ใช้ไป {wi.used} วันทำการ · <strong>เหลือ {wi.left} วันทำการ</strong></div>
          <div className="lbl">ข้ามเสาร์-อาทิตย์ และวันหยุด 13, 23 ต.ค.</div>
        </section>
      </div>
      <section className="card" style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: '10px 20px', alignItems: 'center' }}>
        <label htmlFor="offline" style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 36 }}>
          <input id="offline" type="checkbox" checked={round.offline} onChange={() => svc.toggleOffline()} /> โหมดออฟไลน์ (จำลองโน้ตบุ๊กไม่มีสัญญาณ)
        </label>
        <span className="lbl">บันทึกแล้ว {c.scanned} / {c.total} · รอซิงก์ {c.unsynced} · รอยืนยัน {c.pending} · ยืนยันแล้ว {c.done}</span>
        <span style={{ marginLeft: 'auto', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button className="btn" disabled={noSync} onClick={() => svc.sync()}>ซิงก์ {c.unsynced} รายการ</button>
          <button className="btn pri" disabled={c.pending === 0} onClick={() => svc.confirm()}>ยืนยันผล {c.pending} รายการ</button>
        </span>
      </section>
      {round.offline && (
        <div style={{ padding: '10px 12px', borderRadius: 6, background: '#fcefd9', color: '#6b3b00' }}>ออฟไลน์อยู่: ผลถูกเก็บในเครื่อง และจะส่งขึ้นเซิร์ฟเวอร์เมื่อซิงก์ ทะเบียนจะไม่เปลี่ยนจนกว่ากรรมการยืนยันผล</div>
      )}
      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="t">
          <thead><tr><th></th><th>รหัส</th><th>ครุภัณฑ์</th><th>ห้อง</th><th>บันทึกผล</th><th>สถานะผล</th></tr></thead>
          <tbody>
            {AUDIT_SNAPSHOT.map((id) => {
              const a = assets.find((x) => x.id === id);
              if (!a) return null;
              const v = res[id];
              const state = rowState(v);
              const selSt = {
                height: 32, minWidth: 170, width: 'auto', fontSize: 13.5,
                ...(v ? { fontWeight: 600, background: chip(v.r).background, borderColor: 'transparent' } : { color: '#56666d' }),
                ...(v && v.confirmed ? { opacity: 0.8, cursor: 'not-allowed' } : {}),
              };
              return (
                <tr key={id}>
                  <td style={{ width: 32 }}><Icon kind={iconOf(a.cat)} size={26} /></td>
                  <td className="mono">{a.code}</td>
                  <td>{a.name}</td>
                  <td>{a.room}</td>
                  <td>
                    <select className="inp" aria-label={'ผลตรวจนับ ' + a.code + ' ' + a.name} style={selSt} value={v ? v.r : ''} disabled={!!(v && v.confirmed)}
                      onChange={(e) => { if (e.target.value) svc.setResult(id, e.target.value); }}>
                      <option value="">— เลือกผลตรวจนับ —</option>
                      {AUDIT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </td>
                  <td><span className="chip" style={chip(state)}>{v ? v.r + ' · ' + state : state}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <section className="card" style={{ flex: '1 1 320px', minWidth: 0, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 className="h3">พบแต่ไม่มีในทะเบียน</h2>
          {round.unknown.map((u) => <div key={u.code}><span className="mono">{u.code}</span> · {u.note}</div>)}
          <div><button className="btn sm" onClick={() => svc.scanUnknown()}>จำลอง: สแกนป้ายที่ไม่มีในทะเบียน</button></div>
        </section>
        <section className="card" style={{ flex: '1 1 320px', minWidth: 0, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 className="h3">เปลี่ยนแปลงหลังวันตัดยอด (ไม่อยู่ในฐานตรวจนับ)</h2>
          {afterCut.map((u) => <Fragment key={u.code}><div><span className="mono">{u.code}</span> · {u.name} · {u.how}</div></Fragment>)}
          {afterCut.length === 0 && <div className="lbl">ไม่มี (ลองขึ้นทะเบียนใหม่หรือนำเข้าข้อมูลเดิมแล้วกลับมาดู)</div>}
        </section>
      </div>
    </>
  );
}
