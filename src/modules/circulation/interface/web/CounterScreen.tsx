import type { CSSProperties, FormEvent, ReactNode } from 'react';
import { diffDays, thd } from '../../../../shared/dates';
import { DomainError } from '../../../../shared/domain-error';
import { useStore } from '../../../../shared/web/useStore';
import type { Asset } from '../../../registry';
import type { CirculationModule } from '../../module';
import { BorrowPanel } from './BorrowPanel';
import { messageText } from './messages';
import { counterProgress } from './progress';

export interface CounterScreenProps {
  circulation: CirculationModule;
  /** Current assets, read by the app from the registry. */
  assets: Asset[];
  /** Today, from the Clock. */
  now: Date;
  /** Opens the loan slip for printing. */
  onPrintSlip(loanId: string): void;
  /** The return side of the counter (shown in return mode). A plain hint is shown until it is given. */
  returnPanel?: ReactNode;
  /** The charges column to the right of the counter. */
  aside?: ReactNode;
}

const MSG_COLORS = {
  ok: { background: '#e3f2ee', color: '#0b5e57' },
  err: { background: '#fbeef2', color: '#6e1531' },
  warn: { background: '#fcefd9', color: '#6b3b00' },
} as const;

const SAMPLE_ASSETS = ['A1', 'A7', 'A3', 'A10', 'A5', 'A4', 'A2'];

function modeStyle(on: boolean): CSSProperties {
  return {
    height: 36, padding: '0 18px', border: 0, font: 'inherit', fontSize: 14, cursor: 'pointer',
    ...(on ? { background: '#0d6b66', color: '#fff', fontWeight: 600 } : { background: '#fff', color: '#15232a' }),
  };
}

interface Chip { code: string; sub: string }

// Counter screen, ported from mockup lines 510-549 (shared frame) and 551-605 (borrow panel).
export function CounterScreen({ circulation, assets, now, returnPanel, aside }: CounterScreenProps) {
  const counter = circulation.counter;
  const c = useStore(counter.state);
  const borrowers = useStore(circulation.borrowers);
  const isBorrow = c.mode === 'borrow';
  const loans = useStore(circulation.loans);
  const settings = useStore(circulation.settings);
  const borrower = c.borrowerCode ? borrowers.find((b) => b.code === c.borrowerCode) : undefined;

  let chips: Chip[] = [];
  if (isBorrow && !c.borrowerCode) chips = borrowers.map((b) => ({ code: b.code, sub: b.name }));
  else if (isBorrow && !c.blocked) {
    chips = SAMPLE_ASSETS.flatMap((id) => {
      const a = assets.find((x) => x.id === id);
      return a ? [{ code: a.code, sub: a.name.replace(/ \(.*\)/, '') + ' · ' + a.status }] : [];
    });
  }

  const nameOf = (id: string) => assets.find((a) => a.id === id)?.name ?? id;
  const overdue = borrower && c.blocked
    ? borrower.overdueLoans(loans, now).map((l) => ({
      id: l.id, items: l.openItems().map((i) => nameOf(i.assetId)).join(', '), due: thd(l.due), late: diffDays(l.due, now) + ' วัน',
    }))
    : [];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    scan(c.scan);
  };
  // A refused scan has already left its message in the counter state, so the error needs no handling here.
  const scan = (text: string) => {
    try {
      counter.scan(text);
    } catch (err) {
      if (!(err instanceof DomainError)) throw err;
    }
  };

  const progress = counterProgress({
    mode: c.mode,
    borrowerOk: !!borrower && !c.blocked,
    blocked: c.blocked,
    cartCount: c.cart.length,
    partsOk: c.cart.length > 0 && c.cart.every((it) => it.parts.every((p) => p.checked)),
    loanDone: false,
    returnChosen: false,
    returnDone: false,
  });

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        <h1 className="h1">เคาน์เตอร์ยืม-คืน</h1>
        <div style={{ display: 'flex', border: '1px solid #b8c5c9', borderRadius: 8, overflow: 'hidden' }}>
          <button style={modeStyle(isBorrow)} onClick={() => counter.setMode('borrow')}>ยืม</button>
          <button style={modeStyle(!isBorrow)} onClick={() => counter.setMode('return')}>รับคืน</button>
        </div>
        <span className="lbl">ห้องปฏิบัติการพยาบาล 1 · เครื่องสแกน USB เชื่อมต่อแล้ว</span>
      </div>
      <section className="card" aria-label="ความคืบหน้าการทำรายการ" style={{ padding: '12px 16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px 10px' }}>
          <span style={{ fontWeight: 600 }}>{progress.title}</span>
          <span className="lbl">{progress.now}</span>
          <span className="lbl" style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>{progress.pct}%</span>
        </div>
        <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.pct} aria-label={progress.title} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '6px 8px' }}>
          {progress.steps.map((p) => (
            <div key={p.label} style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
              <div style={p.bar}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}><span style={p.dot}>{p.mark}</span><span style={p.lbl}>{p.label}</span></div>
            </div>
          ))}
        </div>
      </section>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ flex: '2 1 460px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <section className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <form onSubmit={submit} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 260px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label htmlFor="scan" className="lbl">
                  {isBorrow ? (c.borrowerCode ? 'สแกนป้าย QR ครุภัณฑ์' : 'สแกนบัตรผู้ยืม (รหัสนักศึกษา / บุคลากร)') : 'สแกนป้าย QR ครุภัณฑ์ที่นำมาคืน'}
                </label>
                <input id="scan" className="inp" style={{ height: 42, fontSize: 16 }} placeholder="ยิงเครื่องสแกน หรือพิมพ์รหัสแล้วกด Enter" value={c.scan} onChange={(e) => counter.setScan(e.target.value)} />
              </div>
              <button type="submit" className="btn pri" style={{ height: 42 }}>สแกน</button>
            </form>
            {chips.length > 0 ? (
              <>
                <div className="lbl">จำลองการสแกน (คลิกแทนการยิงเครื่องสแกน)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {chips.map((ch) => (
                    <button key={ch.code} className="btn sm" onClick={() => scan(ch.code)}><span className="mono">{ch.code}</span> <span style={{ color: '#56666d' }}>{ch.sub}</span></button>
                  ))}
                </div>
              </>
            ) : null}
            {c.msg ? <div role="status" style={{ padding: '10px 12px', borderRadius: 6, fontWeight: 500, ...MSG_COLORS[c.msg.kind] }}>{messageText(c.msg.code, c.msg.params)}</div> : null}
          </section>
          {isBorrow
            ? <>
              <BorrowPanel state={c} borrower={borrower} held={borrower ? borrower.kitsHeld(loans) : 0} maxSets={settings.maxSets} overdue={overdue} />
              {c.blocked ? <div><button className="btn" onClick={() => counter.reset()}>รายการใหม่ (สแกนผู้ยืมคนถัดไป)</button></div> : null}
            </>
            : (returnPanel ?? <div className="card" style={{ padding: 20, color: '#46565c' }}>สแกนป้าย QR ของครุภัณฑ์ที่นำมาคืน ระบบจะค้นใบยืมให้เอง</div>)}
        </div>
        {aside}
      </div>
    </>
  );
}
