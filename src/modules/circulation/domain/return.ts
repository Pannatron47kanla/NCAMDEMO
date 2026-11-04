import type { AssetStatus } from '../../registry';
import type { CartPart } from './cart';

export type ReturnCondition = 'สภาพดี' | 'ชำรุด';

/** What the officer saw when the asset came back. */
export interface ReturnInput {
  assetId: string;
  assetName: string;
  /** Every part of the asset; `checked` is false for a part that did not come back. */
  parts: readonly CartPart[];
  condition: ReturnCondition;
}

export interface ReturnOutcome {
  assetStatus: AssetStatus;
}
