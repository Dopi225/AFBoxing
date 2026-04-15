import { describe, it, expect } from 'vitest';
import { tarifQueryForActivityKind, horaireQueryForScheduleName } from './activityPublicLinks';

describe('activityPublicLinks', () => {
  it('tarifQueryForActivityKind', () => {
    expect(tarifQueryForActivityKind('boxing')).toBe('?programme=boxe');
    expect(tarifQueryForActivityKind('social')).toBe('?programme=social');
  });

  it('horaireQueryForScheduleName', () => {
    expect(horaireQueryForScheduleName('')).toBe('');
    expect(horaireQueryForScheduleName(null)).toBe('');
    expect(horaireQueryForScheduleName('Boxe Loisir')).toBe('?activite=' + encodeURIComponent('Boxe Loisir'));
  });
});
