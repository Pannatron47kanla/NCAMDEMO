// The only file other contexts and the app may import from the registry.
export type { Asset, AssetEvent, AssetStatus, Calibration, Part } from './domain/asset';
export type { AssetCatalog } from './domain/asset-catalog';
export { assetInfo, type AssetInfo, type LifeBucket } from './domain/asset-info';
export {
  CATS, CLASS, COUNTER, CUST, IMPORT_ROWS, LAB1, LAB2, LABD, MAX_LOT_SIZE, PENDING_ROOM, STORE, SUPPLY, V1, V2, V3, V4, VENDORS, iconOf,
  type Category, type ImportRow,
} from './domain/constants';
export { BLD, DECOR, ROOMS, TREES, bldOf, locText, roomCode, roomOf, type Building, type Room, type Tree } from './domain/locations';
export { ALL_CATEGORIES, ALL_STATUSES, STATUS_FILTERS, type AssetFilter } from './domain/asset-list';
export { createRegistryModule, type RegistryModule } from './module';
export { AssetDetail, type AssetDetailProps } from './interface/web/AssetDetail';
export { AddAssetDialog, type AddAssetDialogProps } from './interface/web/AddAssetDialog';
export { AssetListScreen, type AssetListScreenProps } from './interface/web/AssetListScreen';
export { ImportDialog, type ImportDialogProps } from './interface/web/ImportDialog';
export { RoomScanScreen, type RoomScanScreenProps } from './interface/web/RoomScanScreen';
