type Params = Record<string, string | number> | undefined;

/**
 * Thai text for the codes the register screens can show: the wizard's problem lists (DomainError codes)
 * and the room scan's notes. Wording is copied from the mockup.
 */
const TEXT: Record<string, (p: NonNullable<Params>) => string> = {
  STEP_INCOMPLETE: (p) => 'กรอกให้ครบก่อนไปขั้นถัดไป: ' + p.missing,
  SAVE_INCOMPLETE: (p) => 'กรอกให้ครบก่อนบันทึก: ' + p.missing,
  LOT_INVALID: (p) => 'ตรวจข้อมูลก่อนบันทึก: ' + p.missing,
  ROOM_REQUIRED: () => 'เลือกห้องปลายทางก่อน เพื่อบอกระบบว่าของจะอยู่ห้องไหน',
  ROOM_CHANGED: (p) => 'เปลี่ยนห้องปลายทางเป็น ' + p.room + ' · ยิงป้ายครุภัณฑ์ต่อได้เลย',
  ROOM_PICKED: (p) => 'ห้องปลายทาง: ' + p.room + ' · ยิงป้ายครุภัณฑ์ต่อได้เลย',
  ASSET_UNKNOWN: (p) => 'ไม่พบรหัส ' + p.code + ' ในทะเบียน',
  SCAN_DUPLICATE: (p) => 'สแกนซ้ำ: ' + p.name + ' อยู่ในรายการแล้ว ไม่นับซ้ำ',
  SCAN_BLOCKED: (p) => p.name + ': เปลี่ยนห้องไม่ได้ (' + p.why + ')',
  SCAN_NEW: (p) => p.name + ' → ' + p.room,
  SCAN_SAME: (p) => p.name + ' อยู่ห้องนี้แล้ว',
  SCAN_MOVE: (p) => p.name + ' ปัจจุบันอยู่ ' + p.from + ' · กดยืนยันในรายการถ้าต้องการย้าย',
};

export function messageText(code: string, params?: Params): string {
  const text = TEXT[code];
  return text ? text(params ?? {}) : code;
}
