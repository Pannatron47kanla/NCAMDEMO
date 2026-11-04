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

  openItems(): LoanItem[] {
    return this.props.items.filter((i) => !i.returned);
  }
}
