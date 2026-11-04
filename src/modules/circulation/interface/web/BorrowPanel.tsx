import { chip } from '../../../../shared/web/chip';
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
}

export interface OverdueRow { id: string; items: string; due: string; late: string }

// Borrow panel, ported from mockup lines 551-605.
export function BorrowPanel({ state, borrower, held, maxSets, overdue }: BorrowPanelProps) {
  if (!borrower) {
    return <div className="card" style={{ padding: 20, color: '#46565c' }}>เริ่มจากสแกนบัตรนักศึกษาหรือบัตรบุคลากร ระบบจะตรวจสิทธิ์ก่อนให้สแกนครุภัณฑ์</div>;
  }
  return (
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
    </section>
  );
}
