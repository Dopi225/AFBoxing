import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'mobile-se', width: 320, height: 568 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'ultrawide', width: 1920, height: 1080 },
];

const PUBLIC_ROUTES = [
  '/',
  '/apropos',
  '/activite',
  '/actualite',
  '/equipe',
  '/galerie',
  '/horaire',
  '/tarif',
  '/contact',
  '/partenaire',
  '/palmares',
  '/news',
  '/association',
];

const ADMIN_ROUTES = ['/admin/login'];

for (const route of [...PUBLIC_ROUTES, ...ADMIN_ROUTES]) {
  test.describe(`Responsive ${route}`, () => {
    for (const vp of VIEWPORTS) {
      test(`pas de scroll horizontal @ ${vp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 60_000 });
        await page.waitForTimeout(500);
        const hasOverflow = await page.evaluate(() => {
          const doc = document.documentElement;
          return doc.scrollWidth > doc.clientWidth + 1;
        });
        expect(hasOverflow).toBe(false);
      });
    }
  });
}

test('skip link visible au focus', async ({ page }) => {
  await page.goto('/');
  const skip = page.locator('.skip-link');
  await skip.focus();
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
});

test('main content visible sur la home', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#main-content')).toBeVisible();
});
