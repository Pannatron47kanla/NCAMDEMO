import { describe, expect, it } from 'vitest';
import { addDays } from '../../../../shared/dates';
import { DomainError } from '../../../../shared/domain-error';
import { Loan } from '../../domain/loan';
import { setup } from './helpers';

describe('counter scan box', () => {
  it('AC6: an empty or blank scan shows the warning EMPTY_SCAN and changes nothing else', () => {
    const { counter, state } = setup();
    counter.scan('');
    expect(state().msg).toEqual({ kind: 'warn', code: 'EMPTY_SCAN' });
    counter.scan('   ');
    expect(state().msg).toEqual({ kind: 'warn', code: 'EMPTY_SCAN' });
    expect(state().borrowerCode).toBe('');
  });

  it('AC6: a code with spaces around it finds the borrower as if trimmed', () => {
    const { counter, state } = setup();
    counter.scan(' T0007 ');
    expect(state().borrowerCode).toBe('T0007');
    expect(state().blocked).toBe(false);
    expect(state().msg).toEqual({ kind: 'ok', code: 'BORROWER_OK' });
  });
});

describe('counter borrower check', () => {
  it('AC7: an unknown borrower code throws BORROWER_NOT_FOUND with the code and leaves the message in state', () => {
    const { counter, state } = setup();
    let error: unknown;
    try { counter.scan('9999999999'); } catch (e) { error = e; }
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({ code: 'BORROWER_NOT_FOUND', params: { code: '9999999999' } });
    expect(state().msg).toEqual({ kind: 'err', code: 'BORROWER_NOT_FOUND', params: { code: '9999999999' } });
    expect(state().scan).toBe('');
    expect(state().borrowerCode).toBe('');
  });
});

function refusal(run: () => void): DomainError {
  try { run(); } catch (e) { if (e instanceof DomainError) return e; throw e; }
  throw new Error('expected a DomainError');
}

describe('counter overdue block', () => {
  it('AC8: the seed borrower with an overdue loan is blocked with a count of 1', () => {
    const { counter, state } = setup();
    const error = refusal(() => counter.scan('6511010088'));
    expect(error).toMatchObject({ code: 'BORROWER_OVERDUE', params: { count: 1 } });
    expect(state()).toMatchObject({ borrowerCode: '6511010088', blocked: true, scan: '' });
    expect(state().msg).toEqual({ kind: 'err', code: 'BORROWER_OVERDUE', params: { count: 1 } });
  });

  it('AC8: once blocked, later scans throw BORROWER_BLOCKED and add nothing to the cart', () => {
    const { counter, state } = setup();
    refusal(() => counter.scan('6511010088'));
    expect(refusal(() => counter.scan('6515-002-0001')).code).toBe('BORROWER_BLOCKED');
    expect(state().msg).toEqual({ kind: 'err', code: 'BORROWER_BLOCKED' });
    expect(state().cart).toEqual([]);
  });

  it('AC8: a pending overdue loan does not block the borrower', () => {
    const { counter, circulation, state, clock } = setup();
    circulation.loans.set((list) => list.map((l) => (l.id === 'L-2569-0412' ? Loan.restore({
      id: l.id, borrowerCode: l.borrowerCode, items: [...l.items], start: addDays(clock.now(), -10), due: addDays(clock.now(), -3), pending: true,
    }) : l)));
    counter.scan('6511010088');
    expect(state().blocked).toBe(false);
  });
});

describe('counter asset lookup', () => {
  it('AC9: an unknown asset code throws ASSET_NOT_FOUND with the code', () => {
    const { counter, state } = setup();
    counter.scan('T0007');
    const error = refusal(() => counter.scan('9999-999-9999'));
    expect(error).toMatchObject({ code: 'ASSET_NOT_FOUND', params: { code: '9999-999-9999' } });
    expect(state().msg).toEqual({ kind: 'err', code: 'ASSET_NOT_FOUND', params: { code: '9999-999-9999' } });
    expect(state().cart).toEqual([]);
  });
});
