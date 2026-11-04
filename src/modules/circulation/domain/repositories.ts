import type { Borrower } from './borrower';
import type { Loan } from './loan';

export interface BorrowerRepository {
  list(): Borrower[];
  findByCode(code: string): Borrower | undefined;
}

export interface LoanRepository {
  list(): Loan[];
  findById(id: string): Loan | undefined;
  /** The loan holding this asset (not yet returned), if any. */
  findHolding(assetId: string): Loan | undefined;
  /** The id the next loan will get. */
  nextId(): string;
  add(loan: Loan): void;
  save(loan: Loan): void;
}
