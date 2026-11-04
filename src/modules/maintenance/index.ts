// The only file other contexts and the app may import from maintenance.
export { createMaintenanceModule, type MaintenanceModule, type MaintenancePorts } from './module';
export type { OpenRepairs, RepairIntake, RepairIntakeInput } from './application/repair-service';
export type { RepairTicket, TicketStatus } from './domain/ticket';
export { RepairScreen, type RepairScreenProps } from './interface/web/RepairScreen';
