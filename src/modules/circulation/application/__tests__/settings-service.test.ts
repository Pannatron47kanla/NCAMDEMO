import { describe, expect, it } from 'vitest';
import { addDays } from '../../../../shared/dates';
import { setup } from './helpers';

describe('loan settings', () => {
  it('AC43: editing keeps a draft and says not saved; settings stay until saved', () => {
    const { circulation } = setup();
    circulation.settingsDesk.editNumber('loanDays', '1a4');
    expect(circulation.settingsDesk.desk.get()).toMatchObject({ draft: { loanDays: '14' }, message: 'ยังไม่บันทึก' });
    expect(circulation.settings.get().loanDays).toBe(7);
  });

  it('AC43: saved empty and zero values fall back to defaults', () => {
    const { circulation } = setup();
    const d = circulation.settingsDesk;
    d.editNumber('loanDays', ''); d.editNumber('finePerDay', '0'); d.editNumber('lossPct', '0');
    d.save();
    expect(circulation.settings.get()).toMatchObject({ loanDays: 7, finePerDay: 5, lossPct: 0 });
    expect(d.desk.get()).toEqual({ draft: null, message: 'บันทึกแล้ว มีผลกับการยืมครั้งถัดไป' });
  });

  it('AC43: saved days and approval change the next loan', () => {
    const { circulation, counter, registry, clock } = setup();
    const d = circulation.settingsDesk;
    d.editNumber('loanDays', '14'); d.setNeedApproval(true); d.save();
    counter.scan('6611010015');
    counter.scan(registry.catalog.findById('A1')!.code);
    counter.confirmBorrow();
    const loan = circulation.loans.get()[circulation.loans.get().length - 1]!;
    expect(loan.due).toEqual(addDays(clock.now(), 14));
    expect(loan.pending).toBe(true);
  });

  it('AC43: saved fine and loss percent change later returns and charges', () => {
    const env = setup();
    const { circulation, counter, registry } = env;
    circulation.settingsDesk.editNumber('finePerDay', '10'); circulation.settingsDesk.editNumber('lossPct', '50'); circulation.settingsDesk.save();
    counter.setMode('return');
    counter.scan(registry.catalog.findById('A2')!.code);
    counter.confirmReturn();
    expect(circulation.charges.get().map((c) => c.amount)).toEqual([30]);
    counter.setMode('borrow');
    counter.scan('T0007'); counter.scan(registry.catalog.findById('A10')!.code); counter.confirmBorrow();
    counter.setMode('return');
    counter.scan(registry.catalog.findById('A10')!.code); counter.toggleReturnPart(1); counter.confirmReturn();
    expect(circulation.charges.get()[1]).toMatchObject({ amount: 2700, desc: 'ค่าชดใช้: ท่อช่วยหายใจจำลอง × 2 (ราคา + 50%)' });
  });
});
