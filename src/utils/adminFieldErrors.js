import { toUserMessage } from './userFacingError';

const FIELD_LABELS = {
  title: 'Titre',
  date: 'Date',
  summary: 'Résumé',
  description: 'Description',
  image: 'Photo',
  subtitle: 'Description courte',
  eyebrow: 'Accroche',
  kind: 'Type d\'activité',
  price_key: 'Référence du tarif',
  priceKey: 'Référence du tarif',
  label: 'Nom du tarif',
  amount: 'Montant',
  period: 'Période',
  category: 'Catégorie',
  activityId: 'Activité liée',
  activity_id: 'Activité liée',
  username: 'Identifiant',
  password: 'Mot de passe',
  role: 'Rôle',
  name: 'Nom',
  email: 'E-mail',
  phone: 'Téléphone',
  message: 'Message',
  time: 'Horaire',
  level: 'Niveau',
  location: 'Lieu',
  boxer: 'Boxeur ou équipe',
  result: 'Résultat',
  details: 'Détails',
};

/**
 * Traduit un message d'erreur API (notamment 422) en langage compréhensible.
 */
export function toAdminErrorMessage(err, fallback = 'Une erreur est survenue. Réessayez dans un instant.') {
  const base = toUserMessage(err, fallback);
  if (!base) return fallback;

  // Remplace les noms de champs techniques dans les messages "field: message"
  let result = base;
  Object.entries(FIELD_LABELS).forEach(([key, label]) => {
    const patterns = [
      new RegExp(`\\b${key}\\b`, 'gi'),
      new RegExp(`${key}:`, 'gi'),
    ];
    patterns.forEach((p) => {
      result = result.replace(p, (m) => m.replace(new RegExp(key, 'i'), label));
    });
  });

  // Messages courants à reformuler
  if (/required|obligatoire|manquant/i.test(result) && !/est obligatoire|est requis/i.test(result)) {
    return `${result}. Vérifiez que tous les champs marqués d'un astérisque sont remplis.`;
  }

  return result;
}

/**
 * Extrait des erreurs par champ depuis une erreur 422.
 */
export function parseFieldErrors(err) {
  const fields = {};
  const raw = err?.message || '';
  if (!raw.includes(':')) return fields;

  raw.split(/[;\n]/).forEach((part) => {
    const [key, ...rest] = part.split(':');
    const fieldKey = key?.trim();
    const msg = rest.join(':').trim();
    if (fieldKey && msg) {
      const label = FIELD_LABELS[fieldKey] || fieldKey;
      fields[fieldKey] = msg.replace(fieldKey, label);
    }
  });
  return fields;
}
