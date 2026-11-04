import { fixedClock } from '../../../../shared/clock';
import { createRegistryModule } from '../../../registry';
import { createCirculationModule } from '../../module';
import type { RepairIntake, RepairIntakeInput, RepairTicketRef } from '../ports';

/** A stand-in for maintenance: remembers every ticket it was asked to open. */
export class FakeRepairIntake implements RepairIntake {
  readonly calls: RepairIntakeInput[] = [];
  readonly tickets: RepairTicketRef[] = [];

  open(input: RepairIntakeInput): RepairTicketRef {
    this.calls.push(input);
    const ticket = { id: 'WO-2569-0' + (32 + this.tickets.length), status: 'รอรับงาน' };
    this.tickets.push(ticket);
    return ticket;
  }
}

/** A fresh registry and circulation on the demo date. */
export function setup() {
  const clock = fixedClock(new Date(2026, 9, 28));
  const registry = createRegistryModule();
  const repairs = new FakeRepairIntake();
  const circulation = createCirculationModule(clock, { assets: registry.catalog, repairs });
  return { clock, registry, repairs, circulation, counter: circulation.counter, state: () => circulation.counter.state.get() };
}
