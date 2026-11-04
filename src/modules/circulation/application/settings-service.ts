import { createStore, type Store } from '../../../shared/store';
import { normalizeSettings, type LoanSettings, type SettingsDraft } from '../domain/loan-settings';

export interface SettingsDesk {
  /** The form while it has unsaved edits; null when it shows the saved settings. */
  draft: SettingsDraft | null;
  message: string;
}

type NumberField = 'loanDays' | 'maxSets' | 'finePerDay' | 'lossPct';

/** ตั้งค่ากติกายืม: edits a draft and saves it into the settings the counter reads. */
export class SettingsService {
  readonly desk: Store<SettingsDesk> = createStore<SettingsDesk>({ draft: null, message: '' });

  constructor(private readonly settings: Store<LoanSettings>) {}

  /** A number box changed. Only digits are kept (mockup setDr). */
  editNumber(field: NumberField, text: string): void {
    this.edit(field, text.replace(/[^0-9]/g, ''));
  }

  setNeedApproval(on: boolean): void {
    this.edit('needApproval', on);
  }

  save(): void {
    const draft = this.desk.get().draft ?? this.settings.get();
    this.settings.set(normalizeSettings(draft));
    this.desk.set({ draft: null, message: 'บันทึกแล้ว มีผลกับการยืมครั้งถัดไป' });
  }

  private edit(field: keyof SettingsDraft, value: string | boolean): void {
    const base = this.desk.get().draft ?? this.settings.get();
    this.desk.set({ draft: { ...base, [field]: value }, message: 'ยังไม่บันทึก' });
  }
}
