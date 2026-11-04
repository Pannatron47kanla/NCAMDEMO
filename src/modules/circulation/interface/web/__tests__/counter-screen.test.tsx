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
});
