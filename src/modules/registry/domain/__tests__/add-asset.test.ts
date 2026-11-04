import { describe, expect, it } from 'vitest';
import { DomainError } from '../../../../shared/domain-error';
import { assertCanLeave, lotSize, missingFor, newAssetForm, serialList, type NewAssetForm } from '../new-asset';

const TODAY = new Date(2026, 9, 28);

function form(patch: Partial<NewAssetForm> = {}): NewAssetForm {
  return { ...newAssetForm(TODAY), doc: 'ใบตรวจรับ ตร.51/2569', price: '1000', name: 'หุ่นฝึกทำแผล', ...patch };
}

function codeOf(run: () => void): string | undefined {
  try { run(); } catch (e) { return e instanceof DomainError ? e.code : 'other'; }
  return undefined;
}

describe('add-asset wizard validation', () => {
  it('AC24: a blank form lists what step 1 is missing', () => {
    expect(missingFor(newAssetForm(TODAY), 1)).toEqual(['เลขที่เอกสาร', 'ราคา']);
  });

  it('AC24: a transfer or donation asks for the estimated value, not the price', () => {
    expect(missingFor({ ...newAssetForm(TODAY), method: 'รับบริจาค' }, 1)).toEqual(['เลขที่เอกสาร', 'มูลค่าประเมิน']);
  });

  it('AC24: a missing acquisition date is listed', () => {
    expect(missingFor(form({ acq: '' }), 1)).toEqual(['วันที่ได้มา']);
  });

  it.each(['0', '201', 'abc', ''])('AC24: quantity "%s" is rejected on step 1', (qty) => {
    const miss = missingFor(form({ qty }), 1);
    expect(miss).toHaveLength(1);
    expect(miss[0]).toBe(qty === '201' ? 'จำนวน (ล็อตละไม่เกิน 200 ชิ้น)' : 'จำนวน');
    expect(codeOf(() => assertCanLeave(form({ qty }), 1))).toBe('STEP_INCOMPLETE');
  });

  it.each(['1', '200'])('AC24: quantity %s is accepted', (qty) => {
    expect(missingFor(form({ qty }), 1)).toEqual([]);
  });

  it.each(['abc', '', '0'])('AC24: price "%s" is rejected, never stored as a number', (price) => {
    expect(missingFor(form({ price }), 1)).toEqual(['ราคา']);
  });

  it('AC24: the lot size shown for text that is not a number is 1, never NaN', () => {
    expect(['abc', '', '0', '-5', '201', '3'].map(lotSize)).toEqual([1, 1, 1, 1, 200, 3]);
  });

  it('AC24: step 2 needs a name and a life above zero', () => {
    expect(missingFor(form({ name: ' ', life: '0' }), 2)).toEqual(['ชื่อครุภัณฑ์', 'อายุการใช้งาน']);
    expect(missingFor(form({ life: 'abc' }), 2)).toEqual(['อายุการใช้งาน']);
    expect(missingFor(form({ life: '' }), 2)).toEqual(['อายุการใช้งาน']);
  });

  it('AC24: duplicate serials are listed, three at most', () => {
    const miss = missingFor(form({ qty: '9', serials: 'A\nB\nA\nB\nC\nC\nD\nD' }), 2);
    expect(miss).toEqual(['serial ซ้ำกัน (A, B, C)']);
  });

  it('AC24: more serials than items is rejected, and serials split on commas, semicolons and tabs', () => {
    expect(serialList(' A ,B;C\tD\n\nE ')).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(missingFor(form({ qty: '2', serials: 'A,B,C' }), 2)).toEqual(['serial มากกว่าจำนวนชิ้น']);
    expect(missingFor(form({ qty: '3', serials: 'A,B,C' }), 2)).toEqual([]);
  });

  it('AC24: step 3 needs the custodian, and steps 4 and 5 have nothing to check', () => {
    expect(missingFor(form({ cust: '  ' }), 3)).toEqual(['ผู้รับผิดชอบ']);
    expect(missingFor(form({ cust: '' }), 4)).toEqual([]);
    expect(missingFor(form({ cust: '' }), 5)).toEqual([]);
  });

  it('AC24: leaving a step with problems throws STEP_INCOMPLETE with the list joined by commas', () => {
    try {
      assertCanLeave(newAssetForm(TODAY), 1);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(DomainError);
      expect((e as DomainError).code).toBe('STEP_INCOMPLETE');
      expect((e as DomainError).params).toEqual({ missing: 'เลขที่เอกสาร, ราคา' });
    }
  });
});
