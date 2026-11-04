import type { Clock } from '../../../shared/clock';
import { addDays, th } from '../../../shared/dates';
import { createStore, type Store } from '../../../shared/store';
import type { TicketRepository } from '../domain/repositories';
import { RepairTicket } from '../domain/ticket';
import type { AssetsPort } from './ports';

/** A repair request from another context (the return counter). */
export interface RepairIntakeInput {
  assetId: string;
  symptom: string;
  needDate: Date;
  reporter: string;
}

/** What other contexts use to ask for a repair. */
export interface RepairIntake {
  open(input: RepairIntakeInput): RepairTicket;
}

/** What other contexts use to ask whether an asset is in repair. */
export interface OpenRepairs {
  hasOpenTicket(assetId: string): boolean;
}

/** The repair form and the ticket the officer is looking at. */
export interface RepairDeskState {
  assetId: string;
  symptom: string;
  /** Days until the asset is needed for teaching, as the select gives it: '1', '3' or '7'. */
  need: string;
  selTicket: string;
}

export const INITIAL_DESK: RepairDeskState = { assetId: 'A3', symptom: '', need: '3', selTicket: 'WO-2569-031' };

/** Repair screen: report a problem, then accept and close tickets. */
export class RepairService implements RepairIntake, OpenRepairs {
  readonly state: Store<RepairDeskState> = createStore<RepairDeskState>({ ...INITIAL_DESK });

  constructor(
    private readonly clock: Clock,
    private readonly tickets: TicketRepository,
    private readonly assets: AssetsPort,
  ) {}

  private patch(p: Partial<RepairDeskState>): void {
    this.state.set((s) => ({ ...s, ...p }));
  }

  setAsset(assetId: string): void { this.patch({ assetId }); }
  setSymptom(symptom: string): void { this.patch({ symptom }); }
  setNeed(need: string): void { this.patch({ need }); }
  select(selTicket: string): void { this.patch({ selTicket }); }

  /** Opens a ticket waiting to be accepted. Changes nothing on the asset: the caller already did. */
  open(input: RepairIntakeInput): RepairTicket {
    const ticket = RepairTicket.open({ ...input, id: this.tickets.nextId(), createdAt: this.clock.now() });
    this.tickets.add(ticket);
    return ticket;
  }

  hasOpenTicket(assetId: string): boolean {
    return this.tickets.list().some((t) => t.assetId === assetId && t.status !== 'ปิดงาน');
  }

  /**
   * Submits the form: opens the ticket, marks the asset รอซ่อม (a ถูกยืม asset stays ถูกยืม), adds a history
   * line, selects the ticket and clears the symptom. A blank symptom throws SYMPTOM_REQUIRED and changes nothing.
   */
  submit(): void {
    const form = this.state.get();
    const asset = this.assets.findById(form.assetId);
    if (!asset) return;
    const now = this.clock.now();
    const ticket = this.open({
      assetId: asset.id, symptom: form.symptom, needDate: addDays(now, parseInt(form.need, 10)), reporter: 'lab.officer',
    });
    if (asset.status !== 'ถูกยืม') this.assets.setStatus(asset.id, 'รอซ่อม');
    this.assets.addEvent(asset.id, { date: th(now, 0), text: 'แจ้งซ่อม: ' + ticket.symptom, doc: ticket.id });
    this.patch({ selTicket: ticket.id, symptom: '' });
  }
}
