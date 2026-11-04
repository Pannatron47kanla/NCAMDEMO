import { describe, expect, it } from 'vitest';
import { DomainError } from '../../../../shared/domain-error';
import { setup } from './helpers';

function submitError(desk: ReturnType<typeof setup>['desk']): unknown {
  try { desk.submit(); } catch (e) { return e; }
  return undefined;
}

describe('reporting a repair', () => {
  it('AC21: a blank symptom throws SYMPTOM_REQUIRED, opens no ticket and leaves the asset and its history alone', () => {
    const { desk, registry, tickets } = setup();
    const before = registry.catalog.findById('A3')!;
    desk.setSymptom('   ');
    const error = submitError(desk);
    expect((error as DomainError).code).toBe('SYMPTOM_REQUIRED');
    expect(tickets()).toHaveLength(1);
    expect(registry.catalog.findById('A3')).toEqual(before);
  });

  it('AC22: the first report is WO-2569-032 with status รอรับงาน, then the next is WO-2569-033', () => {
    const { desk, tickets } = setup();
    desk.setSymptom('หุ่นไม่ส่งสัญญาณ');
    desk.submit();
    desk.setSymptom('สายขาด');
    desk.submit();
    expect(tickets().map((t) => [t.id, t.status])).toEqual([
      ['WO-2569-031', 'รอรับงาน'], ['WO-2569-032', 'รอรับงาน'], ['WO-2569-033', 'รอรับงาน'],
    ]);
  });

  it('AC22: the asset becomes รอซ่อม, gets a history line, and the form selects the ticket and clears the symptom', () => {
    const { desk, registry, clock } = setup();
    desk.setAsset('A3');
    desk.setNeed('7');
    desk.setSymptom('  หุ่นไม่ส่งสัญญาณ ');
    desk.submit();
    const a = registry.catalog.findById('A3')!;
    expect(a.status).toBe('รอซ่อม');
    expect(a.events.at(-1)).toEqual({ date: '28 ต.ค. 69', text: 'แจ้งซ่อม: หุ่นไม่ส่งสัญญาณ', doc: 'WO-2569-032' });
    expect(desk.state.get()).toMatchObject({ selTicket: 'WO-2569-032', symptom: '', assetId: 'A3', need: '7' });
    const t = desk.hasOpenTicket('A3');
    expect(t).toBe(true);
    expect(clock.now()).toEqual(new Date(2026, 9, 28));
  });

  it('AC22: the need date is the chosen number of days after today', () => {
    const { desk, tickets } = setup();
    desk.setNeed('7');
    desk.setSymptom('x');
    desk.submit();
    expect(tickets().at(-1)!.needDate).toEqual(new Date(2026, 10, 4));
    expect(tickets().at(-1)!.createdAt).toEqual(new Date(2026, 9, 28));
  });

  it('AC22: a ถูกยืม asset stays ถูกยืม but still gets a ticket and a history line', () => {
    const { desk, registry, tickets } = setup();
    const borrowed = registry.catalog.list().find((a) => a.status === 'ถูกยืม')!;
    desk.setAsset(borrowed.id);
    desk.setSymptom('ปุ่มค้าง');
    desk.submit();
    expect(registry.catalog.findById(borrowed.id)!.status).toBe('ถูกยืม');
    expect(tickets().at(-1)).toMatchObject({ assetId: borrowed.id, status: 'รอรับงาน' });
    expect(registry.catalog.findById(borrowed.id)!.events.at(-1)!.text).toBe('แจ้งซ่อม: ปุ่มค้าง');
  });
});

describe('repair intake for other contexts', () => {
  it('AC19: open() adds a ticket with status รอรับงาน and numbers the next one, without touching the asset', () => {
    const { desk, registry, tickets } = setup();
    const before = registry.catalog.findById('A2')!;
    const ticket = desk.open({ assetId: 'A2', symptom: 'รับคืนในสภาพชำรุด', needDate: new Date(2026, 10, 1), reporter: 'เคาน์เตอร์ห้องปฏิบัติการ' });
    expect(ticket).toMatchObject({ id: 'WO-2569-032', status: 'รอรับงาน' });
    expect(tickets()).toHaveLength(2);
    expect(registry.catalog.findById('A2')).toEqual(before);
  });

  it('AC22: hasOpenTicket is true for the seed ticket asset until its ticket is closed, false for others', () => {
    const { desk } = setup();
    expect(desk.hasOpenTicket('A4')).toBe(true);
    expect(desk.hasOpenTicket('A1')).toBe(false);
  });
});

describe('accepting and closing a ticket', () => {
  function report() {
    const env = setup();
    env.desk.setAsset('A3');
    env.desk.setSymptom('หุ่นไม่ส่งสัญญาณ');
    env.desk.submit();
    return { ...env, id: 'WO-2569-032' };
  }
  const closeError = (desk: ReturnType<typeof setup>['desk'], id: string) => {
    try { desk.close(id); } catch (e) { return (e as DomainError).code; }
    return undefined;
  };

  it('AC23: accept sets กำลังซ่อม with the route and logs รับงานซ่อม on the asset', () => {
    const { desk, tickets, registry, id } = report();
    desk.accept(id, 'ส่งซ่อมภายนอก');
    expect(tickets().find((t) => t.id === id)).toMatchObject({ status: 'กำลังซ่อม', route: 'ส่งซ่อมภายนอก' });
    expect(registry.catalog.findById('A3')!.events.at(-1)).toEqual({ date: '28 ต.ค. 69', text: 'รับงานซ่อม: ส่งซ่อมภายนอก', doc: id });
  });

  it('AC23: close throws TICKET_NOT_READY and changes nothing until tested and parts are ticked, then closes and frees the asset', () => {
    const { desk, tickets, registry, id } = report();
    desk.accept(id, 'ซ่อมภายใน');
    expect(closeError(desk, id)).toBe('TICKET_NOT_READY');
    desk.toggleTested(id);
    expect(closeError(desk, id)).toBe('TICKET_NOT_READY');
    expect(registry.catalog.findById('A3')!.status).toBe('รอซ่อม');
    desk.toggleParts(id);
    desk.close(id);
    expect(tickets().find((t) => t.id === id)!.status).toBe('ปิดงาน');
    expect(registry.catalog.findById('A3')!.status).toBe('พร้อมใช้');
    expect(registry.catalog.findById('A3')!.events.at(-1)!.text).toBe('ซ่อมเสร็จ ทดสอบผ่าน ชิ้นส่วนครบ ปิดใบงาน');
    expect(desk.hasOpenTicket('A3')).toBe(false);
  });

  it('AC23: a typed cost shows in the closing history line', () => {
    const { desk, registry, id } = report();
    desk.accept(id, 'ซ่อมภายใน');
    desk.setCost(id, '1,500 บาท');
    desk.toggleTested(id);
    desk.toggleParts(id);
    desk.close(id);
    expect(registry.catalog.findById('A3')!.events.at(-1)!.text).toBe('ซ่อมเสร็จ ทดสอบผ่าน ชิ้นส่วนครบ ปิดใบงาน · ค่าใช้จ่าย 1,500 บาท');
  });
});
