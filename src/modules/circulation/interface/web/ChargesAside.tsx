import { baht } from '../../../../shared/money';

export interface ChargeRow {
  id: string;
  who: string;
  desc: string;
  amount: number;
  receipt: string;
}

export interface ChargesAsideProps {
  rows: ChargeRow[];
  paidN: number;
  onReceipt(chargeId: string, text: string): void;
  onPay(chargeId: string): void;
}

// Charges column, ported from mockup lines 641-664.
export function ChargesAside({ rows, paidN, onReceipt, onPay }: ChargesAsideProps) {
  return (
    <aside className="card" style={{ flex: '1 1 280px', minWidth: 0, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 className="h3">ค่าปรับ / ค่าชดใช้ค้างชำระ</h2>
      <div className="lbl">รับเงินที่งานการเงิน แล้วบันทึกเลขที่ใบเสร็จที่นี่</div>
      {rows.length === 0 ? <div className="lbl" style={{ padding: '8px 0' }}>ยังไม่มีรายการค้างชำระ</div> : null}
      {rows.map((ch) => (
        <div key={ch.id} style={{ borderTop: '1px solid #edf1f2', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
            <div style={{ flex: 1, minWidth: 0, fontWeight: 600 }}>{ch.who}</div>
            <div style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{baht(ch.amount)}</div>
          </div>
          <div className="lbl">{ch.desc}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <label htmlFor={'rc-' + ch.id} style={{ position: 'absolute', left: -9999 }}>เลขที่ใบเสร็จ</label>
            <input id={'rc-' + ch.id} className="inp" style={{ flex: 1, height: 32 }} placeholder="เลขที่ใบเสร็จ" value={ch.receipt} onChange={(e) => onReceipt(ch.id, e.target.value)} />
            <button className="btn sm" disabled={!ch.receipt.trim()} onClick={() => onPay(ch.id)}>บันทึกชำระ</button>
          </div>
        </div>
      ))}
      <div className="lbl" style={{ borderTop: '1px solid #edf1f2', paddingTop: 8 }}>ชำระแล้ววันนี้ {paidN} รายการ</div>
    </aside>
  );
}
