import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  requireApi,
  requireAdminCreds,
  uniqueLabel,
  confirmDialog,
} from './helpers/admin.js';

test.describe('Tarifs — saison et duplication', () => {
  test.beforeEach(async ({ request }) => {
    requireAdminCreds();
    await requireApi(request);
  });

  test('créer une saison en copiant les tarifs de la saison courante', async ({ page }) => {
    const label = uniqueLabel('2099').replace(/^E2E\s+/i, '').slice(0, 20);
    // Libellé type année : 2099-2100 pour éviter collision avec saisons réelles
    const seasonLabel = `2099-${String(Date.now()).slice(-4)}`;

    await loginAsAdmin(page);
    await page.goto('/admin/pricing');
    await expect(page.getByRole('heading', { name: /^tarifs$/i })).toBeVisible({ timeout: 15_000 });

    const seasonChips = page.locator('.season-chip');
    const beforeCount = await seasonChips.count();
    expect(beforeCount).toBeGreaterThan(0);

    await page.getByRole('button', { name: /créer une nouvelle saison/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByLabel(/libellé|saison/i).fill(seasonLabel);
    // dates souvent préremplies ; on laisse ou force
    const start = dialog.getByLabel(/date de début|début/i);
    if (await start.isVisible().catch(() => false)) {
      await start.fill('2099-09-01');
    }
    const end = dialog.getByLabel(/date de fin|fin/i);
    if (await end.isVisible().catch(() => false)) {
      await end.fill('2100-08-31');
    }
    await dialog.getByRole('button', { name: /créer la saison et copier/i }).click();

    await expect(page.getByText(new RegExp(`saison ${seasonLabel}`, 'i')).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(seasonChips).toHaveCount(beforeCount + 1, { timeout: 10_000 });

    // Sélectionner la nouvelle saison et vérifier qu'au moins un tarif a été copié
    await page.getByRole('button', { name: new RegExp(`saison ${seasonLabel}`, 'i') }).click();
    await expect(
      page.locator('.pricing-table, table, .data-table, .pricing-list, main').getByText(/€|gratuit|par /i).first()
    ).toBeVisible({ timeout: 10_000 });

    // Nettoyage optionnel si suppression de saison non courante disponible
    void uniqueLabel;
    void confirmDialog;
    void label;
  });
});
