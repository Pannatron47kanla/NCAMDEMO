import type { Asset, AssetEvent, Part } from '../domain/asset';
import { CUST, LABD, LAB1, LAB2, STORE, CLASS, SUPPLY, V1, V2, V3, V4 } from '../domain/constants';
import { iso, thd } from '../../../shared/dates';

// The sample assets of the mockup (seedAssets, lines 1707-1748), in the same order and with the same text.

interface AssetSeed extends Partial<Omit<Asset, 'vendor' | 'events'>> {
  id: string;
  code: string;
  name: string;
  cat: string;
  room: string;
  price: number;
  doc: string;
  vendor?: string;
  events?: AssetEvent[];
}

function P(name: string, qty: number, price: number): Part {
  return { name, qty, price };
}

function A(o: AssetSeed): Asset {
  const buy = (o.method || 'ซื้อ') === 'ซื้อ';
  const acq = o.acq ?? null;
  return {
    id: o.id, code: o.code, name: o.name, cat: o.cat, dept: o.dept || LABD, room: o.room, status: o.status || 'พร้อมใช้', price: o.price,
    acq, method: o.method || 'ซื้อ', doc: o.doc, vendor: buy ? (o.vendor || '-') : (o.method === 'รับโอน' ? 'รับโอน' : 'รับบริจาค'),
    warranty: o.warranty || null, life: o.life || 5, parts: o.parts || [], calib: o.calib || null, custodian: o.custodian || CUST,
    events: o.events || [{ date: acq ? thd(iso(acq)!) : '-', text: (buy ? 'ตรวจรับและขึ้นทะเบียน' : (o.method === 'รับโอน' ? 'รับโอนและขึ้นทะเบียน' : 'รับบริจาคและขึ้นทะเบียน')), doc: o.doc }],
  };
}

const CPR = (): Part[] => [P('ตัวหุ่น', 1, 0), P('หน้ากากใบหน้า', 5, 350), P('ถุงลมปอด', 5, 280), P('กระเป๋าเก็บหุ่น', 1, 1200)];

