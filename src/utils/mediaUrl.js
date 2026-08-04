/**
 * URLs éphémères (preview locale) — ne jamais les envoyer à l'API ni les persister en brouillon.
 */
export function isEphemeralMediaUrl(value) {
  if (typeof value !== 'string' || !value) return false;
  return value.startsWith('data:') || value.startsWith('blob:');
}

/**
 * @param {unknown} data
 * @param {string[]} keys
 * @returns {unknown}
 */
export function stripEphemeralMediaFields(data, keys = ['image', 'photo', 'src']) {
  if (!data || typeof data !== 'object') return data;
  // Ne pas faire `{ ...array }` : ça transforme le tableau en objet indexé (plus de .map).
  if (Array.isArray(data)) {
    return data.map((item) =>
      item && typeof item === 'object' ? stripEphemeralMediaFields(item, keys) : item
    );
  }
  const out = { ...data };
  for (const key of keys) {
    if (isEphemeralMediaUrl(out[key])) {
      out[key] = '';
    }
  }
  return out;
}

/** URL d’image acceptable pour l’API (chemin local /uploads ou http(s)). */
export function toPersistableMediaUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  const v = value.trim();
  if (isEphemeralMediaUrl(v)) return '';
  return v;
}
