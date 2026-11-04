import { createStore, type Store } from '../../shared/store';
import type { Asset } from './domain/asset';
import type { AssetCatalog } from './domain/asset-catalog';
import { InMemoryAssetCatalog } from './infrastructure/in-memory-asset-catalog';
import { seedAssets } from './infrastructure/seed';

export interface RegistryModule {
  /** The port other contexts use. */
  catalog: AssetCatalog;
  /** The same data as an observable, for screens: `useStore(registry.assets)`. */
  assets: Store<Asset[]>;
}

/** Builds the registry from the seed. Every call gives a separate, fresh copy. */
export function createRegistryModule(): RegistryModule {
  const assets = createStore<Asset[]>(seedAssets());
  return { catalog: new InMemoryAssetCatalog(assets), assets };
}
