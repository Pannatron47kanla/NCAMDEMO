/** Every screen of the mockup. Add a key here when a later group ports a new screen. */
export type ScreenKey =
  | 'dash' | 'counter' | 'repair'
  | 'assets' | 'asset' | 'add' | 'roomscan' | 'map' | 'import'
  | 'cal' | 'disp' | 'audit' | 'reports'
  | 'settings' | 'print';

/** What a screen is told when it is opened. Later groups add fields here (filters, a selected ticket, ...). */
export interface ScreenParams {
  selAsset?: string;
}

export interface Navigation {
  screen: ScreenKey;
  params: ScreenParams;
}

export const START_SCREEN: Navigation = { screen: 'dash', params: {} };
