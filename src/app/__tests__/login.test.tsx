// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../App';

const ROLES = ['เจ้าหน้าที่ห้องปฏิบัติการ', 'เจ้าหน้าที่พัสดุ', 'กรรมการตรวจสอบพัสดุ', 'ผู้บริหาร', 'ผู้ดูแลระบบ'];

const NAV_BUTTONS = [
  'แดชบอร์ด', 'เคาน์เตอร์ยืม-คืน', 'แจ้งซ่อม / ใบงาน',
  'ทะเบียนและตำแหน่ง', 'ทะเบียนครุภัณฑ์', 'ขึ้นทะเบียนใหม่', 'กำหนดห้อง', 'แผนที่ตำแหน่ง', 'นำเข้าข้อมูลเดิม',
  'วางแผนและรายงาน', 'ปฏิทินกำหนดการ', 'แผนจำหน่าย', 'ตรวจสอบพัสดุประจำปี', 'รายงาน',
  'ตั้งค่ากติกายืม',
];

async function signIn(role: string) {
  const user = userEvent.setup();
  render(<App />);
  await user.selectOptions(screen.getByLabelText('บทบาท (สำหรับสาธิต)'), role);
  await user.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }));
  return user;
}

describe('login and shell', () => {
  it('AC3: the app opens on the login screen with the five roles', () => {
    render(<App />);
    const select = screen.getByLabelText('บทบาท (สำหรับสาธิต)');
    expect(within(select).getAllByRole('option').map((o) => o.textContent)).toEqual(ROLES);
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it.each(ROLES)('AC3: any role reaches the dashboard (%s)', async (role) => {
    await signIn(role);
    expect(screen.getByRole('heading', { level: 1, name: 'แดชบอร์ด' })).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'เมนูหลัก' });
    expect(within(nav).getByText(role)).toBeInTheDocument();
    for (const label of NAV_BUTTONS) expect(within(nav).getByRole('button', { name: label })).toBeInTheDocument();
    for (const head of ['งานประจำวัน', 'ตั้งค่า']) expect(within(nav).getByText(head)).toBeInTheDocument();
  });

  it('AC3: nav groups collapse and expand', async () => {
    const user = await signIn('ผู้บริหาร');
    const nav = screen.getByRole('navigation', { name: 'เมนูหลัก' });
    const group = within(nav).getByRole('button', { name: 'ทะเบียนและตำแหน่ง' });
    expect(group).toHaveAttribute('aria-expanded', 'true');
    await user.click(group);
    expect(group).toHaveAttribute('aria-expanded', 'false');
    expect(within(nav).queryByRole('button', { name: 'ทะเบียนครุภัณฑ์' })).toBeNull();
    await user.click(group);
    expect(within(nav).getByRole('button', { name: 'ทะเบียนครุภัณฑ์' })).toBeInTheDocument();

    const plan = within(nav).getByRole('button', { name: 'วางแผนและรายงาน' });
    await user.click(plan);
    expect(within(nav).queryByRole('button', { name: 'ปฏิทินกำหนดการ' })).toBeNull();
  });

  it('AC3: a screen that is not ported yet shows a placeholder and logout returns to login', async () => {
    const user = await signIn('ผู้ดูแลระบบ');
    await user.click(screen.getByRole('button', { name: 'เคาน์เตอร์ยืม-คืน' }));
    expect(screen.getByRole('heading', { level: 1, name: 'เคาน์เตอร์ยืม-คืน' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'ออกจากระบบ' }));
    expect(screen.getByLabelText('บทบาท (สำหรับสาธิต)')).toHaveValue('ผู้ดูแลระบบ');
  });
});
