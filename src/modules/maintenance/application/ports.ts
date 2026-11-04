import type { AssetEvent, AssetStatus } from '../../registry';

/** What maintenance needs from the registry. `registry`'s `AssetCatalog` fits it. */
export interface AssetsPort {
  /** Only the status is read, to leave a borrowed asset as it is. */
  findById(id: string): { id: string; name: string; status: AssetStatus } | undefined;
  setStatus(id: string, status: AssetStatus): void;
  addEvent(id: string, event: AssetEvent): void;
}
