import type { Clock } from '../../../shared/clock';
import { th } from '../../../shared/dates';
import { createStore, type Store } from '../../../shared/store';
import {
  NOT_FOUND, confirm, newAuditRound, scanUnknown, setResult, sync, toggleOffline,
  type AuditRound,
} from '../domain/round';
import type { AssetsPort } from './ports';

/** The annual audit screen: record results (maybe offline), sync, then confirm. */
export class AuditService {
  readonly round: Store<AuditRound> = createStore<AuditRound>(newAuditRound());

  constructor(private readonly clock: Clock, private readonly assets: AssetsPort) {}

  toggleOffline(): void { this.round.set(toggleOffline); }
  setResult(id: string, r: string): void { this.round.set((s) => setResult(s, id, r)); }
  sync(): void { this.round.set(sync); }
  scanUnknown(): void { this.round.set(scanUnknown); }

  /**
   * Confirms every synced result. A confirmed ไม่พบ makes the asset สูญหาย / ไม่พบ, and every confirmed
   * result adds a history line to the asset.
   */
  confirm(): void {
    const { round, applied } = confirm(this.round.get());
    this.round.set(round);
    const date = th(this.clock.now(), 0);
    applied.forEach(({ id, r }) => {
      if (r === NOT_FOUND) this.assets.setStatus(id, 'สูญหาย / ไม่พบ');
      this.assets.addEvent(id, { date, text: 'ตรวจสอบพัสดุประจำปี 2569: ' + r, doc: 'รอบตรวจ 2569' });
    });
  }
}
