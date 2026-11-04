import { fixedClock } from '../../../../shared/clock';
import { createMaintenanceModule } from '../../../maintenance';
import { createRegistryModule } from '../../../registry';
import { createDisposalModule } from '../../module';

/** A fresh registry, maintenance and disposal on the demo date. */
export function setup() {
  const clock = fixedClock(new Date(2026, 9, 28));
  const registry = createRegistryModule(clock);
  const maintenance = createMaintenanceModule(clock, { assets: registry.catalog });
  const disposal = createDisposalModule(clock, { assets: registry.catalog, repairs: maintenance.repairs });
  const asset = (id: string) => registry.catalog.findById(id)!;
  return { clock, registry, maintenance, disposal, svc: disposal.disposal, asset };
}
