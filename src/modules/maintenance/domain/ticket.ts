import { DomainError } from '../../../shared/domain-error';

export type TicketStatus = 'รอรับงาน' | 'กำลังซ่อม' | 'ปิดงาน';

export interface TicketData {
  id: string;
  assetId: string;
  symptom: string;
  /** The day the lab needs the asset back for teaching. */
  needDate: Date;
  status: TicketStatus;
  reporter: string;
  createdAt: Date;
  /** How the repair is done. '-' until the work is accepted. */
  route: string;
  /** Cost as typed: digits only, empty until entered. */
  cost: string;
  tested: boolean;
  partsOk: boolean;
}

export interface OpenTicketInput {
  id: string;
  assetId: string;
  symptom: string;
  needDate: Date;
  reporter: string;
  createdAt: Date;
}

/** ใบงานซ่อม: one repair work order. Immutable; every change gives a new ticket. */
export class RepairTicket implements TicketData {
  private constructor(private readonly data: TicketData) {}

  /** Opens a new ticket waiting to be accepted. A blank symptom is refused (AC21). */
  static open(input: OpenTicketInput): RepairTicket {
    const symptom = input.symptom.trim();
    if (!symptom) throw new DomainError('SYMPTOM_REQUIRED');
    return new RepairTicket({
      id: input.id, assetId: input.assetId, symptom, needDate: input.needDate, status: 'รอรับงาน',
      reporter: input.reporter, createdAt: input.createdAt, route: '-', cost: '', tested: false, partsOk: false,
    });
  }

  /** Loads a ticket as it was saved, without checking the rules. */
  static restore(data: TicketData): RepairTicket {
    return new RepairTicket({ ...data });
  }

  get id() { return this.data.id; }
  get assetId() { return this.data.assetId; }
  get symptom() { return this.data.symptom; }
  get needDate() { return this.data.needDate; }
  get status() { return this.data.status; }
  get reporter() { return this.data.reporter; }
  get createdAt() { return this.data.createdAt; }
  get route() { return this.data.route; }
  get cost() { return this.data.cost; }
  get tested() { return this.data.tested; }
  get partsOk() { return this.data.partsOk; }
}
