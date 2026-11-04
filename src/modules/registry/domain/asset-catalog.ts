import type { Asset, AssetEvent, AssetStatus } from './asset';

/**
 * What the other contexts may do with assets. They never touch the registry's data directly:
 * circulation, maintenance, audit and disposal all go through this port (see context-map.md).
 */
export interface AssetCatalog {
  list(): Asset[];
  findById(id: string): Asset | undefined;
  findByCode(code: string): Asset | undefined;
  setStatus(id: string, status: AssetStatus): void;
  /** Appends a history line. The caller formats `event.date` from the Clock. */
  addEvent(id: string, event: AssetEvent): void;
}
