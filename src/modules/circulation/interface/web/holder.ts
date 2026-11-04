import { thd } from '../../../../shared/dates';
import type { Borrower } from '../../domain/borrower';
import type { Loan } from '../../domain/loan';

/** The "ถูกยืมโดย ..." line of the asset detail (mockup line 2376), or null when no loan holds the asset. */
export function holderText(assetId: string, loans: readonly Loan[], borrowers: readonly Borrower[]): string | null {
  const loan = loans.find((l) => l.items.some((i) => i.assetId === assetId && !i.returned));
  if (!loan) return null;
  const who = borrowers.find((b) => b.code === loan.borrowerCode)?.name ?? loan.borrowerCode;
  return 'ถูกยืมโดย ' + who + ' · ใบยืม ' + loan.id + ' · กำหนดคืน ' + thd(loan.due) + (loan.pending ? ' · รออนุมัติ' : '');
}
