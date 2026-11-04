import { createStore, type Store } from '../../../shared/store';
import { chooseRoom, newRoomScan, scanCode, type RoomScanState } from '../domain/room-scan';
import type { AssetRepository } from '../domain/repositories';

/** The กำหนดห้อง screen: choose a room, scan assets into it, check the moves, then save. */
export class RoomScanService {
  readonly state: Store<RoomScanState> = createStore<RoomScanState>(newRoomScan());

  constructor(private readonly assets: AssetRepository) {}

  private patch(change: (s: RoomScanState) => RoomScanState): void {
    this.state.set(change);
  }

  setScan(scan: string): void {
    this.patch((s) => ({ ...s, scan }));
  }

  /** The room select. An empty value clears the room. */
  chooseRoom(room: string): void {
    this.patch((s) => chooseRoom(s, room));
  }

  /** Scans `code`, or the text in the scan box when none is given (Enter in the box). */
  scan(code?: string): void {
    this.patch((s) => scanCode(s, code ?? s.scan, this.assets.list()));
  }

  /** "เริ่มใหม่" and the lot's "กำหนดห้องให้ทั้งล็อต": an empty scan with no room. */
  reset(): void {
    this.state.set(newRoomScan());
  }
}
