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
