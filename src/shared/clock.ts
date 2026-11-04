/** The only way business code learns the date. Never call `new Date()` with no arguments there. */
export interface Clock {
  now(): Date;
}

/** The demo date from the mockup, 28 October 2026. Each call returns a new Date, so callers cannot change it. */
export const systemClock: Clock = {
  now: () => new Date(2026, 9, 28),
};

/** A clock stuck at one moment, for tests. */
export function fixedClock(at: Date): Clock {
  return { now: () => new Date(at.getTime()) };
}
