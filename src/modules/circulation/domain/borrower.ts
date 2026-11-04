import { DomainError } from '../../../shared/domain-error';
import type { LendableAsset } from './cart';
import type { Loan } from './loan';

export type BorrowerType = 'นักศึกษา' | 'อาจารย์';

export interface BorrowerProps {
  code: string;
  name: string;
  type: BorrowerType;
  info: string;
}

/** ผู้ยืม: a student or teacher who can borrow. Aggregate root of the borrowing side. */
export class Borrower {
  private constructor(private readonly props: BorrowerProps) {}

  static restore(props: BorrowerProps): Borrower {
    return new Borrower({ ...props });
  }

  get code(): string { return this.props.code; }
  get name(): string { return this.props.name; }
  get type(): BorrowerType { return this.props.type; }
  get info(): string { return this.props.info; }
  get isStudent(): boolean { return this.props.type === 'นักศึกษา'; }

  /** Loans past their due date that still have an item out. Pending (unapproved) loans do not count. */
  overdueLoans(loans: readonly Loan[], now: Date): Loan[] {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return loans.filter((l) => l.borrowerCode === this.code && !l.pending && l.due.getTime() < today && l.openItems().length > 0);
  }

  /** Kits (assets with parts) this borrower still holds. */
  kitsHeld(loans: readonly Loan[]): number {
    return loans.filter((l) => l.borrowerCode === this.code).reduce((n, l) => n + l.openItems().filter((i) => i.kit).length, 0);
  }

  /** Throws a DomainError when this borrower may not take the asset now. */
  assertCanTake(asset: LendableAsset): void {
    if (asset.status !== 'พร้อมใช้') throw new DomainError('ASSET_NOT_AVAILABLE', { name: asset.name, status: asset.status });
  }
}
