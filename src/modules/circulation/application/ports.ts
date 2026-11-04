import type { Asset, AssetEvent, AssetStatus } from '../../registry';

/** What circulation needs from the registry. `registry`'s `AssetCatalog` fits it; `main` passes the real one in. */
export interface AssetsPort {
  list(): Asset[];
  findById(id: string): Asset | undefined;
  findByCode(code: string): Asset | undefined;
  setStatus(id: string, status: AssetStatus): void;
  addEvent(id: string, event: AssetEvent): void;
}
