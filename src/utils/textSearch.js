/**
 * Normalise une chaîne pour recherche tolérante (accents, casse, espaces).
 * Les emojis et caractères spéciaux restent comparables via includes.
 */
export function normalizeSearchText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** true si `haystack` contient `needle` (insensible aux accents). */
export function textIncludes(haystack, needle) {
  const n = normalizeSearchText(needle);
  if (!n) return true;
  return normalizeSearchText(haystack).includes(n);
}
