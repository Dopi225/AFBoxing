import { test } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'baseline-screenshots');

const VIEWPORTS = [
  { name: '320', width: 320, height: 568 },
  { name: '375', width: 375, height: 812 },
  { name: '390', width: 390, height: 844 },
  { name: '428', width: 428, height: 926 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 768 },
  { name: '1280', width: 1280, height: 800 },
  { name: '1440', width: 1440, height: 900 },
  { name: '1920', width: 1920, height: 1080 },
  { name: '2560', width: 2560, height: 1440 }
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
  '/info/educative',
  '/admin/login'
];

test.describe('Baseline screenshots — matrice responsive', () => {
  for (const route of PUBLIC_ROUTES) {
    for (const vp of VIEWPORTS) {
      test(`${route} @ ${vp.name}px`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 60_000 });
        await page.waitForTimeout(800);
        const slug = route === '/' ? 'home' : route.replace(/\//g, '_').replace(/^_/, '');
        await page.screenshot({
          path: path.join(OUT_DIR, `${slug}__${vp.name}.png`),
          fullPage: true
        });
      });
    }
  }
});
