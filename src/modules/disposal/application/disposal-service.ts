import type { Clock } from '../../../shared/clock';
import { DomainError } from '../../../shared/domain-error';
import { thd } from '../../../shared/dates';
import { createStore, type Store } from '../../../shared/store';
import { blockReason, DisposalCase, type BlockReason, type CaseEffect, type Fault } from '../domain/case';
import { REASONS, type MethodKey } from '../domain/methods';
import type { DisposalCaseRepository } from '../domain/repositories';
import type { AssetsPort, OpenRepairsPort } from './ports';

/** A message to show above the step: a broken rule, or a recorded notice. Interface turns the code into Thai. */
export interface Notice {
  code: string;
  params?: Record<string, string | number>;
}

/** What the officer has typed into the open case's forms and not yet recorded. */
export interface CaseDraft {
  fault: Fault;
  minP: Record<string, string>;
  soldP: Record<string, string>;
  buyer: string;
  receipt: string;
  party: string;
  ref: string;
  oag: string;
}

/** The disposal screen's controls and the forms of the open case. */
export interface DisposalDesk {
  /** Ticked rows of the plan list. */
  sel: Record<string, boolean>;
  reason: string;
  modal: boolean;
  filter: string;
  page: number;
  pageSize: number;
  draft: CaseDraft;
  note: Notice | null;
}

export const BLANK_DRAFT: CaseDraft = { fault: 'none', minP: {}, soldP: {}, buyer: '', receipt: '', party: '', ref: '', oag: '' };

export function initialDesk(): DisposalDesk {
  return { sel: { A16: true, A17: true }, reason: REASONS[0]!, modal: false, filter: 'ทั้งหมด', page: 1, pageSize: 10, draft: { ...BLANK_DRAFT }, note: null };
}

/** The disposal plan screen and the case dialog. It loads the case, calls the domain, saves, and updates the assets. */
export class DisposalService {
  readonly desk: Store<DisposalDesk> = createStore<DisposalDesk>(initialDesk());

  constructor(
    private readonly clock: Clock,
    private readonly cases: DisposalCaseRepository,
    private readonly assets: AssetsPort,
    private readonly repairs: OpenRepairsPort,
  ) {}

  private patch(p: Partial<DisposalDesk>): void { this.desk.set((d) => ({ ...d, ...p })); }

  toggle(id: string): void { this.desk.set((d) => ({ ...d, sel: { ...d.sel, [id]: !d.sel[id] } })); }
  clearSelection(): void { this.patch({ sel: {} }); }
  removeFromSelection(id: string): void {
    this.desk.set((d) => {
      const sel = { ...d.sel };
      delete sel[id];
      return { ...d, sel };
    });
  }
  setReason(reason: string): void { this.patch({ reason }); }
  openDialog(): void { this.patch({ modal: true }); }
  closeDialog(): void { this.patch({ modal: false }); }
  setFilter(filter: string): void { this.patch({ filter, page: 1 }); }
  setPage(page: number): void { this.patch({ page }); }
  setPageSize(pageSize: number): void { this.patch({ pageSize: pageSize || 10, page: 1 }); }

  /** Why this asset cannot join a case; empty when it can. */
  blockReasonOf(assetId: string): BlockReason {
    const a = this.assets.findById(assetId);
    return a ? blockReason({ status: a.status, hasOpenTicket: this.repairs.hasOpenTicket(a.id) }) : '';
  }

  /** The ticked assets that can still join a case. */
  eligibleIds(): string[] {
    const sel = this.desk.get().sel;
    return Object.keys(sel).filter((k) => {
      const a = sel[k] ? this.assets.findById(k) : undefined;
      return !!a && a.status !== 'จำหน่ายแล้ว' && !this.blockReasonOf(k);
    });
  }

  private apply(effect: CaseEffect, ids: string[]): void {
    ids.forEach((id) => {
      if (effect.status) this.assets.setStatus(id, effect.status);
    });
    effect.lines.forEach((l) => this.assets.addEvent(l.assetId, { date: thd(l.date), text: l.text, doc: l.doc }));
  }

  /** Starts a case from the ticked assets. Does nothing when a case is open or nothing can join. */
  createCase(): void {
    const d = this.desk.get();
    const candidates = Object.keys(d.sel).filter((k) => d.sel[k]).flatMap((k) => {
      const a = this.assets.findById(k);
      return a ? [{ id: a.id, status: a.status, hasOpenTicket: this.repairs.hasOpenTicket(a.id) }] : [];
    });
    const made = DisposalCase.create({ seq: this.cases.nextSeq(), reason: d.reason, today: this.clock.now(), candidates, hasOpenCase: !!this.cases.current() });
    if (!made) return;
    this.apply(made.opening(), made.data.ids);
    this.cases.save(made);
    this.patch({ draft: { ...BLANK_DRAFT }, note: null });
  }

  private edit(p: Partial<CaseDraft>): void { this.desk.set((d) => ({ ...d, draft: { ...d.draft, ...p }, note: null })); }

  setFault(fault: Fault): void { this.edit({ fault }); }

  /**
   * Loads the open case, runs one step on a copy, applies what it does to the assets and saves it.
   * A broken rule is kept as the note above the step; the case and the assets are left as they were.
   */
  private step(run: (c: DisposalCase) => CaseEffect | void): boolean {
    const open = this.cases.current();
    if (!open) return false;
    const next = open.clone();
    try {
      const effect = run(next);
      if (effect) this.apply(effect, next.data.ids);
    } catch (e) {
      if (!(e instanceof DomainError)) throw e;
      this.patch({ note: { code: e.code, params: e.params } });
      return false;
    }
    this.cases.save(next);
    this.patch({ note: null });
    return true;
  }

  /** The method picked on the form. */
  setMethod(method: MethodKey): void { this.step((c) => c.chooseMethod(method)); }

  recordFact(): void { this.step((c) => c.recordFact(this.desk.get().draft.fault)); }

  approve(): void {
    this.step((c) => c.approve(c.data.method, c.data.ids.reduce((t, id) => t + (this.assets.findById(id)?.price ?? 0), 0)));
  }
}
