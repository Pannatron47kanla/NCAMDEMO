import { describe, expect, it } from 'vitest';
import { DomainError } from '../../../../shared/domain-error';
import { setup } from './helpers';

function scanReturn(counter: ReturnType<typeof setup>['counter'], code: string): unknown {
  try { counter.scan(code); } catch (e) { return e; }
  return undefined;
}

describe('counter return scan', () => {
  it('AC15: scanning an asset with no open loan throws NO_OPEN_LOAN with its name and leaves the message in state', () => {
    const { counter, state, registry } = setup();
    counter.setMode('return');
    const a1 = registry.catalog.findById('A1')!;
    const error = scanReturn(counter, a1.code);
    expect(error).toBeInstanceOf(DomainError);
    expect((error as DomainError).code).toBe('NO_OPEN_LOAN');
    expect(state().msg).toEqual({ kind: 'err', code: 'NO_OPEN_LOAN', params: { name: a1.name } });
    expect(state().ret).toBeNull();
  });

  it('AC15: an unknown asset code in return mode is ASSET_NOT_FOUND', () => {
    const { counter } = setup();
    counter.setMode('return');
    expect((scanReturn(counter, 'nope') as DomainError).code).toBe('ASSET_NOT_FOUND');
  });
});
