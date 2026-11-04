import type { Candidate, CaseEffect } from './case';

/** An older, simpler path: propose assets for auction without opening a case (mockup prepAuction, line 2045). */
export interface AuctionRequest {
  ids: string[];
}

/**
 * Picks the selected assets that are not borrowed. They become รอจำหน่าย with a history line dated today.
 * Returns undefined when none can be proposed.
 */
export function prepareAuction(candidates: Candidate[], today: Date): { request: AuctionRequest; effect: CaseEffect } | undefined {
  const ids = candidates.filter((c) => c.status !== 'ถูกยืม').map((c) => c.id);
  if (!ids.length) return undefined;
  return {
    request: { ids },
    effect: {
      status: 'รอจำหน่าย',
      lines: ids.map((assetId) => ({ assetId, date: today, text: 'เสนอจำหน่ายโดยการขายทอดตลาด (ครบอายุใช้งาน)', doc: 'บันทึกเสนอจำหน่าย' })),
    },
  };
}
