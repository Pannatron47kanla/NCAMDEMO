import { addDays } from '../../../shared/dates';
import { DomainError } from '../../../shared/domain-error';
import type { CartItem, LendableAsset } from './cart';
import type { LoanSettings } from './loan-settings';
import { Loan } from './loan';

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
  assertCanTake(asset: LendableAsset, cart: readonly CartItem[], loans: readonly Loan[], settings: LoanSettings): void {
    if (asset.status !== 'พร้อมใช้') throw new DomainError('ASSET_NOT_AVAILABLE', { name: asset.name, status: asset.status });
    if (this.isStudent && asset.parts.length) {
      const held = this.kitsHeld(loans) + cart.filter((it) => it.parts.length).length;
      if (held >= settings.maxSets) throw new DomainError('KIT_LIMIT_REACHED', { max: settings.maxSets, held });
    }
  }

  /** Hands the cart over as one loan due `loanDays` from today. */
  borrow(cart: readonly CartItem[], settings: LoanSettings, now: Date, loanId: string): Loan {
    return Loan.start({
      id: loanId,
      borrowerCode: this.code,
      items: cart.map((it) => {
        const missing = it.parts.filter((p) => !p.checked).map((p) => p.name);
        return { assetId: it.assetId, returned: false, kit: it.parts.length > 0, note: missing.length ? 'จ่ายไม่ครบ: ไม่มี ' + missing.join(', ') : 'ครบทุกชิ้น' };
      }),
      start: addDays(now, 0),
      due: addDays(now, settings.loanDays),
      pending: settings.needApproval && this.isStudent,
    });
  }
}
