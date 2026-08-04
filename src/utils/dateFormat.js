/**
 * Dates locales — évite le décalage UTC de `new Date('YYYY-MM-DD')`.
 */

/** Aujourd’hui en YYYY-MM-DD (fuseau local). */
export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Parse une date API (YYYY-MM-DD ou ISO) en Date locale (midi local pour stabilité).
 * @returns {Date|null}
 */
export function parseLocalDate(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const s = String(value).trim();
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (dateOnly) {
    const y = Number(dateOnly[1]);
    const m = Number(dateOnly[2]) - 1;
    const d = Number(dateOnly[3]);
    const dt = new Date(y, m, d, 12, 0, 0, 0);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const dt = new Date(s);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/** Affichage FR court : JJ/MM/AAAA */
export function formatDateFR(value, options = { style: 'short' }) {
  const dt = parseLocalDate(value);
  if (!dt) return '';
  if (options.style === 'long') {
    return dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Comparaison de jours (filtres historique) en local. */
export function startOfLocalDay(value) {
  const dt = parseLocalDate(value);
  if (!dt) return null;
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0, 0);
}

export function endOfLocalDay(value) {
  const dt = parseLocalDate(value);
  if (!dt) return null;
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 23, 59, 59, 999);
}
