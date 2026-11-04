// Disposal methods and reasons, ported from the mockup (METHODS line 1679, REASONS line 1688).

export type MethodKey = 'auction' | 'direct' | 'exchange' | 'transfer' | 'destroy' | 'writeoff';

export interface DisposalMethod {
  label: string;
  note: string;
  /** A sale needs prices, a buyer and a receipt; the others need a party and a reference. */
  sale: boolean;
  partyLabel?: string;
}

export const METHODS: Record<MethodKey, DisposalMethod> = {
  auction: { label: 'ขายทอดตลาด', note: 'วิธีหลักตามข้อ 215 ต้องประเมินราคาขั้นต่ำ และปิดประกาศไม่น้อยกว่า 15 วันก่อนขาย', sale: true },
  direct: { label: 'ขายโดยวิธีเฉพาะเจาะจง', note: 'ใช้ได้เมื่อราคาซื้อรวมไม่เกิน 500,000 บาท หรือขายให้หน่วยงานของรัฐหรือองค์การสาธารณกุศล', sale: true },
  exchange: { label: 'แลกเปลี่ยน', note: 'แลกเปลี่ยนกับพัสดุของผู้อื่นตามวิธีที่ระเบียบกำหนด', sale: false, partyLabel: 'คู่สัญญาและพัสดุที่ได้รับ' },
  transfer: { label: 'โอน', note: 'โอนให้หน่วยงานของรัฐหรือองค์การสาธารณกุศล พร้อมหลักฐานการส่งมอบ', sale: false, partyLabel: 'หน่วยงานผู้รับโอน' },
  destroy: { label: 'แปรสภาพหรือทำลาย', note: 'ทำลายต่อหน้าคณะกรรมการ และบันทึกวิธีกับหลักฐาน', sale: false, partyLabel: 'วิธีแปรสภาพหรือทำลาย' },
  writeoff: { label: 'จำหน่ายเป็นสูญ', note: 'ข้อ 217 ใช้กับพัสดุที่สูญไปหรือไม่มีราคา ราคารวมไม่เกิน 1,000,000 บาท หัวหน้าหน่วยงานอนุมัติ', sale: false, partyLabel: 'เลขที่หนังสืออนุมัติจำหน่ายเป็นสูญ' },
};

export const METHOD_KEYS = Object.keys(METHODS) as MethodKey[];

export const REASONS = ['ครบอายุใช้งานและเสื่อมสภาพ', 'ชำรุดซ่อมไม่คุ้มค่า', 'หมดความจำเป็นต้องใช้', 'สูญไป (ไม่พบจากการตรวจสอบ)'];
