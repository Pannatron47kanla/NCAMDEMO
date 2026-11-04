import { describe, expect, it } from 'vitest';
import { DomainError } from '../../../../shared/domain-error';
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

const open = () => create([ok('A16'), ok('A17')])!;

describe('recording the finding and approving the method', () => {
  it('AC34: the finding moves the case to step 2 and logs the committee text on the planned fact date', () => {
    const c = open();
    const effect = c.recordFact('none');
    expect(c.data.step).toBe(2);
    expect(effect.lines.map((l) => [l.assetId, l.text, l.doc])).toEqual([
      ['A16', 'กรรมการสอบหาข้อเท็จจริง: เสื่อมสภาพจากการใช้งานตามปกติ ไม่มีผู้ต้องรับผิด', 'DS-2569-001'],
      ['A17', 'กรรมการสอบหาข้อเท็จจริง: เสื่อมสภาพจากการใช้งานตามปกติ ไม่มีผู้ต้องรับผิด', 'DS-2569-001'],
    ]);
    expect(effect.lines[0]!.date).toEqual(c.data.plan.fact);
    expect(open().recordFact('liable').lines[0]!.text).toBe('กรรมการสอบหาข้อเท็จจริง: มีผู้ต้องรับผิด ชดใช้เรียบร้อยแล้ว');
  });

  it('AC34: a direct sale with a total of 500,001 baht throws DIRECT_SALE_LIMIT and changes nothing', () => {
    const c = open();
    c.recordFact('none');
    let error: unknown;
    try { c.approve('direct', 500001); } catch (e) { error = e; }
    expect(error).toBeInstanceOf(DomainError);
    expect((error as DomainError).code).toBe('DIRECT_SALE_LIMIT');
    expect((error as DomainError).params).toEqual({ total: 500001 });
    expect(c.data.step).toBe(2);
  });

  it('AC34: a direct sale with exactly 500,000 baht is approved and moves to step 3', () => {
    const c = open();
    c.recordFact('none');
    const effect = c.approve('direct', 500000);
    expect(c.data.step).toBe(3);
    expect(c.data.method).toBe('direct');
    expect(effect.lines[0]!.text).toBe('ผู้อำนวยการอนุมัติจำหน่ายโดยวิธีขายโดยวิธีเฉพาะเจาะจง');
    expect(effect.lines[0]!.date).toEqual(c.data.plan.approve);
  });

  it('AC34: the limit applies only to a direct sale; an auction above 500,000 baht is approved', () => {
    const c = open();
    c.recordFact('none');
    c.approve('auction', 900000);
    expect(c.data.step).toBe(3);
  });
});
