import type { Clock } from '../shared/clock';
import { createCirculationModule, type CirculationModule, type RepairIntake } from '../modules/circulation';
import { createRegistryModule, type RegistryModule } from '../modules/registry';

/** Every context, built from the seed and wired together. */
export interface AppModules {
  clock: Clock;
  registry: RegistryModule;
  circulation: CirculationModule;
}

/**
 * TEMPORARY stand-in for maintenance's repair intake (Group D, Task 22, replaces it): it opens no real
 * ticket and only numbers them like the mockup (WO-2569-032, ...). Delete it when `maintenance` is wired.
 */
function standInRepairIntake(): RepairIntake {
  let seq = 32;
  return { open: () => ({ id: 'WO-2569-0' + seq++, status: 'รอรับงาน' }) };
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
  const circulation = createCirculationModule(clock, { assets: registry.catalog, repairs: standInRepairIntake() });
  return { clock, registry, circulation };
}
