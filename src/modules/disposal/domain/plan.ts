import { addDays } from '../../../shared/dates';
import { addWorkDays } from '../../../shared/working-days';
import type { MethodKey } from './methods';

/** A case must be finished this many days after the director approves it. */
export const COMPLETION_DAYS = 60;

/** The planned dates of a case, fixed when it is created (mockup casePlan, line 2059). */
export interface CasePlan {
  created: Date;
  fact: Date;
  approve: Date;
  ann: Date;
  viewTo: Date;
  sale: Date;
  deadline: Date;
}

export function casePlan(today: Date): CasePlan {
  const fact = addWorkDays(today, 5);
  const approve = addWorkDays(fact, 3);
  const ann = addWorkDays(approve, 2);
  const viewTo = addDays(ann, 15);
  const sale = addWorkDays(viewTo, 1);
  return { created: new Date(today.getTime()), fact, approve, ann, viewTo, sale, deadline: addDays(approve, COMPLETION_DAYS) };
}

/** The plan plus the dates that depend on the method (mockup caseDates, line 2064). */
export interface CaseDates extends CasePlan {
  done: Date;
  writeoff: Date;
  oagDue: Date;
  oagSent: Date;
}

export function caseDates(plan: CasePlan, method: MethodKey): CaseDates {
  const done = method === 'auction' ? plan.sale : addWorkDays(plan.approve, 5);
  const writeoff = addWorkDays(done, 1);
  return { ...plan, done, writeoff, oagDue: addWorkDays(writeoff, 30), oagSent: addWorkDays(writeoff, 5) };
}

/** The older auction path (mockup auctionPlan, line 2132), read by the auction document. */
export interface AuctionPlan {
  ann: Date;
  viewFrom: Date;
  viewTo: Date;
  day: Date;
  report: Date;
}

export function auctionPlan(today: Date): AuctionPlan {
  const ann = addWorkDays(today, 7);
  const viewTo = addDays(ann, 15);
  const day = addWorkDays(viewTo, 1);
  return { ann, viewFrom: new Date(ann.getTime()), viewTo, day, report: addWorkDays(day, 30) };
}
