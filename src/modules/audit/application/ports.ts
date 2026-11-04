import type { AssetEvent, AssetStatus } from '../../registry';

/** What audit needs from the registry. `registry`'s `AssetCatalog` fits it. */
export interface AssetsPort {
  setStatus(id: string, status: AssetStatus): void;
  addEvent(id: string, event: AssetEvent): void;
}
