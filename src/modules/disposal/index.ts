// The only file other contexts and the app may import from disposal.
export { createDisposalModule, type DisposalModule, type DisposalPorts } from './module';
export { DisposalCase, blockReason, type BlockReason, type CaseEffect, type CaseState, type Fault, type HistoryLine } from './domain/case';
export { METHODS, METHOD_KEYS, REASONS, type DisposalMethod, type MethodKey } from './domain/methods';
export { COMPLETION_DAYS, auctionPlan, caseDates, casePlan, type AuctionPlan, type CaseDates, type CasePlan } from './domain/plan';
export { DisposalScreen, type DisposalScreenProps } from './interface/web/DisposalScreen';
export { quarterColumns, type LifeEnd, type QuarterColumn } from './interface/web/quarters';
