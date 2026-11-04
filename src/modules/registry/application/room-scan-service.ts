import type { Clock } from '../../../shared/clock';
import { th } from '../../../shared/dates';
import { createStore, type Store } from '../../../shared/store';
import { chooseRoom, newRoomScan, removeItem, saveScan, scanCode, toggleConfirm, type RoomScanState } from '../domain/room-scan';
import type { AssetRepository } from '../domain/repositories';

/** The กำหนดห้อง screen: choose a room, scan assets into it, check the moves, then save. */
export class RoomScanService {
  readonly state: Store<RoomScanState> = createStore<RoomScanState>(newRoomScan());

  constructor(private readonly clock: Clock, private readonly assets: AssetRepository) {}

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

  /** "ยืนยันย้าย" / "ยกเลิกย้าย" on a move. */
  toggleConfirm(id: string): void {
    this.patch((s) => toggleConfirm(s, id));
  }

  /** "เอาออก". */
  remove(id: string): void {
    this.patch((s) => removeItem(s, id));
  }

  /**
   * "บันทึก": changes the room of first placements and confirmed moves and adds a history line to each.
   * With nothing to save it does nothing, so pressing it twice cannot move an asset or add history twice.
   */
  save(): void {
    const result = saveScan(this.state.get(), this.assets.list(), th(this.clock.now(), 0));
    result.changed.forEach((a) => this.assets.save(a));
    this.state.set(result.state);
  }

  /** "เริ่มใหม่" and the lot's "กำหนดห้องให้ทั้งล็อต": an empty scan with no room. */
  reset(): void {
    this.state.set(newRoomScan());
  }
}
