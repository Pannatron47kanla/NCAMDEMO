import type { FormEvent } from 'react';
import { useStore } from '../../../../shared/web/useStore';
import type { CirculationModule } from '../../module';

export interface SettingsScreenProps {
  circulation: CirculationModule;
}

// Settings screen, ported from mockup lines 1185-1196.
export function SettingsScreen({ circulation }: SettingsScreenProps) {
  const saved = useStore(circulation.settings);
  const desk = useStore(circulation.settingsDesk.desk);
  const dr = desk.draft ?? saved;
  const service = circulation.settingsDesk;
  const submit = (e: FormEvent) => { e.preventDefault(); service.save(); };
  const num = (id: string, label: string, field: 'loanDays' | 'maxSets' | 'finePerDay' | 'lossPct') => (
    <div className="fld">
      <label htmlFor={id} className="lbl">{label}</label>
      <input id={id} className="inp" inputMode="numeric" value={String(dr[field])} onChange={(e) => service.editNumber(field, e.target.value)} />
    </div>
  );
  return (
    <>
      <h1 className="h1">ตั้งค่ากติกายืม</h1>
      <form onSubmit={submit} className="card" style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px 20px', maxWidth: 760 }}>
        {num('s-days', 'ระยะเวลายืม (วัน)', 'loanDays')}
        {num('s-max', 'ชุดหุ่น/ชุดฝึกสูงสุดต่อนักศึกษา', 'maxSets')}
        {num('s-fine', 'ค่าปรับคืนช้า (บาท/วัน)', 'finePerDay')}
        {num('s-loss', 'ค่าดำเนินการเพิ่มเมื่อของหาย (%)', 'lossPct')}
        <label htmlFor="s-appr" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8, minHeight: 36 }}>
          <input id="s-appr" type="checkbox" checked={dr.needApproval} onChange={(e) => service.setNeedApproval(e.target.checked)} /> นักศึกษาต้องให้อาจารย์อนุมัติก่อนยืม
        </label>
        <div style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
          <button type="submit" className="btn pri">บันทึก</button><span className="lbl">{desk.message}</span>
        </div>
      </form>
      <div className="lbl" style={{ maxWidth: 760 }}>การเปลี่ยนกติกามีผลกับการยืมครั้งถัดไป ไม่กระทบรายการที่บันทึกไปแล้ว ยกเว้นค่าปรับที่คำนวณตอนรับคืน</div>
    </>
  );
}
