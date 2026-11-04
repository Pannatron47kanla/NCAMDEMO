import type { Clock } from '../../shared/clock';
import { createStore, type Store } from '../../shared/store';
import { ChargeService } from './application/charge-service';
import { CounterService } from './application/counter-service';
import { SettingsService } from './application/settings-service';
import type { AssetsPort, RepairIntake } from './application/ports';
import type { Borrower } from './domain/borrower';
import { DEFAULT_LOAN_SETTINGS, type LoanSettings } from './domain/loan-settings';
import type { Charge } from './domain/charge';
import type { Loan } from './domain/loan';
import { InMemoryBorrowerRepository, InMemoryChargeRepository, InMemoryLoanRepository } from './infrastructure/in-memory-repositories';
import { SEED_LOAN_SEQ, seedBorrowers, seedLoans } from './infrastructure/seed';

export interface CirculationPorts {
  assets: AssetsPort;
  repairs: RepairIntake;
}

export interface CirculationModule {
  counter: CounterService;
  cashier: ChargeService;
  /** The same data as observables, for screens. */
  loans: Store<Loan[]>;
  charges: Store<Charge[]>;
  borrowers: Store<Borrower[]>;
  settings: Store<LoanSettings>;
  /** The settings form: unsaved edits and saving. */
  settingsDesk: SettingsService;
}

/** Builds circulation from the seed. Every call gives a separate, fresh copy. */
export function createCirculationModule(clock: Clock, ports: CirculationPorts): CirculationModule {
  const borrowers = createStore<Borrower[]>(seedBorrowers());
  const loans = createStore<Loan[]>(seedLoans(clock.now()));
  const charges = createStore<Charge[]>([]);
  const settings = createStore<LoanSettings>({ ...DEFAULT_LOAN_SETTINGS });
  const chargeRepository = new InMemoryChargeRepository(charges);
  const counter = new CounterService(clock, {
    borrowers: new InMemoryBorrowerRepository(borrowers),
    loans: new InMemoryLoanRepository(loans, SEED_LOAN_SEQ),
    charges: chargeRepository,
    settings,
    assets: ports.assets,
    repairs: ports.repairs,
  });
  return { counter, cashier: new ChargeService(chargeRepository), loans, charges, borrowers, settings, settingsDesk: new SettingsService(settings) };
}
