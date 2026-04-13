import { describe, it, expect, beforeEach, vi } from 'vitest';
import { newsApi } from './apiService';

describe('newsApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('déploie data[] depuis la réponse paginée', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [{ id: 1, title: 'Test' }],
        meta: { total: 1, page: 1, per_page: 500, total_pages: 1 }
      })
    });

    const rows = await newsApi.list();
    expect(Array.isArray(rows)).toBe(true);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('Test');
  });
});
