import { describe, expect, it } from 'vitest';
import { fixedClock } from '../../../shared/clock';
import { diffDays, toIso } from '../../../shared/dates';
import { workInfo } from '../../../shared/working-days';
import { assetInfo } from '../../../modules/registry';
import { createAppModules, type AppModules } from '../../modules';
import { allEvents, calLoans, eventTarget, upcoming60, type EventKind } from '../events';

const NOW = new Date(2026, 9, 28);

function eventsOf(m: AppModules) {
  return allEvents({
    assets: m.registry.assets.get(),
    loans: calLoans(m.circulation.loans.get(), m.circulation.borrowers.get()),
    tickets: m.maintenance.tickets.get(),
    auction: m.disposal.auction.get(),
    current: m.disposal.current.get(),
  }, NOW);
}

const ALL_ON: Record<EventKind, boolean> = { cal: true, disp: true, loan: true, repair: true, audit: true, auction: true };

describe('calendar events', () => {
  it('AC40: each kind of event appears on its own date', () => {
    const m = createAppModules(fixedClock(NOW));
    const ev = eventsOf(m);

    const a = m.registry.assets.get().find((x) => assetInfo(x, NOW).calNext)!;
    const calEv = ev.find((e) => e.kind === 'cal' && e.assetId === a.id)!;
    expect(toIso(calEv.date)).toBe(toIso(assetInfo(a, NOW).calNext!));

    const dispEv = ev.find((e) => e.kind === 'disp')!;
    const dispAsset = m.registry.assets.get().find((x) => x.id === dispEv.assetId)!;
    expect(toIso(dispEv.date)).toBe(toIso(assetInfo(dispAsset, NOW).disp!));

    const loan = m.circulation.loans.get().find((l) => l.openItems().length)!;
    expect(ev.some((e) => e.kind === 'loan' && toIso(e.date) === toIso(loan.due))).toBe(true);

    const ticket = m.maintenance.tickets.get().find((t) => t.status !== 'ปิดงาน')!;
    const repairEv = ev.find((e) => e.kind === 'repair')!;
    expect(repairEv.ticketId).toBe(ticket.id);
    expect(toIso(repairEv.date)).toBe(toIso(ticket.needDate));

    const auditEv = ev.find((e) => e.kind === 'audit')!;
    expect(toIso(auditEv.date)).toBe(toIso(workInfo(NOW).dueDate));
    expect(auditEv.label).toBe('ครบกำหนดรายงานผลตรวจสอบพัสดุ');
  });

  it('AC40: events are in date order, and a loan label drops the title and counts open items', () => {
    const ev = eventsOf(createAppModules(fixedClock(NOW)));
    for (let i = 1; i < ev.length; i++) expect(ev[i]!.date.getTime()).toBeGreaterThanOrEqual(ev[i - 1]!.date.getTime());
    const loanEv = ev.find((e) => e.kind === 'loan')!;
    expect(loanEv.label).toBe('กัญญาณัฐ บุญมา (1 รายการ)');
  });

  it('AC40: a kind switched off is hidden from the 60-day list', () => {
    const ev = eventsOf(createAppModules(fixedClock(NOW)));
    const on = upcoming60(ev, ALL_ON, NOW);
    expect(on.some((e) => e.kind === 'audit')).toBe(diffDays(NOW, workInfo(NOW).dueDate) <= 60);
    const off = upcoming60(ev, { ...ALL_ON, cal: false, disp: false, loan: false }, NOW);
    expect(off.some((e) => e.kind === 'cal' || e.kind === 'disp' || e.kind === 'loan')).toBe(false);
    expect(on.length).toBeGreaterThan(off.length);
  });

  it('AC40: opening an event goes to the right screen', () => {
    const ev = eventsOf(createAppModules(fixedClock(NOW)));
    const cal = ev.find((e) => e.kind === 'cal')!;
    expect(eventTarget(cal)).toEqual({ screen: 'asset', params: { selAsset: cal.assetId } });
    const repair = ev.find((e) => e.kind === 'repair')!;
    expect(eventTarget(repair)).toEqual({ screen: 'repair', params: {}, ticketId: repair.ticketId });
    expect(eventTarget(ev.find((e) => e.kind === 'loan')!).screen).toBe('counter');
    expect(eventTarget(ev.find((e) => e.kind === 'audit')!).screen).toBe('audit');
  });

  it('AC40: a finished asset adds no event, and an open disposal case adds its stage dates', () => {
    const m = createAppModules(fixedClock(NOW));
    m.registry.catalog.setStatus('A1', 'จำหน่ายแล้ว');
    expect(eventsOf(m).some((e) => e.assetId === 'A1')).toBe(false);

    const before = eventsOf(m).filter((e) => e.kind === 'auction').length;
    m.disposal.disposal.toggle('A4');
    m.disposal.disposal.createCase();
    const c = m.disposal.current.get()!;
    const mine = eventsOf(m).filter((e) => e.kind === 'auction');
    expect(mine.length - before).toBe(4);
    expect(mine.map((e) => e.label)).toContain(c.data.id + ' กรรมการรายงานข้อเท็จจริง');
    const deadline = mine.find((e) => e.label === c.data.id + ' ครบ 60 วันต้องจำหน่ายเสร็จ')!;
    expect(toIso(deadline.date)).toBe(toIso(c.dates.deadline));
    expect(eventTarget(deadline).screen).toBe('disp');
  });
});
