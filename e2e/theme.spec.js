import { test, expect } from '@playwright/test';

const STORAGE_KEY = 'afboxing_theme';

const PUBLIC_ROUTES = [
  '/',
  '/contact',
  '/tarif',
  '/activite',
  '/horaire',
  '/galerie',
  '/palmares',
  '/news',
  '/equipe',
  '/apropos',
  '/actualite',
  '/partenaire',
  '/info/educative',
];

const ADMIN_ROUTES = ['/admin/login'];

async function setTheme(page, mode) {
  await page.addInitScript((key, value) => {
    localStorage.setItem(key, value);
    const mq = window.matchMedia;
    window.matchMedia = (query) => {
      const result = mq.call(window, query);
      if (query === '(prefers-reduced-motion: reduce)') {
        return { ...result, matches: true };
      }
      return result;
    };
  }, STORAGE_KEY, mode);
}

async function applyThemeOnPage(page, mode) {
  await page.evaluate(
    ([key, value]) => {
      localStorage.setItem(key, value);
      if (value === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    },
    [STORAGE_KEY, mode],
  );
}

async function waitForPublicPageReady(page) {
  await expect(page.getByText('Chargement de la page')).toBeHidden({ timeout: 45_000 });
  await expect(
    page.locator('.container-fluid, .section-header, .hero-section').first(),
  ).toBeVisible({ timeout: 15_000 });
}

for (const theme of ['light', 'dark']) {
  test.describe(`Thème ${theme}`, () => {
    for (const route of PUBLIC_ROUTES) {
      test(`pas de scroll horizontal sur ${route}`, async ({ page }) => {
        await setTheme(page, theme);
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 60_000 });
        await applyThemeOnPage(page, theme);
        await page.waitForTimeout(600);
        const hasOverflow = await page.evaluate(() => {
          const doc = document.documentElement;
          return doc.scrollWidth > doc.clientWidth + 1;
        });
        expect(hasOverflow).toBe(false);
        const themeAttr = await page.evaluate(() =>
          document.documentElement.getAttribute('data-theme'),
        );
        if (theme === 'dark') {
          expect(themeAttr).toBe('dark');
        } else {
          expect(themeAttr).toBeNull();
        }
        await expect(
          page.locator('nav, footer, #main-content, .public-layout-outlet, .login-container, .container-fluid').first(),
        ).toBeVisible({ timeout: 15_000 });
      });
    }
  });
}

test('horaire segmented actif lisible en mode sombre', async ({ page }) => {
  await setTheme(page, 'dark');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/horaire', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await applyThemeOnPage(page, 'dark');
  await page.waitForTimeout(600);

  const activeSegment = page.locator('.schedule-toolbar .segmented__btn.is-active').first();
  await expect(activeSegment).toBeVisible({ timeout: 15_000 });

  const segmentStyles = await activeSegment.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { backgroundColor: cs.backgroundColor, color: cs.color };
  });
  expect(segmentStyles.color).toMatch(/rgb\(255,\s*255,\s*255\)/);
  expect(segmentStyles.backgroundColor).not.toBe(segmentStyles.color);

  const toolbarBg = await page.locator('.schedule-toolbar').first().evaluate((el) => {
    return getComputedStyle(el).backgroundColor;
  });
  expect(toolbarBg).not.toBe('rgba(255, 255, 255, 0.85)');
});

test('activite btn-secondary lisible en mode sombre', async ({ page }) => {
  test.setTimeout(60_000);
  await setTheme(page, 'dark');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/activite', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await applyThemeOnPage(page, 'dark');
  await waitForPublicPageReady(page);

  const secondaryBtn = page.locator('.section-header__actions .btn').nth(1);
  await expect(secondaryBtn).toBeVisible({ timeout: 15_000 });

  const styles = await secondaryBtn.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { color: cs.color, backgroundColor: cs.backgroundColor };
  });
  expect(styles.color).toMatch(/rgb\(\s*22[0-9],\s*0,\s*0\)|rgb\(\s*220,\s*0,\s*0\)/);
  expect(styles.backgroundColor).toMatch(/rgba?\(\s*255,\s*255,\s*255/);
});

async function expectContrastAtLeast(page, selector, minRatio = 4.5) {
  const ratio = await page.locator(selector).first().evaluate((el) => {
    const parseRgb = (color) => {
      const m = color.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!m) return null;
      const alpha = m[4] !== undefined ? Number(m[4]) : 1;
      if (alpha < 0.05) return null;
      return [Number(m[1]), Number(m[2]), Number(m[3])];
    };
    const getEffectiveBackground = (node) => {
      let current = node;
      while (current) {
        const rgb = parseRgb(getComputedStyle(current).backgroundColor);
        if (rgb) return rgb;
        current = current.parentElement;
      }
      return [255, 255, 255];
    };
    const lum = ([r, g, b]) => {
      const ch = [r, g, b].map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
    };
    const fgRgb = parseRgb(getComputedStyle(el).color);
    const bgRgb = getEffectiveBackground(el);
    if (!fgRgb) return 0;
    const l1 = lum(fgRgb);
    const l2 = lum(bgRgb);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  });
  expect(ratio).toBeGreaterThanOrEqual(minRatio);
}

