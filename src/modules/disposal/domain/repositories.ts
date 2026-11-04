import type { DisposalCase } from './case';

/** Where the open case and the finished cases are kept. */
export interface DisposalCaseRepository {
  /** The case being worked on, or null. */
  current(): DisposalCase | null;
  /** Running number for the next case. */
  nextSeq(): number;
  /** Stores the open case (a new one, or a changed copy). */
  save(c: DisposalCase): void;
  /** Moves the open case to the finished list and makes the next number available. */
  finish(c: DisposalCase): void;
}
