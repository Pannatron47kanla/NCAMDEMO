import { describe, expect, it } from 'vitest';
import { addDays } from '../../../../shared/dates';
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
    expect(codeOf(() => returned.receiveReturn(input()))).toBe('NO_OPEN_LOAN');
    expect(codeOf(() => loan().receiveReturn(input({ assetId: 'A9' })))).toBe('NO_OPEN_LOAN');
  });
});
