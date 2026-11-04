import { describe, expect, it } from 'vitest';
import { addDays } from '../../../../shared/dates';
import { DEFAULT_LOAN_SETTINGS } from '../loan-settings';
import { DomainError } from '../../../../shared/domain-error';
import { Loan, type LoanProps } from '../loan';
import type { ReturnInput } from '../return';

const today = new Date(2026, 9, 28);

function loan(over: Partial<LoanProps> = {}): Loan {
  return Loan.restore({
    id: 'L-1', borrowerCode: '6511010088', start: addDays(today, -10), due: addDays(today, -3), pending: false,
    items: [{ assetId: 'A2', returned: false, note: 'ครบทุกชิ้น', kit: true }], ...over,
  });
}

const parts = [
  { name: 'ตัวหุ่น', qty: 1, price: 0, checked: true },
  { name: 'ถุงลม', qty: 2, price: 100, checked: true },
];

function input(over: Partial<ReturnInput> = {}): ReturnInput {
  return { assetId: 'A2', assetName: 'หุ่น CPR ชุดที่ 2', parts, condition: 'สภาพดี', ...over };
}

function codeOf(fn: () => unknown): string | undefined {
  try { fn(); } catch (e) { if (e instanceof DomainError) return e.code; throw e; }
  return undefined;
}

describe('return of an asset', () => {
  it('AC15: an asset with no open item on the loan throws NO_OPEN_LOAN', () => {
    const returned = loan({ items: [{ assetId: 'A2', returned: true, note: 'ครบทุกชิ้น', kit: true }] });
    expect(codeOf(() => returned.receiveReturn(input(), DEFAULT_LOAN_SETTINGS, today))).toBe('NO_OPEN_LOAN');
    expect(codeOf(() => loan().receiveReturn(input({ assetId: 'A9' }), DEFAULT_LOAN_SETTINGS, today))).toBe('NO_OPEN_LOAN');
  });
});

describe('on-time return', () => {
  it('AC16: on time, complete and in good condition: พร้อมใช้, no charges, and the item is marked returned', () => {
    const onTime = loan({ due: addDays(today, 2) });
    const outcome = onTime.receiveReturn(input(), DEFAULT_LOAN_SETTINGS, today);
    expect(outcome.assetStatus).toBe('พร้อมใช้');
    expect(outcome.charges).toEqual([]);
    expect(outcome.needsRepair).toBe(false);
    expect(outcome.missingText).toBe('ครบทุกชิ้น');
    expect(outcome.lateDays).toBe(0);
    expect(outcome.loan.openItems()).toEqual([]);
    expect(onTime.openItems()).toHaveLength(1);
  });

  it('AC16: returning on the due date is not late', () => {
    expect(loan({ due: today }).receiveReturn(input(), DEFAULT_LOAN_SETTINGS, today).lateDays).toBe(0);
  });
});

describe('late return', () => {
  it('AC17: 3 days late at 5 baht a day creates a fine charge of 15', () => {
    const outcome = loan().receiveReturn(input(), DEFAULT_LOAN_SETTINGS, today);
    expect(outcome.lateDays).toBe(3);
    expect(outcome.charges).toEqual([{ kind: 'fine', desc: 'ค่าปรับคืนช้า 3 วัน · หุ่น CPR ชุดที่ 2', amount: 15 }]);
    expect(outcome.assetStatus).toBe('พร้อมใช้');
  });

  it('AC17: the fine follows the finePerDay setting', () => {
    const outcome = loan().receiveReturn(input(), { ...DEFAULT_LOAN_SETTINGS, finePerDay: 10 }, today);
    expect(outcome.charges.map((c) => c.amount)).toEqual([30]);
  });
});

describe('return with missing parts', () => {
  const missingBags = [parts[0]!, { ...parts[1]!, checked: false }];

  it('AC18: a missing part of qty 2 and price 100 charges round(200 x 1.2) = 240 and the asset becomes ชิ้นส่วนไม่ครบ', () => {
    const outcome = loan({ due: today }).receiveReturn(input({ parts: missingBags }), DEFAULT_LOAN_SETTINGS, today);
    expect(outcome.assetStatus).toBe('ชิ้นส่วนไม่ครบ');
    expect(outcome.missingText).toBe('ขาด ถุงลม × 2');
    expect(outcome.charges).toEqual([{ kind: 'loss', desc: 'ค่าชดใช้: ถุงลม × 2 (ราคา + 20%)', amount: 240 }]);
  });

  it('AC18: lossPct 50 gives 300, and the fine and the loss are both charged when late', () => {
    const outcome = loan().receiveReturn(input({ parts: missingBags }), { ...DEFAULT_LOAN_SETTINGS, lossPct: 50 }, today);
    expect(outcome.charges.map((c) => [c.kind, c.amount])).toEqual([['fine', 15], ['loss', 300]]);
  });

  it('AC18: a missing part priced 0 makes the status ชิ้นส่วนไม่ครบ but charges nothing', () => {
    const outcome = loan({ due: today }).receiveReturn(input({ parts: [{ ...parts[0]!, checked: false }, parts[1]!] }), DEFAULT_LOAN_SETTINGS, today);
    expect(outcome.assetStatus).toBe('ชิ้นส่วนไม่ครบ');
    expect(outcome.charges).toEqual([]);
  });
});

describe('damaged return', () => {
  const missingBags = [parts[0]!, { ...parts[1]!, checked: false }];

  it('AC19: ชำรุด makes the status รอซ่อม and asks for a repair, even when parts are missing', () => {
    const outcome = loan({ due: today }).receiveReturn(input({ condition: 'ชำรุด', parts: missingBags }), DEFAULT_LOAN_SETTINGS, today);
    expect(outcome.assetStatus).toBe('รอซ่อม');
    expect(outcome.needsRepair).toBe(true);
    expect(outcome.charges.map((c) => c.kind)).toEqual(['loss']);
  });

  it('AC19: สภาพดี never asks for a repair', () => {
    expect(loan({ due: today }).receiveReturn(input(), DEFAULT_LOAN_SETTINGS, today).needsRepair).toBe(false);
  });
});
