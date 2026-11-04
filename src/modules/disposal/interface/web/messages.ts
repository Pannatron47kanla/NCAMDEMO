import { baht } from '../../../../shared/money';

type Params = Record<string, string | number> | undefined;

/** Thai text for the codes disposal can show: rule errors, notices and the reasons an asset cannot join a case. Wording is copied from the mockup. */
const TEXT: Record<string, (p: NonNullable<Params>) => string> = {
  BORROWED: () => 'ถูกยืมอยู่ ต้องรับคืนก่อน',
  DIRECT_SALE_LIMIT: (p) => 'ขายเฉพาะเจาะจงไม่ได้ ราคาซื้อรวม ' + baht(p.total!) + ' เกิน 500,000 บาท ให้ใช้วิธีขายทอดตลาด (ทางเลือก A4)',
  MIN_PRICE_REQUIRED: () => 'กรอกราคาประเมินขั้นต่ำให้ครบทุกรายการก่อนปิดประกาศ',
  NO_BID_RECORDED: (p) => 'บันทึกแล้ว: ไม่มีผู้เสนอราคาถึงราคาขั้นต่ำ ให้ประเมินราคาใหม่และปิดประกาศครั้งที่ ' + p.round + ' หรือขออนุมัติเปลี่ยนวิธีจำหน่าย',
  OPEN_TICKET: () => 'มีงานซ่อมค้าง ต้องปิดใบงานก่อน',
};

export function messageText(code: string, params?: Params): string {
  const text = TEXT[code];
  return text ? text(params ?? {}) : code;
}

export { baht };
