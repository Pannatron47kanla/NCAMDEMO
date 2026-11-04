import { describe, expect, it } from 'vitest';
import { DisposalCase, type Candidate } from '../case';

const TODAY = new Date(2026, 9, 28);
const ok = (id: string): Candidate => ({ id, status: 'พร้อมใช้', hasOpenTicket: false });

function create(candidates: Candidate[], over: { seq?: number; hasOpenCase?: boolean } = {}) {
  return DisposalCase.create({ seq: over.seq ?? 1, reason: 'ครบอายุใช้งานและเสื่อมสภาพ', today: TODAY, candidates, hasOpenCase: over.hasOpenCase ?? false });
}

describe('creating a case', () => {
  it('AC33: a borrowed asset and an asset with an open ticket are left out; the others join', () => {
    const c = create([ok('A16'), { id: 'A2', status: 'ถูกยืม', hasOpenTicket: false }, { id: 'A4', status: 'รอซ่อม', hasOpenTicket: true }, ok('A17')])!;
    expect(c.data.ids).toEqual(['A16', 'A17']);
  });

  it('AC33: an asset already จำหน่ายแล้ว is left out', () => {
    const c = create([{ id: 'A1', status: 'จำหน่ายแล้ว', hasOpenTicket: false }, ok('A16')])!;
    expect(c.data.ids).toEqual(['A16']);
  });

  it('AC33: the assets of the case become รอจำหน่าย and each gets a history line with the case number', () => {
    const effect = create([ok('A16'), ok('A17')])!.opening();
    expect(effect.status).toBe('รอจำหน่าย');
    expect(effect.lines).toEqual([
      { assetId: 'A16', date: TODAY, text: 'เสนอจำหน่าย (ครบอายุใช้งานและเสื่อมสภาพ) แต่งตั้งคณะกรรมการสอบหาข้อเท็จจริง', doc: 'DS-2569-001' },
      { assetId: 'A17', date: TODAY, text: 'เสนอจำหน่าย (ครบอายุใช้งานและเสื่อมสภาพ) แต่งตั้งคณะกรรมการสอบหาข้อเท็จจริง', doc: 'DS-2569-001' },
    ]);
  });

  it('AC33: the first case is DS-2569-001 and the next number is padded to 3 digits', () => {
    expect(create([ok('A16')])!.data.id).toBe('DS-2569-001');
    expect(create([ok('A16')], { seq: 12 })!.data.id).toBe('DS-2569-012');
  });

  it('AC33: a new case starts at step 1 as an auction in round 1', () => {
    const d = create([ok('A16')])!.data;
    expect([d.step, d.method, d.round, d.fault, d.announced]).toEqual([1, 'auction', 1, 'none', false]);
  });

  it('AC33: a second create while one case is open does nothing', () => {
    expect(create([ok('A16')], { hasOpenCase: true })).toBeUndefined();
  });

  it('AC33: nothing is created when no selected asset can join', () => {
    expect(create([{ id: 'A2', status: 'ถูกยืม', hasOpenTicket: false }])).toBeUndefined();
    expect(create([])).toBeUndefined();
  });
});
