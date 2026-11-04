// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { fixedClock } from '../../../../../shared/clock';
import { createRegistryModule } from '../../../../registry';
import { createCirculationModule } from '../../../module';
import { CounterScreen } from '../CounterScreen';

/** Lends `ids` to the teacher T0007 before the screen opens; the clock starts at the demo date. */
function show(lend: string[] = []) {
  const clock = fixedClock(new Date(2026, 9, 28));
  const registry = createRegistryModule();
  const circulation = createCirculationModule(clock, { assets: registry.catalog, repairs: { open: () => ({ id: 'WO-2569-032', status: 'รอรับงาน' }) } });
  if (lend.length) {
    circulation.counter.scan('T0007');
    for (const id of lend) circulation.counter.scan(registry.catalog.findById(id)!.code);
    circulation.counter.confirmBorrow();
  }
  render(<CounterScreen circulation={circulation} assets={registry.assets.get()} now={clock.now()} onPrintSlip={() => undefined} />);
  return { circulation, registry, user: userEvent.setup() };
}

describe('return panel', () => {
  it('AC16: an on-time return shows no charges; confirming shows the saved card with the new status', async () => {
    const { user, registry } = show(['A1']);
    const a = registry.catalog.findById('A1')!;
    await user.click(screen.getByRole('button', { name: 'รับคืน' }));
    await user.type(screen.getByRole('textbox'), `${a.code}{Enter}`);
    expect(screen.getByRole('status')).toHaveTextContent(/^พบใบยืม L-2569-0413$/);
    expect(screen.getByText('คืนตรงเวลา', { selector: '.chip' })).toBeInTheDocument();
    expect(screen.getByText('ติ๊กชิ้นส่วนที่ได้รับคืน (เอาติ๊กออกถ้าขาด)')).toBeInTheDocument();
    expect(screen.getAllByText('ไม่มี')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'ยืนยันการรับคืน' }));
    expect(screen.getByRole('status')).toHaveTextContent('บันทึกการรับคืนแล้ว');
    const card = screen.getByText('ค่าปรับและค่าชดใช้ไปรอบันทึกชำระในช่องด้านขวา').closest('section')!;
    expect(within(card).getByText('ครบทุกชิ้น')).toBeInTheDocument();
    expect(within(card).getByText('พร้อมใช้', { selector: '.chip' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'ยืนยันการรับคืน' })).not.toBeInTheDocument();
  });

  it('AC16: cancelling the form brings back the scan hint', async () => {
    const { user, registry } = show();
    await user.click(screen.getByRole('button', { name: 'รับคืน' }));
    await user.type(screen.getByRole('textbox'), `${registry.catalog.findById('A2')!.code}{Enter}`);
    await user.click(screen.getByRole('button', { name: 'ยกเลิก' }));
    expect(screen.getByText('สแกนป้าย QR ของครุภัณฑ์ที่นำมาคืน ระบบจะค้นใบยืมให้เอง')).toBeInTheDocument();
  });
});

describe('late return panel', () => {
  it('AC17: the seed loan shows the late chip and fine before confirming, and the fine on the saved card', async () => {
    const { user, registry } = show();
    await user.click(screen.getByRole('button', { name: 'รับคืน' }));
    await user.type(screen.getByRole('textbox'), `${registry.catalog.findById('A2')!.code}{Enter}`);
    expect(screen.getByText('คืนช้า 3 วัน', { selector: '.chip' })).toBeInTheDocument();
    expect(screen.getByText('15 บาท (3 วัน × 5 บาท)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'ยืนยันการรับคืน' }));
    expect(screen.getByText('15 บาท (ช้า 3 วัน × 5 บาท)')).toBeInTheDocument();
  });
});

describe('return panel with missing parts', () => {
  it('AC18: unticking a part shows the loss before confirming and on the saved card', async () => {
    const { user, registry } = show(['A10']);
    await user.click(screen.getByRole('button', { name: 'รับคืน' }));
    await user.type(screen.getByRole('textbox'), `${registry.catalog.findById('A10')!.code}{Enter}`);
    await user.click(screen.getByRole('checkbox', { name: 'ท่อช่วยหายใจจำลอง × 2' }));
    expect(screen.getByText('2,160 บาท (ราคาชิ้นส่วน + 20%)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'ยืนยันการรับคืน' }));
    const card = screen.getByText('ค่าปรับและค่าชดใช้ไปรอบันทึกชำระในช่องด้านขวา').closest('section')!;
    expect(within(card).getByText('ขาด ท่อช่วยหายใจจำลอง × 2')).toBeInTheDocument();
    expect(within(card).getByText('2,160 บาท')).toBeInTheDocument();
    expect(within(card).getByText('ชิ้นส่วนไม่ครบ', { selector: '.chip' })).toBeInTheDocument();
  });
});

describe('damaged return panel', () => {
  it('AC19: choosing ชำรุด and confirming shows the new status รอซ่อม', async () => {
    const { user, registry } = show(['A1']);
    await user.click(screen.getByRole('button', { name: 'รับคืน' }));
    await user.type(screen.getByRole('textbox'), `${registry.catalog.findById('A1')!.code}{Enter}`);
    await user.selectOptions(screen.getByLabelText('สภาพเมื่อรับคืน'), 'ชำรุด');
    await user.click(screen.getByRole('button', { name: 'ยืนยันการรับคืน' }));
    const card = screen.getByText('ค่าปรับและค่าชดใช้ไปรอบันทึกชำระในช่องด้านขวา').closest('section')!;
    expect(within(card).getByText('รอซ่อม', { selector: '.chip' })).toBeInTheDocument();
  });
});
