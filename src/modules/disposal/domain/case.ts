import { caseDates, casePlan, type CaseDates, type CasePlan } from './plan';
import type { MethodKey } from './methods';

export type Fault = 'none' | 'liable';
/** The asset status a case moves its assets to. */
export type AssetStage = 'รอจำหน่าย' | 'จำหน่ายแล้ว';

/** One line to add to an asset's history. The caller formats the date. */
export interface HistoryLine {
  assetId: string;
  date: Date;
  text: string;
  doc: string;
}

/** What a step of the case does to the assets, for the use case to apply. */
export interface CaseEffect {
  lines: HistoryLine[];
  /** Every asset of the case takes this status. */
  status?: AssetStage;
}

/** What the case needs to know about a selected asset. Declared here so the domain imports no other context. */
export interface Candidate {
  id: string;
  status: string;
  hasOpenTicket: boolean;
}

export type BlockReason = 'BORROWED' | 'OPEN_TICKET' | '';

/** Why an asset cannot join a case (mockup blockReason, line 2051). Empty when it can. */
export function blockReason(a: { status: string; hasOpenTicket: boolean }): BlockReason {
  if (a.status === 'ถูกยืม') return 'BORROWED';
  if (a.hasOpenTicket) return 'OPEN_TICKET';
  return '';
}

export interface CreateCaseInput {
  /** Running number of the case this year. */
  seq: number;
  reason: string;
  today: Date;
  candidates: Candidate[];
  /** Only one case can be open at a time. */
  hasOpenCase: boolean;
}

export interface CaseState {
  id: string;
  ids: string[];
  reason: string;
  /** 1 to 6: the number of finished stages, plus one. */
  step: number;
  fault: Fault;
  method: MethodKey;
  round: number;
  minP: Record<string, number>;
  soldP: Record<string, number>;
  buyer: string;
  receipt: string;
  party: string;
  ref: string;
  announced: boolean;
  oag: string;
  plan: CasePlan;
  closed: boolean;
}

/** เรื่องจำหน่าย: one disposal case across its 6 steps. The only way to change a case. */
export class DisposalCase {
  private constructor(private state: CaseState) {}

  /**
   * Starts a case from the selected assets. Borrowed assets, assets with an open ticket and assets already
   * จำหน่ายแล้ว are left out. Returns undefined when a case is already open or nothing is left.
   */
  static create(input: CreateCaseInput): DisposalCase | undefined {
    if (input.hasOpenCase) return undefined;
    const ids = input.candidates.filter((c) => c.status !== 'จำหน่ายแล้ว' && !blockReason(c)).map((c) => c.id);
    if (!ids.length) return undefined;
    return new DisposalCase({
      id: 'DS-2569-' + String(input.seq).padStart(3, '0'), ids, reason: input.reason, step: 1, fault: 'none', method: 'auction', round: 1,
      minP: {}, soldP: {}, buyer: '', receipt: '', party: '', ref: '', announced: false, oag: '', plan: casePlan(input.today), closed: false,
    });
  }

  static restore(state: CaseState): DisposalCase {
    return new DisposalCase({ ...state, ids: state.ids.slice(), minP: { ...state.minP }, soldP: { ...state.soldP } });
  }

  /** A copy to change, so a step that throws leaves this case as it was. */
  clone(): DisposalCase { return DisposalCase.restore(this.state); }

  get data(): Readonly<CaseState> { return this.state; }
  get dates(): CaseDates { return caseDates(this.state.plan, this.state.method); }

  /** The first step, done when the case is created: assets become รอจำหน่าย and get a history line. */
  opening(): CaseEffect {
    const s = this.state;
    return {
      status: 'รอจำหน่าย',
      lines: s.ids.map((assetId) => ({ assetId, date: s.plan.created, text: 'เสนอจำหน่าย (' + s.reason + ') แต่งตั้งคณะกรรมการสอบหาข้อเท็จจริง', doc: s.id })),
    };
  }
}
