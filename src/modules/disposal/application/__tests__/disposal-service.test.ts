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

describe('finding and approval', () => {
  it('AC34: recording the finding moves to step 2 and adds the committee line dated on the planned fact date (5 working days on)', () => {
    const { svc, disposal, asset } = setup();
    svc.createCase();
    svc.recordFact();
    expect(disposal.current.get()!.data.step).toBe(2);
    expect(asset('A16').events.at(-1)).toEqual({ date: '4 พ.ย. 69', text: 'กรรมการสอบหาข้อเท็จจริง: เสื่อมสภาพจากการใช้งานตามปกติ ไม่มีผู้ต้องรับผิด', doc: 'DS-2569-001' });
  });

  it('AC34: a direct sale of the whole register is refused with DIRECT_SALE_LIMIT, the case stays at step 2 and no history line is added', () => {
    const { svc, disposal, registry, asset } = setup();
    registry.catalog.list().forEach((a) => { if (!svc.desk.get().sel[a.id]) svc.toggle(a.id); });
    svc.createCase();
    svc.recordFact();
    const ids = disposal.current.get()!.data.ids;
    const total = ids.reduce((t, id) => t + asset(id).price, 0);
    expect(total).toBeGreaterThan(500000);
    svc.setMethod('direct');
    const lines = asset(ids[0]!).events.length;
    svc.approve();
    expect(svc.desk.get().note?.code).toBe('DIRECT_SALE_LIMIT');
    expect(svc.desk.get().note?.params).toEqual({ total });
    expect(disposal.current.get()!.data.step).toBe(2);
    expect(asset(ids[0]!).events).toHaveLength(lines);
  });

  it('AC34: approving a direct sale within the limit moves to step 3 and adds the approval line', () => {
    const { svc, disposal, asset } = setup();
    svc.createCase();
    svc.recordFact();
    svc.setMethod('direct');
    svc.approve();
    expect(disposal.current.get()!.data.step).toBe(3);
    expect(asset('A17').events.at(-1)!.text).toBe('ผู้อำนวยการอนุมัติจำหน่ายโดยวิธีขายโดยวิธีเฉพาะเจาะจง');
    expect(svc.desk.get().note).toBeNull();
  });
});

describe('closing the auction notice', () => {
  function atNotice() {
    const t = setup();
    t.svc.createCase();
    t.svc.recordFact();
    t.svc.approve();
    return t;
  }

  it('AC35: announcing without every minimum price keeps the case and shows MIN_PRICE_REQUIRED', () => {
    const { svc, disposal, asset } = atNotice();
    svc.setMinPrice('A16', '5000');
    const lines = asset('A16').events.length;
    svc.announce();
    expect(svc.desk.get().note?.code).toBe('MIN_PRICE_REQUIRED');
    expect(disposal.current.get()!.data.announced).toBe(false);
    expect(asset('A16').events).toHaveLength(lines);
  });

  it('AC35: typed prices keep only digits, and with all of them the notice closes and each asset gets a history line', () => {
    const { svc, disposal, asset } = atNotice();
    svc.setMinPrice('A16', '5,000');
    svc.setMinPrice('A17', '12000');
    svc.announce();
    expect(disposal.current.get()!.data.announced).toBe(true);
    expect(svc.desk.get().note).toBeNull();
    expect(asset('A16').events.at(-1)).toEqual({ date: '11 พ.ย. 69', text: 'ปิดประกาศขายทอดตลาด ครั้งที่ 1 ราคาขั้นต่ำ 5,000 บาท', doc: 'DS-2569-001' });
  });
});

describe('a round with no bid', () => {
  it('AC36: noBid shows the notice for the next round, reopens the notice and empties the sale forms', () => {
    const t = setup();
    t.svc.createCase();
    t.svc.recordFact();
    t.svc.approve();
    t.svc.setMinPrice('A16', '5000');
    t.svc.setMinPrice('A17', '12000');
    t.svc.announce();
    t.svc.noBid();
    const c = t.disposal.current.get()!;
    expect([c.data.round, c.data.announced]).toEqual([2, false]);
    expect(t.svc.desk.get().note).toEqual({ code: 'NO_BID_RECORDED', params: { round: 2 } });
    expect(t.svc.desk.get().draft.soldP).toEqual({});
    expect(t.svc.desk.get().draft.minP).toEqual({ A16: '5000', A17: '12000' });
  });
});
