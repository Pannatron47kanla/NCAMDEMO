import type { Store } from '../../../shared/store';
import type { TicketRepository } from '../domain/repositories';
import type { RepairTicket } from '../domain/ticket';

/** Tickets in a store. Changes replace the list, so screens see them. */
export class InMemoryTicketRepository implements TicketRepository {
  constructor(private readonly tickets: Store<RepairTicket[]>, private seq: number) {}
  list(): RepairTicket[] { return this.tickets.get().slice(); }
  findById(id: string): RepairTicket | undefined { return this.tickets.get().find((t) => t.id === id); }
  nextId(): string { return 'WO-2569-0' + this.seq; }
  add(ticket: RepairTicket): void {
    this.seq += 1;
    this.tickets.set((list) => list.concat([ticket]));
  }
  save(ticket: RepairTicket): void {
    this.tickets.set((list) => list.map((t) => (t.id === ticket.id ? ticket : t)));
  }
}
