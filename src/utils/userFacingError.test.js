import { describe, it, expect } from 'vitest';
import { toUserMessage } from './userFacingError';

describe('toUserMessage', () => {
  it('masque les messages techniques', () => {
    const err = { message: 'JWT_SECRET manquant sur /api/auth/login', status: 200 };
    expect(toUserMessage(err)).not.toMatch(/JWT|api/i);
  });

  it('retourne un message 429', () => {
    expect(toUserMessage({ status: 429 })).toMatch(/patientez/i);
  });

  it('retourne le message utilisateur si lisible', () => {
    expect(toUserMessage({ message: 'Champ requis manquant.' })).toBe('Champ requis manquant.');
  });
});
