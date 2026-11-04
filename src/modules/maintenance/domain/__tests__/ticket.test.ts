import { describe, expect, it } from 'vitest';
import { DomainError } from '../../../../shared/domain-error';
import { RepairTicket } from '../ticket';

const NOW = new Date(2026, 9, 28);
const input = (symptom: string) => ({ id: 'WO-2569-032', assetId: 'A3', symptom, needDate: new Date(2026, 9, 31), reporter: 'lab.officer', createdAt: NOW });

describe('opening a ticket', () => {
  it('AC21: a blank or spaces-only symptom throws SYMPTOM_REQUIRED and opens no ticket', () => {
    for (const symptom of ['', '   ', '\n\t ']) {
      let error: unknown;
      try { RepairTicket.open(input(symptom)); } catch (e) { error = e; }
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).code).toBe('SYMPTOM_REQUIRED');
    }
  });
});

describe('a reported ticket', () => {
  it('AC22: opens as รอรับงาน with no route, no cost and nothing ticked, and keeps the trimmed symptom', () => {
    const t = RepairTicket.open(input('  หุ่นไม่ส่งสัญญาณ  '));
    expect(t).toMatchObject({
      id: 'WO-2569-032', assetId: 'A3', symptom: 'หุ่นไม่ส่งสัญญาณ', status: 'รอรับงาน', route: '-', cost: '', tested: false, partsOk: false, reporter: 'lab.officer',
    });
    expect(t.createdAt).toEqual(NOW);
  });
});

describe('accepting and closing', () => {
  const open = () => RepairTicket.open(input('x'));

  it('AC23: accept sets กำลังซ่อม with the route and keeps the rest', () => {
    const t = open().accept('ซ่อมภายใน');
    expect(t).toMatchObject({ status: 'กำลังซ่อม', route: 'ซ่อมภายใน', symptom: 'x', id: 'WO-2569-032' });
  });

  it('AC23: close throws TICKET_NOT_READY until both tested and partsOk are ticked', () => {
    const code = (t: RepairTicket) => { try { t.close(); } catch (e) { return (e as DomainError).code; } return 'closed'; };
    const working = open().accept('ซ่อมภายใน');
    expect(code(working)).toBe('TICKET_NOT_READY');
    expect(code(working.toggleTested())).toBe('TICKET_NOT_READY');
    expect(code(working.toggleParts())).toBe('TICKET_NOT_READY');
    expect(code(working.toggleTested().toggleParts())).toBe('closed');
    expect(code(working.toggleTested().toggleTested().toggleParts())).toBe('TICKET_NOT_READY');
  });

  it('AC23: closing a ready ticket gives ปิดงาน', () => {
    expect(open().accept('ซ่อมภายใน').toggleTested().toggleParts().close().status).toBe('ปิดงาน');
  });

  it('AC23: the cost keeps digits only and counts as 0 when empty', () => {
    expect(open().withCost('1,2a50').cost).toBe('1250');
    expect(open().withCost('1,2a50').costAmount).toBe(1250);
    expect(open().costAmount).toBe(0);
  });
});
