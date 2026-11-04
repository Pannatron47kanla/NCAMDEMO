import { describe, expect, it } from 'vitest';
import { DomainError } from '../../../../shared/domain-error';
import { auctionPlan, casePlan, caseDates } from '../plan';
import { DisposalCase, type Candidate } from '../case';

const TODAY = new Date(2026, 9, 28);
const ok = (id: string): Candidate => ({ id, status: 'พร้อมใช้', hasOpenTicket: false });

function create(candidates: Candidate[], over: { seq?: number; hasOpenCase?: boolean } = {}) {
  return DisposalCase.create({ seq: over.seq ?? 1, reason: 'ครบอายุใช้งานและเสื่อมสภาพ', today: TODAY, candidates, hasOpenCase: over.hasOpenCase ?? false });
}

describe('creating a case', () => {
  it('AC33: a borrowed asset and an asset with an open ticket are left out; the others join', () => {
    const c = create([ok('A16'), { id: 'A2', status: 'ถูกยืม', hasOpenTicket: false }, { id: 'A4', status: 'รอซ่อม', hasOpenTicket: true }, ok('A17')])!;
    expect(c.data.ids).toEqual(['A16', 'A17']);
  });

  it('AC33: an asset already จำหน่ายแล้ว is left out', () => {
    const c = create([{ id: 'A1', status: 'จำหน่ายแล้ว', hasOpenTicket: false }, ok('A16')])!;
    expect(c.data.ids).toEqual(['A16']);
  });

  it('AC33: the assets of the case become รอจำหน่าย and each gets a history line with the case number', () => {
    const effect = create([ok('A16'), ok('A17')])!.opening();
    expect(effect.status).toBe('รอจำหน่าย');
    expect(effect.lines).toEqual([
      { assetId: 'A16', date: TODAY, text: 'เสนอจำหน่าย (ครบอายุใช้งานและเสื่อมสภาพ) แต่งตั้งคณะกรรมการสอบหาข้อเท็จจริง', doc: 'DS-2569-001' },
      { assetId: 'A17', date: TODAY, text: 'เสนอจำหน่าย (ครบอายุใช้งานและเสื่อมสภาพ) แต่งตั้งคณะกรรมการสอบหาข้อเท็จจริง', doc: 'DS-2569-001' },
    ]);
  });

  it('AC33: the first case is DS-2569-001 and the next number is padded to 3 digits', () => {
    expect(create([ok('A16')])!.data.id).toBe('DS-2569-001');
    expect(create([ok('A16')], { seq: 12 })!.data.id).toBe('DS-2569-012');
  });

  it('AC33: a new case starts at step 1 as an auction in round 1', () => {
    const d = create([ok('A16')])!.data;
    expect([d.step, d.method, d.round, d.fault, d.announced]).toEqual([1, 'auction', 1, 'none', false]);
  });

  it('AC33: a second create while one case is open does nothing', () => {
    expect(create([ok('A16')], { hasOpenCase: true })).toBeUndefined();
  });

  it('AC33: nothing is created when no selected asset can join', () => {
    expect(create([{ id: 'A2', status: 'ถูกยืม', hasOpenTicket: false }])).toBeUndefined();
    expect(create([])).toBeUndefined();
  });
});

const open = () => create([ok('A16'), ok('A17')])!;

