import { describe, expect, it } from 'vitest';
import { DomainError } from '../../../../shared/domain-error';
import { RepairTicket } from '../ticket';

const NOW = new Date(2026, 9, 28);
const input = (symptom: string) => ({ id: 'WO-2569-032', assetId: 'A3', symptom, needDate: new Date(2026, 9, 31), reporter: 'lab.officer', createdAt: NOW });

describe('opening a ticket', () => {
  it('AC21: a blank or spaces-only symptom throws SYMPTOM_REQUIRED and opens no ticket', () => {
    for (const symptom of ['', '   ', '\n\t ']) {
      let error: unknown;
      try { RepairTicket.open(input(symptom)); } catch (e) { error = e; }
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).code).toBe('SYMPTOM_REQUIRED');
    }
  });
});
