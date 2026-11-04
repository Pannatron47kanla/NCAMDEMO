import { describe, expect, it } from 'vitest';
import { fixedClock } from '../../../../shared/clock';
import { createRegistryModule } from '../../../registry';
import { createAuditModule } from '../../module';

function setup() {
  const clock = fixedClock(new Date(2026, 9, 28));
  const registry = createRegistryModule();
  const audit = createAuditModule(clock, { assets: registry.catalog });
  return { registry, audit, svc: audit.audit, asset: (id: string) => registry.catalog.findById(id)! };
}

describe('audit service: confirming results', () => {
  it('AC32: ไม่พบ sets สูญหาย / ไม่พบ and adds history', () => {
    const { svc, asset } = setup();
    const before = asset('A1').events.length;
    svc.setResult('A1', 'ไม่พบ');
    expect(asset('A1').status).not.toBe('สูญหาย / ไม่พบ');
    svc.confirm();
    expect(asset('A1').status).toBe('สูญหาย / ไม่พบ');
    expect(asset('A1').events.length).toBe(before + 1);
    expect(asset('A1').events.at(-1)).toEqual({ date: '28 ต.ค. 69', text: 'ตรวจสอบพัสดุประจำปี 2569: ไม่พบ', doc: 'รอบตรวจ 2569' });
  });

  it('AC32: a result other than ไม่พบ adds history and keeps the status', () => {
    const { svc, asset } = setup();
    const status = asset('A2').status;
    svc.setResult('A2', 'ชำรุด');
    svc.confirm();
    expect(asset('A2').status).toBe(status);
    expect(asset('A2').events.at(-1)!.text).toBe('ตรวจสอบพัสดุประจำปี 2569: ชำรุด');
  });

  it('AC32: setResult on a confirmed row changes nothing', () => {
    const { svc, audit } = setup();
    svc.setResult('A1', 'พบ');
    svc.confirm();
    const before = audit.round.get();
    svc.setResult('A1', 'ไม่พบ');
    expect(audit.round.get()).toBe(before);
    expect(audit.round.get().res.A1).toEqual({ r: 'พบ', synced: true, confirmed: true });
  });

  it('AC32: pressing confirm twice adds history only once', () => {
    const { svc, asset } = setup();
    const before = asset('A3').events.length;
    svc.setResult('A3', 'ไม่พบ');
    svc.confirm();
    svc.confirm();
    expect(asset('A3').events.length).toBe(before + 1);
  });

  it('AC32: an unsynced result leaves the asset untouched until sync and confirm', () => {
    const { svc, asset } = setup();
    svc.toggleOffline();
    svc.setResult('A4', 'ไม่พบ');
    svc.confirm();
    expect(asset('A4').status).not.toBe('สูญหาย / ไม่พบ');
    svc.sync();
    svc.confirm();
    expect(asset('A4').status).toBe('สูญหาย / ไม่พบ');
  });
});
