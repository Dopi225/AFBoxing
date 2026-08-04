import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  requireApi,
  requireAdminCreds,
  uniqueLabel,
} from './helpers/admin.js';

test.describe('Contact public → admin → réponse → Répondu', () => {
  test.beforeEach(async ({ request }) => {
    requireAdminCreds();
    await requireApi(request);
  });

  test('soumission formulaire, lecture admin, réponse email, statut Répondu', async ({ page }) => {
    const marker = uniqueLabel('E2E Contact');
    const email = `e2e.${Date.now()}@example.com`;

    // 1) Formulaire public
    await page.goto('/contact');
    await page.getByLabel(/nom et prénom/i).fill(marker);
    await page.getByLabel(/^email$/i).fill(email);
    await page.getByLabel(/^message$/i).fill(
      `Message de test automatisé ${marker}. Merci de répondre pour valider le parcours CRM.`
    );
    await page.getByRole('button', { name: /envoyer/i }).click();
    await expect(page.getByText(/merci|envoyé|reçu|message/i).first()).toBeVisible({ timeout: 15_000 });

    // 2) Admin — retrouver le message
    await loginAsAdmin(page);
    await page.goto('/admin/contacts');
    await expect(page.getByRole('heading', { name: /messages reçus/i })).toBeVisible();
    await expect(page.getByText(marker).first()).toBeVisible({ timeout: 15_000 });
    await page.getByText(marker).first().click();

    // 3) Répondre
    await page.getByRole('button', { name: /^répondre$/i }).click();
    const replyBox = page.getByLabel(/votre réponse|réponse|message/i).or(page.locator('textarea')).first();
    await replyBox.fill(
      `Bonjour,\n\nNous avons bien reçu votre message (${marker}). Merci pour votre intérêt.\n\nSportivement,`
    );
    await page.getByRole('button', { name: /envoyer la réponse/i }).click();

    // 4) Statut Répondu (nécessite MAIL_DRIVER=log ou SMTP fonctionnel)
    await expect(page.getByText(/répondu/i).first()).toBeVisible({ timeout: 20_000 });
  });
});
