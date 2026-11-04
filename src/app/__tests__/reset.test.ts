import { describe, expect, it } from 'vitest';
import { fixedClock } from '../../shared/clock';
import { createAppModules } from '../modules';

const clock = fixedClock(new Date(2026, 9, 28));

describe('composition from the seed', () => {
  it('AC4: a new app instance starts from the seed', () => {
    const first = createAppModules(clock);
    expect(first.registry.catalog.findById('A1')?.status).toBe('พร้อมใช้');

    first.registry.catalog.setStatus('A1', 'รอซ่อม');
    first.registry.catalog.addEvent('A1', { date: '28 ต.ค. 69', text: 'แจ้งซ่อม', doc: 'WO-TEST' });
    expect(first.registry.catalog.findById('A1')?.status).toBe('รอซ่อม');
    expect(first.registry.catalog.findById('A1')?.events).toHaveLength(4);

    const second = createAppModules(clock);
    expect(second.registry.catalog.findById('A1')?.status).toBe('พร้อมใช้');
    expect(second.registry.catalog.findById('A1')?.events).toHaveLength(3);
    expect(second.registry.catalog.list()).toHaveLength(17);
  });

  it('AC4: the first instance is not touched by a later one', () => {
    const first = createAppModules(clock);
    first.registry.catalog.setStatus('A3', 'รอจำหน่าย');
    createAppModules(clock).registry.catalog.setStatus('A3', 'จำหน่ายแล้ว');
    expect(first.registry.catalog.findByCode('6515-002-0007')?.status).toBe('รอจำหน่าย');
  });

  it('AC4: every instance carries the clock it was built with', () => {
    expect(createAppModules(clock).clock.now()).toEqual(new Date(2026, 9, 28));
  });
});
