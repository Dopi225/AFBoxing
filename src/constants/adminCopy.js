/** Libellés métier pour le panel d'administration — jamais de jargon technique */

export const APP_TITLE = 'Gestion AF Boxing';

export const ROLES = {
  admin: { label: 'Responsable', help: 'Accès complet : tarifs, messages, comptes et contenu' },
  editor: { label: 'Éditeur de contenu', help: 'Peut modifier le contenu public du site' },
};

export const NAV_SECTIONS = {
  workspace: 'Mon espace',
  content: 'Contenu du site',
  club: 'Gestion du club',
  follow: 'Suivi',
};

export const NAV_ITEMS = {
  dashboard: 'Tableau de bord',
  news: 'Actualités',
  palmares: 'Palmarès',
  schedule: 'Planning',
  gallery: 'Galerie',
  activities: 'Activités',
  contacts: 'Messages reçus',
  pricing: 'Tarifs',
  settings: 'Informations du club',
  users: 'Comptes d\'accès',
  history: 'Historique des modifications',
  search: 'Rechercher',
};

export const ACTIONS = {
  save: 'Enregistrer',
  cancel: 'Annuler',
  continue: 'Continuer',
  previous: 'Précédent',
  add: 'Ajouter',
  edit: 'Modifier',
  delete: 'Supprimer',
  confirm: 'Confirmer',
  choosePhoto: 'Choisir une photo',
  publish: 'Publier',
};

export const ENTITY_LABELS = {
  news: 'Actualité',
  palmares: 'Palmarès',
  gallery: 'Photo',
  activities: 'Activité',
  activity: 'Activité',
  schedule: 'Planning',
  contact: 'Message',
  contacts: 'Message',
  settings: 'Informations du club',
  user: 'Compte',
  users: 'Compte',
  auth: 'Connexion',
  pricing: 'Tarif',
};

export const ACTION_LABELS = {
  create: 'Ajout',
  update: 'Modification',
  delete: 'Suppression',
  view: 'Consultation',
  login: 'Connexion',
  logout: 'Déconnexion',
};

export const PERIOD_LABELS = {
  an: 'Par an',
  mois: 'Par mois',
  seance: 'Par séance',
  trimestre: 'Par trimestre',
};

export const ACTIVITY_KIND_LABELS = {
  boxing: 'Boxe',
  social: 'Socio-éducatif',
};

export const GALLERY_CATEGORIES = [
  { value: 'Infrastructure', label: 'Infrastructure', help: 'Photos des locaux et équipements' },
  { value: 'Coaching', label: 'Coaching', help: 'Séances d\'entraînement et encadrement' },
  { value: 'Compétition', label: 'Compétition', help: 'Combats et tournois' },
  { value: 'Événement', label: 'Événement', help: 'Manifestations et sorties' },
  { value: 'Autre', label: 'Autre', help: 'Autres photos du club' },
];

export const PALMARES_RESULTS = [
  { value: 'Champion', label: 'Champion' },
  { value: 'Vainqueur', label: 'Vainqueur' },
  { value: 'Finaliste', label: 'Finaliste' },
  { value: 'Médaillé d\'Or', label: 'Médaillé d\'or' },
  { value: 'Médaillé d\'Argent', label: 'Médaillé d\'argent' },
  { value: 'Médaillé de Bronze', label: 'Médaillé de bronze' },
  { value: 'Participation', label: 'Participation' },
];

export const PALMARES_CATEGORIES = [
  { value: 'Amateur', label: 'Amateur' },
  { value: 'Professionnel', label: 'Professionnel' },
  { value: 'Jeunes', label: 'Jeunes' },
  { value: 'Féminin', label: 'Féminin' },
  { value: 'Équipe', label: 'Équipe' },
];

export function formatRelativeDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function humanizeEntity(entity) {
  return ENTITY_LABELS[entity] || entity;
}

export function humanizeAction(action) {
  return ACTION_LABELS[action] || action;
}