/** A fresh copy of the seed on every call, so two app instances never share data. */
export function seedAssets(): Asset[] {
  return [
    A({ id: 'A1', code: '6515-002-0001', name: 'หุ่นฝึกช่วยฟื้นคืนชีพผู้ใหญ่ (CPR) ชุดที่ 1', cat: 'หุ่นจำลอง', room: LAB1, price: 85000, acq: '2023-09-12', doc: 'ใบตรวจรับ ตร.45/2566', vendor: V1, warranty: '2025-09-12', life: 5, parts: CPR(),
      events: [{ date: '12 ก.ย. 66', text: 'ตรวจรับและขึ้นทะเบียน ส่งมอบงานห้องปฏิบัติการพยาบาล', doc: 'ตร.45/2566' }, { date: '3 ต.ค. 68', text: 'ตรวจสอบพัสดุประจำปี 2568: พบ สภาพดี', doc: 'รอบตรวจ 2568' }, { date: '9 ก.ย. 69', text: 'ยืมโดย นายธนกร แก้วมณี คืนตรงเวลา ครบทุกชิ้น', doc: 'L-2569-0388' }] }),
    A({ id: 'A2', code: '6515-002-0002', name: 'หุ่นฝึกช่วยฟื้นคืนชีพผู้ใหญ่ (CPR) ชุดที่ 2', cat: 'หุ่นจำลอง', room: LAB1, status: 'ถูกยืม', price: 85000, acq: '2023-09-12', doc: 'ใบตรวจรับ ตร.45/2566', vendor: V1, warranty: '2025-09-12', life: 5, parts: CPR(),
      events: [{ date: '12 ก.ย. 66', text: 'ตรวจรับและขึ้นทะเบียน', doc: 'ตร.45/2566' }, { date: '18 ต.ค. 69', text: 'ยืมโดย นางสาวกัญญาณัฐ บุญมา กำหนดคืน 25 ต.ค. 69', doc: 'L-2569-0412' }] }),
    A({ id: 'A3', code: '6515-002-0007', name: 'หุ่นฝึกสวนปัสสาวะ (เพศหญิง)', cat: 'หุ่นจำลอง', room: LAB1, price: 48000, acq: '2025-06-20', doc: 'ใบตรวจรับ ตร.22/2568', vendor: V1, warranty: '2027-06-20', life: 5, parts: [P('ตัวหุ่นช่วงล่าง', 1, 0), P('อวัยวะเพศจำลองเปลี่ยนได้', 1, 4500), P('ถุงเก็บน้ำปัสสาวะ', 1, 150)] }),
    A({ id: 'A4', code: '6515-002-0011', name: 'แขนฝึกแทงเข็มเข้าหลอดเลือดดำ', cat: 'หุ่นจำลอง', room: LAB2, status: 'รอซ่อม', price: 26500, acq: '2022-02-02', doc: 'ใบตรวจรับ ตร.8/2565', vendor: V2, warranty: '2024-02-02', life: 5, parts: [P('แขนจำลอง', 1, 0), P('ผิวหนังสำรอง', 2, 1800), P('ขาตั้ง', 1, 600)],
      events: [{ date: '2 ก.พ. 65', text: 'ตรวจรับและขึ้นทะเบียน', doc: 'ตร.8/2565' }, { date: '27 ต.ค. 69', text: 'แจ้งซ่อม: ผิวหนังจำลองรั่ว', doc: 'WO-2569-031' }] }),
    A({ id: 'A5', code: '6515-003-0004', name: 'เครื่องวัดความดันโลหิตอัตโนมัติ', cat: 'เครื่องมือแพทย์ที่ใช้สอน', room: LAB2, price: 3200, acq: '2024-01-15', doc: 'ใบตรวจรับ ตร.3/2567', vendor: V2, warranty: '2026-01-15', life: 5, calib: { last: '2025-11-10', cycle: 12 } }),
    A({ id: 'A6', code: '6515-003-0009', name: 'เครื่องดูดเสมหะแบบพกพา', cat: 'เครื่องมือแพทย์ที่ใช้สอน', room: LAB2, price: 18000, acq: '2024-04-04', method: 'รับบริจาค', doc: 'หนังสือรับบริจาค 3/2567', life: 5, calib: { last: '2026-01-15', cycle: 12 } }),
    A({ id: 'A7', code: '6515-002-0015', name: 'หุ่นฝึกทำคลอด', cat: 'หุ่นจำลอง', room: LAB1, price: 120000, acq: '2023-12-01', method: 'รับโอน', doc: 'หนังสือรับโอน [เลขที่]', life: 8, parts: [P('หุ่นมารดา', 1, 0), P('ทารกจำลอง', 1, 6500), P('รกและสายสะดือจำลอง', 1, 2400)] }),
    A({ id: 'A8', code: '7440-001-0021', name: 'คอมพิวเตอร์โน้ตบุ๊ก', cat: 'คอมพิวเตอร์', dept: 'งานพัสดุ', room: SUPPLY, price: 24900, acq: '2025-03-10', doc: 'ใบตรวจรับ ตร.11/2568', vendor: V3, warranty: '2028-03-10', life: 4 }),
    A({ id: 'A9', code: '7730-001-0003', name: 'เครื่องฉายภาพ (โปรเจกเตอร์)', cat: 'โสตทัศนูปกรณ์', dept: 'กลุ่มงานวิชาการ', room: CLASS, price: 21500, acq: '2022-08-05', doc: 'ใบตรวจรับ ตร.30/2565', vendor: V4, warranty: '2024-08-05', life: 5 }),
    A({ id: 'A10', code: '6515-002-0020', name: 'หุ่นฝึกดูดเสมหะทางท่อช่วยหายใจ', cat: 'หุ่นจำลอง', room: LAB2, price: 64000, acq: '2024-05-22', doc: 'ใบตรวจรับ ตร.17/2567', vendor: V1, warranty: '2026-05-22', life: 5, parts: [P('ตัวหุ่นครึ่งตัว', 1, 0), P('ท่อช่วยหายใจจำลอง', 2, 900)] }),
    A({ id: 'A11', code: '6530-001-0004', name: 'เตียงฝึกปฏิบัติการพยาบาล', cat: 'เตียงและครุภัณฑ์ห้องฝึก', room: LAB1, price: 32000, acq: '2020-06-10', doc: 'ใบตรวจรับ ตร.19/2563', vendor: V4, life: 8 }),
    A({ id: 'A12', code: '7110-001-0018', name: 'ตู้เก็บหุ่นจำลอง', cat: 'สำนักงาน', room: STORE, price: 15800, acq: '2017-12-10', doc: 'ใบตรวจรับ ตร.40/2560', vendor: V4, life: 10 }),
    A({ id: 'A13', code: '6515-003-0012', name: 'เครื่องชั่งน้ำหนักดิจิทัล', cat: 'เครื่องมือแพทย์ที่ใช้สอน', room: LAB2, price: 4500, acq: '2023-05-20', doc: 'ใบตรวจรับ ตร.14/2566', vendor: V2, life: 5, calib: { last: '2026-05-20', cycle: 6 } }),
    A({ id: 'A14', code: '6515-003-0013', name: 'เครื่องวัดอุณหภูมิอินฟราเรด', cat: 'เครื่องมือแพทย์ที่ใช้สอน', room: LAB1, price: 2800, acq: '2022-10-20', doc: 'ใบตรวจรับ ตร.33/2565', vendor: V2, life: 5, calib: { last: '2025-10-20', cycle: 12 } }),
    A({ id: 'A15', code: '6515-002-0005', name: 'หุ่นฝึก CPR ทารก', cat: 'หุ่นจำลอง', room: STORE, price: 38000, acq: '2021-11-15', doc: 'ใบตรวจรับ ตร.41/2564', vendor: V1, life: 5, parts: [P('ตัวหุ่นทารก', 1, 0), P('หน้ากากใบหน้า', 3, 250)] }),
    A({ id: 'A16', code: '7730-001-0001', name: 'เครื่องฉายภาพข้ามศีรษะ', cat: 'โสตทัศนูปกรณ์', dept: 'กลุ่มงานวิชาการ', room: STORE, price: 18900, acq: '2014-06-01', doc: 'ใบตรวจรับ ตร.12/2557', vendor: V4, life: 8 }),
    A({ id: 'A17', code: '7440-001-0007', name: 'คอมพิวเตอร์ตั้งโต๊ะ', cat: 'คอมพิวเตอร์', dept: 'งานพัสดุ', room: SUPPLY, price: 19500, acq: '2018-03-01', doc: 'ใบตรวจรับ ตร.6/2561', vendor: V3, life: 5 })
  ];
}
