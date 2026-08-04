/** Libellés métier pour le panel d'administration — jamais de jargon technique */

import { parseLocalDate, formatDateFR } from '../utils/dateFormat';

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
  team: 'Équipe',
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
  team_member: 'Membre de l\'équipe',
  team: 'Équipe',
  schedule: 'Planning',
  contact: 'Message',
  contacts: 'Message',
  settings: 'Informations du club',
  user: 'Compte',
  users: 'Compte',
  auth: 'Connexion',
  pricing: 'Tarif',
  season: 'Saison',
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

/** Catégories d'affichage de l'équipe (page publique regroupée) */
export const TEAM_CATEGORIES = [
  { value: 'coaches', label: 'Coachs' },
  { value: 'board', label: 'Bureau / Dirigeants' },
  { value: 'volunteers', label: 'Bénévoles' },
];

/** Rôles suggérés — l'admin peut aussi saisir un rôle libre */
export const TEAM_ROLE_SUGGESTIONS = [
  'Entraîneur principal',
  'Coach boxe éducative',
  'Coach boxe loisir',
  'Éducateur / éducatrice',
  'Président',
  'Présidente',
  'Trésorier',
  'Trésorière',
  'Secrétaire',
  'Référent socio-éducatif',
  'Référent handiboxe',
  'Bénévole',
];

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

/** Modèles de réponse pré-écrits pour les messages de contact */
export const CONTACT_REPLY_TEMPLATES = [
  {
    id: 'inscription',
    label: 'Demande d\'inscription',
    body: `Bonjour,

Merci pour votre message concernant une inscription au club.

Nous serons ravis de vous accueillir. Pour formaliser l'inscription, merci de vous présenter à une séance d'essai ou de nous contacter par téléphone afin de convenir d'un rendez-vous. Pensez à prévoir un certificat médical de non contre-indication à la pratique de la boxe.

N'hésitez pas si vous avez d'autres questions.

Sportivement,`,
  },
  {
    id: 'tarifs',
    label: 'Infos tarifs',
    body: `Bonjour,

Merci pour votre intérêt pour le club.

Vous trouverez le détail de nos tarifs sur la page Tarifs du site. Les licences et le certificat médical sont à prévoir selon l'activité choisie.

Si vous souhaitez un renseignement plus précis (âge, créneau, formule), répondez à cet email en précisant votre situation : nous vous indiquerons la formule la plus adaptée.

Sportivement,`,
  },
  {
    id: 'general',
    label: 'Demande générale',
    body: `Bonjour,

Merci de nous avoir contactés.

Nous avons bien reçu votre message et revenons vers vous rapidement. En attendant, n'hésitez pas à consulter les pages Activités, Horaires et Tarifs du site pour plus d'informations.

Sportivement,`,
  },
];

export function formatRelativeDate(dateStr) {
  if (!dateStr) return '';
  const date = parseLocalDate(dateStr);
  if (!date) return '';
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((startToday - startDate) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
  return formatDateFR(date, { style: 'long' });
}

export function humanizeEntity(entity) {
  return ENTITY_LABELS[entity] || entity;
}

export function humanizeAction(action) {
  return ACTION_LABELS[action] || action;
}
