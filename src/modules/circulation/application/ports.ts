import type { Asset, AssetEvent, AssetStatus } from '../../registry';

/** What circulation needs from the registry. `registry`'s `AssetCatalog` fits it; `main` passes the real one in. */
export interface AssetsPort {
  list(): Asset[];
  findById(id: string): Asset | undefined;
  findByCode(code: string): Asset | undefined;
  setStatus(id: string, status: AssetStatus): void;
  addEvent(id: string, event: AssetEvent): void;
}

/** A repair request raised by the counter when an asset comes back broken. */
export interface RepairIntakeInput {
  assetId: string;
  symptom: string;
  needDate: Date;
  reporter: string;
}

/** The ticket maintenance opened. Only what circulation needs to know about it. */
export interface RepairTicketRef {
  id: string;
  status: string;
}

/** What circulation needs from maintenance. The app wires the real one in. */
export interface RepairIntake {
  open(input: RepairIntakeInput): RepairTicketRef;
}