describe('recording the finding and approving the method', () => {
  it('AC34: the finding moves the case to step 2 and logs the committee text on the planned fact date', () => {
    const c = open();
    const effect = c.recordFact('none');
    expect(c.data.step).toBe(2);
    expect(effect.lines.map((l) => [l.assetId, l.text, l.doc])).toEqual([
      ['A16', 'กรรมการสอบหาข้อเท็จจริง: เสื่อมสภาพจากการใช้งานตามปกติ ไม่มีผู้ต้องรับผิด', 'DS-2569-001'],
      ['A17', 'กรรมการสอบหาข้อเท็จจริง: เสื่อมสภาพจากการใช้งานตามปกติ ไม่มีผู้ต้องรับผิด', 'DS-2569-001'],
    ]);
    expect(effect.lines[0]!.date).toEqual(c.data.plan.fact);
    expect(open().recordFact('liable').lines[0]!.text).toBe('กรรมการสอบหาข้อเท็จจริง: มีผู้ต้องรับผิด ชดใช้เรียบร้อยแล้ว');
  });

  it('AC34: a direct sale with a total of 500,001 baht throws DIRECT_SALE_LIMIT and changes nothing', () => {
    const c = open();
    c.recordFact('none');
    let error: unknown;
    try { c.approve('direct', 500001); } catch (e) { error = e; }
    expect(error).toBeInstanceOf(DomainError);
    expect((error as DomainError).code).toBe('DIRECT_SALE_LIMIT');
    expect((error as DomainError).params).toEqual({ total: 500001 });
    expect(c.data.step).toBe(2);
  });

  it('AC34: a direct sale with exactly 500,000 baht is approved and moves to step 3', () => {
    const c = open();
    c.recordFact('none');
    const effect = c.approve('direct', 500000);
    expect(c.data.step).toBe(3);
    expect(c.data.method).toBe('direct');
    expect(effect.lines[0]!.text).toBe('ผู้อำนวยการอนุมัติจำหน่ายโดยวิธีขายโดยวิธีเฉพาะเจาะจง');
    expect(effect.lines[0]!.date).toEqual(c.data.plan.approve);
  });

  it('AC34: the limit applies only to a direct sale; an auction above 500,000 baht is approved', () => {
    const c = open();
    c.recordFact('none');
    c.approve('auction', 900000);
    expect(c.data.step).toBe(3);
  });
});

function atStep3(): DisposalCase {
  const c = open();
  c.recordFact('none');
  c.approve('auction', 38400);
  return c;
}

describe('closing the auction notice', () => {
  it('AC35: a missing minimum price throws MIN_PRICE_REQUIRED and changes nothing', () => {
    const c = atStep3();
    let error: unknown;
    try { c.announce({ A16: '5000' }); } catch (e) { error = e; }
    expect((error as DomainError).code).toBe('MIN_PRICE_REQUIRED');
    expect(c.data.announced).toBe(false);
    expect(c.data.minP).toEqual({});
  });

  it('AC35: a zero or empty minimum price throws MIN_PRICE_REQUIRED', () => {
    expect(() => atStep3().announce({ A16: '5000', A17: '0' })).toThrow(expect.objectContaining({ code: 'MIN_PRICE_REQUIRED' }));
    expect(() => atStep3().announce({ A16: '', A17: '5000' })).toThrow(expect.objectContaining({ code: 'MIN_PRICE_REQUIRED' }));
  });

  it('AC35: with all minimum prices the notice is closed, with a history line per asset on the announcement date', () => {
    const c = atStep3();
    const effect = c.announce({ A16: '5000', A17: '12000' });
    expect(c.data.announced).toBe(true);
    expect(c.data.minP).toEqual({ A16: 5000, A17: 12000 });
    expect(effect.lines.map((l) => l.text)).toEqual(['ปิดประกาศขายทอดตลาด ครั้งที่ 1 ราคาขั้นต่ำ 5,000 บาท', 'ปิดประกาศขายทอดตลาด ครั้งที่ 1 ราคาขั้นต่ำ 12,000 บาท']);
    expect(effect.lines[0]!.date).toEqual(c.data.plan.ann);
  });
});

describe('a round with no bid', () => {
  it('AC36: noBid raises the round by 1, opens the notice again and keeps the minimum prices', () => {
    const c = atStep3();
    c.announce({ A16: '5000', A17: '12000' });
    c.noBid();
    expect(c.data.round).toBe(2);
    expect(c.data.announced).toBe(false);
    expect(c.data.minP).toEqual({ A16: 5000, A17: 12000 });
  });

  it('AC36: noBid clears the sale data', () => {
    const c = atStep3();
    c.announce({ A16: '5000', A17: '12000' });
    c.noBid();
    expect([c.data.soldP, c.data.buyer, c.data.receipt]).toEqual([{}, '', '']);
  });

  it('AC36: the next announcement is round 2', () => {
    const c = atStep3();
    c.announce({ A16: '5000', A17: '12000' });
    c.noBid();
    expect(c.announce({ A16: '4000', A17: '9000' }).lines[0]!.text).toBe('ปิดประกาศขายทอดตลาด ครั้งที่ 2 ราคาขั้นต่ำ 4,000 บาท');
  });
});

