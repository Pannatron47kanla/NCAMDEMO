import type { Clock } from '../../shared/clock';
import { createStore, type Store } from '../../shared/store';
import { RepairService } from './application/repair-service';
import type { AssetsPort } from './application/ports';
import type { RepairTicket } from './domain/ticket';
import { InMemoryTicketRepository } from './infrastructure/in-memory-ticket-repository';
import { SEED_TICKET_SEQ, seedTickets } from './infrastructure/seed';

export interface MaintenancePorts {
  assets: AssetsPort;
}

export interface MaintenanceModule {
  /** The repair screen's service. It is also the `RepairIntake` and `OpenRepairs` other contexts use. */
  repairs: RepairService;
  /** The same tickets as an observable, for screens. */
  tickets: Store<RepairTicket[]>;
}

/** Builds maintenance from the seed. Every call gives a separate, fresh copy. */
export function createMaintenanceModule(clock: Clock, ports: MaintenancePorts): MaintenanceModule {
  const tickets = createStore<RepairTicket[]>(seedTickets(clock.now()));
  const repairs = new RepairService(clock, new InMemoryTicketRepository(tickets, SEED_TICKET_SEQ), ports.assets);
  return { repairs, tickets };
}
