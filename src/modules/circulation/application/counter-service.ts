import type { Clock } from '../../../shared/clock';
import { createStore, type Store } from '../../../shared/store';
import type { CartItem } from '../domain/cart';
import type { BorrowerRepository, LoanRepository } from '../domain/repositories';
import type { LoanSettings } from '../domain/loan-settings';
import type { AssetsPort } from './ports';

/** What the counter shows under the scan box. The web layer turns `code` + `params` into Thai text. */
export interface CounterMessage {
  kind: 'ok' | 'err' | 'warn';
  code: string;
  params?: Record<string, string | number>;
}

export interface CounterState {
  mode: 'borrow' | 'return';
  /** Text in the scan box. */
  scan: string;
  borrowerCode: string;
  blocked: boolean;
  cart: CartItem[];
  msg: CounterMessage | null;
}

export interface CounterDeps {
  borrowers: BorrowerRepository;
  loans: LoanRepository;
  settings: Store<LoanSettings>;
  assets: AssetsPort;
}

export function initialCounterState(): CounterState {
  return { mode: 'borrow', scan: '', borrowerCode: '', blocked: false, cart: [], msg: null };
}

/** The เคาน์เตอร์ยืม-คืน: one scan box that first takes the borrower, then assets. */
export class CounterService {
  readonly state: Store<CounterState> = createStore(initialCounterState());

  constructor(protected readonly clock: Clock, private readonly deps: CounterDeps) {}

  setScan(text: string): void {
    this.patch({ scan: text });
  }

  /** Borrow keeps the borrower and cart. Return starts clean (mockup setBorrow / setReturn). */
  setMode(mode: CounterState['mode']): void {
    if (mode === 'borrow') this.patch({ mode, msg: null, scan: '' });
    else this.patch({ mode, msg: null, scan: '', borrowerCode: '', blocked: false, cart: [] });
  }

  /** Clears the borrower and cart for the next person. */
  reset(): void {
    this.patch({ scan: '', borrowerCode: '', blocked: false, cart: [], msg: null });
  }

  /** Handles one scan. Rules that refuse it throw a DomainError; the message is also left in `state`. */
  scan(raw: string): void {
    const code = String(raw ?? '').trim();
    if (!code) {
      this.patch({ msg: { kind: 'warn', code: 'EMPTY_SCAN' } });
      return;
    }
    // Return mode is handled by the return side of the counter.
    if (this.state.get().mode !== 'borrow') return;
    const borrower = this.deps.borrowers.findByCode(code);
    if (borrower) this.patch({ scan: '', borrowerCode: borrower.code, blocked: false, msg: { kind: 'ok', code: 'BORROWER_OK' } });
  }

  private patch(change: Partial<CounterState>): void {
    this.state.set((s) => ({ ...s, ...change }));
  }
}
