import { describe, expect, it } from 'vitest';
import { fixedClock } from '../../../shared/clock';
import { calLoans } from '../../calendar/events';
import { createAppModules, type AppModules } from '../../modules';
import { buildDashboard, type Dashboard } from '../dashboard';

const NOW = new Date(2026, 9, 28);

function dash(m: AppModules): Dashboard {
  const assets = m.registry.assets.get();
  const loans = m.circulation.loans.get();
  const borrowers = m.circulation.borrowers.get();
  const tickets = m.maintenance.tickets.get();
  return buildDashboard({
    assets, loans, borrowers, tickets, settings: m.circulation.settings.get(), audit: m.audit.round.get(),
    events: { assets, loans: calLoans(loans, borrowers), tickets, auction: m.disposal.auction.get(), current: m.disposal.current.get() },
  }, NOW);
}

const tile = (d: Dashboard, label: string) => d.tiles.find((t) => t.label === label)!;

describe('dashboard figures', () => {
  it('AC44: the seed shows the overdue loan, the open ticket and a fine at 5 baht a day', () => {
    const d = dash(createAppModules(fixedClock(NOW)));
    expect(tile(d, 'เกินกำหนดคืน').n).toBe(1);
    expect(d.overdue).toHaveLength(1);
    expect(d.overdue[0]).toMatchObject({ who: 'นางสาวกัญญาณัฐ บุญมา', late: '3 วัน', fine: '15 บาท' });
    expect(d.openTickets.map((t) => t.id)).toEqual(['WO-2569-031']);
    expect(d.audit).toMatchObject({ done: 3 });
  });

  it('AC44: confirming a loan moves one asset from พร้อมใช้ to ถูกยืม and keeps the total', () => {
    const m = createAppModules(fixedClock(NOW));
    const before = dash(m);
    m.circulation.counter.scan('T0007');
    m.circulation.counter.scan(m.registry.catalog.findById('A1')!.code);
    m.circulation.counter.confirmBorrow();
    const after = dash(m);
    expect(tile(after, 'ถูกยืม').n).toBe(tile(before, 'ถูกยืม').n + 1);
    expect(tile(after, 'พร้อมใช้งาน').n).toBe(tile(before, 'พร้อมใช้งาน').n - 1);
    expect(tile(after, 'ครุภัณฑ์ทั้งหมด').n).toBe(tile(before, 'ครุภัณฑ์ทั้งหมด').n);
  });

  it('AC44: a student loan that needs approval is listed until approved', () => {
    const m = createAppModules(fixedClock(NOW));
    m.circulation.settingsDesk.setNeedApproval(true);
    m.circulation.settingsDesk.save();
    m.circulation.counter.scan('6611010015');
    m.circulation.counter.scan(m.registry.catalog.findById('A1')!.code);
    m.circulation.counter.confirmBorrow();
    const pending = dash(m).pending;
    expect(pending).toHaveLength(1);
    m.circulation.counter.approve(pending[0]!.id);
    expect(dash(m).pending).toHaveLength(0);
  });

  it('AC44: a saved fine changes the accumulated fine of an overdue loan', () => {
    const m = createAppModules(fixedClock(NOW));
    m.circulation.settingsDesk.editNumber('finePerDay', '10');
    m.circulation.settingsDesk.save();
    expect(dash(m).overdue[0]!.fine).toBe('30 บาท');
  });

  it('AC44: returning the overdue loan clears the overdue tile', () => {
    const m = createAppModules(fixedClock(NOW));
    m.circulation.counter.setMode('return');
    m.circulation.counter.scan(m.registry.catalog.findById('A2')!.code);
    m.circulation.counter.confirmReturn();
    expect(tile(dash(m), 'เกินกำหนดคืน').n).toBe(0);
    expect(dash(m).overdue).toEqual([]);
  });

  it('AC44: confirming an audit result raises the audit progress', () => {
    const m = createAppModules(fixedClock(NOW));
    m.audit.audit.setResult('A1', 'พบ');
    m.audit.audit.confirm();
    expect(dash(m).audit.done).toBe(4);
  });
});
