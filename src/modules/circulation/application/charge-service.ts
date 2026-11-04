import { createStore, type Store } from '../../../shared/store';
import type { ChargeRepository } from '../domain/repositories';

export interface CashierState {
  /** What the officer has typed in each charge's receipt box, as typed. */
  receipts: Record<string, string>;
  /** Charges paid since the page opened. */
  paidN: number;
}

/** The charges column: the officer records the receipt number after the borrower pays at finance. */
export class ChargeService {
  readonly state: Store<CashierState> = createStore<CashierState>({ receipts: {}, paidN: 0 });

  constructor(private readonly charges: ChargeRepository) {}

  setReceipt(chargeId: string, text: string): void {
    this.state.set((s) => ({ ...s, receipts: { ...s.receipts, [chargeId]: text } }));
  }

  /** Marks the charge paid with the typed receipt. Throws RECEIPT_REQUIRED when the box is empty. */
  pay(chargeId: string): void {
    const charge = this.charges.findById(chargeId);
    if (!charge || charge.paid) return;
    this.charges.save(charge.pay(this.state.get().receipts[chargeId] ?? ''));
    this.state.set((s) => ({ ...s, paidN: s.paidN + 1 }));
  }
}
