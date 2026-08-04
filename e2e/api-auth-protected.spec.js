import { test, expect } from '@playwright/test';
import { requireApi } from './helpers/admin.js';

/**
 * Autorisation API : routes protégées sans token → 401 (indépendant du login UI).
 */
test.describe('API — autorisation sans token', () => {
  test.beforeEach(async ({ request }) => {
    await requireApi(request);
  });

  test('POST /api/news refuse sans Authorization', async ({ request }) => {
    const res = await request.post('/api/news', {
      data: { title: 'x', date: '2026-01-01', summary: 's', description: 'd' },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error || body).toBeTruthy();
  });

  test('POST /api/seasons refuse sans Authorization', async ({ request }) => {
    const res = await request.post('/api/seasons', {
      data: {
        label: '2090-2091',
        startsOn: '2090-09-01',
        endsOn: '2091-08-31',
        copyFromSeasonId: 1,
      },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/team-members refuse sans Authorization', async ({ request }) => {
    const res = await request.post('/api/team-members', {
      data: { fullName: 'Test', role: 'Coach', category: 'coaches' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/contacts/{id}/reply refuse sans Authorization', async ({ request }) => {
    const res = await request.post('/api/contacts/1/reply', {
      data: { body: 'Réponse de test avec assez de caractères.' },
    });
    expect(res.status()).toBe(401);
  });
});
