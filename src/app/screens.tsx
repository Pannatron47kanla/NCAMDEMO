import type { ReactNode } from 'react';
import { AssetScreen } from './AssetScreen';
import { AuditScreen } from './AuditScreen';
import { CounterScreen } from './CounterScreen';
import { DisposalScreen } from './DisposalScreen';
import { AssetsScreen, RoomScanPage } from './RegisterScreens';
import { RepairScreen } from './RepairScreen';
import { CalendarScreen } from './calendar/CalendarScreen';
import { DashboardScreen } from './dashboard/DashboardScreen';
import { MapScreen } from './map/MapScreen';
import type { AppModules } from './modules';
import type { ScreenKey, ScreenParams } from './navigation';

/** What the Shell hands to every screen. */
export interface ScreenContext {
  modules: AppModules;
  params: ScreenParams;
  go(screen: ScreenKey, params?: ScreenParams): void;
}

export type ScreenRenderer = (ctx: ScreenContext) => ReactNode;

/**
 * The screens that are ported. To port a screen, add one entry here with its key from `ScreenKey`.
 * A key with no entry shows a placeholder in the Shell, so the menu always works.
 */
export const SCREENS: Partial<Record<ScreenKey, ScreenRenderer>> = {
  dash: () => <DashboardScreen />,
  asset: (ctx) => <AssetScreen {...ctx} />,
  counter: (ctx) => <CounterScreen {...ctx} />,
  repair: (ctx) => <RepairScreen {...ctx} />,
  assets: (ctx) => <AssetsScreen {...ctx} />,
  add: (ctx) => <AssetsScreen {...ctx} dialog="add" />,
  import: (ctx) => <AssetsScreen {...ctx} dialog="import" />,
  audit: (ctx) => <AuditScreen {...ctx} />,
  disp: (ctx) => <DisposalScreen {...ctx} />,
  roomscan: (ctx) => <RoomScanPage {...ctx} />,
  map: (ctx) => <MapScreen {...ctx} />,
  cal: (ctx) => <CalendarScreen {...ctx} />,
};

/**
 * What choosing a menu entry does before the screen opens. In the mockup the menu starts a blank wizard and
 * the import dialog on step 1, while other ways back to the same screen (such as "back" from printing) keep them as they were.
 */
export const ON_MENU: Partial<Record<ScreenKey, (modules: AppModules) => void>> = {
  add: (modules) => modules.registry.addAsset.start(),
  import: (modules) => modules.registry.importer.start(),
};
