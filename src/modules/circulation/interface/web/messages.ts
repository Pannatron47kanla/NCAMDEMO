type Params = Record<string, string | number> | undefined;

/**
 * Thai text for every message code the counter can show (warnings, successes and DomainError codes).
 * Wording is copied from the mockup.
 */
const TEXT: Record<string, (p: NonNullable<Params>) => string> = {
  EMPTY_SCAN: () => 'สแกนหรือพิมพ์รหัสก่อนกดสแกน',
  BORROWER_NOT_FOUND: (p) => 'ไม่พบรหัสผู้ยืม ' + p.code + ' ในทะเบียนผู้ยืม',
  BORROWER_OVERDUE: (p) => 'ยืมไม่ได้: มีรายการเกินกำหนดคืน ' + p.count + ' ใบยืม ต้องคืนก่อน',
  BORROWER_BLOCKED: () => 'ผู้ยืมรายนี้งดยืมจนกว่าจะคืนรายการที่ค้าง',
  ASSET_NOT_FOUND: (p) => 'ไม่พบรหัสครุภัณฑ์ ' + p.code,
  ALREADY_IN_CART: (p) => 'สแกนซ้ำ: ' + p.name + ' อยู่ในรายการแล้ว ไม่เพิ่มซ้ำ',
  ASSET_NOT_AVAILABLE: (p) => 'จ่ายไม่ได้: ' + p.name + ' สถานะ "' + p.status + '"',
  KIT_LIMIT_REACHED: (p) => 'เกินจำนวนสูงสุด ' + p.max + ' ชุดต่อนักศึกษา (มีในรายการ/ถืออยู่แล้ว ' + p.held + ' ชุด)',
  LOAN_ALREADY_SAVED: () => 'รายการนี้บันทึกแล้ว กด "รายการใหม่" เพื่อเริ่มผู้ยืมคนถัดไป',
  LOAN_REQUESTED: () => 'ส่งคำขอยืมแล้ว รออาจารย์อนุมัติ',
  LOAN_SAVED: () => 'บันทึกการยืมแล้ว',
  ITEM_ADDED: (p) => 'เพิ่ม ' + p.name,
  ITEM_REMOVED: (p) => 'เอา ' + p.name + ' ออกจากรายการ',
  BORROWER_OK: () => 'ผ่านการตรวจสิทธิ์ สแกนครุภัณฑ์ที่จะจ่ายได้เลย',
};

export function messageText(code: string, params?: Params): string {
  const text = TEXT[code];
  return text ? text(params ?? {}) : code;
}
