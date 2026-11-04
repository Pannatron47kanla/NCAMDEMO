import { describe, expect, it } from 'vitest';
import { setup } from './helpers';

describe('creating a case', () => {
  it('AC33: with A16 and A17 ticked, a case DS-2569-001 is created and both assets become รอจำหน่าย with a history line', () => {
    const { svc, disposal, asset } = setup();
    svc.createCase();
    expect(disposal.current.get()!.data.id).toBe('DS-2569-001');
    for (const id of ['A16', 'A17']) {
      expect(asset(id).status).toBe('รอจำหน่าย');
      expect(asset(id).events.at(-1)).toEqual({
        date: '28 ต.ค. 69', text: 'เสนอจำหน่าย (ครบอายุใช้งานและเสื่อมสภาพ) แต่งตั้งคณะกรรมการสอบหาข้อเท็จจริง', doc: 'DS-2569-001',
      });
    }
  });

  it('AC33: a borrowed asset (A2) and an asset with an open ticket (A4) are excluded', () => {
    const { svc, disposal, asset } = setup();
    svc.toggle('A2');
    svc.toggle('A4');
    expect(svc.blockReasonOf('A2')).toBe('BORROWED');
    expect(svc.blockReasonOf('A4')).toBe('OPEN_TICKET');
    svc.createCase();
    expect(disposal.current.get()!.data.ids).toEqual(['A16', 'A17']);
    expect(asset('A2').status).toBe('ถูกยืม');
    expect(asset('A4').status).toBe('รอซ่อม');
  });

  it('AC33: a second create while a case is open does nothing, even with other assets ticked', () => {
    const { svc, disposal, asset } = setup();
    svc.createCase();
    const first = disposal.current.get();
    svc.toggle('A12');
    svc.createCase();
    expect(disposal.current.get()).toBe(first);
    expect(asset('A12').status).toBe('พร้อมใช้');
    expect(asset('A16').events.filter((e) => e.doc === 'DS-2569-001')).toHaveLength(1);
  });

  it('AC33: creating with nothing ticked does nothing', () => {
    const { svc, disposal } = setup();
    svc.clearSelection();
    svc.createCase();
    expect(disposal.current.get()).toBeNull();
  });
});
