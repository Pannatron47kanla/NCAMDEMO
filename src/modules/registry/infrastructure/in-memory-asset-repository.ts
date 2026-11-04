import type { Store } from '../../../shared/store';
import type { Asset } from '../domain/asset';
import type { AssetRepository } from '../domain/repositories';

/** Assets kept in the same store as `InMemoryAssetCatalog`, so a change made by either shows in both. */
export class InMemoryAssetRepository implements AssetRepository {
  constructor(private readonly assets: Store<Asset[]>) {}

  list(): Asset[] {
    return this.assets.get().slice();
  }

  add(assets: Asset[]): void {
    this.assets.set((list) => list.concat(assets));
  }

  save(asset: Asset): void {
    this.assets.set((list) => list.map((a) => (a.id === asset.id ? asset : a)));
  }
}
