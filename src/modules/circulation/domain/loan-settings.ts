/** กติกาการยืม: the numbers the counter uses. Defaults are the mockup's seed values. */
export interface LoanSettings {
  /** Days a loan lasts. */
  loanDays: number;
  /** Maximum kits per student. */
  maxSets: number;
  /** Late fine, baht per day. */
  finePerDay: number;
  /** Loss surcharge, percent. */
  lossPct: number;
  /** Student loans wait for a teacher's approval. */
  needApproval: boolean;
}

export const DEFAULT_LOAN_SETTINGS: LoanSettings = {
  loanDays: 7,
  maxSets: 2,
  finePerDay: 5,
  lossPct: 20,
  needApproval: false,
};
