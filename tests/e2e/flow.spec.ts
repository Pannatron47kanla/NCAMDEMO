import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 1100 } });

const openMenu = (page: Page, label: string) =>
  page.getByRole('navigation', { name: 'เมนูหลัก' }).getByRole('button', { name: label, exact: true }).click();

test('AC5: main flow works on the production build', async ({ page }) => {
  const remote: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    const url = r.url();
    if (!url.startsWith('http://localhost:4173') && !url.startsWith('blob:') && !url.startsWith('data:')) remote.push(url);
  });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  // Login.
  await page.goto('/');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'แดชบอร์ด' })).toBeVisible();

  // Borrow asset A1 for student 6611010015.
  await openMenu(page, 'เคาน์เตอร์ยืม-คืน');
  await page.getByRole('button', { name: /6611010015/ }).click();
  await page.getByRole('button', { name: /6515-002-0001/ }).click();
  await page.getByRole('button', { name: 'ยืนยันการยืม' }).click();

  // Return it damaged, which opens a repair ticket.
  await page.getByRole('button', { name: 'รับคืน', exact: true }).click();
  await page.getByRole('button', { name: /6515-002-0001/ }).click();
  await page.locator('#ret-cond').selectOption('ชำรุด');
  await page.getByRole('button', { name: 'ยืนยันการรับคืน' }).click();

  // Accept and close the ticket that the return opened.
  await openMenu(page, 'แจ้งซ่อม / ใบงาน');
  await page.locator('tbody tr', { hasText: 'รอรับงาน' }).first().click();
  await expect(page.locator('section.card', { hasText: 'ผู้แจ้ง' }).getByText('6515-002-0001')).toBeVisible();
  await page.getByRole('button', { name: 'รับงาน: ซ่อมภายใน' }).click();
  await page.locator('#tk-test').check();
  await page.locator('#tk-parts').check();
  await page.getByRole('button', { name: 'ปิดงาน ส่งคืนใช้งาน' }).click();
  await expect(page.getByText(/ปิดงานแล้ว ครุภัณฑ์กลับเป็น "พร้อมใช้"/)).toBeVisible();

  // Dispose of an asset by auction, through all six steps.
  await openMenu(page, 'แผนจำหน่าย');
  await page.locator('#ds-A16').check();
  await page.getByRole('button', { name: /^สร้างเรื่องขอจำหน่าย/ }).first().click();
  await page.getByRole('button', { name: /^สร้างเรื่องขอจำหน่าย \(/ }).last().click();
  await page.getByRole('button', { name: 'บันทึกผลกรรมการ' }).click();
  await page.getByRole('button', { name: 'บันทึก: ผู้อำนวยการอนุมัติ' }).click();
  await page.locator('#mn-A16').fill('5000');
  await page.locator('#mn-A17').fill('4000');
  await page.getByRole('button', { name: 'ปิดประกาศขายทอดตลาด' }).click();
  await page.locator('#sd-A16').fill('6000');
  await page.locator('#sd-A17').fill('4500');
  await page.locator('#d-buyer').fill('บริษัท ทดสอบ จำกัด');
  await page.locator('#d-rcpt').fill('R-001');
  await page.getByRole('button', { name: 'บันทึกผลการขาย' }).click();
  await page.getByRole('button', { name: /^ยืนยันลงจ่ายออกจากทะเบียน/ }).click();
  await page.locator('#d-oag').fill('ศธ 0001/2569');
  await page.getByRole('button', { name: 'บันทึกการแจ้ง สตง.' }).click();
  await expect(page.getByRole('dialog').getByText(/แจ้ง สตง\. หนังสือที่ ศธ 0001\/2569/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'ปิดเรื่องและเริ่มเรื่องใหม่' })).toBeVisible();

  expect(remote).toEqual([]);
  expect(errors).toEqual([]);
});
