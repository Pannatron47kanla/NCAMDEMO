import type { Store } from '../../../shared/store';
import type { Asset, AssetEvent, AssetStatus } from '../domain/asset';
import type { AssetCatalog } from '../domain/asset-catalog';

/**
 * Assets kept in a store loaded from the seed. Changes replace the asset object, never edit it,
 * so React sees the change and an old list stays as it was.
 */
export class InMemoryAssetCatalog implements AssetCatalog {
  constructor(private readonly assets: Store<Asset[]>) {}

  list(): Asset[] {
    return this.assets.get().slice();
  }

  findById(id: string): Asset | undefined {
    return this.assets.get().find((a) => a.id === id);
  }

  findByCode(code: string): Asset | undefined {
    return this.assets.get().find((a) => a.code === code);
  }

  setStatus(id: string, status: AssetStatus): void {
    this.update(id, (a) => ({ ...a, status }));
  }

  addEvent(id: string, event: AssetEvent): void {
    this.update(id, (a) => ({ ...a, events: a.events.concat([event]) }));
  }

  private update(id: string, change: (a: Asset) => Asset): void {
    this.assets.set((list) => list.map((a) => (a.id === id ? change(a) : a)));
  }
}