function announced(): DisposalCase {
  const c = atStep3();
  c.announce({ A16: '5000', A17: '12000' });
  return c;
}

function codeOf(run: () => unknown): string | undefined {
  try { run(); } catch (e) { return (e as DomainError).code; }
  return undefined;
}

const sale = { soldPrices: { A16: '5000', A17: '12000' }, buyer: 'บจ. ผู้ซื้อ', receipt: 'ร.1/2569', party: '', ref: '' };

describe('recording the result', () => {
  it('AC37: an auction price below the minimum throws SALE_PRICE_BELOW_MIN and changes nothing', () => {
    const c = announced();
    expect(codeOf(() => c.recordResult({ ...sale, soldPrices: { A16: '4999', A17: '12000' } }))).toBe('SALE_PRICE_BELOW_MIN');
    expect(c.data.step).toBe(3);
  });

  it('AC37: a missing or zero auction price throws SALE_PRICE_BELOW_MIN', () => {
    expect(codeOf(() => announced().recordResult({ ...sale, soldPrices: { A16: '5000' } }))).toBe('SALE_PRICE_BELOW_MIN');
    expect(codeOf(() => announced().recordResult({ ...sale, soldPrices: { A16: '0', A17: '12000' } }))).toBe('SALE_PRICE_BELOW_MIN');
  });

  it('AC37: a price equal to the minimum is accepted', () => {
    const c = announced();
    c.recordResult(sale);
    expect(c.data.step).toBe(4);
  });

  it('AC37: a missing buyer or a missing receipt throws BUYER_RECEIPT_REQUIRED', () => {
    expect(codeOf(() => announced().recordResult({ ...sale, buyer: '  ' }))).toBe('BUYER_RECEIPT_REQUIRED');
    expect(codeOf(() => announced().recordResult({ ...sale, receipt: '' }))).toBe('BUYER_RECEIPT_REQUIRED');
  });

  it('AC37: a direct sale needs a price for every asset but no minimum, and throws SALE_PRICE_REQUIRED without one', () => {
    const c = open();
    c.recordFact('none');
    c.approve('direct', 38400);
    expect(codeOf(() => c.recordResult({ ...sale, soldPrices: { A16: '1000' } }))).toBe('SALE_PRICE_REQUIRED');
    c.recordResult({ ...sale, soldPrices: { A16: '1000', A17: '2' } });
    expect(c.data.step).toBe(4);
  });

  it('AC37: a sale logs the buyer, the price and the receipt on the date the sale is done', () => {
    const c = announced();
    const effect = c.recordResult(sale);
    expect(effect.lines.map((l) => l.text)).toEqual(['ขายทอดตลาด ให้ บจ. ผู้ซื้อ ราคา 5,000 บาท · ใบเสร็จ ร.1/2569', 'ขายทอดตลาด ให้ บจ. ผู้ซื้อ ราคา 12,000 บาท · ใบเสร็จ ร.1/2569']);
    expect(effect.lines[0]!.date).toEqual(c.data.plan.sale);
    expect(c.data.soldP).toEqual({ A16: 5000, A17: 12000 });
  });

  it('AC37: a method that is not a sale needs a party and a reference, and throws PARTY_REF_REQUIRED with the party label', () => {
    const c = open();
    c.recordFact('none');
    c.approve('transfer', 38400);
    let error: unknown;
    try { c.recordResult({ ...sale, party: 'วิทยาลัยพยาบาล', ref: '' }); } catch (e) { error = e; }
    expect((error as DomainError).code).toBe('PARTY_REF_REQUIRED');
    expect((error as DomainError).params).toEqual({ party: 'หน่วยงานผู้รับโอน' });
    expect(c.data.step).toBe(3);
  });

  it('AC37: a transfer with a party and a reference logs them, dated 5 working days after approval', () => {
    const c = open();
    c.recordFact('none');
    c.approve('transfer', 38400);
    const effect = c.recordResult({ ...sale, party: 'วิทยาลัยพยาบาล', ref: 'หนังสือ 5/2569' });
    expect(c.data.step).toBe(4);
    expect(effect.lines[0]!.text).toBe('โอน: วิทยาลัยพยาบาล · หนังสือ 5/2569');
    expect(effect.lines[0]!.date).toEqual(c.dates.done);
  });
});

