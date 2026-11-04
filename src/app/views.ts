import { createStore, type Store } from '../shared/store';
import type { EventKind } from './calendar/events';

/** The calendar controls. They stay when the user leaves the screen and comes back, as in the mockup. */
export interface CalendarView {
  /** Months from October 2026 (mockup calOff). */
  monthOffset: number;
  kinds: Record<EventKind, boolean>;
}

/** The map controls (mockup mapCat, mapSel, mapView, mapB, mapF, mapAngle). */
export interface MapView {
  sel: string | null;
  cat: string;
  view: '3d' | 'floor';
  building: string;
  floor: number;
  angle: number;
}

export interface AppViews {
  calendar: Store<CalendarView>;
  map: Store<MapView>;
}

export function createAppViews(): AppViews {
  return {
    calendar: createStore<CalendarView>({ monthOffset: 0, kinds: { cal: true, disp: true, loan: true, repair: true, audit: true, auction: true } }),
    map: createStore<MapView>({ sel: 'A1', cat: 'ทั้งหมด', view: '3d', building: 'B1', floor: 2, angle: 40 }),
  };
}
