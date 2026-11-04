import { describe, expect, it } from 'vitest';
import { addDays } from '../../../../shared/dates';
import { DomainError } from '../../../../shared/domain-error';
import { setup } from './helpers';

/** Lends `assetId` to the teacher T0007 (due in 7 days), then switches the counter to return mode. */
function lend(env: ReturnType<typeof setup>, assetId: string): void {
  const { counter, registry } = env;
  counter.scan('T0007');
  counter.scan(registry.catalog.findById(assetId)!.code);
  counter.confirmBorrow();
  counter.setMode('return');
}

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

describe('counter on-time return', () => {
  it('AC16: scanning a borrowed asset finds its loan and shows the check form', () => {
    const env = setup();
    env.counter.setMode('return');
    env.counter.scan(env.registry.catalog.findById('A2')!.code);
    expect(env.state().ret).toMatchObject({ loanId: 'L-2569-0412', assetId: 'A2', cond: 'สภาพดี' });
    expect(env.state().ret!.parts.every((p) => p.checked)).toBe(true);
    expect(env.state().msg).toEqual({ kind: 'ok', code: 'LOAN_FOUND', params: { id: 'L-2569-0412' } });
  });

  it('AC16: confirming an on-time, complete, good return frees the asset with no charge; a second confirm changes nothing', () => {
    const env = setup();
    const { counter, registry, circulation, state } = env;
    lend(env, 'A1');
    counter.scan(registry.catalog.findById('A1')!.code);
    counter.confirmReturn();
    expect(registry.catalog.findById('A1')!.status).toBe('พร้อมใช้');
    expect(circulation.loans.get()[circulation.loans.get().length - 1]!.openItems()).toEqual([]);
    expect(circulation.charges.get()).toEqual([]);
    expect(state().ret).toBeNull();
    expect(state().msg).toEqual({ kind: 'ok', code: 'RETURN_SAVED' });
    expect(state().retDone).toMatchObject({ name: registry.catalog.findById('A1')!.name, who: 'อ.ดร.สุภาวดี วงศ์ใหญ่', missText: 'ครบทุกชิ้น', fine: 0, loss: 0, status: 'พร้อมใช้' });
    const events = registry.catalog.findById('A1')!.events;
    expect(events[events.length - 1]!.text).toBe('รับคืนจาก อ.ดร.สุภาวดี วงศ์ใหญ่ ตรงเวลา · ครบทุกชิ้น');
    const before = { events: events.length, done: state().retDone };
    counter.confirmReturn();
    expect(registry.catalog.findById('A1')!.events).toHaveLength(before.events);
    expect(state().retDone).toEqual(before.done);
    expect(circulation.charges.get()).toEqual([]);
  });

  it('AC16: cancelling the check form drops it without changes', () => {
    const env = setup();
    env.counter.setMode('return');
    env.counter.scan(env.registry.catalog.findById('A2')!.code);
    env.counter.cancelReturn();
    expect(env.state().ret).toBeNull();
    expect(env.state().msg).toBeNull();
    expect(env.registry.catalog.findById('A2')!.status).toBe('ถูกยืม');
  });
});

describe('counter late return', () => {
  it('AC17: the seed loan 3 days late records a fine of 15 for its borrower and shows the lateness in history', () => {
    const env = setup();
    const { counter, registry, circulation, state } = env;
    counter.setMode('return');
    counter.scan(registry.catalog.findById('A2')!.code);
    counter.confirmReturn();
    const charges = circulation.charges.get();
    expect(charges).toHaveLength(1);
    expect(charges[0]).toMatchObject({ id: 'CH1', borrowerCode: '6511010088', desc: 'ค่าปรับคืนช้า 3 วัน · ' + registry.catalog.findById('A2')!.name, amount: 15, paid: false });
    expect(state().retDone).toMatchObject({ fine: 15, lateDays: 3, finePerDay: 5, loss: 0 });
    const events = registry.catalog.findById('A2')!.events;
    expect(events[events.length - 1]!.text).toBe('รับคืนจาก นางสาวกัญญาณัฐ บุญมา ช้า 3 วัน · ครบทุกชิ้น');
    counter.confirmReturn();
    expect(circulation.charges.get()).toHaveLength(1);
  });

  it('AC17: finePerDay 10 gives a fine of 30', () => {
    const env = setup();
    env.circulation.settings.set((s) => ({ ...s, finePerDay: 10 }));
    env.counter.setMode('return');
    env.counter.scan(env.registry.catalog.findById('A2')!.code);
    env.counter.confirmReturn();
    expect(env.circulation.charges.get().map((c) => c.amount)).toEqual([30]);
  });
});

