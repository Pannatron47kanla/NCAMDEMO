import { fixedClock } from '../../../../shared/clock';
import { createRegistryModule } from '../../../registry';
import { createMaintenanceModule } from '../../module';

/** A fresh registry and maintenance on the demo date. */
export function setup() {
  const clock = fixedClock(new Date(2026, 9, 28));
  const registry = createRegistryModule();
  const maintenance = createMaintenanceModule(clock, { assets: registry.catalog });
  return { clock, registry, maintenance, desk: maintenance.repairs, tickets: () => maintenance.tickets.get() };
}
