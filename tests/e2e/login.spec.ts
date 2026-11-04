import { expect, test } from '@playwright/test';

test('AC3: any role reaches the dashboard on the production build', async ({ page }) => {
  const remote: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith('http://localhost:4173')) remote.push(r.url());
  });
  await page.goto('/');
  await page.getByLabel('บทบาท (สำหรับสาธิต)').selectOption('ผู้บริหาร');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'แดชบอร์ด' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'เมนูหลัก' }).getByText('ผู้บริหาร')).toBeVisible();
  expect(remote).toEqual([]);
});
