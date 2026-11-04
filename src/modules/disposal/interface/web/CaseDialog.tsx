import { thd } from '../../../../shared/dates';
import { baht } from '../../../../shared/money';
import { chip } from '../../../../shared/web/chip';
import { Icon } from '../../../../shared/web/Icon';
import { useStore } from '../../../../shared/web/useStore';
import { assetInfo, iconOf, type Asset } from '../../../registry';
import { METHODS, METHOD_KEYS, REASONS, type MethodKey } from '../../domain/methods';
import type { Fault } from '../../domain/case';
import type { DisposalModule } from '../../module';
import { messageText } from './messages';

export interface CaseDialogProps {
  disposal: DisposalModule;
  assets: Asset[];
  /** Today, from the Clock. */
  now: Date;
  /** The planned date of each of the 6 stages. */
  stageDates: Date[];
  onPrint(kind: 'auction' | 'dispResult'): void;
}

const STAGE = ['เสนอจำหน่าย', 'สอบข้อเท็จจริง', 'อนุมัติวิธี', 'ดำเนินการ', 'ลงจ่าย', 'แจ้ง สตง.'];
const STAGE_LONG = ['เสนอจำหน่ายและแต่งตั้งกรรมการ', 'กรรมการสอบหาข้อเท็จจริง', 'เลือกวิธีจำหน่ายและขออนุมัติ', 'ดำเนินการจำหน่าย', 'ลงจ่ายออกจากทะเบียน', 'แจ้ง สตง.'];

