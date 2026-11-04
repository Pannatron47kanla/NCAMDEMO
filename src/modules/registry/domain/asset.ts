export type AssetStatus =
  | 'พร้อมใช้'
  | 'ถูกยืม'
  | 'รอซ่อม'
  | 'ชิ้นส่วนไม่ครบ'
  | 'สูญหาย / ไม่พบ'
  | 'รอจำหน่าย'
  | 'จำหน่ายแล้ว';

/** A part of a kit. A price of 0 marks the main body. */
export interface Part {
  name: string;
  qty: number;
  price: number;
}

/** One line of an asset's history. `date` is already formatted for display (e.g. 12 ก.ย. 66). */
export interface AssetEvent {
  date: string;
  text: string;
  doc: string;
}

export interface Calibration {
  /** YYYY-MM-DD */
  last: string;
  /** months */
  cycle: number;
}

/** ครุภัณฑ์: one registered asset. */
export interface Asset {
  id: string;
  /** Asset code, e.g. 6515-002-0001. */
  code: string;
  name: string;
  cat: string;
  dept: string;
  room: string;
  status: AssetStatus;
  price: number;
  /** Acquisition date, YYYY-MM-DD, or null when not known. */
  acq: string | null;
  method: string;
  doc: string;
  vendor: string;
  /** Warranty end, YYYY-MM-DD, or null. */
  warranty: string | null;
  /** Service life in years (อายุการใช้งาน). */
  life: number;
  parts: Part[];
  calib: Calibration | null;
  custodian: string;
  events: AssetEvent[];
}
