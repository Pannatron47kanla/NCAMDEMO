import type { FormEvent, KeyboardEvent } from 'react';
import { useEffect } from 'react';
import { th } from '../../../../shared/dates';
import { DomainError } from '../../../../shared/domain-error';
import { chip } from '../../../../shared/web/chip';
import { useStore } from '../../../../shared/web/useStore';
import type { Asset } from '../../../registry';
import type { MaintenanceModule } from '../../module';

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
      </div>
    </>
  );
}
