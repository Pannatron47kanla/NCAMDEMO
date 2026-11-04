import { describe, expect, it } from 'vitest';
import { normalizeSettings } from '../loan-settings';

const base = { loanDays: '14', maxSets: '3', finePerDay: '10', lossPct: '30', needApproval: true };

describe('settings fallback', () => {
  it('AC43: valid numbers are kept', () => {
    expect(normalizeSettings(base)).toEqual({ loanDays: 14, maxSets: 3, finePerDay: 10, lossPct: 30, needApproval: true });
  });

  it('AC43: empty or zero days, kits and fine fall back to 7, 2 and 5', () => {
    expect(normalizeSettings({ ...base, loanDays: '', maxSets: '0', finePerDay: '0' })).toMatchObject({ loanDays: 7, maxSets: 2, finePerDay: 5 });
  });

  it('AC43: a zero loss percent is kept and an empty one falls back to 20', () => {
    expect(normalizeSettings({ ...base, lossPct: '0' }).lossPct).toBe(0);
    expect(normalizeSettings({ ...base, lossPct: '' }).lossPct).toBe(20);
  });

  it('AC43: numbers from the saved settings pass through and needApproval stays a boolean', () => {
    expect(normalizeSettings({ ...base, loanDays: 5, needApproval: false })).toMatchObject({ loanDays: 5, needApproval: false });
  });
});
