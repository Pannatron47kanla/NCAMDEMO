import type { Asset, AssetEvent, AssetStatus } from '../../registry';

/** What disposal needs from the registry. `registry`'s `AssetCatalog` fits it. */
export interface AssetsPort {
  list(): Asset[];
  findById(id: string): Asset | undefined;
  setStatus(id: string, status: AssetStatus): void;
  addEvent(id: string, event: AssetEvent): void;
}

/** What disposal needs from maintenance. `maintenance.repairs` fits it. */
export interface OpenRepairsPort {
  hasOpenTicket(assetId: string): boolean;
}