describe('counter return with missing parts', () => {
  it('AC18: unticking a part charges its price plus 20%, sets ชิ้นส่วนไม่ครบ and records what is missing', () => {
    const env = setup();
    const { counter, registry, circulation, state } = env;
    lend(env, 'A10');
    counter.scan(registry.catalog.findById('A10')!.code);
    counter.toggleReturnPart(1);
    expect(state().ret!.parts.map((p) => p.checked)).toEqual([true, false]);
    counter.confirmReturn();
    expect(registry.catalog.findById('A10')!.status).toBe('ชิ้นส่วนไม่ครบ');
    expect(circulation.charges.get()).toHaveLength(1);
    expect(circulation.charges.get()[0]).toMatchObject({ borrowerCode: 'T0007', desc: 'ค่าชดใช้: ท่อช่วยหายใจจำลอง × 2 (ราคา + 20%)', amount: 2160 });
    expect(state().retDone).toMatchObject({ missText: 'ขาด ท่อช่วยหายใจจำลอง × 2', fine: 0, loss: 2160, status: 'ชิ้นส่วนไม่ครบ' });
    const events = registry.catalog.findById('A10')!.events;
    expect(events[events.length - 1]!.text).toBe('รับคืนจาก อ.ดร.สุภาวดี วงศ์ใหญ่ ตรงเวลา · ขาด ท่อช่วยหายใจจำลอง × 2');
  });
});

describe('counter damaged return', () => {
  it('AC19: ชำรุด with a missing part sets รอซ่อม and opens exactly one repair ticket; a second confirm opens none', () => {
    const env = setup();
    const { counter, registry, repairs, state } = env;
    lend(env, 'A10');
    counter.scan(registry.catalog.findById('A10')!.code);
    counter.toggleReturnPart(1);
    counter.setReturnCondition('ชำรุด');
    expect(state().ret!.cond).toBe('ชำรุด');
    counter.confirmReturn();
    expect(registry.catalog.findById('A10')!.status).toBe('รอซ่อม');
    expect(state().retDone).toMatchObject({ status: 'รอซ่อม', loss: 2160 });
    expect(repairs.calls).toEqual([{
      assetId: 'A10', symptom: 'รับคืนในสภาพชำรุด (บันทึกจากเคาน์เตอร์รับคืน)', needDate: addDays(new Date(2026, 9, 28), 3), reporter: 'เคาน์เตอร์ห้องปฏิบัติการ',
    }]);
    expect(repairs.tickets.map((t) => t.status)).toEqual(['รอรับงาน']);
    const events = registry.catalog.findById('A10')!.events;
    expect(events[events.length - 1]!.text).toBe('รับคืนจาก อ.ดร.สุภาวดี วงศ์ใหญ่ ตรงเวลา · ขาด ท่อช่วยหายใจจำลอง × 2 · สภาพชำรุด ส่งซ่อม');
    counter.confirmReturn();
    expect(repairs.calls).toHaveLength(1);
  });

  it('AC19: a good-condition return opens no ticket', () => {
    const env = setup();
    lend(env, 'A1');
    env.counter.scan(env.registry.catalog.findById('A1')!.code);
    env.counter.confirmReturn();
    expect(env.repairs.calls).toEqual([]);
  });
});
