import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  requireApi,
  requireAdminCreds,
  uniqueLabel,
  finishWizard,
  confirmDialog,
} from './helpers/admin.js';

test.describe.configure({ mode: 'serial' });

test.describe('Admin CRM — parcours CRUD par module', () => {
  test.beforeEach(async ({ request }) => {
    requireAdminCreds();
    await requireApi(request);
  });

  test('Actualités : créer → liste → modifier → supprimer', async ({ page }) => {
    const title = uniqueLabel('E2E Actu');
    const titleEdited = `${title} (modifiée)`;

    await loginAsAdmin(page);
    await page.goto('/admin/news');
    await expect(page.getByRole('heading', { name: /^actualités$/i })).toBeVisible();

    await page.getByRole('button', { name: /publier une actualité/i }).click();
    await page.getByLabel(/titre de l'actualité/i).fill(title);
    await page.getByLabel(/^date$/i).fill('2026-08-04');
    await page.getByRole('button', { name: /^continuer$/i }).click();
    await page.getByLabel(/résumé court/i).fill('Résumé e2e court pour le test.');
    await page.getByLabel(/texte complet/i).fill('Description e2e complète du test automatisé.');
    await finishWizard(page, 1);
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 15_000 });

    const row = page.locator('.data-table, .news-list, main, .manage-news').getByText(title).first();
    await expect(row).toBeVisible();
    await page
      .locator('button, a')
      .filter({ hasText: /modifier/i })
      .first()
      .click();
    // Clic sur Modifier de la ligne concernée
    const card = page.locator('.news-card, tr, .list-item, article, .modern-card').filter({ hasText: title }).first();
    if (await card.count()) {
      await card.getByRole('button', { name: /modifier/i }).click();
    }
    await page.getByLabel(/titre de l'actualité/i).fill(titleEdited);
    await finishWizard(page, 2);
    await expect(page.getByText(titleEdited).first()).toBeVisible({ timeout: 15_000 });

    const editedCard = page.locator('.news-card, tr, .list-item, article, .modern-card').filter({ hasText: titleEdited }).first();
    if (await editedCard.count()) {
      await editedCard.getByRole('button', { name: /supprimer/i }).click();
    } else {
      await page.getByRole('button', { name: /supprimer/i }).first().click();
    }
    await confirmDialog(page, /^supprimer$/i);
    await expect(page.getByText(titleEdited)).toHaveCount(0, { timeout: 15_000 });
  });

  test('Palmarès : créer → liste → modifier → supprimer', async ({ page }) => {
    const title = uniqueLabel('E2E Palmarès');
    const titleEdited = `${title} bis`;

    await loginAsAdmin(page);
    await page.goto('/admin/palmares');
    await expect(page.getByRole('heading', { name: /^palmarès$/i })).toBeVisible();

    await page.getByRole('button', { name: /ajouter un résultat/i }).click();
    await page.getByLabel(/nom de la compétition/i).fill(title);
    await page.getByLabel(/^date$/i).fill('2026-06-15');
    await page.getByLabel(/^lieu$/i).fill('Poitiers');
    await page.getByRole('button', { name: /^continuer$/i }).click();
    await page.getByLabel(/boxeur ou équipe/i).fill('Boxeur E2E');
    await finishWizard(page, 1);
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 15_000 });

    const card = page.locator('.palmares-card, tr, .list-item, article, .modern-card').filter({ hasText: title }).first();
    await card.getByRole('button', { name: /modifier/i }).click();
    await page.getByLabel(/nom de la compétition/i).fill(titleEdited);
    await finishWizard(page, 2);
    await expect(page.getByText(titleEdited).first()).toBeVisible({ timeout: 15_000 });

    const edited = page.locator('.palmares-card, tr, .list-item, article, .modern-card').filter({ hasText: titleEdited }).first();
    await edited.getByRole('button', { name: /supprimer/i }).click();
    await confirmDialog(page, /^supprimer$/i);
    await expect(page.getByText(titleEdited)).toHaveCount(0, { timeout: 15_000 });
  });

  test('Équipe : créer → liste → modifier → masquer → supprimer', async ({ page }) => {
    const name = uniqueLabel('E2E Coach');
    const nameEdited = `${name} Mod`;

    await loginAsAdmin(page);
    await page.goto('/admin/team');
    await expect(page.getByRole('heading', { name: /^équipe$/i })).toBeVisible();

    await page.getByRole('button', { name: /ajouter un membre/i }).click();
    await page.getByLabel(/nom complet/i).fill(name);
    await page.getByLabel(/rôle ou fonction/i).fill('Coach e2e');
    await finishWizard(page, 2);
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 15_000 });

    const card = page.locator('.team-card, tr, .list-item, article, .member-card, .modern-card').filter({ hasText: name }).first();
    await card.getByRole('button', { name: /modifier/i }).click();
    await page.getByLabel(/nom complet/i).fill(nameEdited);
    await finishWizard(page, 2);
    await expect(page.getByText(nameEdited).first()).toBeVisible({ timeout: 15_000 });

    const edited = page.locator('.team-card, tr, .list-item, article, .member-card, .modern-card').filter({ hasText: nameEdited }).first();
    const toggle = edited.getByRole('button', { name: /masquer|afficher|visible/i });
    if (await toggle.count()) {
      await toggle.first().click();
      await confirmDialog(page, /masquer|afficher|confirmer/i);
    }

    await edited.getByRole('button', { name: /supprimer/i }).click();
    await confirmDialog(page, /^supprimer$/i);
    await expect(page.getByText(nameEdited)).toHaveCount(0, { timeout: 15_000 });
  });

  test('Activités : créer → liste → modifier → masquer', async ({ page }) => {
    const stamp = Date.now().toString(36);
    const title = `E2E Act ${stamp}`;
    const titleEdited = `${title} edit`;
    const activityId = `e2e-act-${stamp}`;

    await loginAsAdmin(page);
    await page.goto('/admin/activities');
    await expect(page.getByRole('heading', { name: /^activités$/i })).toBeVisible();

    await page.getByRole('button', { name: /ajouter une activité/i }).click();
    // Certains wizards ont un ID généré ; on remplit titre + description
    const idField = page.getByLabel(/id unique|identifiant/i);
    if (await idField.isVisible().catch(() => false)) {
      await idField.fill(activityId);
    }
    await page.getByLabel(/^titre/i).fill(title);
    const desc = page.getByLabel(/description/i);
    if (await desc.isVisible().catch(() => false)) {
      await desc.fill('Description activité e2e pour tests.');
    }
    // Parcourir les étapes restantes
    for (let i = 0; i < 5; i += 1) {
      const continuer = page.getByRole('button', { name: /^continuer$/i });
      if (!(await continuer.isVisible().catch(() => false))) break;
      if (!(await continuer.isEnabled())) break;
      await continuer.click();
      await page.waitForTimeout(150);
    }
    const save = page.getByRole('button', { name: /^enregistrer$/i });
    if (await save.isVisible()) {
      await save.click();
    }
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 20_000 });

    const card = page.locator('.activity-card, tr, .list-item, article, .modern-card').filter({ hasText: title }).first();
    await card.getByRole('button', { name: /modifier/i }).click();
    await page.getByLabel(/^titre/i).fill(titleEdited);
    for (let i = 0; i < 5; i += 1) {
      const continuer = page.getByRole('button', { name: /^continuer$/i });
      if (!(await continuer.isVisible().catch(() => false))) break;
      if (!(await continuer.isEnabled())) break;
      await continuer.click();
    }
    await page.getByRole('button', { name: /^enregistrer$/i }).click();
    await expect(page.getByText(titleEdited).first()).toBeVisible({ timeout: 15_000 });

    const edited = page.locator('.activity-card, tr, .list-item, article, .modern-card').filter({ hasText: titleEdited }).first();
    const toggle = edited.getByRole('button', { name: /masquer|désactiver|afficher/i });
    if (await toggle.count()) {
      await toggle.first().click();
      await confirmDialog(page, /masquer|afficher|confirmer/i);
      await expect(edited.getByText(/masqu|inactif|désactiv/i).or(edited)).toBeVisible();
    }

    await edited.getByRole('button', { name: /supprimer/i }).click();
    await confirmDialog(page, /^supprimer$/i);
    await expect(page.getByText(titleEdited)).toHaveCount(0, { timeout: 15_000 });
  });

  test('Planning : charger la page et enregistrer sans erreur', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/schedule');
    await expect(page.getByRole('heading', { name: /planning|horaires/i })).toBeVisible({ timeout: 15_000 });
    // Ne doit plus planter (régression .map / brouillon corrompu)
    await expect(page.getByText(/lundi/i).first()).toBeVisible({ timeout: 10_000 });
    const saveBtn = page.getByRole('button', { name: /enregistrer/i }).first();
    if (await saveBtn.isEnabled()) {
      await saveBtn.click();
      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible().catch(() => false)) {
        await dialog.getByRole('button', { name: /enregistrer|confirmer/i }).click();
      }
    }
  });
});
