import type { AssetStatus } from '../../registry';
import type { CartPart } from './cart';
import type { Loan } from './loan';

export type ReturnCondition = 'สภาพดี' | 'ชำรุด';

/** What the officer saw when the asset came back. */
export interface ReturnInput {
  assetId: string;
  assetName: string;
  /** Every part of the asset; `checked` is false for a part that did not come back. */
  parts: readonly CartPart[];
  condition: ReturnCondition;
}

/** A charge the return creates. The service gives it an id and the borrower. */
export interface ChargeDraft {
  kind: 'fine' | 'loss';
  desc: string;
  amount: number;
}

export interface ReturnOutcome {
  assetStatus: AssetStatus;
  charges: ChargeDraft[];
  needsRepair: boolean;
  /** `ครบทุกชิ้น`, or `ขาด <part> × <qty>, ...`. */
  missingText: string;
  lateDays: number;
  /** The loan as it is after the item came back. */
  loan: Loan;
}

/** Surcharge-inclusive price of the parts that did not come back, rounded to whole baht. */
export function lossOf(parts: readonly CartPart[], lossPct: number): number {
  const missing = parts.filter((p) => !p.checked);
  return Math.round(missing.reduce((t, p) => t + p.qty * p.price, 0) * (1 + lossPct / 100));
}

/** What a return would cost, shown before the officer confirms. */
export interface ReturnQuote {
  lateDays: number;
  fine: number;
  loss: number;
}
