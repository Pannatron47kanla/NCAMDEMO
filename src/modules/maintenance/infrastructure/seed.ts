import { addDays } from '../../../shared/dates';
import { RepairTicket } from '../domain/ticket';

/** The next ticket number after the seed (mockup woSeq). */
export const SEED_TICKET_SEQ = 32;

/** The mockup's one starting ticket (line 1766). Dates come from `now`, not from stored offsets. */
export function seedTickets(now: Date): RepairTicket[] {
  return [RepairTicket.restore({
    id: 'WO-2569-031', assetId: 'A4', symptom: 'ผิวหนังจำลองบริเวณข้อพับรั่ว น้ำซึมออกระหว่างฝึกแทงเข็ม',
    needDate: addDays(now, 2), status: 'รอรับงาน', reporter: 'อ.ดร.สุภาวดี วงศ์ใหญ่', createdAt: addDays(now, -1),
    route: '-', cost: '', tested: false, partsOk: false,
  })];
}
