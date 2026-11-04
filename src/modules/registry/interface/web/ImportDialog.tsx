import type { KeyboardEvent } from 'react';
import { baht } from '../../../../shared/money';
import { chip } from '../../../../shared/web/chip';
import { useStore } from '../../../../shared/web/useStore';
import { IMPORT_ROWS } from '../../domain/constants';
import type { ImportPreview } from '../../domain/import-register';
import type { RegistryModule } from '../../module';
import { dialogSteps } from './steps';

export interface ImportDialogProps {
  registry: RegistryModule;
  /** Closes the dialog and goes back to the register. */
  onClose(): void;
  /** "ดูรายการที่รอระบุห้อง": the register searched for รอระบุห้อง. */
  onFindPending(): void;
}

const IMP_STEPS = ['เลือกไฟล์', 'ตรวจสอบข้อมูล', 'นำเข้าแล้ว'];

// A verdict's chip uses the colour of its kind: every "ผิด: ..." is ผิด.
const chipKey = (v: string) => (v.indexOf('ผิด') === 0 ? 'ผิด' : v);

// Import dialog, ported from mockup lines 1410-1471 and the `imp` view values (lines 2780-2804).
export function ImportDialog({ registry, onClose, onFindPending }: ImportDialogProps) {
  const importer = registry.importer;
  const s = useStore(importer.state);
  useStore(registry.assets);

  const step = Math.min(3, Math.max(1, s.step));
  const preview: ImportPreview[] = step === 2 ? importer.preview() : [];
  const verdictOf = (row: number) => (step === 2 ? preview.find((p) => p.row === row)?.verdict ?? '' : '');
  const count = (pred: (v: string) => boolean) => preview.filter((p) => pred(p.verdict)).length;
  const okN = count((v) => v === 'ผ่าน');
  const badN = count((v) => v.indexOf('ผิด') === 0);
  const skipN = count((v) => v.indexOf('ข้าม') === 0);
  const steps = dialogSteps(IMP_STEPS, step, step === 3);
  const pct = step === 3 ? 100 : Math.round((step - 1) / 3 * 100);
  const r = s.result;
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15, 30, 36, 0.48)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', boxSizing: 'border-box' }}>
      <div role="dialog" aria-modal="true" aria-labelledby="imp-title" onKeyDown={onKey} style={{ width: '100%', maxWidth: 860, maxHeight: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 12, boxShadow: '0 24px 60px rgba(10, 25, 30, 0.35)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '18px 20px 12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 id="imp-title" style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>นำเข้าทะเบียนเดิมจาก Excel</h2>
            <div className="lbl">ใช้ครั้งแรกตอนย้ายข้อมูลจากทะเบียนเดิม หรือขึ้นทะเบียนของล็อตใหญ่ทีละหลายรายการ</div>
          </div>
          <button type="button" className="btn sm" onClick={onClose} aria-label="ปิดหน้าต่าง" style={{ width: 32, padding: 0, justifyContent: 'center', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '0 20px 14px', borderBottom: '1px solid #e3e9eb', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span className="lbl">{step === 3 ? 'นำเข้าเรียบร้อย' : 'ขั้นที่ ' + step + ' จาก 3 · ' + IMP_STEPS[step - 1]}</span>
            <span className="lbl" style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
          </div>
          <div role="progressbar" aria-label="ความคืบหน้าการนำเข้า" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}>
            {steps.map((p, i) => (
              <button key={p.label} type="button" disabled={!p.canGo} onClick={() => importer.goTo(i + 1)} aria-current={p.current ? 'step' : undefined} style={p.btn}>
                <span style={p.bar}></span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}><span style={p.dot}>{p.mark}</span><span style={p.lbl}>{p.label}</span></span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {step === 1 ? (
            <>
              <div style={{ border: '1.5px dashed #9fb2b8', borderRadius: 10, padding: '22px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center', background: '#f7f9fa' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0d6b66" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M4 14.5V20h16v-5.5"></path></svg>
                <div style={{ fontWeight: 600 }}>ลากไฟล์ Excel มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์</div>
                <div className="lbl">.xlsx หรือ .csv · ต้องใช้คอลัมน์ตามแบบฟอร์มนำเข้า</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '12px 14px', border: '1px solid #cfe5e0', borderRadius: 8, background: '#eef8f5' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0b5e57" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v14H6zM15 3v4h4M9 12l4 5M13 12l-4 5"></path></svg>
                <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>ทะเบียนครุภัณฑ์เดิม_2568.xlsx</div>
                  <div className="lbl">{'ไฟล์ตัวอย่าง · ' + IMPORT_ROWS.length + ' แถว · แผ่นงาน "ครุภัณฑ์"'}</div>
                </div>
                <span className="chip" style={{ background: '#d9f2e3', color: '#0e5a35' }}>เลือกไฟล์แล้ว</span>
              </div>
              <div className="lbl">ยังไม่มีไฟล์? ดาวน์โหลดแบบฟอร์มนำเข้า (รหัส ชื่อ หมวด ราคา วันที่ได้มา ห้อง ผู้ขาย) ได้ในระบบจริง</div>
            </>
          ) : null}
          {step === 2 ? (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <span className="chip" style={{ background: '#d9f2e3', color: '#0e5a35' }}>ผ่าน {okN}</span>
                <span className="chip" style={{ background: '#f4e3ea', color: '#82193a' }}>ผิด {badN}</span>
                <span className="chip" style={{ background: '#eceff0', color: '#3d4b50' }}>มีแล้ว ข้าม {skipN}</span>
              </div>
              <div style={{ overflowX: 'auto', border: '1px solid #e3e9eb', borderRadius: 8 }}>
                <table className="t">
                  <thead><tr><th>แถว</th><th>รหัส</th><th>ชื่อ</th><th>หมวด</th><th>ราคา</th><th>ผลตรวจ</th></tr></thead>
                  <tbody>
                    {IMPORT_ROWS.map((row) => {
                      const v = verdictOf(row.row);
                      return (
                        <tr key={row.row}>
                          <td>{row.row}</td><td className="mono">{row.code}</td><td>{row.name}</td><td>{row.cat}</td>
                          <td>{row.price === null ? '(ว่าง)' : baht(row.price)}</td>
                          <td><span className="chip" style={chip(chipKey(v))}>{v}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="lbl">ระบบนำเข้าเฉพาะแถวที่ผ่าน แถวที่ผิดแก้ในไฟล์แล้วนำเข้าใหม่ได้ ระบบจะข้ามรายการที่มีแล้วโดยไม่สร้างซ้ำ</div>
            </>
          ) : null}
          {step === 3 ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span aria-hidden="true" style={{ display: 'inline-flex', width: 44, height: 44, borderRadius: '50%', background: '#d9f2e3', color: '#0e5a35', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700 }}>✓</span>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#0b5e57' }}>นำเข้าเรียบร้อย</div>
                  <div>{r ? 'นำเข้าสำเร็จ ' + r.ok + ' รายการ · ผิด ' + r.bad + ' แถว · ข้ามรายการที่มีแล้ว ' + r.skip + ' รายการ' : ''}</div>
                </div>
              </div>
              <div className="lbl">รายการที่นำเข้ายังไม่มีห้องและวันที่ได้มา ต้องเติมก่อนจึงขึ้นแผนที่และแผนจำหน่าย ใช้ตัวกรองค้นคำว่า "รอระบุห้อง" ในทะเบียนเพื่อหารายการเหล่านี้</div>
            </>
          ) : null}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '12px 20px', borderTop: '1px solid #e3e9eb', background: '#f7f9fa' }}>
          {step < 3 ? <button type="button" className="btn" onClick={onClose}>ยกเลิก</button> : null}
          <span style={{ marginLeft: 'auto' }}></span>
          {step === 2 ? <button type="button" className="btn" onClick={() => importer.back()}>← ย้อนกลับ</button> : null}
          {step === 1 ? <button type="button" className="btn pri" onClick={() => importer.check()}>ตรวจสอบข้อมูล →</button> : null}
          {step === 2 ? <button type="button" className="btn pri" disabled={okN === 0} onClick={() => importer.run()}>นำเข้า {okN} รายการที่ผ่าน</button> : null}
          {step === 3 ? (
            <>
              <button type="button" className="btn" onClick={onFindPending}>ดูรายการที่รอระบุห้อง</button>
              <button type="button" className="btn pri" onClick={onClose}>เสร็จสิ้น</button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
