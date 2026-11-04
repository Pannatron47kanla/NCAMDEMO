// The only file other contexts and the app may import from circulation.
export { createCirculationModule, type CirculationModule, type CirculationPorts } from './module';
export { CounterScreen, type CounterScreenProps } from './interface/web/CounterScreen';
export type { RepairIntake, RepairIntakeInput, RepairTicketRef } from './application/ports';
export { holderText } from './interface/web/holder';
export type { Borrower } from './domain/borrower';
export type { Loan, LoanItem } from './domain/loan';
export type { LoanSettings } from './domain/loan-settings';
export { SettingsScreen, type SettingsScreenProps } from './interface/web/SettingsScreen';
export { normalizeSettings, DEFAULT_LOAN_SETTINGS, type SettingsDraft } from './domain/loan-settings';