// Disposal case dialog, ported from mockup lines 1472-1573 and the `dm` and `cv` view values (lines 2607-2649, 2680-2698).
export function CaseDialog({ disposal, assets, now, stageDates, onPrint }: CaseDialogProps) {
  const svc = disposal.disposal;
  const desk = useStore(svc.desk);
  const current = useStore(disposal.current);

  const asset = (id: string) => assets.find((a) => a.id === id);
  const price = (id: string) => asset(id)?.price ?? 0;
  const step = current ? current.data.step : 0;
  const selIds = svc.eligibleIds();
  const close = () => svc.closeDialog();
  const note = desk.note;
  const isAuction = current?.data.method === 'auction';
  const dates = current ? current.dates : null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15, 30, 36, 0.48)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', boxSizing: 'border-box' }}>
      <div role="dialog" aria-modal="true" aria-labelledby="dm-title" onKeyDown={(e) => { if (e.key === 'Escape') close(); }} style={{ width: '100%', maxWidth: 900, maxHeight: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 12, boxShadow: '0 24px 60px rgba(10, 25, 30, 0.35)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '18px 20px 12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 id="dm-title" style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>{current ? 'เรื่องขอจำหน่าย ' + current.data.id : 'สร้างเรื่องขอจำหน่าย'}</h2>
            <div className="lbl">{current ? 'ทำตามขั้นตอนตามระเบียบฯ หมวด 9 (ร่าง UC-09 รอ flow จริงจากลูกค้า)' : 'ตรวจรายการและเหตุผล แล้วสร้างเรื่องเพื่อเริ่มขั้นตอนจำหน่าย'}</div>
          </div>
          <button type="button" className="btn sm" onClick={close} aria-label="ปิดหน้าต่าง" style={{ width: 32, padding: 0, justifyContent: 'center', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '0 20px 14px', borderBottom: '1px solid #e3e9eb', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span className="lbl">{step >= 6 ? 'จำหน่ายเสร็จสมบูรณ์' : 'ขั้นที่ ' + (step + 1) + ' จาก 6 · ' + STAGE_LONG[step]}</span>
            <span className="lbl" style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>{Math.round(step / 6 * 100)}%</span>
          </div>
          <div role="progressbar" aria-label="ความคืบหน้าเรื่องจำหน่าย" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(step / 6 * 100)} style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 6 }}>
            {STAGE.map((label, i) => {
              const done = i < step;
              const cur = i === step;
              return (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                  <span style={{ display: 'block', height: 6, borderRadius: 3, background: done ? '#0d6b66' : (cur ? '#8fd0c5' : '#e3e9eb') }}></span>
                  <span style={{ display: 'flex', alignItems: 'flex-start', gap: 6, minWidth: 0 }}>
                    <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '50%', fontSize: 11.5, fontWeight: 700, boxSizing: 'border-box', border: '1.5px solid ' + (done || cur ? '#0d6b66' : '#d3dcdf'), background: done ? '#0d6b66' : (cur ? '#fff' : '#eef2f3'), color: done ? '#fff' : (cur ? '#0b5e57' : '#7b8a90') }}>{done ? '✓' : String(i + 1)}</span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 12.5, lineHeight: 1.3, ...(cur ? { color: '#0b5e57', fontWeight: 600 } : (done ? { color: '#2a3a40' } : { color: '#7b8a90' })) }}>{label}</span>
                      <span style={{ display: 'block', fontSize: 11, color: '#7b8a90', lineHeight: 1.3 }}>{(done ? '' : 'กำหนด ') + thd(stageDates[i]!)}</span>
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!current && (
            <>
              <h3 className="h3">ตรวจรายการที่จะเสนอจำหน่าย</h3>
              <div style={{ border: '1px solid #e3e9eb', borderRadius: 8 }}>
                {selIds.map((id) => {
                  const a = asset(id)!;
                  const f = assetInfo(a, now);
                  return (
                    <div key={id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: '1px solid #edf1f2' }}>
                      <Icon kind={iconOf(a.cat)} size={28} />
                      <div style={{ flex: '1 1 200px', minWidth: 0 }}><div>{a.name}</div><div className="lbl"><span className="mono">{a.code}</span> · ราคาซื้อ {baht(a.price)} · {f.dispText}</div></div>
                      <span className="chip" style={chip(f.bucket)}>{f.bucket}</span>
                      <button type="button" className="btn sm" onClick={() => svc.removeFromSelection(id)}>เอาออก</button>
                    </div>
                  );
                })}
              </div>
              <div className="lbl">รวม {selIds.length} รายการ · ราคาซื้อรวม {baht(selIds.reduce((t, id) => t + price(id), 0))}</div>
              <div className="fld">
                <label htmlFor="d-reason" className="lbl">เหตุผลการจำหน่าย</label>
                <select id="d-reason" className="inp" value={desk.reason} onChange={(e) => svc.setReason(e.target.value)}>{REASONS.map((o) => <option key={o} value={o}>{o}</option>)}</select>
              </div>
              <div className="lbl">เมื่อสร้างเรื่อง รายการทั้งหมดจะเปลี่ยนสถานะเป็น "รอจำหน่าย" และยืมไม่ได้จนกว่าเรื่องจะจบ · ระบบแต่งตั้งคณะกรรมการสอบหาข้อเท็จจริงในขั้นถัดไป</div>
            </>
          )}
          {current && (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '6px 12px' }}>
                <span className="mono" style={{ fontSize: 16, fontWeight: 600 }}>{current.data.id}</span>
                <span>{current.data.ids.length} รายการ · {current.data.reason} · ราคาซื้อรวม {baht(current.data.ids.reduce((t, id) => t + price(id), 0))}</span>
                <span className="lbl" style={{ marginLeft: 'auto' }}>วันที่ในขั้นตอนเป็นวันที่จำลองเพื่อสาธิต</span>
              </div>
              {note && <div role="alert" style={{ padding: '8px 12px', borderRadius: 6, background: '#fcefd9', color: '#6b3b00' }}>{messageText(note.code, note.params)}</div>}
              {step === 1 && (
                <>
                  <div style={{ fontWeight: 600 }}>ขั้นที่ 2 · บันทึกผลคณะกรรมการสอบหาข้อเท็จจริง</div>
                  <div className="fld">
                    <label htmlFor="d-fault" className="lbl">ผลการสอบหาข้อเท็จจริง</label>
                    <select id="d-fault" className="inp" value={desk.draft.fault} onChange={(e) => svc.setFault(e.target.value as Fault)}>
                      <option value="none">เสื่อมสภาพจากการใช้งานตามปกติ ไม่มีผู้ต้องรับผิด</option>
                      <option value="liable">มีผู้ต้องรับผิด ต้องชดใช้ก่อน (ทางเลือก A1)</option>
                    </select>
                  </div>
                  {desk.draft.fault === 'liable' && <div className="lbl">ระบบจริงจะสร้างรายการติดตามการชดใช้ (FR-6.2) และพักเรื่องจนชดใช้ครบ ในต้นแบบนี้กดบันทึกเพื่อจำลองว่าชดใช้เรียบร้อยแล้ว</div>}
                  <div><button className="btn pri" onClick={() => svc.recordFact()}>บันทึกผลกรรมการ</button></div>
                </>
              )}
              {step === 2 && (
                <>
                  <div style={{ fontWeight: 600 }}>ขั้นที่ 3 · เลือกวิธีจำหน่ายและขออนุมัติ</div>
                  <div className="fld">
                    <label htmlFor="d-method" className="lbl">วิธีจำหน่าย</label>
                    <select id="d-method" className="inp" value={current.data.method} onChange={(e) => svc.setMethod(e.target.value as MethodKey)}>{METHOD_KEYS.map((k) => <option key={k} value={k}>{METHODS[k].label}</option>)}</select>
                  </div>
                  <div className="lbl">{METHODS[current.data.method].note}</div>
                  <div><button className="btn pri" onClick={() => svc.approve()}>บันทึก: ผู้อำนวยการอนุมัติ</button></div>
                </>
              )}
              {step === 3 && (
                <>
                  <div style={{ fontWeight: 600 }}>ขั้นที่ 4 · ดำเนินการ{METHODS[current.data.method].label}</div>
                  {isAuction && dates && <div className="lbl">ประกาศครั้งที่ {current.data.round} · ปิดประกาศ {thd(dates.ann)} ถึง {thd(dates.viewTo)} · วันขาย {thd(dates.sale)}</div>}
                  {current.data.ids.map((id) => {
                    const a = asset(id);
                    if (!a) return null;
                    return (
                      <div key={id} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end', padding: '8px 0', borderBottom: '1px solid #edf1f2' }}>
                        <Icon kind={iconOf(a.cat)} size={28} />
                        <div style={{ flex: '2 1 180px', minWidth: 0 }}><div>{a.name}</div><div className="lbl">{a.code} · ราคาซื้อ {baht(a.price)}</div></div>
                        {isAuction && (
                          <div className="fld" style={{ flex: '1 1 120px' }}>
                            <label htmlFor={'mn-' + id} className="lbl">ราคาขั้นต่ำ (บาท)</label>
                            <input id={'mn-' + id} className="inp" inputMode="numeric" value={desk.draft.minP[id] ?? ''} onChange={(e) => svc.setMinPrice(id, e.target.value)} disabled={current.data.announced} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {isAuction && !current.data.announced && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <button className="btn pri" onClick={() => svc.announce()}>ปิดประกาศขายทอดตลาด</button>
                      <button className="btn" onClick={() => onPrint('auction')}>ดูร่างประกาศ</button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '12px 20px', borderTop: '1px solid #e3e9eb', background: '#f7f9fa' }}>
          {!current && (
            <>
              <button type="button" className="btn" onClick={close}>ยกเลิก</button>
              <span style={{ marginLeft: 'auto' }}></span>
              <button type="button" className="btn pri" disabled={selIds.length === 0} onClick={() => svc.createCase()}>สร้างเรื่องขอจำหน่าย ({selIds.length} รายการ)</button>
            </>
          )}
          {current && (
            <>
              <span className="lbl">ปิดหน้าต่างได้ตลอด เรื่องจะค้างอยู่ที่ขั้นปัจจุบัน และเปิดต่อได้จากหน้าแผนจำหน่าย</span>
              <span style={{ marginLeft: 'auto' }}></span>
              <button type="button" className="btn" onClick={close}>ปิดหน้าต่าง</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
