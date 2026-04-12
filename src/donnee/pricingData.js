// Source de vérité Front pour les tarifs.
// NOTE: il n'existe pas encore d'endpoint "pricing" dans `src/services/apiService.js`.
// Quand l'API sera prête, on remplacera ce fichier par un `pricingApi` sans toucher aux composants.

export const PRICING = {
  boxing: {
    educative: { label: 'Boxe Éducative', amount: 80, period: 'an', note: 'Licence comprise – Certificat médical obligatoire' },
    loisir: { label: 'Boxe Loisir', amount: 120, period: 'an', note: 'Licence comprise – Certificat médical obligatoire' },
    amateur: { label: 'Boxe Amateur', amount: 120, period: 'an', note: 'Licence comprise – Certificat médical obligatoire' },
    handiboxe: { label: 'Handiboxe', amount: 120, period: 'an', note: 'Licence comprise – Certificat médical obligatoire' },
    aeroboxe: { label: 'Aeroboxe', amount: 120, period: 'an', note: 'Licence comprise – Certificat médical obligatoire' },
    therapie: { label: 'Boxe Thérapie', amount: 120, period: 'an', note: 'Licence comprise – Certificat médical obligatoire' }
  },
  social: {
    periscolaire: { label: 'Programme Social-Éducatif', amount: 30, period: 'an', note: 'Tarif dégressif selon quotient familial (CAF)' }
  }
};

export const formatPrice = (price) => {
  if (!price) return '—';
  if (price.amount === 0) return 'Gratuit';
  if (typeof price.amount === 'number') return `${price.amount}€`;
  return String(price.amount);
};


