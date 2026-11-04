import { systemClock, type Clock } from '../../shared/clock';
import { createStore, type Store } from '../../shared/store';
import { AddAssetService } from './application/add-asset-service';
import type { Asset } from './domain/asset';
import type { AssetCatalog } from './domain/asset-catalog';
import { InMemoryAssetCatalog } from './infrastructure/in-memory-asset-catalog';
import { seedAssets } from './infrastructure/seed';

export interface RegistryModule {
  /** The port other contexts use. */
  catalog: AssetCatalog;
  /** The same data as an observable, for screens: `useStore(registry.assets)`. */
  assets: Store<Asset[]>;
  /** The ขึ้นทะเบียนใหม่ wizard. */
  addAsset: AddAssetService;
}

/**
 * Builds the registry from the seed. Every call gives a separate, fresh copy.
 * The clock gives today's date to new history lines and to the wizard's default acquisition date.
 */
export function createRegistryModule(clock: Clock = systemClock): RegistryModule {
  const assets = createStore<Asset[]>(seedAssets());
  return { catalog: new InMemoryAssetCatalog(assets), assets, addAsset: new AddAssetService(clock) };
}
