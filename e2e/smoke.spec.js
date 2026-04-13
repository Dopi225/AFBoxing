import { test, expect } from '@playwright/test';

test.describe('Parcours public', () => {
  test('la page d’accueil se charge', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('route inconnue affiche la page 404', async ({ page }) => {
    await page.goto('/route-inexistante-xyz');
    await expect(page.getByRole('heading', { name: /cette page n’existe pas/i })).toBeVisible();
  });
});
