import { test, expect } from '@playwright/test';

const adminUser = process.env.E2E_ADMIN_USER || '';
const adminPass = process.env.E2E_ADMIN_PASSWORD || '';

test.describe('Admin (optionnel)', () => {
  test.skip(!adminUser || !adminPass, 'Définir E2E_ADMIN_USER et E2E_ADMIN_PASSWORD pour activer ce test.');

  test('connexion admin et tableau de bord', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('Identifiant').fill(adminUser);
    await page.getByLabel('Mot de passe').fill(adminPass);
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page).toHaveURL(/\/admin\/(dashboard)?/i, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /bonjour|tableau de bord/i })).toBeVisible({ timeout: 10_000 });
  });

  test('accueil affiche les actions fréquentes', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('Identifiant').fill(adminUser);
    await page.getByLabel('Mot de passe').fill(adminPass);
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page).toHaveURL(/\/admin\/(dashboard)?/i, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /actions fréquentes/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /publier une actualité/i })).toBeVisible();
  });

  test('navigation actualités avec fil d\'Ariane', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('Identifiant').fill(adminUser);
    await page.getByLabel('Mot de passe').fill(adminPass);
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page).toHaveURL(/\/admin\/(dashboard)?/i, { timeout: 15_000 });
    await page.goto('/admin/news');
    await expect(page.getByRole('navigation', { name: /fil d'ariane/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^actualités$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /publier une actualité/i })).toBeVisible();
  });

  test('ouverture manuelle du guide onboarding', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('Identifiant').fill(adminUser);
    await page.getByLabel('Mot de passe').fill(adminPass);
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page).toHaveURL(/\/admin\/(dashboard)?/i, { timeout: 15_000 });
    await page.getByRole('button', { name: /aide|revoir le guide/i }).first().click();
    await expect(page.getByRole('heading', { name: /guide de prise en main/i })).toBeVisible();
    await expect(page.getByText(/prérequis/i)).toBeVisible();
  });
});
