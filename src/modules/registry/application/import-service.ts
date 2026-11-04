import type { Clock } from '../../../shared/clock';
import { createStore, type Store } from '../../../shared/store';
import { IMPORT_ROWS } from '../domain/constants';
import { importRows, previewImport, type ImportOutcome, type ImportPreview } from '../domain/import-register';
import type { AssetRepository } from '../domain/repositories';

export interface ImportState {
  /** 1 choose the file, 2 check the rows, 3 imported. */
  step: number;
  /** Codes imported earlier in this page load. */
  importedCodes: string[];
  /** What the last import did, shown on step 3. */
  result: Pick<ImportOutcome, 'ok' | 'skip' | 'bad' | 'results'> | null;
}

/** The นำเข้าข้อมูลเดิม dialog. The file is the mockup's fixed sample. */
export class ImportService {
  readonly state: Store<ImportState> = createStore<ImportState>({ step: 1, importedCodes: [], result: null });

  constructor(private readonly clock: Clock, private readonly assets: AssetRepository) {}

  /** Opens the dialog on step 1. What was imported before is remembered. */
  start(): void {
    this.state.set((s) => ({ ...s, step: 1 }));
  }

  close(): void {
    this.start();
  }

  /** "ตรวจสอบข้อมูล": the rows with their verdicts, as of now. */
  check(): void {
    this.state.set((s) => ({ ...s, step: 2 }));
  }

  back(): void {
    this.state.set((s) => ({ ...s, step: 1 }));
  }

  /** A finished step's button in the progress bar. Only earlier steps can be reached, and not once imported. */
  goTo(step: number): void {
    const s = this.state.get();
    if (s.step < 3 && step < s.step) this.state.set({ ...s, step });
  }

  preview(): ImportPreview[] {
    return previewImport(IMPORT_ROWS, this.state.get().importedCodes, this.assets.list());
  }

  /** Adds the rows that pass. Works from the check step only, so pressing it again after the import does nothing. */
  run(): void {
    const s = this.state.get();
    if (s.step !== 2) return;
    const outcome = importRows(IMPORT_ROWS, s.importedCodes, this.assets.list(), this.clock.now());
    this.assets.add(outcome.added);
    this.state.set({
      step: 3,
      importedCodes: outcome.importedCodes,
      result: { ok: outcome.ok, skip: outcome.skip, bad: outcome.bad, results: outcome.results },
    });
  }
}
