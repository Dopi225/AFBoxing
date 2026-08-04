/** Validateurs pour champs admin — messages en français courant */

export function validateRequired(value, label = 'Ce champ') {
  if (!String(value ?? '').trim()) {
    return `${label} est obligatoire.`;
  }
  return '';
}

export function validateEmail(value) {
  const v = String(value ?? '').trim();
  if (!v) return '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    return 'Indiquez une adresse e-mail valide (ex. : contact@club.fr).';
  }
  return '';
}

export function validateUrl(value) {
  const v = String(value ?? '').trim();
  if (!v) return '';
  try {
    const u = new URL(v);
    if (!['http:', 'https:'].includes(u.protocol)) {
      return 'L\'adresse doit commencer par https://';
    }
  } catch {
    return 'Indiquez une adresse web valide (ex. : https://www.facebook.com/…).';
  }
  return '';
}

export function validateAmount(value) {
  const v = String(value ?? '').trim();
  if (!v) return 'Indiquez un montant en euros.';
  const n = Number(v.replace(',', '.'));
  if (Number.isNaN(n) || n < 0) {
    return 'Indiquez un montant valide en euros (ex. : 120).';
  }
  return '';
}

export function validateActivityId(value) {
  if (!String(value ?? '').trim()) {
    return 'Choisissez une activité pour ce créneau.';
  }
  return '';
}

/** Valide un objet { fieldName: error } — retourne true si valide */
export function hasNoErrors(errors) {
  return Object.values(errors).every((e) => !e);
}
