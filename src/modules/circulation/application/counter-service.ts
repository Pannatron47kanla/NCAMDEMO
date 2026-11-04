import type { Clock } from '../../../shared/clock';
import { th } from '../../../shared/dates';
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
  /** The loan just saved, until the officer starts a new one. */
  done: { loanId: string; due: Date; pending: boolean; count: number } | null;
}

export interface CounterDeps {
  borrowers: BorrowerRepository;
  loans: LoanRepository;
  settings: Store<LoanSettings>;
  assets: AssetsPort;
}

export function initialCounterState(): CounterState {
  return { mode: 'borrow', scan: '', borrowerCode: '', blocked: false, cart: [], msg: null, done: null };
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
    else this.patch({ mode, msg: null, scan: '', borrowerCode: '', blocked: false, cart: [], done: null });
  }

  removeFromCart(assetId: string): void {
    const name = this.deps.assets.findById(assetId)?.name ?? assetId;
    this.patch({ cart: this.state.get().cart.filter((it) => it.assetId !== assetId), msg: { kind: 'warn', code: 'ITEM_REMOVED', params: { name } } });
  }

  togglePart(assetId: string, partIndex: number): void {
    this.patch({
      cart: this.state.get().cart.map((it) => (it.assetId !== assetId ? it : {
        ...it, parts: it.parts.map((p, i) => (i === partIndex ? { ...p, checked: !p.checked } : p)),
      })),
    });
  }

  /** Turns the cart into a loan. Does nothing without a borrower, a cart, or when blocked (so a second press adds nothing). */
  confirmBorrow(): void {
    const c = this.state.get();
    const borrower = this.deps.borrowers.findByCode(c.borrowerCode);
    if (!borrower || c.blocked || !c.cart.length) return;
    const now = this.clock.now();
    const settings = this.deps.settings.get();
    const loan = borrower.borrow(c.cart, settings, now, this.deps.loans.nextId());
    this.deps.loans.add(loan);
    for (const it of c.cart) {
      this.deps.assets.setStatus(it.assetId, 'ถูกยืม');
      this.deps.assets.addEvent(it.assetId, { date: th(now, 0), text: (loan.pending ? 'ขอยืม (รออนุมัติ) โดย ' : 'ยืมโดย ') + borrower.name + ' กำหนดคืน ' + th(now, settings.loanDays), doc: loan.id });
    }
    this.patch({
      cart: [],
      done: { loanId: loan.id, due: loan.due, pending: loan.pending, count: loan.items.length },
      msg: { kind: 'ok', code: loan.pending ? 'LOAN_REQUESTED' : 'LOAN_SAVED' },
    });
  }

  /** A teacher approves a pending student loan. */
  approve(loanId: string): void {
    const loan = this.deps.loans.findById(loanId);
    if (!loan) return;
    const now = this.clock.now();
    for (const it of loan.items) this.deps.assets.addEvent(it.assetId, { date: th(now, 0), text: 'อาจารย์อนุมัติการยืม', doc: loanId });
    this.deps.loans.save(loan.approve());
  }

  /** Clears the borrower and cart for the next person. */
  reset(): void {
    this.patch({ scan: '', borrowerCode: '', blocked: false, cart: [], msg: null, done: null });
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
    if (c.done) return this.refuse('LOAN_ALREADY_SAVED');
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
    const borrower = this.deps.borrowers.findByCode(c.borrowerCode);
    if (!borrower) return this.refuse('BORROWER_NOT_FOUND', { code: c.borrowerCode });
    try {
      borrower.assertCanTake(asset, c.cart, this.deps.loans.list(), this.deps.settings.get());
    } catch (e) {
      if (e instanceof DomainError) return this.refuse(e.code, e.params);
      throw e;
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
