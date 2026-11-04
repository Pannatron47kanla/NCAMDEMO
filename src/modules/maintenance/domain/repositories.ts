import type { RepairTicket } from './ticket';

export interface TicketRepository {
  list(): RepairTicket[];
  findById(id: string): RepairTicket | undefined;
  /** The id the next ticket will get: WO-2569-0<seq>. */
  nextId(): string;
  add(ticket: RepairTicket): void;
  save(ticket: RepairTicket): void;
}
