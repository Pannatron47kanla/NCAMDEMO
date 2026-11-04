import type { Store } from '../../../shared/store';
import type { DisposalCase } from '../domain/case';
import type { DisposalCaseRepository } from '../domain/repositories';

export class InMemoryCaseRepository implements DisposalCaseRepository {
  private seq = 1;

  constructor(private readonly open: Store<DisposalCase | null>, private readonly done: Store<DisposalCase[]>) {}

  current(): DisposalCase | null { return this.open.get(); }
  nextSeq(): number { return this.seq; }
  save(c: DisposalCase): void { this.open.set(c); }
  finish(c: DisposalCase): void {
    this.done.set((list) => list.concat([c]));
    this.open.set(null);
    this.seq += 1;
  }
}
