import { holderText } from '../modules/circulation';
import { AssetDetail } from '../modules/registry';
import { useStore } from '../shared/web/useStore';
import type { ScreenContext } from './screens';

/** Asset detail screen: finds the asset (the mockup falls back to the first one) and wires the buttons to navigation. */
export function AssetScreen({ modules, params, go }: ScreenContext) {
  const assets = useStore(modules.registry.assets);
  const loans = useStore(modules.circulation.loans);
  const borrowers = useStore(modules.circulation.borrowers);
  const asset = assets.find((a) => a.id === (params.selAsset ?? 'A1')) ?? assets[0];
  if (!asset) return null;
  return (
    <AssetDetail
      asset={asset}
      now={modules.clock.now()}
      holder={holderText(asset.id, loans, borrowers)}
      onBack={() => go('assets')}
      onLocate={() => go('map', { selAsset: asset.id })}
      onPrintLabel={() => go('print', { selAsset: asset.id, print: { kind: 'labels', ids: [asset.id], loanId: '', back: 'asset' } })}
      onRepair={() => go('repair', { repairAssetId: asset.id })}
    />
  );
}
