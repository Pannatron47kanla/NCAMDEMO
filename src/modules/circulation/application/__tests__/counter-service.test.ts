import { describe, expect, it } from 'vitest';
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
