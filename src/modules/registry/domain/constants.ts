// Reference data of the registry, ported from the mockup (lines 1589-1750).

export interface Category {
  icon: string;
  /** Asset code prefix, e.g. 6515-002. */
  prefix: string;
  /** Default service life in years. */
  life: number;
}

export const CATS: Record<string, Category> = {
  'หุ่นจำลอง': { icon: 'manikin', prefix: '6515-002', life: 5 },
  'เครื่องมือแพทย์ที่ใช้สอน': { icon: 'medical', prefix: '6515-003', life: 5 },
  'เตียงและครุภัณฑ์ห้องฝึก': { icon: 'bed', prefix: '6530-001', life: 8 },
  'คอมพิวเตอร์': { icon: 'computer', prefix: '7440-001', life: 4 },
  'โสตทัศนูปกรณ์': { icon: 'av', prefix: '7730-001', life: 5 },
  'สำนักงาน': { icon: 'furniture', prefix: '7110-001', life: 10 },
};

/** Icon kind for a category; anything unknown is "other". */
export function iconOf(cat: string): string {
  return CATS[cat]?.icon ?? 'other';
}

/** Maximum number of items in one new lot (context-map: Business numbers). */
export const MAX_LOT_SIZE = 200;

export const LAB1 = 'ห้องปฏิบัติการพยาบาล 1';
export const LAB2 = 'ห้องปฏิบัติการพยาบาล 2';
export const STORE = 'คลังเก็บหุ่นและอุปกรณ์';
export const CLASS = 'ห้องเรียน 205';
export const SUPPLY = 'ห้องงานพัสดุ';
export const COUNTER = 'เคาน์เตอร์ยืม-คืน';

export const V1 = 'บจ. เมดิคอลเทรนนิ่ง (ตัวอย่าง)';
export const V2 = 'หจก. สยามเฮลท์ซัพพลาย (ตัวอย่าง)';
export const V3 = 'บจ. ไอทีโซลูชั่น (ตัวอย่าง)';
export const V4 = 'บจ. ออฟฟิศพลัส (ตัวอย่าง)';
export const VENDORS = [V1, V2, V3, V4];

/** Default department and custodian for a new asset. The names are fictional. */
export const LABD = 'งานห้องปฏิบัติการพยาบาล';
export const CUST = 'นางสาวอรุณี แสงจันทร์';

export interface ImportRow {
  row: number;
  code: string;
  name: string;
  cat: string;
  price: number | null;
}

/** The sample rows of the legacy-data import (mockup IMPORT). */
export const IMPORT_ROWS: ImportRow[] = [
  { row: 2, code: '6515-002-0031', name: 'หุ่นฝึกให้อาหารทางสายยาง', cat: 'หุ่นจำลอง', price: 42000 },
  { row: 3, code: '6515-003-0015', name: 'เครื่องวัดออกซิเจนปลายนิ้ว', cat: 'เครื่องมือแพทย์ที่ใช้สอน', price: 3900 },
  { row: 4, code: '6515-002-0001', name: 'หุ่นฝึก CPR ผู้ใหญ่', cat: 'หุ่นจำลอง', price: 85000 },
  { row: 5, code: '7110-001-0044', name: 'ตู้เก็บเอกสาร', cat: 'สำนักงาน', price: null },
  { row: 6, code: '7440-001-0030', name: 'เครื่องพิมพ์ฉลาก', cat: 'คอมพิวเตอร์', price: 8500 },
];
