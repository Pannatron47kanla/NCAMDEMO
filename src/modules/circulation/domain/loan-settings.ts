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

/** What the settings form holds while it is being edited: digits typed by the user, or the saved numbers. */
export interface SettingsDraft {
  loanDays: string | number;
  maxSets: string | number;
  finePerDay: string | number;
  lossPct: string | number;
  needApproval: boolean;
}

/**
 * The settings to save from a draft (mockup saveSettings, lines 2988-2990). Days, kits and fine need a number above 0,
 * otherwise they go back to the default (7, 2, 5). The loss percent may be 0, otherwise it goes back to 20.
 */
export function normalizeSettings(draft: SettingsDraft): LoanSettings {
  const positive = (v: string | number, fallback: number): number => {
    const x = parseInt(String(v), 10);
    return x > 0 ? x : fallback;
  };
  const pct = parseInt(String(draft.lossPct), 10);
  return {
    loanDays: positive(draft.loanDays, DEFAULT_LOAN_SETTINGS.loanDays),
    maxSets: positive(draft.maxSets, DEFAULT_LOAN_SETTINGS.maxSets),
    finePerDay: positive(draft.finePerDay, DEFAULT_LOAN_SETTINGS.finePerDay),
    lossPct: pct >= 0 ? pct : DEFAULT_LOAN_SETTINGS.lossPct,
    needApproval: !!draft.needApproval,
  };
}
