import type { Clock } from '../../shared/clock';
import { createStore, type Store } from '../../shared/store';
import { DisposalService } from './application/disposal-service';
import type { AssetsPort, OpenRepairsPort } from './application/ports';
import type { DisposalCase } from './domain/case';
import { InMemoryCaseRepository } from './infrastructure/in-memory-case-repository';

export interface DisposalPorts {
  assets: AssetsPort;
  repairs: OpenRepairsPort;
}

export interface DisposalModule {
  /** The disposal screen's service. */
  disposal: DisposalService;
  /** The case being worked on (or null), for screens, the calendar, the documents and reports. */
  current: Store<DisposalCase | null>;
  /** Finished cases, oldest first. */
  done: Store<DisposalCase[]>;
}

/** Builds disposal with no case. Every call gives a separate, fresh copy. */
export function createDisposalModule(clock: Clock, ports: DisposalPorts): DisposalModule {
  const current = createStore<DisposalCase | null>(null);
  const done = createStore<DisposalCase[]>([]);
  const disposal = new DisposalService(clock, new InMemoryCaseRepository(current, done), ports.assets, ports.repairs);
  return { disposal, current, done };
}
