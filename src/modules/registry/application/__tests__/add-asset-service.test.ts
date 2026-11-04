import { describe, expect, it } from 'vitest';
import { setup } from './helpers';

describe('add-asset wizard steps', () => {
  it('AC24: a step with missing fields does not advance and lists the problems', () => {
    const { wizard, state } = setup();
    wizard.next();
    expect(state().step).toBe(1);
    expect(state().error).toEqual({ code: 'STEP_INCOMPLETE', params: { missing: 'เลขที่เอกสาร, ราคา' } });
  });

  it.each(['0', '201', 'abc', ''])('AC24: quantity "%s" keeps the wizard on step 1', (qty) => {
    const { wizard, state } = setup();
    wizard.edit({ doc: 'ใบตรวจรับ', price: '5000', qty });
    wizard.next();
    expect(state().step).toBe(1);
    expect(state().error?.code).toBe('STEP_INCOMPLETE');
  });

  it('AC24: a complete step advances, and any edit clears the problem list', () => {
    const { wizard, state } = setup();
    wizard.next();
    expect(state().error).not.toBeNull();
    wizard.edit({ doc: 'ใบตรวจรับ', price: '5000' });
    expect(state().error).toBeNull();
    wizard.next();
    expect(state().step).toBe(2);
  });

  it('AC24: duplicate serials stop step 2', () => {
    const { wizard, state } = setup();
    wizard.edit({ doc: 'ใบตรวจรับ', price: '5000', qty: '3' });
    wizard.next();
    wizard.edit({ name: 'หุ่น', serials: 'A\nA' });
    wizard.next();
    expect(state().step).toBe(2);
    expect(state().error?.params).toEqual({ missing: 'serial ซ้ำกัน (A)' });
  });

  it('AC24: back goes one step, and a finished step can be reached again but a later one cannot', () => {
    const { wizard, state } = setup();
    wizard.edit({ doc: 'ใบตรวจรับ', price: '5000' });
    wizard.next();
    wizard.edit({ name: 'หุ่น' });
    wizard.next();
    expect(state().step).toBe(3);
    wizard.goTo(5);
    expect(state().step).toBe(3);
    wizard.goTo(1);
    expect(state().step).toBe(1);
    wizard.next();
    wizard.back();
    expect(state().step).toBe(1);
  });

  it('AC24: choosing a category sets its life, and medical tools get a 12 month calibration', () => {
    const { wizard, state } = setup();
    wizard.setCategory('เครื่องมือแพทย์ที่ใช้สอน');
    expect(state().form.life).toBe('5');
    expect(state().form.calib).toBe('12');
    wizard.setCategory('สำนักงาน');
    expect(state().form.life).toBe('10');
    expect(state().form.calib).toBe('12');
  });

  it('AC24: the wizard opens on today from the clock', () => {
    expect(setup().state().form.acq).toBe('2026-10-28');
  });
});

function fillLot(wizard: ReturnType<typeof setup>['wizard'], patch = {}) {
  wizard.edit({ doc: 'ใบตรวจรับ ตร.51/2569', price: '12000', qty: '3', name: 'หุ่นฝึกทำแผล', brand: 'MedTrain', serials: 'S1\nS2', ...patch });
  for (let i = 0; i < 4; i++) wizard.next();
}

