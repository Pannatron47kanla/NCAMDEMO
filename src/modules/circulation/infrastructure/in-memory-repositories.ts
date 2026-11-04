import type { Store } from '../../../shared/store';
import type { Borrower } from '../domain/borrower';
import type { Charge } from '../domain/charge';
import type { Loan } from '../domain/loan';
import type { BorrowerRepository, ChargeRepository, LoanRepository } from '../domain/repositories';

export class InMemoryBorrowerRepository implements BorrowerRepository {
  constructor(private readonly borrowers: Store<Borrower[]>) {}
  list(): Borrower[] { return this.borrowers.get().slice(); }
  findByCode(code: string): Borrower | undefined { return this.borrowers.get().find((b) => b.code === code); }
}

/** Loans in a store. Changes replace the list, so screens see them. */
export class InMemoryLoanRepository implements LoanRepository {
  constructor(private readonly loans: Store<Loan[]>, private seq: number) {}
  list(): Loan[] { return this.loans.get().slice(); }
  findById(id: string): Loan | undefined { return this.loans.get().find((l) => l.id === id); }
  findHolding(assetId: string): Loan | undefined {
    return this.loans.get().find((l) => l.items.some((i) => i.assetId === assetId && !i.returned));
  }
  nextId(): string { return 'L-2569-0' + this.seq; }
  add(loan: Loan): void {
    this.seq += 1;
    this.loans.set((list) => list.concat([loan]));
  }
  save(loan: Loan): void {
    this.loans.set((list) => list.map((l) => (l.id === loan.id ? loan : l)));
  }
}

/** Charges in a store (the mockup numbers them CH1, CH2, ...). */
export class InMemoryChargeRepository implements ChargeRepository {
  constructor(private readonly charges: Store<Charge[]>, private seq = 1) {}
  list(): Charge[] { return this.charges.get().slice(); }
  findById(id: string): Charge | undefined { return this.charges.get().find((c) => c.id === id); }
  nextId(): string { return 'CH' + this.seq; }
  add(charge: Charge): void {
    this.seq += 1;
    this.charges.set((list) => list.concat([charge]));
  }
  save(charge: Charge): void {
    this.charges.set((list) => list.map((c) => (c.id === charge.id ? charge : c)));
  }
}
