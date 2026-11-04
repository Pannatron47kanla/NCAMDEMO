import { systemClock, type Clock } from '../../shared/clock';
import { createStore, type Store } from '../../shared/store';
import { AddAssetService } from './application/add-asset-service';
import { ImportService } from './application/import-service';
import { RoomScanService } from './application/room-scan-service';
import type { Asset } from './domain/asset';
import type { AssetCatalog } from './domain/asset-catalog';
import { InMemoryAssetCatalog } from './infrastructure/in-memory-asset-catalog';
import { InMemoryAssetRepository } from './infrastructure/in-memory-asset-repository';
import { seedAssets } from './infrastructure/seed';

export interface RegistryModule {
  /** The port other contexts use. */
  catalog: AssetCatalog;
  /** The same data as an observable, for screens: `useStore(registry.assets)`. */
  assets: Store<Asset[]>;
  /** The ขึ้นทะเบียนใหม่ wizard. */
  addAsset: AddAssetService;
  /** The import dialog. */
  importer: ImportService;
  /** The room assignment screen. */
  roomScan: RoomScanService;
}

/**
 * Builds the registry from the seed. Every call gives a separate, fresh copy.
 * The clock gives today's date to new history lines and to the wizard's default acquisition date.
 */
export function createRegistryModule(clock: Clock = systemClock): RegistryModule {
  const assets = createStore<Asset[]>(seedAssets());
  const repository = new InMemoryAssetRepository(assets);
  return { catalog: new InMemoryAssetCatalog(assets), assets, addAsset: new AddAssetService(clock, repository), importer: new ImportService(clock, repository), roomScan: new RoomScanService(clock, repository) };
}
