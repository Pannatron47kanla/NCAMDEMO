import { describe, expect, it } from 'vitest';
import { DomainError } from '../../../../shared/domain-error';
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
