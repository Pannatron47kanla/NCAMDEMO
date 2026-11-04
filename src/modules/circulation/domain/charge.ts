export interface ChargeProps {
  id: string;
  borrowerCode: string;
  desc: string;
  amount: number;
  paid: boolean;
  receipt: string;
}

/** ค่าปรับ / ค่าชดใช้: money a borrower owes after a return. */
export class Charge {
  private constructor(private readonly props: ChargeProps) {}

  /** A new charge, not yet paid. */
  static open(input: { id: string; borrowerCode: string; desc: string; amount: number }): Charge {
    return new Charge({ ...input, paid: false, receipt: '' });
  }

  get id(): string { return this.props.id; }
  get borrowerCode(): string { return this.props.borrowerCode; }
  get desc(): string { return this.props.desc; }
  get amount(): number { return this.props.amount; }
  get paid(): boolean { return this.props.paid; }
  get receipt(): string { return this.props.receipt; }
}
