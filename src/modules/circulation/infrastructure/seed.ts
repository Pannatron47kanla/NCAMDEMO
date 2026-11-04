import { addDays } from '../../../shared/dates';
import { Borrower } from '../domain/borrower';
import { Loan } from '../domain/loan';

// Ported from the mockup seed (lines 1758-1765).
export function seedBorrowers(): Borrower[] {
  return [
    Borrower.restore({ code: '6611010015', name: 'นางสาวพิมพ์ชนก ศรีสุข', type: 'นักศึกษา', info: 'ชั้นปีที่ 2' }),
    Borrower.restore({ code: '6611010042', name: 'นายธนกร แก้วมณี', type: 'นักศึกษา', info: 'ชั้นปีที่ 2' }),
    Borrower.restore({ code: '6511010088', name: 'นางสาวกัญญาณัฐ บุญมา', type: 'นักศึกษา', info: 'ชั้นปีที่ 3' }),
    Borrower.restore({ code: 'T0007', name: 'อ.ดร.สุภาวดี วงศ์ใหญ่', type: 'อาจารย์', info: 'กลุ่มวิชาการพยาบาลผู้ใหญ่' }),
  ];
}

/** The mockup's offsets (startOff -10, dueOff -3) become real dates from today. */
export function seedLoans(now: Date): Loan[] {
  return [
    Loan.restore({
      id: 'L-2569-0412',
      borrowerCode: '6511010088',
      items: [{ assetId: 'A2', returned: false, note: 'ครบทุกชิ้น', kit: true }],
      start: addDays(now, -10),
      due: addDays(now, -3),
      pending: false,
    }),
  ];
}

export const SEED_LOAN_SEQ = 413;
