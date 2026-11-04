import { describe, expect, it } from 'vitest';
import { addDays } from '../../../../shared/dates';
import { Borrower } from '../borrower';
import { Loan, type LoanProps } from '../loan';

const today = new Date(2026, 9, 28);
const borrower = Borrower.restore({ code: '6511010088', name: 'นางสาวกัญญาณัฐ บุญมา', type: 'นักศึกษา', info: 'ชั้นปีที่ 3' });

function loan(over: Partial<LoanProps> = {}): Loan {
  return Loan.restore({
    id: 'L-1', borrowerCode: '6511010088', start: addDays(today, -10), due: addDays(today, -3), pending: false,
    items: [{ assetId: 'A2', returned: false, note: 'ครบทุกชิ้น', kit: true }], ...over,
  });
}

describe('borrower overdue loans', () => {
  it('AC8: a past-due loan with an item still out counts as overdue', () => {
    expect(borrower.overdueLoans([loan()], today)).toHaveLength(1);
  });

  it('AC8: pending loans, loans not yet due, fully returned loans and other borrowers do not count', () => {
    const returned = [{ assetId: 'A2', returned: true, note: 'ครบทุกชิ้น', kit: true }];
    const loans = [
      loan({ id: 'L-2', pending: true }),
      loan({ id: 'L-3', due: today }),
      loan({ id: 'L-4', items: returned }),
      loan({ id: 'L-5', borrowerCode: 'T0007' }),
    ];
    expect(borrower.overdueLoans(loans, today)).toEqual([]);
  });
});
