import type { FormEvent, KeyboardEvent } from 'react';
import { useEffect } from 'react';
import { iso, th, thd } from '../../../../shared/dates';
import { DomainError } from '../../../../shared/domain-error';
import { baht } from '../../../../shared/money';
import { chip } from '../../../../shared/web/chip';
import { useStore } from '../../../../shared/web/useStore';
import type { Asset } from '../../../registry';
import type { MaintenanceModule } from '../../module';
import { messageText } from './messages';

export interface RepairScreenProps {
  maintenance: MaintenanceModule;
  /** Current assets, read by the app from the registry. */
  assets: Asset[];
  /** Today, from the Clock. */
  now: Date;
  /** Asset to pre-select when the screen is opened from an asset's page. */
  repairAssetId?: string;
}

// Repair screen, ported from mockup lines 995-1049.
export function RepairScreen({ maintenance, assets, now, repairAssetId }: RepairScreenProps) {
  const desk = maintenance.repairs;
  const form = useStore(desk.state);
  const tickets = useStore(maintenance.tickets);

  useEffect(() => {
    if (repairAssetId) desk.setAsset(repairAssetId);
  }, [desk, repairAssetId]);

  const nameOf = (id: string) => assets.find((a) => a.id === id)?.name ?? id;
  const formAsset = assets.find((a) => a.id === form.assetId);
  const noSubmit = !form.symptom.trim();
  const rows = tickets.slice().reverse();

  const sel = tickets.find((t) => t.id === form.selTicket);
  const selAsset = sel ? assets.find((a) => a.id === sel.assetId) : undefined;
  const warranty = selAsset ? iso(selAsset.warranty) : null;
  const inWarranty = !!(warranty && warranty.getTime() >= now.getTime());

  const accept = (route: string) => sel && desk.accept(sel.id, route);
  const close = () => {
    if (!sel) return;
    try {
      desk.close(sel.id);
    } catch (err) {
      if (!(err instanceof DomainError)) throw err;
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    try {
      desk.submit();
    } catch (err) {
      if (!(err instanceof DomainError)) throw err;
    }
  };
  const onRowKey = (e: KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      desk.select(id);
    }
  };

  return (
    <>
      <h1 className="h1">แจ้งซ่อม / ใบงาน</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <form onSubmit={submit} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 className="h3">แจ้งซ่อมใหม่</h2>
            <label htmlFor="rp-asset" className="lbl">ครุภัณฑ์ (สแกนป้ายหรือเลือก)</label>
            <select id="rp-asset" className="inp" value={form.assetId} onChange={(e) => desk.setAsset(e.target.value)}>
              {assets.map((a) => <option key={a.id} value={a.id}>{a.code + ' · ' + a.name}</option>)}
            </select>
            <div className="lbl">สถานะตอนนี้: {formAsset ? formAsset.status : '-'}</div>
            <label htmlFor="rp-sym" className="lbl">อาการ (จำเป็น)</label>
            <textarea id="rp-sym" className="inp" rows={3} placeholder="เช่น หุ่นไม่ส่งสัญญาณเมื่อกดหน้าอกลึกพอ" value={form.symptom} onChange={(e) => desk.setSymptom(e.target.value)}></textarea>
            <label htmlFor="rp-need" className="lbl">ต้องใช้สอนภายใน (จำเป็น)</label>
            <select id="rp-need" className="inp" value={form.need} onChange={(e) => desk.setNeed(e.target.value)}>
              <option value="1">พรุ่งนี้ ({th(now, 1)})</option>
              <option value="3">3 วัน ({th(now, 3)})</option>
              <option value="7">1 สัปดาห์ ({th(now, 7)})</option>
            </select>
            <div className="lbl">แนบรูปได้สูงสุด 3 รูปในระบบจริง</div>
            <button type="submit" className="btn pri" disabled={noSubmit}>ส่งแจ้งซ่อม</button>
          </form>
          <section className="card" style={{ overflowX: 'auto' }}>
            <table className="t">
              <thead><tr><th>ใบงาน</th><th>ครุภัณฑ์</th><th>สถานะ</th></tr></thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} className={t.id === form.selTicket ? 'on rowlink' : 'rowlink'} tabIndex={0} aria-selected={t.id === form.selTicket} onClick={() => desk.select(t.id)} onKeyDown={(e) => onRowKey(e, t.id)}>
                    <td className="mono">{t.id}</td>
                    <td>{nameOf(t.assetId)}</td>
                    <td><span className="chip" style={chip(t.status)}>{t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
        {sel && selAsset && (
          <section className="card" style={{ flex: '2 1 400px', minWidth: 0, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <h2 className="h3 mono" style={{ marginRight: 'auto' }}>{sel.id}</h2>
              <span className="chip" style={chip(sel.status)}>{sel.status}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(110px, 150px) minmax(0, 1fr)', gap: '6px 16px' }}>
              <div className="lbl">ครุภัณฑ์</div><div>{selAsset.name} <span className="mono" style={{ color: '#56666d' }}>{selAsset.code}</span></div>
              <div className="lbl">อาการ</div><div>{sel.symptom}</div>
              <div className="lbl">ผู้แจ้ง</div><div>{sel.reporter} · {thd(sel.createdAt)}</div>
              <div className="lbl">ต้องใช้สอน</div><div>{thd(sel.needDate)}</div>
              <div className="lbl">ประกัน</div>
              <div><span className="chip" style={chip(inWarranty ? 'อยู่ในประกัน' : 'หมดประกัน')}>{inWarranty && warranty ? 'อยู่ในประกันถึง ' + thd(warranty) + ' ควรเคลมผู้ขายก่อนซ่อมเอง' : 'นอกประกัน'}</span></div>
              <div className="lbl">ช่องทางซ่อม</div><div>{sel.route}</div>
            </div>
            {sel.status === 'รอรับงาน' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 8, borderTop: '1px solid #edf1f2' }}>
                {inWarranty && <button className="btn pri" onClick={() => accept('เคลมประกันผู้ขาย')}>รับงาน: เคลมประกันผู้ขาย</button>}
                <button className="btn" onClick={() => accept('ซ่อมภายใน')}>รับงาน: ซ่อมภายใน</button>
                <button className="btn" onClick={() => accept('ส่งซ่อมภายนอก')}>รับงาน: ส่งซ่อมภายนอก</button>
              </div>
            )}
            {sel.status === 'กำลังซ่อม' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8, borderTop: '1px solid #edf1f2' }}>
                <label htmlFor="tk-cost" className="lbl">ค่าใช้จ่าย (บาท)</label>
                <input id="tk-cost" className="inp" style={{ maxWidth: 200 }} inputMode="numeric" placeholder="0" value={sel.cost} onChange={(e) => desk.setCost(sel.id, e.target.value)} />
                <label htmlFor="tk-test" style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 32 }}><input id="tk-test" type="checkbox" checked={sel.tested} onChange={() => desk.toggleTested(sel.id)} /> ทดสอบการใช้งานผ่าน</label>
                <label htmlFor="tk-parts" style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 32 }}><input id="tk-parts" type="checkbox" checked={sel.partsOk} onChange={() => desk.toggleParts(sel.id)} /> ตรวจชิ้นส่วนครบชุด</label>
                <div><button className="btn pri" disabled={!sel.readyToClose} onClick={close}>ปิดงาน ส่งคืนใช้งาน</button></div>
                <div className="lbl">{messageText('TICKET_NOT_READY')}</div>
              </div>
            )}
            {sel.status === 'ปิดงาน' && (
              <div style={{ padding: '10px 12px', borderRadius: 6, background: '#e3f2ee', color: '#0b5e57' }}>ปิดงานแล้ว ครุภัณฑ์กลับเป็น "พร้อมใช้" {sel.costAmount ? '· ค่าใช้จ่าย ' + baht(sel.costAmount) : ''}</div>
            )}
          </section>
        )}
      </div>
    </>
  );
}
