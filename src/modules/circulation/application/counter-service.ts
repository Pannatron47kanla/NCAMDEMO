import type { Clock } from '../../../shared/clock';
import { DomainError } from '../../../shared/domain-error';
import { createStore, type Store } from '../../../shared/store';
import { cartItemFor, isInCart, type CartItem } from '../domain/cart';
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

  removeFromCart(assetId: string): void {
    const name = this.deps.assets.findById(assetId)?.name ?? assetId;
    this.patch({ cart: this.state.get().cart.filter((it) => it.assetId !== assetId), msg: { kind: 'warn', code: 'ITEM_REMOVED', params: { name } } });
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
    const c = this.state.get();
    if (!c.borrowerCode) {
      const borrower = this.deps.borrowers.findByCode(code);
      if (!borrower) return this.refuse('BORROWER_NOT_FOUND', { code });
      const overdue = borrower.overdueLoans(this.deps.loans.list(), this.clock.now());
      if (overdue.length) {
        const params = { count: overdue.length };
        this.patch({ scan: '', borrowerCode: borrower.code, blocked: true, msg: { kind: 'err', code: 'BORROWER_OVERDUE', params } });
        throw new DomainError('BORROWER_OVERDUE', params);
      }
      this.patch({ scan: '', borrowerCode: borrower.code, blocked: false, msg: { kind: 'ok', code: 'BORROWER_OK' } });
      return;
    }
    if (c.blocked) return this.refuse('BORROWER_BLOCKED');
    const asset = this.deps.assets.findByCode(code);
    if (!asset) return this.refuse('ASSET_NOT_FOUND', { code });
    if (isInCart(c.cart, asset)) {
      this.patch({ scan: '', msg: { kind: 'warn', code: 'ALREADY_IN_CART', params: { name: asset.name } } });
      return;
    }
    this.patch({ scan: '', cart: c.cart.concat([cartItemFor(asset)]), msg: { kind: 'ok', code: 'ITEM_ADDED', params: { name: asset.name } } });
  }

  /** Shows the error under the scan box (clearing the box) and throws it, as the mockup's `err()` shows it. */
  private refuse(code: string, params?: Record<string, string | number>): never {
    this.patch({ scan: '', msg: params ? { kind: 'err', code, params } : { kind: 'err', code } });
    throw new DomainError(code, params);
  }

  private patch(change: Partial<CounterState>): void {
    this.state.set((s) => ({ ...s, ...change }));
  }
}
