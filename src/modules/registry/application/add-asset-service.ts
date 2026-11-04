import type { Clock } from '../../../shared/clock';
import { DomainError } from '../../../shared/domain-error';
import { createStore, type Store } from '../../../shared/store';
import { assertCanLeave, newAssetForm, withCategory, withDemoSerials, type NewAssetForm, type PartDraft } from '../domain/new-asset';

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

  constructor(private readonly clock: Clock) {
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
    try {
      assertCanLeave(form, step);
    } catch (e) {
      if (e instanceof DomainError) { this.state.set((s) => ({ ...s, error: { code: e.code, params: e.params } })); return; }
      throw e;
    }
    this.state.set((s) => ({ ...s, step: s.step + 1, error: null }));
  }

  back(): void {
    this.state.set((s) => ({ ...s, step: Math.max(1, s.step - 1), error: null }));
  }

  /** A finished step's button in the progress bar. Only earlier steps can be reached. */
  goTo(step: number): void {
    if (step < this.state.get().step) this.state.set((s) => ({ ...s, step, error: null }));
  }
}
