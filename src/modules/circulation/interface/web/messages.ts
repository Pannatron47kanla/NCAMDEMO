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
  BORROWER_OK: () => 'ผ่านการตรวจสิทธิ์ สแกนครุภัณฑ์ที่จะจ่ายได้เลย',
};

export function messageText(code: string, params?: Params): string {
  const text = TEXT[code];
  return text ? text(params ?? {}) : code;
}
