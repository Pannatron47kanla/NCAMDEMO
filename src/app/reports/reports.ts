import { auditCounts, type AuditRound } from '../../modules/audit';
import type { DisposalCase } from '../../modules/disposal';
import { assetInfo, type Asset } from '../../modules/registry';
import { resultCase } from '../documents/documents';

// The report cards, ported from the `reports` list in renderVals (mockup lines 2812-2819).

export interface ReportCard {
  /** The print kind the card opens. */
  kind: 'register' | 'disposal' | 'calib' | 'audit' | 'auction' | 'dispResult';
  title: string;
  desc: string;
  note: string;
  off: boolean;
}

export interface ReportSources {
  assets: readonly Asset[];
  audit: AuditRound;
  current: DisposalCase | null;
  done: readonly DisposalCase[];
}

export function buildReports(src: ReportSources, now: Date): ReportCard[] {
  const live = src.assets.filter((a) => a.status !== 'จำหน่ายแล้ว');
  const infoOf = (a: Asset) => assetInfo(a, now);
  // The mockup declares `dispList` twice in renderVals. The card note uses the later one (line 2581): every asset with an end-of-life date.
  const dispList = live.filter((a) => infoOf(a).disp);
  const dc = src.current;
  const rc = resultCase(src.current, src.done);
  const auctionReady = !!dc && dc.data.method === 'auction' && dc.data.step >= 3;
  return [
    { kind: 'register', title: 'ทะเบียนคุมครุภัณฑ์', desc: 'ทุกรายการพร้อมวิธีได้มา ผู้ขาย ราคา ที่ตั้ง สถานะ และกำหนดพิจารณาจำหน่าย ใช้ประกอบการตรวจสอบพัสดุประจำปี', note: live.length + ' รายการ', off: false },
    { kind: 'disposal', title: 'รายงานครุภัณฑ์ครบอายุใช้งาน', desc: 'รายการที่เกินอายุใช้งานแล้วหรือจะครบภายใน 12 เดือน สำหรับวางแผนจำหน่ายและตั้งงบจัดหาทดแทน', note: dispList.filter((a) => (infoOf(a).off ?? 0) <= 365).length + ' รายการ', off: false },
    { kind: 'calib', title: 'รายงานกำหนดสอบเทียบเครื่องมือ', desc: 'เครื่องมือวัดที่ต้องสอบเทียบ รอบ ครั้งล่าสุด ครั้งถัดไป และรายการที่เลยกำหนด', note: live.filter((a) => a.calib).length + ' รายการ', off: false },
    { kind: 'audit', title: 'รายงานผลการตรวจสอบพัสดุประจำปี', desc: 'สรุปผลตรวจนับและบัญชีรายการที่ไม่ถูกต้อง ชำรุด หรือสูญไป เสนอผู้อำนวยการ ส่งสำเนา สตง.', note: 'ยืนยันแล้ว ' + auditCounts(src.audit).done + ' รายการ', off: false },
    { kind: 'auction', title: 'ร่างประกาศขายทอดตลาด', desc: 'ประกาศตามระเบียบฯ ข้อ 215 พร้อมราคาขั้นต่ำ วันดูสภาพ และวันขาย', note: auctionReady ? dc!.data.id : 'ต้องมีเรื่องจำหน่ายที่อนุมัติวิธีขายทอดตลาดแล้ว', off: !auctionReady },
    { kind: 'dispResult', title: 'รายงานผลการจำหน่ายและบัญชีลงจ่าย', desc: 'รายการที่จำหน่าย วิธี ราคาที่ได้ วันที่ลงจ่ายออกจากทะเบียน และการแจ้ง สตง. ตามข้อ 218', note: rc ? rc.data.id : 'ยังไม่มีเรื่องที่ลงจ่ายแล้ว', off: !rc },
  ];
}
