import { thd } from '../../../../shared/dates';
import { baht } from '../../../../shared/money';
import { chip } from '../../../../shared/web/chip';
import type { ReturnCondition, ReturnQuote } from '../../domain/return';
import type { ReturnDone, ReturnDraft } from '../../application/counter-service';

export interface ReturnPanelProps {
  draft: ReturnDraft | null;
  done: ReturnDone | null;
  /** What the open return shows: asset, loan and borrower. */
  view: { name: string; code: string; loanId: string; who: string; start: Date; due: Date } | null;
  quote: ReturnQuote | null;
  finePerDay: number;
  lossPct: number;
  onTogglePart(index: number): void;
  onCondition(cond: ReturnCondition): void;
  onCancel(): void;
  onConfirm(): void;
}

// Return panel, ported from mockup lines 607-651.
export function ReturnPanel({ draft, done, view, quote, finePerDay, lossPct, onTogglePart, onCondition, onCancel, onConfirm }: ReturnPanelProps) {
  if (!draft && !done) {
    return <div className="card" style={{ padding: 20, color: '#46565c' }}>สแกนป้าย QR ของครุภัณฑ์ที่นำมาคืน ระบบจะค้นใบยืมให้เอง</div>;
  }
  return (
    <>
      {draft && view && quote ? (
        <section className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', alignItems: 'flex-start' }}>
            <div style={{ flex: '1 1 240px', minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 600 }}>{view.name}</div>
              <div className="lbl"><span className="mono">{view.code}</span> · ใบยืม <span className="mono">{view.loanId}</span></div>
              <div className="lbl">ผู้ยืม {view.who} · ยืม {thd(view.start)} · กำหนดคืน {thd(view.due)}</div>
            </div>
            <span className="chip" style={chip(quote.lateDays ? 'ไม่พบ' : 'พร้อมใช้')}>{quote.lateDays ? 'คืนช้า ' + quote.lateDays + ' วัน' : 'คืนตรงเวลา'}</span>
          </div>
          {draft.parts.length > 0 ? (
            <>
              <div className="lbl">ติ๊กชิ้นส่วนที่ได้รับคืน (เอาติ๊กออกถ้าขาด)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '4px 12px' }}>
                {draft.parts.map((p, i) => (
                  <label key={i} htmlFor={'rp' + i} style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 32 }}>
                    <input id={'rp' + i} type="checkbox" checked={p.checked} onChange={() => onTogglePart(i)} /> {p.name + ' × ' + p.qty}
                  </label>
                ))}
              </div>
            </>
          ) : null}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <label htmlFor="ret-cond" className="lbl">สภาพเมื่อรับคืน</label>
            <select id="ret-cond" className="inp" style={{ width: 'auto' }} value={draft.cond} onChange={(e) => onCondition(e.target.value as ReturnCondition)}>
              <option value="สภาพดี">สภาพดี</option>
              <option value="ชำรุด">ชำรุด (ส่งซ่อมอัตโนมัติ)</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, padding: '10px 12px', background: '#f6f8f8', borderRadius: 6 }}>
            <div><div className="lbl">ค่าปรับคืนช้า</div><div style={{ fontWeight: 600 }}>{quote.lateDays ? baht(quote.fine) + ' (' + quote.lateDays + ' วัน × ' + finePerDay + ' บาท)' : 'ไม่มี'}</div></div>
            <div><div className="lbl">ค่าชดใช้ชิ้นส่วนที่ขาด</div><div style={{ fontWeight: 600 }}>{quote.loss ? baht(quote.loss) + ' (ราคาชิ้นส่วน + ' + lossPct + '%)' : 'ไม่มี'}</div></div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn" onClick={onCancel}>ยกเลิก</button>
            <button className="btn pri" onClick={onConfirm}>ยืนยันการรับคืน</button>
          </div>
        </section>
      ) : null}
      {done ? (
        <section className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, borderColor: '#0d6b66' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0b5e57' }}>บันทึกการรับคืนแล้ว</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="t"><tbody>
              <tr><td className="lbl">ครุภัณฑ์</td><td>{done.name}</td></tr>
              <tr><td className="lbl">ผู้ยืม</td><td>{done.who}</td></tr>
              <tr><td className="lbl">ชิ้นส่วน</td><td>{done.missText}</td></tr>
              <tr><td className="lbl">ค่าปรับ</td><td>{done.fine ? baht(done.fine) + ' (ช้า ' + done.lateDays + ' วัน × ' + done.finePerDay + ' บาท)' : 'ไม่มี'}</td></tr>
              <tr><td className="lbl">ค่าชดใช้</td><td>{done.loss ? baht(done.loss) : 'ไม่มี'}</td></tr>
              <tr><td className="lbl">สถานะใหม่</td><td><span className="chip" style={chip(done.status)}>{done.status}</span></td></tr>
            </tbody></table>
          </div>
          <div className="lbl">ค่าปรับและค่าชดใช้ไปรอบันทึกชำระในช่องด้านขวา</div>
        </section>
      ) : null}
    </>
  );
}