describe('add-asset wizard save', () => {
  it('AC25: a lot of 3 gets consecutive codes above the highest in that prefix, padded to 4 digits', () => {
    const { wizard, assets, state } = setup();
    // The seed's highest 6515-002 code is the CPR manikin's 0001..: the lot starts right above it.
    const highest = Math.max(...assets().filter((a) => a.code.startsWith('6515-002-')).map((a) => parseInt(a.code.slice(10), 10)));
    fillLot(wizard);
    wizard.next();
    const made = assets().filter((a) => a.id.startsWith('N'));
    expect(made.map((a) => a.code)).toEqual([1, 2, 3].map((k) => '6515-002-' + String(highest + k).padStart(4, '0')));
    expect(state().doneIds).toEqual(['N1', 'N2', 'N3']);
  });

  it('AC25: history records the lot position and the serial, and an item with no serial says so', () => {
    const { wizard, assets } = setup();
    fillLot(wizard);
    wizard.next();
    const texts = assets().filter((a) => a.id.startsWith('N')).map((a) => a.events);
    expect(texts.map((e) => e.length)).toEqual([1, 1, 1]);
    expect(texts[0]![0]).toEqual({
      date: '28 ต.ค. 69', text: 'ตรวจรับ ขึ้นทะเบียน ติดป้าย QR และส่งมอบ นางสาวอรุณี แสงจันทร์ · ล็อต 1/3 · S/N S1', doc: 'ใบตรวจรับ ตร.51/2569',
    });
    expect(texts[1]![0]!.text).toContain('ล็อต 2/3 · S/N S2');
    expect(texts[2]![0]!.text).toContain('ล็อต 3/3 · S/N ยังไม่ระบุ');
  });

  it('AC25: one item uses the single serial field and has no lot text, and a brand goes in brackets', () => {
    const { wizard, assets } = setup();
    fillLot(wizard, { qty: '1', serials: '', serial: ' SN-9 ' });
    wizard.next();
    const made = assets().find((a) => a.id === 'N1')!;
    expect(made.name).toBe('หุ่นฝึกทำแผล (MedTrain)');
    expect(made.events[0]!.text).toBe('ตรวจรับ ขึ้นทะเบียน ติดป้าย QR และส่งมอบ นางสาวอรุณี แสงจันทร์ · S/N SN-9');
    expect(made.price).toBe(12000);
    expect(made.life).toBe(5);
    expect(made.status).toBe('พร้อมใช้');
    expect(made.calib).toBeNull();
  });

  it('AC25: no field of a saved asset is NaN', () => {
    const { wizard, assets } = setup();
    wizard.edit({ parts: [{ name: 'ตัวหลัก', qty: 'x', price: 'abc' }, { name: 'ฝา', qty: '', price: 'abc' }] });
    fillLot(wizard, { calib: '6' });
    wizard.next();
    const made = assets().filter((a) => a.id.startsWith('N'));
    expect(made).toHaveLength(3);
    made.forEach((a) => {
      expect(a.parts).toEqual([{ name: 'ตัวหลัก', qty: 1, price: 0 }, { name: 'ฝา', qty: 1, price: 0 }]);
      expect(a.calib).toEqual({ last: '2026-10-28', cycle: 6 });
      expect([a.price, a.life, ...a.parts.map((p) => p.qty + p.price)].every(Number.isFinite)).toBe(true);
    });
  });

  it('AC25: a transfer is recorded under its own method and a gift has no vendor', () => {
    const { wizard, assets } = setup();
    fillLot(wizard, { method: 'รับบริจาค', qty: '1', serials: '' });
    wizard.next();
    const made = assets().find((a) => a.id === 'N1')!;
    expect(made.vendor).toBe('รับบริจาค');
    expect(made.events[0]!.text.startsWith('รับบริจาค ขึ้นทะเบียน')).toBe(true);
  });

  it('AC25: pressing save twice makes the lot once', () => {
    const { wizard, assets, state } = setup();
    fillLot(wizard);
    const before = assets().length;
    wizard.next();
    wizard.submit();
    expect(assets().length).toBe(before + 3);
    expect(state().doneIds).toHaveLength(3);
    expect(state().step).toBe(1);
  });

  it('AC25: the next lot continues the codes and the ids', () => {
    const { wizard, assets } = setup();
    fillLot(wizard, { qty: '2', serials: '' });
    wizard.next();
    wizard.start();
    fillLot(wizard, { qty: '2', serials: '' });
    wizard.next();
    const made = assets().filter((a) => a.id.startsWith('N'));
    expect(made.map((a) => a.id)).toEqual(['N1', 'N2', 'N3', 'N4']);
    expect(new Set(made.map((a) => a.code)).size).toBe(4);
  });

  it('AC25: a lot that breaks a rule when saved makes nothing and shows the mockup message', () => {
    const { wizard, assets, state } = setup();
    fillLot(wizard);
    wizard.edit({ qty: '201' });
    const before = assets().length;
    wizard.next();
    expect(assets().length).toBe(before);
    expect(state().doneIds).toEqual([]);
    expect(state().error).toEqual({ code: 'LOT_INVALID', params: { missing: 'จำนวน (ล็อตละไม่เกิน 200 ชิ้น)' } });
    wizard.edit({ qty: 'abc' });
    wizard.next();
    expect(assets().length).toBe(before);
    expect(state().error?.params).toEqual({ missing: 'จำนวน' });
  });

  it('AC25: a missing required field at save is listed first', () => {
    const { wizard, state } = setup();
    fillLot(wizard);
    wizard.edit({ cust: '' });
    wizard.next();
    expect(state().error).toEqual({ code: 'SAVE_INCOMPLETE', params: { missing: 'ผู้รับผิดชอบ' } });
  });
});
