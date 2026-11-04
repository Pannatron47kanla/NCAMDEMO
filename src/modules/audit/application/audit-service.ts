import type { Clock } from '../../../shared/clock';
import { createStore, type Store } from '../../../shared/store';
import {
  confirm, newAuditRound, scanUnknown, setResult, sync, toggleOffline,
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

  /** Confirms every synced result. */
  confirm(): void {
    void this.clock;
    void this.assets;
    this.round.set((s) => confirm(s).round);
  }
}
