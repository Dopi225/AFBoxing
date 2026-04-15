import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminLogin from './AdminLogin';

describe('AdminLogin', () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('redirige vers le dashboard après connexion réussie', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ token: 'ok-token', user: { id: 1, username: 'a', role: 'admin' } })
    });

    render(
      <MemoryRouter initialEntries={['/admin/login']}>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<div data-testid="dash">Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    const userInputs = screen.getAllByPlaceholderText('admin');
    const passInputs = screen.getAllByPlaceholderText('••••••••');
    await user.type(userInputs[0], 'admin');
    await user.type(passInputs[0], 'password123');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(screen.getByTestId('dash')).toBeInTheDocument();
    });
  });

  it('affiche une erreur si le login échoue', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Identifiants invalides' })
    });

    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );

    await user.type(screen.getAllByPlaceholderText('admin')[0], 'x');
    await user.type(screen.getAllByPlaceholderText('••••••••')[0], 'y');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(screen.getByText(/identifiants incorrects|session expirée/i)).toBeInTheDocument();
    });
  });
});
