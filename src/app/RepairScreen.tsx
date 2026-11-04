import { RepairScreen as Repair } from '../modules/maintenance';
import { useStore } from '../shared/web/useStore';
import type { ScreenContext } from './screens';

/** Repair screen: reads the registry's assets and passes along the asset chosen on the asset page. */
export function RepairScreen({ modules, params }: ScreenContext) {
  const assets = useStore(modules.registry.assets);
  return <Repair maintenance={modules.maintenance} assets={assets} now={modules.clock.now()} repairAssetId={params.repairAssetId} />;
}
