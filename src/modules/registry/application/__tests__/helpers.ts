import { fixedClock } from '../../../../shared/clock';
import { createRegistryModule } from '../../module';

/** A fresh registry on the demo date. */
export function setup() {
  const clock = fixedClock(new Date(2026, 9, 28));
  const registry = createRegistryModule(clock);
  return { clock, registry, list: registry.list, wizard: registry.addAsset, importer: registry.importer, roomScan: registry.roomScan, state: () => registry.addAsset.state.get(), assets: () => registry.assets.get() };
}
