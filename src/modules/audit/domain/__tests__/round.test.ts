import { describe, expect, it } from 'vitest';
import { auditCounts, confirm, newAuditRound, rowState, setResult, sync, toggleOffline } from '../round';

describe('audit round: offline results', () => {
  it('AC31: an offline result is recorded with synced false', () => {
    const r = setResult(toggleOffline(newAuditRound()), 'A1', 'พบ');
    expect(r.res.A1).toEqual({ r: 'พบ', synced: false, confirmed: false });
    expect(rowState(r.res.A1)).toBe('รอซิงก์');
  });

  it('AC31: confirm skips an unsynced result', () => {
    const r = setResult(toggleOffline(newAuditRound()), 'A1', 'พบ');
    const out = confirm(r);
    expect(out.applied).toEqual([]);
    expect(out.round.res.A1!.confirmed).toBe(false);
  });

  it('AC31: after sync, confirm applies the result', () => {
    const r = sync(setResult(toggleOffline(newAuditRound()), 'A1', 'พบ'));
    expect(rowState(r.res.A1)).toBe('รอยืนยัน');
    const out = confirm(r);
    expect(out.applied).toEqual([{ id: 'A1', r: 'พบ' }]);
    expect(out.round.res.A1!.confirmed).toBe(true);
  });

  it('AC31: an online result is synced and counted as pending', () => {
    const r = setResult(newAuditRound(), 'A2', 'ชำรุด');
    expect(r.res.A2!.synced).toBe(true);
    expect(auditCounts(r)).toEqual({ total: 17, scanned: 4, unsynced: 0, pending: 1, done: 3 });
  });

  it('AC31: confirming only the synced rows leaves the offline ones pending sync', () => {
    let r = setResult(newAuditRound(), 'A1', 'พบ');
    r = setResult(toggleOffline(r), 'A2', 'พบ');
    const out = confirm(r);
    expect(out.applied.map((a) => a.id)).toEqual(['A1']);
    expect(out.round.res.A2!.confirmed).toBe(false);
  });
});
