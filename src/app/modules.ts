import type { Clock } from '../shared/clock';
import { createRegistryModule, type RegistryModule } from '../modules/registry';

/** Every context, built from the seed and wired together. */
export interface AppModules {
  clock: Clock;
  registry: RegistryModule;
}

/**
 * The single place where contexts are built and connected. `main.tsx` calls it once per page load,
 * so a reload starts again from the seed (AC4), and tests call it to get a fresh app.
 *
 * To add a context: build it here and add it to `AppModules`. Pass it only what it asks for through
 * its ports, for example `createCirculationModule(clock, { assets: registry.catalog })`. Build the
 * contexts that others depend on first (registry, then maintenance, then circulation).
 */
export function createAppModules(clock: Clock): AppModules {
  const registry = createRegistryModule();
  return { clock, registry };
}
