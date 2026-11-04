import { thd } from '../../../../shared/dates';
import { Icon } from '../../../../shared/web/Icon';
import { chip } from '../../../../shared/web/chip';
import { iconOf, type Asset } from '../../../registry';
import type { Borrower } from '../../domain/borrower';
import type { CounterState } from '../../application/counter-service';

export interface BorrowPanelProps {
  state: CounterState;
  borrower: Borrower | undefined;
  /** Kits the borrower holds now, and the student limit. */
  held: number;
  maxSets: number;
  /** One line per overdue loan (only filled when the borrower is blocked). */
  overdue: OverdueRow[];
  /** Current assets, to show the cart items. */
  assets: Asset[];
  /** Settings that the footer shows. */
  loanDays: number;
  needApproval: boolean;
  /** The due date of a loan confirmed today. */
  dueDate: Date;
  onRemove(assetId: string): void;
  onTogglePart(assetId: string, partIndex: number): void;
  onConfirm(): void;
  /** Clears the borrower and cart. */
  onReset(): void;
  onPrintSlip(loanId: string): void;
}

export interface OverdueRow { id: string; items: string; due: string; late: string }

// Borrow panel, ported from mockup lines 551-605.
export function BorrowPanel({ state, borrower, held, maxSets, overdue, assets, loanDays, needApproval, dueDate, onRemove, onTogglePart, onConfirm, onReset, onPrintSlip }: BorrowPanelProps) {
  if (!borrower) {
    return <div className="card" style={{ padding: 20, color: '#46565c' }}>เริ่มจากสแกนบัตรนักศึกษาหรือบัตรบุคลากร ระบบจะตรวจสิทธิ์ก่อนให้สแกนครุภัณฑ์</div>;
  }
  return (
    <>
    <section className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 12px' }}>
          <div style={{ flex: '1 1 200px', minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 600 }}>{borrower.name}</div>
            <div className="lbl"><span className="mono">{borrower.code}</span>{` · ${borrower.type} · ${borrower.info}`}</div>
          </div>
          <span className="chip" style={chip(state.blocked ? 'ไม่พบ' : 'พร้อมใช้')}>{state.blocked ? 'งดยืม' : 'ยืมได้'}</span>
        </div>
        <div className="lbl">{`ถือชุดหุ่น/ชุดฝึกอยู่ ${held} ชุด · สูงสุด ${maxSets} ชุดต่อนักศึกษา`}</div>
        {state.blocked ? (
          <div style={{ padding: '10px 12px', borderRadius: 6, background: '#fbeef2', color: '#6e1531' }}>
            {overdue.map((o) => <div key={o.id}>{`ค้างคืน ${o.items} · กำหนดคืน ${o.due} · ช้า ${o.late}`}</div>)}
          </div>
        ) : null}
      </div>
      {!state.blocked && !state.done && state.cart.length === 0 ? (
        <div style={{ borderTop: '1px solid #edf1f2', paddingTop: 12, color: '#46565c' }}>ยังไม่มีรายการ สแกนป้าย QR ครุภัณฑ์เพื่อเพิ่มลงรายการที่จะจ่าย</div>
      ) : null}
      {state.cart.length > 0 ? (
        <div style={{ borderTop: '1px solid #edf1f2', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 className="h3">รายการที่จะจ่าย</h2>
            <span className="chip" style={{ background: '#e3f2ee', color: '#0b5e57' }}>{state.cart.length} รายการ</span>
          </div>
          {state.cart.map((it, idx) => {
            const a = assets.find((x) => x.id === it.assetId);
            if (!a) return null;
            return (
              <div key={it.assetId} style={{ border: '1px solid #e3e9eb', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                  <Icon kind={iconOf(a.cat)} size={32} />
                  <div style={{ flex: '1 1 200px', minWidth: 0 }}><div style={{ fontWeight: 600 }}>{a.name}</div><div className="mono" style={{ color: '#56666d' }}>{a.code}</div></div>
                  <button className="btn sm" onClick={() => onRemove(it.assetId)}>เอาออก</button>
                </div>
                {it.parts.length > 0 ? (
                  <>
                    <div className="lbl">ตรวจชิ้นส่วนก่อนจ่าย</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '4px 12px' }}>
                      {it.parts.map((p, pi) => (
                        <label key={pi} htmlFor={`cp${idx}-${pi}`} style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 32 }}>
                          <input id={`cp${idx}-${pi}`} type="checkbox" checked={p.checked} onChange={() => onTogglePart(it.assetId, pi)} /> {`${p.name} × ${p.qty}`}
                        </label>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            );
          })}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, paddingTop: 12, borderTop: '1px solid #edf1f2' }}>
            <div style={{ flex: '1 1 220px', minWidth: 0 }}>
              <div>กำหนดคืน <strong>{thd(dueDate)}</strong></div>
              <div className="lbl">{`ตามกติกา ยืมได้ ${loanDays} วัน`}</div>
              {needApproval ? <div className="lbl" style={{ color: '#5b2d9e' }}>นักศึกษาต้องรออาจารย์อนุมัติก่อนรับของ</div> : null}
            </div>
            <button className="btn" onClick={onReset}>ล้างรายการ</button>
            <button className="btn pri" disabled={state.blocked || state.cart.length === 0} onClick={onConfirm}>ยืนยันการยืม</button>
          </div>
        </div>
      ) : null}
    </section>
    {state.blocked ? <div><button className="btn" onClick={onReset}>รายการใหม่ (สแกนผู้ยืมคนถัดไป)</button></div> : null}
    {state.done ? (
      <section className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10, borderColor: '#0d6b66' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#0b5e57' }}>{state.done.pending ? 'ส่งคำขอยืมแล้ว รออาจารย์อนุมัติ' : 'บันทึกการยืมแล้ว'}</div>
        <div>เลขที่ใบยืม <span className="mono">{state.done.loanId}</span> {`· ${state.done.count} รายการ · กำหนดคืน ${thd(state.done.due)}`}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button className="btn pri" onClick={() => onPrintSlip(state.done!.loanId)}>พิมพ์ใบยืม</button>
          <button className="btn" onClick={onReset}>รายการใหม่</button>
        </div>
      </section>
    ) : null}
    </>
  );
}
