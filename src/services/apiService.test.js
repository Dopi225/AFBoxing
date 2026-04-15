import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authApi } from './apiService';

const TOKEN_KEY = 'afboxing_token';

describe('apiService / authApi', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('efface le token stocké sur réponse 401', async () => {
    localStorage.setItem(TOKEN_KEY, 'bad-token');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' })
    });

    await expect(authApi.getMe()).rejects.toThrow();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('stocke le token après login réussi', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        token: 'jwt-test',
        user: { id: 1, username: 'admin', role: 'admin' }
      })
    });

    const data = await authApi.login('admin', 'secret');
    expect(data.token).toBe('jwt-test');
    expect(localStorage.getItem(TOKEN_KEY)).toBe('jwt-test');
  });

  it('logout appelle l’API puis supprime le token', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: 'ok' })
    });

    await authApi.logout();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/auth\/logout$/),
      expect.objectContaining({ method: 'POST' })
    );
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('agrège les erreurs 422 de validation', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        errors: { email: 'Invalide', name: 'Requis' }
      })
    });

    await expect(authApi.getMe()).rejects.toThrow(/email: Invalide/);
  });

  it('expose le message 403 (format structuré)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        error: { code: 'FORBIDDEN', message: 'Accès refusé : permissions insuffisantes.' }
      })
    });

    await expect(authApi.getMe()).rejects.toMatchObject({
      message: 'Accès refusé : permissions insuffisantes.'
    });
  });
});