const CONTRAST_CHECKS = [
  { route: '/', theme: 'light', selector: '.hero-actions .btn-primary', label: 'accueil primary clair' },
  { route: '/', theme: 'dark', selector: '.hero-actions .btn-primary', label: 'accueil primary sombre' },
  { route: '/activite', theme: 'light', selector: '.section-header__actions .btn.btn-secondary', label: 'activite secondary clair' },
  { route: '/activite', theme: 'dark', selector: '.section-header__actions .btn.btn-secondary', label: 'activite secondary sombre' },
  { route: '/contact', theme: 'light', selector: '.content-section#contact p', label: 'contact texte clair' },
  { route: '/contact', theme: 'dark', selector: '.content-section#contact p', label: 'contact texte sombre' },
  { route: '/contact', theme: 'dark', selector: '.contact-info-card .card-header h3', label: 'contact titre carte sombre' },
  { route: '/admin/login', theme: 'light', selector: '.login-container .btn-login', label: 'admin login primary clair' },
  { route: '/admin/login', theme: 'dark', selector: '.login-container .btn-login', label: 'admin login primary sombre' },
  { route: '/admin/login', theme: 'dark', selector: '.login-container .form-input', label: 'admin login input sombre' },
  { route: '/admin/login', theme: 'dark', selector: '.login-container h1', label: 'admin login titre sombre' },
];

for (const check of CONTRAST_CHECKS) {
  test(`contraste ${check.label} >= 4.5:1`, async ({ page }) => {
    test.setTimeout(60_000);
    await setTheme(page, check.theme);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(check.route, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    if (check.route.startsWith('/admin')) {
      await page.waitForTimeout(400);
    } else {
      await applyThemeOnPage(page, check.theme);
      await waitForPublicPageReady(page);
    }
    await expect(page.locator(check.selector).first()).toBeVisible({ timeout: 15_000 });
    await expectContrastAtLeast(page, check.selector);
  });
}

test('accueil hero bouton hauteur stable au survol', async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await waitForPublicPageReady(page);

  const heroBtn = page.locator('.hero-actions .btn.btn-primary').first();
  await expect(heroBtn).toBeVisible({ timeout: 15_000 });

  const before = await heroBtn.evaluate((el) => el.getBoundingClientRect().height);
  await heroBtn.hover();
  await page.waitForTimeout(200);
  const after = await heroBtn.evaluate((el) => el.getBoundingClientRect().height);
  expect(Math.abs(after - before)).toBeLessThan(2);
});

test('boutons section-header taille DS après visite accueil', async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await waitForPublicPageReady(page);
  await page.goto('/activite', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await waitForPublicPageReady(page);

  const outlineBtn = page.locator('.section-header .btn-outline').first();
  await expect(outlineBtn).toBeVisible({ timeout: 15_000 });

  const metrics = await outlineBtn.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      height: el.getBoundingClientRect().height,
      minHeight: parseFloat(cs.minHeight) || 0,
      paddingTop: parseFloat(cs.paddingTop) || 0,
      paddingBottom: parseFloat(cs.paddingBottom) || 0,
    };
  });
  expect(metrics.height).toBeLessThanOrEqual(48);
  expect(metrics.paddingTop + metrics.paddingBottom).toBeLessThan(8);
});

test('toggle footer persiste le thème', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const toggle = page.locator('footer .theme-toggle, footer button[aria-label*="thème"]').first();
  await expect(toggle).toBeVisible({ timeout: 15_000 });
  await toggle.click();
  const stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
  expect(stored === 'dark' || stored === 'light').toBe(true);
});

test('admin login affiche le toggle thème en mode sombre', async ({ page }) => {
  await setTheme(page, 'dark');
  await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });
  const toggle = page.locator('.admin-login__theme .theme-toggle');
  await expect(toggle).toBeVisible();
  await expect(page.locator('.login-container')).toBeVisible();
});

for (const route of ADMIN_ROUTES) {
  test(`admin ${route} sans scroll horizontal (clair + sombre)`, async ({ page }) => {
    for (const theme of ['light', 'dark']) {
      await setTheme(page, theme);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await page.waitForTimeout(400);
      const hasOverflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth > doc.clientWidth + 1;
      });
      expect(hasOverflow).toBe(false);
    }
  });
}
