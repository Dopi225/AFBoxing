/**
 * Liens publics alignés entre fiche activité (/info/:id), page Tarifs et page Horaires.
 * - programme : voir Tarif.jsx (query ?programme=boxe|social)
 * - activite : nom exact d’une ligne du planning (champ activity côté API), pour filtrer Horaire.jsx
 */

export function tarifQueryForActivityKind(kind) {
  return kind === 'social' ? '?programme=social' : '?programme=boxe';
}

/** @param {string | null | undefined} scheduleActivityName */
export function horaireQueryForScheduleName(scheduleActivityName) {
  const s = String(scheduleActivityName || '').trim();
  if (!s) return '';
  return `?activite=${encodeURIComponent(s)}`;
}
