import { test, expect } from '@playwright/test';

test.describe('SEO & fichiers statiques', () => {
  test('robots.txt est servi en texte brut (pas de HTML SPA)', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.ok()).toBeTruthy();
    const ct = (res.headers()['content-type'] || '').toLowerCase();
    expect(ct).toMatch(/text\/plain/);
    const body = await res.text();
    expect(body).toMatch(/user-agent:\s*\*/i);
    expect(body).not.toMatch(/<!doctype/i);
  });

  test('sitemap.xml est du XML valide côté entête', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toMatch(/<\?xml/);
    expect(body).toMatch(/urlset/i);
  });
});

test.describe('Pages publiques à fort impact', () => {
  test('accueil : section À la une et accès rapide', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Les sections utilisent whileInView : forcer le défilement pour que les titres soient visibles aux tests
    await page.locator('#home-quicklinks-heading').scrollIntoViewIfNeeded();
    await expect(page.locator('#home-quicklinks-heading')).toBeVisible({ timeout: 60_000 });
    await page.locator('#home-news-heading').scrollIntoViewIfNeeded();
    await expect(page.locator('#home-news-heading')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('button', { name: /toutes les actualités/i })).toBeVisible({ timeout: 15_000 });
  });

  test('contact : formulaire et carte coordonnées', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1.section-header__title').filter({ hasText: 'Contact' })).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('textarea[name="message"]')).toBeVisible({ timeout: 15_000 });
  });

  test('tarifs : titre programme et cartes', async ({ page }) => {
    await page.goto('/tarif');
    await expect(page.getByRole('heading', { name: /choisissez votre programme/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /boxe anglaise/i })).toBeVisible();
  });
});
