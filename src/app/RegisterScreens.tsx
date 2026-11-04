import { AddAssetDialog, AssetListScreen, ImportDialog, RoomScanScreen } from '../modules/registry';
import type { ScreenContext } from './screens';

/**
 * The register list. The add-asset wizard and the import dialog are drawn over it, as in the mockup,
 * so `dialog` says which of them (if any) is open.
 */
export function AssetsScreen({ modules, go, dialog }: ScreenContext & { dialog?: 'add' | 'import' }) {
  const { registry, clock } = modules;
  const printLabels = (ids: string[], back: 'assets' | 'add') => go('print', { print: { kind: 'labels', ids, loanId: '', back } });
  const closeDialog = () => {
    if (dialog === 'add') registry.addAsset.close();
    if (dialog === 'import') registry.importer.close();
    go('assets');
  };
  return (
    <AssetListScreen
      registry={registry}
      now={clock.now()}
      onOpen={(id) => go('asset', { selAsset: id })}
      onRoomScan={() => go('roomscan')}
      onImport={() => { registry.importer.start(); go('import'); }}
      onAdd={() => { registry.addAsset.start(); go('add'); }}
      onPrint={(ids) => printLabels(ids, 'assets')}
    >
      {dialog === 'add' ? (
        <AddAssetDialog
          registry={registry}
          now={clock.now()}
          onClose={closeDialog}
          onPrintLabels={(ids) => printLabels(ids, 'add')}
          onLocate={(id) => go('map', { selAsset: id })}
          onOpenAsset={(id) => { registry.addAsset.close(); go('asset', { selAsset: id }); }}
          onShowLot={(name) => { registry.addAsset.close(); registry.list.show({ q: name }); go('assets'); }}
          onScanRoom={() => { registry.roomScan.reset(); registry.addAsset.close(); go('roomscan'); }}
        />
      ) : null}
      {dialog === 'import' ? (
        <ImportDialog
          registry={registry}
          onClose={closeDialog}
          onFindPending={() => { registry.importer.start(); registry.list.show({ q: 'รอระบุห้อง' }); go('assets'); }}
        />
      ) : null}
    </AssetListScreen>
  );
}

export function RoomScanPage({ modules, go }: ScreenContext) {
  return <RoomScanScreen registry={modules.registry} onLocate={(id) => go('map', { selAsset: id })} onOpenMap={() => go('map')} />;
}
