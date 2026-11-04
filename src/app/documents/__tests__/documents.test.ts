import { describe, expect, it } from 'vitest';
import { fixedClock } from '../../../shared/clock';
import { qr } from '../../../shared/qr';
import { auditReportSummary } from '../../../modules/audit';
import { createAppModules } from '../../modules';
import { auctionDocOf, auditDocOf, dispResultOf, formalOf, labelsOf, printTitle, resultCase, slipOf } from '../documents';

const NOW = new Date(2026, 9, 28);
const fresh = () => createAppModules(fixedClock(NOW));

describe('printable documents', () => {
  it('AC42: labels carry the QR pattern of each asset code, and the title counts them', () => {
    const m = fresh();
    const labels = labelsOf(['A1', 'A2', 'nope'], m.registry.assets.get());
    expect(labels).toHaveLength(2);
    expect(labels[0]!.cells).toEqual(qr(labels[0]!.code));
    expect(labels[0]!.cells).toHaveLength(441);
    expect(labels[0]!.room).toBe(m.registry.catalog.findById('A1')!.room);
    expect(printTitle('labels', labels.length)).toBe('พิมพ์ป้าย QR (2 ป้าย)');
    expect(printTitle('slip', 0)).toBe('พิมพ์ใบยืม');
    expect(printTitle('unknown', 0)).toBe('');
  });

  it('AC42: the loan slip shows the borrower, items, parts and the rule numbers', () => {
    const m = fresh();
    const loan = m.circulation.loans.get()[0]!;
    const slip = slipOf(loan.id, m.circulation.loans.get(), m.circulation.borrowers.get(), m.registry.assets.get(), m.circulation.settings.get())!;
    expect(slip.id).toBe(loan.id);
    expect(slip.fine).toBe(5);
    expect(slip.loss).toBe(20);
    expect(slip.items).toHaveLength(loan.items.length);
    expect(slip.items[0]!.no).toBe(1);
    expect(slip.who).not.toBe('');
    expect(slipOf('L-none', m.circulation.loans.get(), m.circulation.borrowers.get(), m.registry.assets.get(), m.circulation.settings.get())).toBeNull();
  });

  it('AC42: the register, disposal and calibration reports list the right assets', () => {
    const m = fresh();
    const assets = m.registry.assets.get();
    const reg = formalOf('register', assets, NOW)!;
    expect(reg.rows).toHaveLength(assets.length);
    expect(reg.total).toMatch(new RegExp('^รวม ' + assets.length + ' รายการ มูลค่า '));
    expect(reg.rows[0]![5]).toMatchObject({ right: true });
    const calib = formalOf('calib', assets, NOW)!;
    expect(calib.rows).toHaveLength(assets.filter((a) => a.calib).length);
    expect(calib.total).toBeNull();
    const disp = formalOf('disposal', assets, NOW)!;
    expect(disp.outro).toBe('จึงเรียนมาเพื่อโปรดพิจารณา');
    expect(formalOf('slip', assets, NOW)).toBeNull();
  });

  it('AC42: the audit report counts confirmed results and lists the exceptions with unknown finds last', () => {
    const m = fresh();
    m.audit.audit.setResult('A1', 'ไม่พบ');
    m.audit.audit.confirm();
    m.audit.audit.scanUnknown();
    const doc = auditDocOf(auditReportSummary(m.audit.round.get()), m.registry.assets.get());
    expect(doc.summary[0]).toEqual({ label: 'ครุภัณฑ์ในทะเบียน ณ 30 ก.ย. 69', n: 17 });
    expect(doc.summary.find((x) => x.label === 'ไม่พบ (สูญไป)')!.n).toBe(1);
    expect(doc.summary.find((x) => x.label === 'พบแต่ไม่มีในทะเบียน')!.n).toBe(1);
    expect(doc.exceptions.at(-1)).toMatchObject({ name: '(ไม่ทราบรายการ)', r: 'พบแต่ไม่มีในทะเบียน' });
    expect(doc.exceptions[0]!.r).toBe('ไม่พบ');
  });

  it('AC42: the auction notice needs an open case with the auction method, and shows the minimum prices', () => {
    const m = fresh();
    expect(auctionDocOf(m.disposal.current.get(), m.registry.assets.get())).toBeNull();
    m.disposal.disposal.toggle('A4');
    m.disposal.disposal.createCase();
    const doc = auctionDocOf(m.disposal.current.get(), m.registry.assets.get())!;
    expect(doc.n).toBe(doc.items.length);
    expect(doc.n).toBeGreaterThan(0);
    expect(doc.items[0]!.min).toBe('[รอคณะกรรมการประเมิน]');
    expect(doc.place).toBe('คลังเก็บหุ่นและอุปกรณ์ อาคารปฏิบัติการพยาบาล ชั้น 1');
  });

  it('AC42: the result report needs a case at step 5 or a finished case', () => {
    const m = fresh();
    expect(resultCase(null, [])).toBeUndefined();
    expect(dispResultOf(undefined, m.registry.assets.get())).toBeNull();
    m.disposal.disposal.toggle('A4');
    m.disposal.disposal.createCase();
    expect(resultCase(m.disposal.current.get(), [])).toBeUndefined();
  });
});
