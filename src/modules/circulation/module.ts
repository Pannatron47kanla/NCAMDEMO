import type { Clock } from '../../shared/clock';
import { createStore, type Store } from '../../shared/store';
import { CounterService } from './application/counter-service';
import type { AssetsPort } from './application/ports';
import type { Borrower } from './domain/borrower';
import { DEFAULT_LOAN_SETTINGS, type LoanSettings } from './domain/loan-settings';
import type { Loan } from './domain/loan';
import { InMemoryBorrowerRepository, InMemoryLoanRepository } from './infrastructure/in-memory-repositories';
import { SEED_LOAN_SEQ, seedBorrowers, seedLoans } from './infrastructure/seed';

export interface CirculationPorts {
  assets: AssetsPort;
}

export interface CirculationModule {
  counter: CounterService;
  /** The same data as observables, for screens. */
  loans: Store<Loan[]>;
  borrowers: Store<Borrower[]>;
  settings: Store<LoanSettings>;
}

/** Builds circulation from the seed. Every call gives a separate, fresh copy. */
export function createCirculationModule(clock: Clock, ports: CirculationPorts): CirculationModule {
  const borrowers = createStore<Borrower[]>(seedBorrowers());
  const loans = createStore<Loan[]>(seedLoans(clock.now()));
  const settings = createStore<LoanSettings>({ ...DEFAULT_LOAN_SETTINGS });
  const counter = new CounterService(clock, {
    borrowers: new InMemoryBorrowerRepository(borrowers),
    loans: new InMemoryLoanRepository(loans, SEED_LOAN_SEQ),
    settings,
    assets: ports.assets,
  });
  return { counter, loans, borrowers, settings };
}
