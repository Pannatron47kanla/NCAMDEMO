import type { Asset } from './asset';

/** The registry's own view of its assets (the other contexts use `AssetCatalog` instead). */
export interface AssetRepository {
  list(): Asset[];
  /** Appends new assets after the existing ones. */
  add(assets: Asset[]): void;
  /** Replaces the stored asset with the same id. */
  save(asset: Asset): void;
}
