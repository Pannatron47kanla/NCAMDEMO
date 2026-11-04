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

describe('counter cart', () => {
  it('AC10: scanning an available asset adds it; scanning it again warns ALREADY_IN_CART and keeps one item', () => {
    const { counter, registry, state } = setup();
    const a = registry.catalog.findById('A1')!;
    counter.scan('T0007');
    counter.scan(a.code);
    expect(state().cart.map((it) => it.assetId)).toEqual(['A1']);
    expect(state().msg).toEqual({ kind: 'ok', code: 'ITEM_ADDED', params: { name: a.name } });
    counter.scan(` ${a.code} `);
    expect(state().cart).toHaveLength(1);
    expect(state().msg).toEqual({ kind: 'warn', code: 'ALREADY_IN_CART', params: { name: a.name } });
    expect(state().scan).toBe('');
  });

  it('AC10: removing an item takes it out of the cart and warns', () => {
    const { counter, registry, state } = setup();
    const a = registry.catalog.findById('A1')!;
    counter.scan('T0007');
    counter.scan(a.code);
    counter.removeFromCart('A1');
    expect(state().cart).toEqual([]);
    expect(state().msg).toEqual({ kind: 'warn', code: 'ITEM_REMOVED', params: { name: a.name } });
  });
});

describe('counter asset status', () => {
  it('AC11: an asset that is not พร้อมใช้ throws ASSET_NOT_AVAILABLE with its name and status', () => {
    const { counter, registry, state } = setup();
    const a = registry.catalog.findById('A1')!;
    registry.catalog.setStatus('A1', 'รอซ่อม');
    counter.scan('T0007');
    const error = refusal(() => counter.scan(a.code));
    expect(error).toMatchObject({ code: 'ASSET_NOT_AVAILABLE', params: { name: a.name, status: 'รอซ่อม' } });
    expect(state().msg).toEqual({ kind: 'err', code: 'ASSET_NOT_AVAILABLE', params: { name: a.name, status: 'รอซ่อม' } });
    expect(state().cart).toEqual([]);
  });
});

describe('student kit limit', () => {
  const codeOf = (registry: ReturnType<typeof setup>['registry'], id: string) => registry.catalog.findById(id)!.code;

  it('AC12: a student with 2 kits in the cart gets KIT_LIMIT_REACHED for a third; an asset without parts still passes', () => {
    const { counter, registry, state } = setup();
    counter.scan('6611010015');
    counter.scan(codeOf(registry, 'A1'));
    counter.scan(codeOf(registry, 'A7'));
    const error = refusal(() => counter.scan(codeOf(registry, 'A3')));
    expect(error).toMatchObject({ code: 'KIT_LIMIT_REACHED', params: { max: 2, held: 2 } });
    expect(state().msg).toEqual({ kind: 'err', code: 'KIT_LIMIT_REACHED', params: { max: 2, held: 2 } });
    expect(state().cart).toHaveLength(2);
    counter.scan(codeOf(registry, 'A5'));
    expect(state().cart.map((it) => it.assetId)).toEqual(['A1', 'A7', 'A5']);
  });

  it('AC12: kits already held on open loans count toward the limit', () => {
    const { counter, circulation, registry, clock } = setup();
    circulation.loans.set((list) => list.concat([Loan.restore({
      id: 'L-9', borrowerCode: '6611010015', start: clock.now(), due: addDays(clock.now(), 7), pending: false,
      items: [{ assetId: 'A2', returned: false, note: 'ครบทุกชิ้น', kit: true }, { assetId: 'A4', returned: false, note: 'ครบทุกชิ้น', kit: true }],
    })]));
    counter.scan('6611010015');
    const error = refusal(() => counter.scan(codeOf(registry, 'A1')));
    expect(error).toMatchObject({ code: 'KIT_LIMIT_REACHED', params: { max: 2, held: 2 } });
  });

  it('AC12: a teacher is not limited', () => {
    const { counter, registry, state } = setup();
    counter.scan('T0007');
    for (const id of ['A1', 'A7', 'A3']) counter.scan(codeOf(registry, id));
    expect(state().cart).toHaveLength(3);
  });
});
