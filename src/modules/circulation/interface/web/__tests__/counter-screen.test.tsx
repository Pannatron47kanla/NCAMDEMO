// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { fixedClock } from '../../../../../shared/clock';
import { createRegistryModule } from '../../../../registry';
import { createCirculationModule } from '../../../module';
import { CounterScreen } from '../CounterScreen';

function show() {
  const clock = fixedClock(new Date(2026, 9, 28));
  const registry = createRegistryModule();
  const circulation = createCirculationModule(clock, { assets: registry.catalog });
  const onPrintSlip = vi.fn();
  render(<CounterScreen circulation={circulation} assets={registry.assets.get()} now={clock.now()} onPrintSlip={onPrintSlip} />);
  return { circulation, registry, onPrintSlip, user: userEvent.setup() };
}

describe('counter screen', () => {
  it('AC6: pressing scan with an empty box shows the warning in the status area', async () => {
    const { user } = show();
    expect(screen.getByText('เริ่มจากสแกนบัตรนักศึกษาหรือบัตรบุคลากร ระบบจะตรวจสิทธิ์ก่อนให้สแกนครุภัณฑ์')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'สแกน' }));
    expect(screen.getByRole('status')).toHaveTextContent('สแกนหรือพิมพ์รหัสก่อนกดสแกน');
  });

  it('AC6: typing a code with spaces and pressing Enter shows the borrower', async () => {
    const { user } = show();
    expect(screen.getByLabelText('สแกนบัตรผู้ยืม (รหัสนักศึกษา / บุคลากร)')).toBeInTheDocument();
    await user.type(screen.getByRole('textbox'), ' T0007 {Enter}');
    expect(screen.getByText('อ.ดร.สุภาวดี วงศ์ใหญ่')).toBeInTheDocument();
    expect(screen.getByText('ยืมได้', { selector: '.chip' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('ผ่านการตรวจสิทธิ์ สแกนครุภัณฑ์ที่จะจ่ายได้เลย');
    expect(screen.getByLabelText('สแกนป้าย QR ครุภัณฑ์')).toBeInTheDocument();
  });

  it('AC6: a simulated-scan chip scans that borrower, and the mode buttons switch panels', async () => {
    const { user } = show();
    await user.click(screen.getByRole('button', { name: /6611010042/ }));
    expect(screen.getByText('นายธนกร แก้วมณี')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'รับคืน' }));
    expect(screen.getByText('สแกนป้าย QR ของครุภัณฑ์ที่นำมาคืน ระบบจะค้นใบยืมให้เอง')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'ขั้นตอนการรับคืน' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'ยืม' }));
    expect(screen.getByText('เริ่มจากสแกนบัตรนักศึกษาหรือบัตรบุคลากร ระบบจะตรวจสิทธิ์ก่อนให้สแกนครุภัณฑ์')).toBeInTheDocument();
  });

  it('AC7: an unknown borrower code shows the Thai error text', async () => {
    const { user } = show();
    await user.type(screen.getByRole('textbox'), '9999999999{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('ไม่พบรหัสผู้ยืม 9999999999 ในทะเบียนผู้ยืม');
  });

  it('AC8: a blocked borrower shows the overdue error, the งดยืม chip, the overdue loan and a new-borrower button', async () => {
    const { user } = show();
    await user.click(screen.getByRole('button', { name: /6511010088/ }));
    expect(screen.getByRole('status')).toHaveTextContent('ยืมไม่ได้: มีรายการเกินกำหนดคืน 1 ใบยืม ต้องคืนก่อน');
    expect(screen.getByText('งดยืม', { selector: '.chip' })).toBeInTheDocument();
    expect(screen.getByText('ถือชุดหุ่น/ชุดฝึกอยู่ 1 ชุด · สูงสุด 2 ชุดต่อนักศึกษา')).toBeInTheDocument();
    expect(screen.getByText(/ค้างคืน .* · กำหนดคืน 25 ต\.ค\. 69 · ช้า 3 วัน/)).toBeInTheDocument();
    await user.type(screen.getByRole('textbox'), '6515-002-0001{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('ผู้ยืมรายนี้งดยืมจนกว่าจะคืนรายการที่ค้าง');
    await user.click(screen.getByRole('button', { name: 'รายการใหม่ (สแกนผู้ยืมคนถัดไป)' }));
    expect(screen.getByText('เริ่มจากสแกนบัตรนักศึกษาหรือบัตรบุคลากร ระบบจะตรวจสิทธิ์ก่อนให้สแกนครุภัณฑ์')).toBeInTheDocument();
  });

  it('AC9: an unknown asset code shows the Thai error text', async () => {
    const { user } = show();
    await user.click(screen.getByRole('button', { name: /T0007/ }));
    await user.type(screen.getByRole('textbox'), '9999-999-9999{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('ไม่พบรหัสครุภัณฑ์ 9999-999-9999');
  });

  it('AC10: a scanned asset appears in the list once; scanning it again shows the duplicate warning; remove empties the list', async () => {
    const { user, registry } = show();
    const a = registry.catalog.findById('A1')!;
    await user.click(screen.getByRole('button', { name: /T0007/ }));
    expect(screen.getByText('ยังไม่มีรายการ สแกนป้าย QR ครุภัณฑ์เพื่อเพิ่มลงรายการที่จะจ่าย')).toBeInTheDocument();
    await user.type(screen.getByRole('textbox'), `${a.code}{Enter}`);
    expect(screen.getByRole('status')).toHaveTextContent('เพิ่ม ' + a.name);
    expect(screen.getByText('รายการที่จะจ่าย')).toBeInTheDocument();
    expect(screen.getByText('1 รายการ')).toBeInTheDocument();
    await user.type(screen.getByRole('textbox'), `${a.code}{Enter}`);
    expect(screen.getByRole('status')).toHaveTextContent('สแกนซ้ำ: ' + a.name + ' อยู่ในรายการแล้ว ไม่เพิ่มซ้ำ');
    expect(screen.getByText('1 รายการ')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'เอาออก' }));
    expect(screen.getByRole('status')).toHaveTextContent('เอา ' + a.name + ' ออกจากรายการ');
    expect(screen.getByText('ยังไม่มีรายการ สแกนป้าย QR ครุภัณฑ์เพื่อเพิ่มลงรายการที่จะจ่าย')).toBeInTheDocument();
  });

  it('AC11: scanning an asset that is not ready shows the Thai error with its status', async () => {
    const { user, registry } = show();
    const a = registry.catalog.findById('A1')!;
    registry.catalog.setStatus('A1', 'รอซ่อม');
    await user.click(screen.getByRole('button', { name: /T0007/ }));
    await user.type(screen.getByRole('textbox'), `${a.code}{Enter}`);
    expect(screen.getByRole('status')).toHaveTextContent(`จ่ายไม่ได้: ${a.name} สถานะ "รอซ่อม"`);
  });

  it('AC12: the third kit for a student shows the Thai limit error', async () => {
    const { user, registry } = show();
    await user.click(screen.getByRole('button', { name: /6611010015/ }));
    for (const id of ['A1', 'A7', 'A3']) await user.type(screen.getByRole('textbox'), `${registry.catalog.findById(id)!.code}{Enter}`);
    expect(screen.getByRole('status')).toHaveTextContent('เกินจำนวนสูงสุด 2 ชุดต่อนักศึกษา (มีในรายการ/ถืออยู่แล้ว 2 ชุด)');
    expect(screen.getByText('2 รายการ')).toBeInTheDocument();
  });
});
