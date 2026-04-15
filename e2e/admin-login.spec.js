import { test, expect } from '@playwright/test';

const adminUser = process.env.E2E_ADMIN_USER || '';
const adminPass = process.env.E2E_ADMIN_PASSWORD || '';

test.describe('Admin (optionnel)', () => {
  test.skip(!adminUser || !adminPass, 'Définir E2E_ADMIN_USER et E2E_ADMIN_PASSWORD pour activer ce test.');

  test('connexion admin et tableau de bord', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByPlaceholder('admin').fill(adminUser);
    await page.getByPlaceholder('••••••••').fill(adminPass);
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page).toHaveURL(/\/admin\/(dashboard)?/i, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /tableau de bord|dashboard/i })).toBeVisible({ timeout: 10_000 });
  });
});
