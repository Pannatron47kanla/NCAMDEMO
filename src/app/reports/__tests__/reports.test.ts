import { describe, expect, it } from 'vitest';
import { fixedClock } from '../../../shared/clock';
import { createAppModules, type AppModules } from '../../modules';
import { buildReports } from '../reports';

const NOW = new Date(2026, 9, 28);

function cards(m: AppModules) {
  return buildReports({ assets: m.registry.assets.get(), audit: m.audit.round.get(), current: m.disposal.current.get(), done: m.disposal.done.get() }, NOW);
}
const card = (m: AppModules, kind: string) => cards(m).find((c) => c.kind === kind)!;

describe('report cards', () => {
  it('AC44: six cards in order; the auction and result cards start disabled', () => {
    const m = createAppModules(fixedClock(NOW));
    expect(cards(m).map((c) => c.kind)).toEqual(['register', 'disposal', 'calib', 'audit', 'auction', 'dispResult']);
    expect(card(m, 'auction')).toMatchObject({ off: true, note: 'ต้องมีเรื่องจำหน่ายที่อนุมัติวิธีขายทอดตลาดแล้ว' });
    expect(card(m, 'dispResult')).toMatchObject({ off: true, note: 'ยังไม่มีเรื่องที่ลงจ่ายแล้ว' });
    expect(card(m, 'register').note).toBe(m.registry.assets.get().length + ' รายการ');
  });

  it('AC44: the audit card counts confirmed results', () => {
    const m = createAppModules(fixedClock(NOW));
    expect(card(m, 'audit').note).toBe('ยืนยันแล้ว 3 รายการ');
    m.audit.audit.setResult('A1', 'พบ');
    m.audit.audit.confirm();
    expect(card(m, 'audit').note).toBe('ยืนยันแล้ว 4 รายการ');
  });

  it('AC44: writing an asset off lowers the register count', () => {
    const m = createAppModules(fixedClock(NOW));
    const before = m.registry.assets.get().length;
    m.registry.catalog.setStatus('A1', 'จำหน่ายแล้ว');
    expect(card(m, 'register').note).toBe(before - 1 + ' รายการ');
  });
});