describe('the plan dates', () => {
  it('AC38: the plan follows the working-day rules from today (28 ต.ค. 2569)', () => {
    const p = casePlan(TODAY);
    expect(p.created).toEqual(TODAY);
    expect(p.fact).toEqual(new Date(2026, 10, 4));
    expect(p.approve).toEqual(new Date(2026, 10, 9));
    expect(p.ann).toEqual(new Date(2026, 10, 11));
    expect(p.viewTo).toEqual(new Date(2026, 10, 26));
    expect(p.sale).toEqual(new Date(2026, 10, 27));
  });

  it('AC38: the deadline is 60 days after approval', () => {
    const p = casePlan(TODAY);
    expect(p.deadline).toEqual(new Date(2027, 0, 8));
  });

  it('AC38: an auction is done on the sale day and any other method 5 working days after approval', () => {
    const p = casePlan(TODAY);
    expect(caseDates(p, 'auction').done).toEqual(p.sale);
    expect(caseDates(p, 'transfer').done).toEqual(new Date(2026, 10, 16));
  });

  it('AC38: the write-off is the next working day, the notice is due 30 working days later and sent after 5', () => {
    const d = caseDates(casePlan(TODAY), 'auction');
    expect(d.writeoff).toEqual(new Date(2026, 10, 30));
    expect(d.oagDue).toEqual(new Date(2027, 0, 15));
    expect(d.oagSent).toEqual(new Date(2026, 11, 8));
  });

  it('AC38: the older auction plan announces 7 working days on, shows 15 days, sells the next working day and reports after 30', () => {
    const p = auctionPlan(TODAY);
    expect(p.ann).toEqual(new Date(2026, 10, 6));
    expect(p.viewFrom).toEqual(p.ann);
    expect(p.viewTo).toEqual(new Date(2026, 10, 21));
    expect(p.day).toEqual(new Date(2026, 10, 23));
  });
});

function sold(): DisposalCase {
  const c = announced();
  c.recordResult(sale);
  return c;
}

describe('completing the case', () => {
  it('AC38: write-off makes every asset จำหน่ายแล้ว, with a history line on the write-off date', () => {
    const c = sold();
    const effect = c.writeOff();
    expect(c.data.step).toBe(5);
    expect(effect.status).toBe('จำหน่ายแล้ว');
    expect(effect.lines.map((l) => [l.assetId, l.text])).toEqual([['A16', 'ลงจ่ายออกจากทะเบียนครุภัณฑ์ (ข้อ 218)'], ['A17', 'ลงจ่ายออกจากทะเบียนครุภัณฑ์ (ข้อ 218)']]);
    expect(effect.lines[0]!.date).toEqual(c.dates.writeoff);
  });

  it('AC38: a blank letter number throws LETTER_REQUIRED and the case stays at step 5', () => {
    const c = sold();
    c.writeOff();
    expect(codeOf(() => c.notifyAuditor('   '))).toBe('LETTER_REQUIRED');
    expect(c.data.step).toBe(5);
  });

  it('AC38: notifying the State Audit Office logs the trimmed letter number and moves to step 6', () => {
    const c = sold();
    c.writeOff();
    const effect = c.notifyAuditor(' 12/2569 ');
    expect(c.data.step).toBe(6);
    expect(c.data.oag).toBe('12/2569');
    expect(effect.lines[0]!.text).toBe('แจ้งสำนักงานการตรวจเงินแผ่นดิน หนังสือที่ 12/2569');
    expect(effect.lines[0]!.date).toEqual(c.dates.oagSent);
  });

  it('AC38: close marks the case closed', () => {
    const c = sold();
    c.writeOff();
    c.notifyAuditor('12/2569');
    c.close();
    expect(c.data.closed).toBe(true);
  });
});
