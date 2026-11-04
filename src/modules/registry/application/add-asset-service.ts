import type { Clock } from '../../../shared/clock';
import { DomainError } from '../../../shared/domain-error';
import { createStore, type Store } from '../../../shared/store';
import type { Asset } from '../domain/asset';
import type { AssetRepository } from '../domain/repositories';
import { assertCanLeave, newAssetForm, registerAssets, withCategory, withDemoSerials, type NewAssetForm, type PartDraft } from '../domain/new-asset';

/** A rule the wizard broke. The web layer turns `code` + `params` into Thai text. */
export interface WizardError {
  code: string;
  params?: Record<string, string | number>;
}

export interface AddAssetState {
  form: NewAssetForm;
  /** 1 to 5. */
  step: number;
  /** Ids of the assets the last submit made, or empty while the form is open. */
  doneIds: string[];
  error: WizardError | null;
}

/** The ขึ้นทะเบียนใหม่ wizard: five steps, then one asset or a lot. */
export class AddAssetService {
  readonly state: Store<AddAssetState>;
  /** The mockup's newSeq: asset ids N1, N2, ... never repeat during one page load. */
  private seq = 1;

  constructor(private readonly clock: Clock, private readonly assets: AssetRepository) {
    this.state = createStore<AddAssetState>(this.fresh());
  }

  private fresh(): AddAssetState {
    return { form: newAssetForm(this.clock.now()), step: 1, doneIds: [], error: null };
  }

  /** Opens an empty wizard (menu, "+ ขึ้นทะเบียนใหม่", "ขึ้นทะเบียนรายการถัดไป"). */
  start(): void {
    this.state.set(this.fresh());
  }

  /** Leaves the wizard. The typed values stay, as in the mockup. */
  close(): void {
    this.state.set((s) => ({ ...s, step: 1, doneIds: [] }));
  }

  /** Changes fields. Any edit clears the problem list. */
  edit(patch: Partial<NewAssetForm>): void {
    this.state.set((s) => ({ ...s, form: { ...s.form, ...patch }, error: null }));
  }

  setCategory(cat: string): void {
    this.state.set((s) => ({ ...s, form: withCategory(s.form, cat), error: null }));
  }

  fillDemoSerials(): void {
    this.state.set((s) => ({ ...s, form: withDemoSerials(s.form), error: null }));
  }

  addPart(): void {
    this.state.set((s) => {
      const part: PartDraft = { name: s.form.parts.length ? '' : 'ตัวหลัก', qty: '1', price: '' };
      return { ...s, form: { ...s.form, parts: s.form.parts.concat([part]) }, error: null };
    });
  }

  editPart(index: number, patch: Partial<PartDraft>): void {
    this.state.set((s) => ({ ...s, form: { ...s.form, parts: s.form.parts.map((p, i) => (i === index ? { ...p, ...patch } : p)) }, error: null }));
  }

  removePart(index: number): void {
    this.state.set((s) => ({ ...s, form: { ...s.form, parts: s.form.parts.filter((_, i) => i !== index) }, error: null }));
  }

  /** "ถัดไป": moves one step on, or lists the problems and stays. */
  next(): void {
    const { form, step } = this.state.get();
    if (step >= 5) { this.submit(); return; }
    this.attempt(() => assertCanLeave(form, step), () => this.state.set((s) => ({ ...s, step: s.step + 1, error: null })));
  }

  /** Runs `check`; a broken rule is shown as the wizard's problem list, and `then` runs only when there is none. */
  private attempt(check: () => void, then: () => void): void {
    try {
      check();
    } catch (e) {
      if (e instanceof DomainError) { this.state.set((s) => ({ ...s, error: { code: e.code, params: e.params } })); return; }
      throw e;
    }
    then();
  }

  /**
   * Saves the lot: one asset per item, with the next free codes, and the wizard shows the finished card.
   * Does nothing once saved, so a second press cannot make the lot twice. A broken rule changes nothing.
   */
  submit(): void {
    const { form, doneIds } = this.state.get();
    if (doneIds.length) return;
    let made: Asset[] = [];
    this.attempt(
      () => { made = registerAssets(form, this.assets.list().map((a) => a.code), this.seq, this.clock.now()); },
      () => {
        this.assets.add(made);
        this.seq += made.length;
        this.state.set({ form: newAssetForm(this.clock.now()), step: 1, doneIds: made.map((a) => a.id), error: null });
      },
    );
  }

  back(): void {
    this.state.set((s) => ({ ...s, step: Math.max(1, s.step - 1), error: null }));
  }

  /** A finished step's button in the progress bar. Only earlier steps can be reached. */
  goTo(step: number): void {
    if (step < this.state.get().step) this.state.set((s) => ({ ...s, step, error: null }));
  }
}
