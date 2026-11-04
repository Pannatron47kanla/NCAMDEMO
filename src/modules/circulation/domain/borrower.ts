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
}
