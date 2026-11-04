import type { CSSProperties } from 'react';

// Status chip colours, ported from the mockup (CHIP and chip(), lines 1616-1630). Presentation only.
const CHIP: Record<string, [bg: string, fg: string]> = {
  'พร้อมใช้': ['#e3f2ee', '#0b5e57'], 'ถูกยืม': ['#e4ecfa', '#1d4a99'], 'รอซ่อม': ['#fcefd9', '#7a4300'],
  'กำลังซ่อม': ['#fcefd9', '#7a4300'], 'รอรับงาน': ['#fcefd9', '#7a4300'], 'ปิดงาน': ['#e3f2ee', '#0b5e57'],
  'ชิ้นส่วนไม่ครบ': ['#fbe7e1', '#8f2f0f'], 'สูญหาย / ไม่พบ': ['#f4e3ea', '#82193a'], 'รอจำหน่าย': ['#f4e3ea', '#82193a'],
  'พบ': ['#e3f2ee', '#0b5e57'], 'ไม่พบ': ['#f4e3ea', '#82193a'], 'ชำรุด': ['#fbe7e1', '#8f2f0f'],
  'เสื่อมสภาพ': ['#fcefd9', '#7a4300'], 'ไม่จำเป็นต้องใช้': ['#eceff0', '#3d4b50'],
  'อยู่ในประกัน': ['#e3f2ee', '#0b5e57'], 'หมดประกัน': ['#eceff0', '#3d4b50'],
  'ผ่าน': ['#e3f2ee', '#0b5e57'], 'ผิด': ['#f4e3ea', '#82193a'], 'ข้าม (มีแล้ว)': ['#eceff0', '#3d4b50'], 'ยังไม่ตรวจ': ['#eceff0', '#3d4b50'],
  'ยืนยันแล้ว': ['#e3f2ee', '#0b5e57'], 'รอยืนยัน': ['#efe8fb', '#5b2d9e'], 'รอซิงก์': ['#fcefd9', '#7a4300'], 'ยังไม่ตรวจนับ': ['#eceff0', '#3d4b50'],
  'เกินอายุใช้งาน': ['#fbe2e3', '#a3191f'], 'ครบภายใน 6 เดือน': ['#fde9d2', '#8a4300'], 'ครบภายใน 6–12 เดือน': ['#fbf3cf', '#6b5600'],
  'มากกว่า 1 ปี': ['#e3f2ee', '#0b5e57'], 'ยังไม่ระบุ': ['#eceff0', '#3d4b50'], 'จำหน่ายแล้ว': ['#e6e8e9', '#3d4b50'],
};

/** Inline style for a `.chip` showing this status or label. Unknown labels are grey. */
export function chip(s: string): CSSProperties {
  const [background, color] = CHIP[s] ?? ['#eceff0', '#3d4b50'];
  return { background, color };
}
