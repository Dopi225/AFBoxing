import { test, expect } from '@playwright/test';

export const adminUser = process.env.E2E_ADMIN_USER || '';
export const adminPass = process.env.E2E_ADMIN_PASSWORD || '';

export const hasAdminCreds = Boolean(adminUser && adminPass);

/** Suffixe unique pour éviter les collisions entre runs. */
export function uniqueLabel(prefix) {
  return `${prefix} ${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Vérifie que le front parle bien à l’API PHP (JSON).
 * Sans VITE_API_PROXY_TARGET + Apache, Vite renvoie du HTML → skip.
 */
export async function requireApi(request) {
  let res;
  try {
    res = await request.get('/api/settings');
  } catch {
    test.skip(true, 'API PHP injoignable. Démarrez Apache/XAMPP et définissez VITE_API_PROXY_TARGET.');
    return;
  }
  const ct = res.headers()['content-type'] || '';
  if (!res.ok() || !ct.includes('json')) {
    test.skip(
      true,
      'API PHP indisponible depuis Playwright. Ex. : VITE_API_PROXY_TARGET=http://localhost/AF/AFBoxing'
    );
  }
}

export function requireAdminCreds() {
  test.skip(!hasAdminCreds, 'Définir E2E_ADMIN_USER et E2E_ADMIN_PASSWORD pour activer ce test.');
}

export async function loginAsAdmin(page) {
  requireAdminCreds();
  await page.goto('/admin/login');
  await page.getByLabel('Identifiant').fill(adminUser);
  await page.getByLabel('Mot de passe').fill(adminPass);
  await page.getByRole('button', { name: /se connecter/i }).click();
  await expect(page).toHaveURL(/\/admin\/(dashboard)?/i, { timeout: 20_000 });
  await expect(page.getByRole('heading', { name: /bonjour|tableau de bord/i })).toBeVisible({
    timeout: 15_000,
  });
}

/** Avance un wizard jusqu’à Enregistrer (étapes facultatives après le dernier champ rempli). */
export async function finishWizard(page, remainingContinues = 2) {
  for (let i = 0; i < remainingContinues; i += 1) {
    const continuer = page.getByRole('button', { name: /^continuer$/i });
    if (await continuer.isVisible().catch(() => false)) {
      if (await continuer.isEnabled()) {
        await continuer.click();
        await page.waitForTimeout(200);
        continue;
      }
    }
    break;
  }
  await page.getByRole('button', { name: /^enregistrer$/i }).click();
}

export async function confirmDialog(page, confirmName = /supprimer|confirmer|masquer|enregistrer/i) {
  const dialog = page.getByRole('dialog').last();
  await expect(dialog).toBeVisible({ timeout: 8_000 });
  await dialog.getByRole('button', { name: confirmName }).click();
}
