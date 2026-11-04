import { fixedClock } from '../../../../shared/clock';
import { createRegistryModule } from '../../../registry';
import { createCirculationModule } from '../../module';

/** A fresh registry and circulation on the demo date. */
export function setup() {
  const clock = fixedClock(new Date(2026, 9, 28));
  const registry = createRegistryModule();
  const circulation = createCirculationModule(clock, { assets: registry.catalog });
  return { clock, registry, circulation, counter: circulation.counter, state: () => circulation.counter.state.get() };
}
