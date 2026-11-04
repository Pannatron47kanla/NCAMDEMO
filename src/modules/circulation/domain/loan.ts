import { diffDays } from '../../../shared/dates';
import { DomainError } from '../../../shared/domain-error';
import type { LoanSettings } from './loan-settings';
import type { CartPart } from './cart';
import { lossOf, type ChargeDraft, type ReturnInput, type ReturnOutcome, type ReturnQuote } from './return';

/** One asset on a loan. `kit` is true when the asset has parts, which is what the student limit counts. */
export interface LoanItem {
  assetId: string;
  returned: boolean;
  note: string;
  kit: boolean;
}

export interface LoanProps {
  id: string;
  borrowerCode: string;
  items: LoanItem[];
  start: Date;
  due: Date;
  pending: boolean;
}

/** ใบยืม: one loan with one or more items. Created only through `Borrower.borrow`. */
export class Loan {
  private constructor(private readonly props: LoanProps) {}

  /** For `Borrower.borrow` only. */
  static start(props: LoanProps): Loan {
    return new Loan({ ...props, items: props.items.map((i) => ({ ...i })) });
  }

  /** Loads a loan that already exists (seed). */
  static restore(props: LoanProps): Loan {
    return new Loan({ ...props, items: props.items.map((i) => ({ ...i })) });
  }

  get id(): string { return this.props.id; }
  get borrowerCode(): string { return this.props.borrowerCode; }
  get items(): readonly LoanItem[] { return this.props.items; }
  get startedAt(): Date { return this.props.start; }
  get due(): Date { return this.props.due; }
  get pending(): boolean { return this.props.pending; }

  /** A teacher approved a pending loan. Returns the loan as it is after that. */
  approve(): Loan {
    return new Loan({ ...this.props, pending: false });
  }

  /** Whole days past the due date (0 when on time). */
  lateDays(now: Date): number {
    return Math.max(0, diffDays(this.props.due, now));
  }

  /** The fine and loss charge a return would create. */
  quoteReturn(parts: readonly CartPart[], settings: LoanSettings, now: Date): ReturnQuote {
    const lateDays = this.lateDays(now);
    return { lateDays, fine: lateDays * settings.finePerDay, loss: lossOf(parts, settings.lossPct) };
  }

  /** The asset comes back. Throws `NO_OPEN_LOAN` when this loan has no open item for it. */
  receiveReturn(input: ReturnInput, settings: LoanSettings, now: Date): ReturnOutcome {
    if (!this.props.items.some((i) => i.assetId === input.assetId && !i.returned)) throw new DomainError('NO_OPEN_LOAN', { name: input.assetName });
    const { lateDays, fine, loss } = this.quoteReturn(input.parts, settings, now);
    const charges: ChargeDraft[] = [];
    if (fine > 0) charges.push({ kind: 'fine', desc: 'ค่าปรับคืนช้า ' + lateDays + ' วัน · ' + input.assetName, amount: fine });
    const missing = input.parts.filter((p) => !p.checked);
    const missingText = missing.length ? 'ขาด ' + missing.map((p) => p.name + ' × ' + p.qty).join(', ') : 'ครบทุกชิ้น';
    if (loss > 0) charges.push({ kind: 'loss', desc: 'ค่าชดใช้: ' + missingText.replace('ขาด ', '') + ' (ราคา + ' + settings.lossPct + '%)', amount: loss });
    const loan = new Loan({ ...this.props, items: this.props.items.map((i) => (i.assetId === input.assetId ? { ...i, returned: true } : { ...i })) });
    return { assetStatus: missing.length ? 'ชิ้นส่วนไม่ครบ' : 'พร้อมใช้', charges, needsRepair: false, missingText, lateDays, loan };
  }

  openItems(): LoanItem[] {
    return this.props.items.filter((i) => !i.returned);
  }
}
