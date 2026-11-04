import type { ReactNode } from 'react';
import { DashboardScreen } from './dashboard/DashboardScreen';
import type { ScreenKey, ScreenParams } from './navigation';

/** What the Shell hands to every screen. */
export interface ScreenContext {
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
};
