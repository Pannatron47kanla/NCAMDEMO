// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createRegistryModule } from '../../../module';
import { AssetDetail } from '../AssetDetail';

const NOW = new Date(2026, 9, 28);
const seed = () => createRegistryModule().catalog;

function show(id: string, holder: string | null = null) {
  const asset = seed().findById(id)!;
  const actions = { onBack: vi.fn(), onLocate: vi.fn(), onPrintLabel: vi.fn(), onRepair: vi.fn() };
  render(<AssetDetail asset={asset} now={NOW} holder={holder} {...actions} />);
  return actions;
}

describe('asset detail', () => {
  it('AC30: a kit shows its life bucket, remaining time, parts and history (latest first)', () => {
    show('A1');
    expect(screen.getByRole('heading', { level: 1, name: 'หุ่นฝึกช่วยฟื้นคืนชีพผู้ใหญ่ (CPR) ชุดที่ 1' })).toBeInTheDocument();
    expect(screen.getByText('6515-002-0001 · หุ่นจำลอง')).toBeInTheDocument();
    expect(screen.getByText('มากกว่า 1 ปี')).toBeInTheDocument();
    expect(screen.getByText('กำหนดพิจารณาจำหน่าย', { exact: false })).toHaveTextContent('12 ก.ย. 71');
    expect(screen.getByText('อายุการใช้งาน 5 ปี · ใช้ไปแล้ว 63%')).toBeInTheDocument();
    expect(screen.getByText('ห้องปฏิบัติการพยาบาล 1', { exact: false })).toHaveTextContent('อาคารปฏิบัติการพยาบาล ชั้น 2 · ห้องปฏิบัติการพยาบาล 1');
    expect(screen.getByText('85,000 บาท')).toBeInTheDocument();
    expect(screen.getByText('หมดประกัน 12 ก.ย. 68')).toBeInTheDocument();
    expect(screen.getByText('ไม่ต้องสอบเทียบ')).toBeInTheDocument();

    expect(screen.getByText('ตัวหุ่น × 1')).toBeInTheDocument();
    expect(screen.getByText('ตัวหลัก')).toBeInTheDocument();
    expect(screen.getByText('หน้ากากใบหน้า × 5')).toBeInTheDocument();
    expect(screen.getByText('350 บาท/ชิ้น')).toBeInTheDocument();

    const history = screen.getByRole('heading', { name: 'ประวัติ (ล่าสุดอยู่บน)' }).parentElement!;
    const dates = Array.from(history.querySelectorAll('.lbl')).map((e) => e.textContent).filter((t) => /^\d/.test(t ?? ''));
    expect(dates).toEqual(['9 ก.ย. 69', '3 ต.ค. 68', '12 ก.ย. 66']);
  });

  it('AC30: a single instrument shows the calibration dates and says it has no parts', () => {
    show('A5');
    expect(screen.getByText('ทุก 12 เดือน · ครั้งล่าสุด 10 พ.ย. 68 · ครั้งถัดไป 10 พ.ย. 69')).toBeInTheDocument();
    expect(screen.getByText('หมดประกัน 15 ม.ค. 69')).toBeInTheDocument();
    expect(screen.getByText('เครื่องเดี่ยว ไม่มีชิ้นส่วนย่อย')).toBeInTheDocument();
  });

  it('AC30: a calibration date already passed says how many days late', () => {
    show('A14');
    expect(screen.getByText(/ครั้งถัดไป 20 ต.ค. 69 \(เลยกำหนด 8 วัน\)/)).toBeInTheDocument();
  });

  it('AC30: a borrowed asset shows who holds it', () => {
    show('A2', 'ถูกยืมโดย นางสาวกัญญาณัฐ บุญมา · ใบยืม L-2569-0412 · กำหนดคืน 25 ต.ค. 69');
    expect(screen.getByText(/ถูกยืมโดย นางสาวกัญญาณัฐ บุญมา/)).toBeInTheDocument();
    expect(screen.getByText('ถูกยืม', { selector: '.chip' })).toBeInTheDocument();
  });

  it('AC30: the four buttons call back', async () => {
    const user = userEvent.setup();
    const a = show('A3');
    expect(screen.queryByText(/ถูกยืมโดย/)).toBeNull();
    await user.click(screen.getByRole('button', { name: '← กลับไปทะเบียน' }));
    await user.click(screen.getByRole('button', { name: 'ดูบนแผนที่' }));
    await user.click(screen.getByRole('button', { name: 'พิมพ์ป้าย QR' }));
    await user.click(screen.getByRole('button', { name: 'แจ้งซ่อม' }));
    expect(a.onBack).toHaveBeenCalledTimes(1);
    expect(a.onLocate).toHaveBeenCalledTimes(1);
    expect(a.onPrintLabel).toHaveBeenCalledTimes(1);
    expect(a.onRepair).toHaveBeenCalledTimes(1);
    expect(screen.getByText('พร้อมใช้', { selector: '.chip' })).toBeInTheDocument();
  });
});
