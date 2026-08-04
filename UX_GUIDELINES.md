# UX Guidelines — CRM AF Boxing

> **Public visé :** utilisateur·rice final·e sans culture informatique (≈ 60 ans).  
> **Principe directeur :** chaque écran doit se comprendre sans aide extérieure, ne jamais faire perdre de données, et ne jamais laisser un état ambigu (« est-ce enregistré ou pas ? »).

Ce document s’applique à **tout** le projet admin (et aux futures évolutions). Cursor et les développeurs doivent s’y référer avant toute modification UX.

---

## Règles obligatoires

### 1. Confirmations explicites pour les actions irréversibles

Toute action irréversible (suppression, vidage d’historique, désactivation d’un compte équipe, masquage public d’un contenu) **doit** afficher une modale de confirmation qui répète précisément **ce qui** va être supprimé ou modifié — jamais un simple « Êtes-vous sûr ? » générique.

**Implémentation existante :** [`ConfirmDialog`](src/components/admin/ConfirmDialog.jsx)

| Prop | Usage |
|------|-------|
| `title` | Question claire (« Supprimer cette actualité ? ») |
| `itemLabel` | Nom de l’élément (« Stage jeunes — été 2025 ») |
| `consequences` | Liste des effets (« Disparaît du site », « Irréversible ») |
| `confirmText` / `cancelText` | Verbes métier (« Supprimer », « Annuler ») |
| `danger={true}` | Pour les suppressions définitives |

**Exemple conforme :**
```jsx
<ConfirmDialog
  title="Supprimer ce tarif ?"
  itemLabel={deleteRow?.label}
  consequences={[
    'Le tarif disparaîtra de la page Tarifs du site.',
    'Cette action ne peut pas être annulée.',
  ]}
  confirmText="Supprimer"
  danger
/>
```

**Interdit :** message générique sans nom d’élément ; icône seule ; suppression au clic sans modale.

---

### 2. Confirmation visuelle après chaque sauvegarde réussie

Après chaque sauvegarde réussie, un message de confirmation **explicite en français courant** apparaît pendant **au moins 3 secondes** (durée par défaut : 5 s).

**Implémentation existante :** [`useAdminNotify`](src/hooks/useAdminNotify.js) → [`NotificationSystem`](src/components/admin/NotificationSystem.jsx)

```jsx
const { notifySuccess, notifyError } = useAdminNotify('pricing');

// Après save réussi :
notifySuccess('Les tarifs ont bien été enregistrés.');

// Durée personnalisée (minimum 3000 ms) :
notifySuccess('Planning enregistré.', 4000);
```

**Formulation attendue :**
- ✅ « L’actualité « Stage jeunes » a bien été publiée. »
- ✅ « Informations du club enregistrées. »
- ❌ « OK » / « 200 » / icône seule sans texte

---

### 3. Messages d’erreur actionnables en français

Après chaque erreur, le message explique **ce qui a échoué** et **ce qu’il faut faire** pour corriger. Jamais de code HTTP, stack trace ou jargon technique affiché à l’utilisateur.

**Implémentation existante :**
- [`useAdminNotify`](src/hooks/useAdminNotify.js) — traduit via [`toAdminErrorMessage`](src/utils/adminFieldErrors.js) et [`userFacingError`](src/utils/userFacingError.js)
- Les détails techniques vont dans la console via `logTechnicalError`

```jsx
notifyError(err, 'Impossible d\'enregistrer ce tarif. Vérifiez le montant et réessayez.');
```

**Formulation attendue :**
- ✅ « Indiquez un montant valide en euros (ex. : 120). »
- ✅ « L’adresse e-mail n’est pas valide. Vérifiez le format. »
- ❌ « Erreur 422 » / « VALIDATION_FAILED » / « Network Error »

---

### 4. Validation progressive des champs obligatoires

Les champs obligatoires sont validés **au fur et à mesure de la saisie** (onBlur, onChange debounced), avec un message d’aide **sous le champ concerné** — pas seulement au clic sur « Enregistrer ».

**Implémentation existante (à brancher systématiquement) :** [`FormField`](src/components/ui/FormField.jsx) / [`TextInput`](src/components/ui/FormField.jsx) — prop `error`

```jsx
<TextInput
  label="Montant (€)"
  name="amount"
  required
  value={form.amount}
  onChange={handleChange}
  onBlur={validateAmount}
  error={fieldErrors.amount}
  help="Indiquez le prix en euros, sans virgule (ex. : 120)."
/>
```

**Règles wizards :** si le bouton « Continuer » est désactivé (`canProceed`), afficher **pourquoi** (ex. : « Remplissez le titre pour continuer ») — ne jamais laisser un bouton grisé sans explication.

**Interdit :** bloquer silencieusement avec `canProceed` ; toast unique au submit comme seule validation.

---

### 5. Brouillon auto-sauvegardé pour les formulaires longs

Toute page contenant un formulaire long (activité, tarif, message de réponse, planning, paramètres du club) propose un **brouillon auto-sauvegardé localement** (`localStorage`) pour ne jamais perdre une saisie en cas de fermeture accidentelle de l’onglet.

**Pattern recommandé :**
```js
const DRAFT_KEY = 'afboxing_draft_activities';

// Sauvegarde debounced (500 ms) à chaque changement
useEffect(() => {
  const timer = setTimeout(() => {
    if (isDirty) localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, 500);
  return () => clearTimeout(timer);
}, [formData, isDirty]);

// Restauration au montage
useEffect(() => {
  const saved = localStorage.getItem(DRAFT_KEY);
  if (saved && !editingId) setFormData(JSON.parse(saved));
}, []);

// Suppression après save réussi
localStorage.removeItem(DRAFT_KEY);
```

**Priorités (formulaires à risque élevé) :**
1. [`ManageSchedule.jsx`](src/components/admin/ManageSchedule.jsx) — semaine entière en mémoire
2. [`ManageActivities.jsx`](src/components/admin/ManageActivities.jsx) — wizard 4 étapes + blocs
3. [`ManageSettings.jsx`](src/components/admin/ManageSettings.jsx) — multi-sections
4. Wizards : actualités, palmarès, galerie

**Compléments recommandés :**
- Bandeau « Modifications non enregistrées » (déjà présent sur Settings)
- Avertissement `beforeunload` si formulaire dirty
- ConfirmDialog à la fermeture d’un wizard avec saisie en cours

---

### 6. Texte d’aide permanent en haut de chaque section complexe

Chaque section complexe (tarifs, équipe, contacts, activités, planning…) affiche un **texte d’aide court et visible en permanence** en haut de page (« À quoi sert cette page, en une phrase »), pas seulement dans un guide PDF séparé.

**Implémentation existante :** [`PageHeader`](src/components/ui/PageHeader.jsx) — prop `subtitle`

```jsx
<PageHeader
  title="Tarifs"
  subtitle="Les tarifs s'affichent sur la page Tarifs du site et sur les fiches activités."
/>
```

**Libellés métier centralisés :** [`src/constants/adminCopy.js`](src/constants/adminCopy.js)

Toute nouvelle page admin **doit** inclure un `subtitle` explicite. Le guide onboarding ([`AdminOnboardingGuide.jsx`](src/components/admin/AdminOnboardingGuide.jsx)) complète mais ne remplace pas ce texte.

---

### 7. Taille de police et zones cliquables confortables

Cible : usage confortable **sans zoom**.

| Élément | Minimum |
|---------|---------|
| Texte courant | **16 px** (`1rem`) |
| Boutons / liens actionnables | **44 px** de hauteur (`min-height`) |
| Cibles tactiles (mobile) | **48 px** recommandé |

**Références existantes :**
- Wizards : [`guided/guided.scss`](src/components/admin/guided/guided.scss) — boutons `min-height: 48px`, `font-size: 1rem`
- Inputs : classe `.form-input` dans [`ui/ui.scss`](src/components/ui/ui.scss)

**À corriger si < 16 px :** toasts (`NotificationSystem.scss` ~0.95 rem), métadonnées ActivityLog (~0.85 rem).

**Interdit :** boutons icône-seule sans label visible ou `aria-label` ; texte < 14 px pour du contenu principal.

---

### 8. Corbeille de 30 jours avant suppression définitive

Aucune suppression définitive sans un état intermédiaire **« corbeille »** d’au moins **30 jours** quand c’est raisonnable techniquement.

**Entités concernées en priorité :** contacts, activités, tarifs, actualités, palmarès, galerie.

**État actuel (à migrer) :** toutes les suppressions backend sont des **hard DELETE** SQL — pas de `deleted_at`, pas de restauration.

**Pattern cible :**
1. `DELETE` → soft-delete (`deleted_at = NOW()`)
2. Vue admin « Corbeille » avec bouton « Restaurer »
3. Purge automatique après 30 jours (cron ou job)
4. ConfirmDialog indique « Déplacé en corbeille pendant 30 jours » plutôt que « Supprimé définitivement »

**Exception acceptable :** historique des modifications (`activity_log`) — purge totale avec ConfirmDialog explicite.

**Masquage vs suppression :** le flag `enabled` (activités, tarifs) = masquage réversible, pas une corbeille. Le masquage public doit aussi passer par ConfirmDialog.

---

## Écarts connus (audit UX — août 2026)

> **Mise à jour implémentation (août 2026) :** la majorité des écarts ci-dessous ont été corrigés (confirmations, brouillons, validation onBlur, corbeille 30 j, libellés). Conserver cette section comme référence ; ne pas réintroduire les patterns listés.

Référence historique pour les prochains correctifs :

### Confirmations manquantes ou incomplètes

| Fichier | Ligne ~ | Problème |
|---------|---------|----------|
| `ManageActivities.jsx` | 163–172 | Masquer/Afficher activité sans ConfirmDialog |
| `ContentBlockEditor.jsx` | 63–70 | Suppression bloc contenu immédiate |
| `ManageNews.jsx` | 142–147 | Fermeture wizard sans avertissement si saisie en cours |
| `ManagePalmares.jsx` | 116–121 | Idem |
| `ManageGallery.jsx` | — | Idem |
| `ManageContacts.jsx` | 256–271 | ConfirmDialog sans `itemLabel` (expéditeur) |
| `ManageUsers.jsx` | — | Suppression compte définitive (pas de désactivation intermédiaire) |

### Feedback / états ambigus

| Fichier | Ligne ~ | Problème |
|---------|---------|----------|
| `ManageSchedule.jsx` | 95–106 | Suppression créneau locale sans toast ni indicateur « non enregistré » |
| `ManageSchedule.jsx` | — | Pas de bandeau « modifications non enregistrées » (contrairement à Settings) |

### Validation uniquement au submit

| Fichier | Ligne ~ | Problème |
|---------|---------|----------|
| Tous les `Manage*.jsx` | — | Prop `error` de FormField jamais branchée |
| Wizards (`WizardModal.jsx`) | 55–63 | `canProceed` désactive « Continuer » sans message |
| `ManagePricing.jsx` | 146–152 | Montant invalide détecté au submit seulement |
| `ManageSettings.jsx` | 197–242 | Email/URL/tel validés au save API seulement |
| `ManageSchedule.jsx` | 218–219 | `activityId` peut rester vide |

### Autosave / brouillon absent

| Fichier | Priorité | Problème |
|---------|----------|----------|
| `ManageSchedule.jsx` | Haute | Semaine entière perdue si on quitte |
| `ManageActivities.jsx` | Haute | Wizard 4 étapes + blocs |
| `ManageSettings.jsx` | Moyenne | Multi-sections, `hasChanges` sans draft |
| Wizards News/Palmares/Gallery | Moyenne | Fermeture = perte saisie |

### Libellés ambigus pour non-initiés

| Fichier | Ligne ~ | Problème |
|---------|---------|----------|
| `AdvancedFilters.jsx` | 132–152 | « Décroissant / Croissant », « Date de création » |
| `ManageActivities.jsx` | 224–231 | « Accroche » (jargon marketing) |

### Corbeille / soft-delete

| Zone | État |
|------|------|
| Backend (`schema.sql`, tous les Models) | Hard DELETE uniquement |
| Frontend | ConfirmDialog UI seulement, pas de restauration |

### Accessibilité / tailles

| Fichier | Problème |
|---------|----------|
| `NotificationSystem.scss` | Texte toast ~0.95 rem (< 16 px) |
| `ActivityLog.scss` | Métadonnées ~0.85 rem |

---

## Architecture technique (référence Cursor)

### Structure du dépôt

```
AFBoxing/                          ← racine frontend (Vite + React)
├── UX_GUIDELINES.md               ← ce fichier
├── src/
│   ├── components/
│   │   ├── admin/                 ← écrans CRM (Manage*, ConfirmDialog, toasts)
│   │   │   └── guided/            ← wizards (WizardModal, ContentBlockEditor…)
│   │   └── ui/                    ← composants réutilisables (FormField, Button, PageHeader)
│   ├── constants/adminCopy.js     ← libellés métier FR (NAV, ACTIONS, ROLES)
│   ├── hooks/useAdminNotify.js    ← toasts admin
│   ├── services/apiService.js     ← client API (tous les *Api)
│   └── utils/
│       ├── adminFieldErrors.js    ← traduction erreurs 422
│       └── userFacingError.js     ← messages utilisateur
├── backend/
│   ├── public/index.php           ← point d’entrée + routes API
│   ├── database/schema.sql        ← schéma MySQL
│   └── src/
│       ├── Controllers/           ← *Controller.php
│       ├── Models/                ← *Model.php (PDO)
│       ├── Middlewares/           ← AuthMiddleware (JWT + rôles)
│       └── Core/                  ← Router, RateLimiter, JsonErrorResponse
└── e2e/                           ← tests Playwright
```

### Conventions de nommage

| Couche | Convention | Exemple |
|--------|------------|---------|
| Page admin | `Manage{Entity}.jsx` + `.scss` | `ManageNews.jsx` |
| API frontend | `{entity}Api` dans `apiService.js` | `newsApi.create()` |
| Contrôleur PHP | `{Entity}Controller.php` | `NewsController.php` |
| Modèle PHP | `{Entity}.php` | `Models/News.php` |
| Méthodes CRUD | `index`, `show`, `store`, `update`, `destroy` | — |
| Rôles JWT | `admin`, `editor` | admin = accès complet |

### Composants UX à réutiliser (ne pas réinventer)

| Composant | Fichier | Rôle |
|-----------|---------|------|
| ConfirmDialog | `admin/ConfirmDialog.jsx` | Modales de confirmation |
| NotificationSystem | `admin/NotificationSystem.jsx` | Toasts (Provider dans AdminDashboard) |
| useAdminNotify | `hooks/useAdminNotify.js` | `notifySuccess`, `notifyError`, `notifyWarning` |
| PageHeader | `ui/PageHeader.jsx` | Titre + subtitle + actions |
| FormField / TextInput | `ui/FormField.jsx` | Labels, help, error inline |
| WizardModal | `admin/guided/WizardModal.jsx` | Formulaires multi-étapes |
| HelpTip | `admin/guided/HelpTip.jsx` | Bulle d’aide contextuelle |
| LoadingState / ErrorState / EmptyState | `ui/` | États de page |

### Endpoints API principaux

Base URL : dérivée de `import.meta.env.BASE_URL` (dev) ou `VITE_API_BASE_URL` (prod).  
Toutes les routes commencent par `/api/`. Définies dans [`backend/public/index.php`](backend/public/index.php).

| Ressource | GET (public/staff) | POST | PUT | DELETE | Auth mutations |
|-----------|-------------------|------|-----|--------|----------------|
| Auth | `GET /api/auth/me` | `POST /api/auth/login`, `/logout` | — | — | JWT Bearer |
| Actualités | `/api/news`, `/api/news/{id}` | `/api/news` | `/api/news/{id}` | `/api/news/{id}` | staff |
| Galerie | `/api/gallery` | `/api/gallery` | `/api/gallery/{id}` | `/api/gallery/{id}` | staff |
| Planning | `/api/schedule` | `/api/schedule` (bulk) | `/api/schedule/{id}` | `/api/schedule/{id}` | staff |
| Palmarès | `/api/palmares` | `/api/palmares` | `/api/palmares/{id}` | `/api/palmares/{id}` | staff |
| Activités | `/api/activities`, `/{id}` | `/api/activities` | `/api/activities/{id}` | `/api/activities/{id}` | staff |
| Contacts | — | `POST /api/contact` (public) | `PUT /api/contacts/{id}/read` | `/api/contacts/{id}` | admin |
| Tarifs | `/api/pricing`, `/{key}` | `/api/pricing` | `/api/pricing/{key}` | `/api/pricing/{key}` | admin |
| Paramètres | `/api/settings`, `/{key}` | `/api/settings` | — | `/api/settings/{key}` | admin (POST/DELETE) |
| Historique | `/api/activity-log`, `/count` | `/api/activity-log` | — | `/api/activity-log` (purge) | admin (GET/DELETE), staff (POST) |
| Comptes | `/api/users` | `/api/users` | `/api/users/{id}` | `/api/users/{id}` | admin |
| Upload | — | `POST /api/upload` | — | — | staff |

**Rôles middleware :**
- `$authAny` — tout utilisateur connecté
- `$authStaff` — `admin` ou `editor`
- `$authAdmin` — `admin` uniquement

### Client API frontend

Tout passe par [`src/services/apiService.js`](src/services/apiService.js) :

```js
import { newsApi, activitiesApi, pricingApi, settingsApi } from '../../services/apiService';

// CRUD typique
await newsApi.list();
await newsApi.create(payload);
await newsApi.update(id, payload);
await newsApi.remove(id);
```

Token JWT stocké dans `localStorage` (`afboxing_token`).

### Routing admin

Défini dans l’app React (react-router). Shell : [`AdminDashboard.jsx`](src/components/admin/AdminDashboard.jsx) avec sidebar depuis [`adminCopy.js`](src/constants/adminCopy.js) (`NAV_ITEMS`).

| Route (approx.) | Composant |
|-----------------|-----------|
| `/admin` | DashboardHome |
| `/admin/news` | ManageNews |
| `/admin/palmares` | ManagePalmares |
| `/admin/gallery` | ManageGallery |
| `/admin/schedule` | ManageSchedule |
| `/admin/activities` | ManageActivities |
| `/admin/contacts` | ManageContacts |
| `/admin/pricing` | ManagePricing |
| `/admin/settings` | ManageSettings |
| `/admin/history` | ActivityLog |
| `/admin/users` | ManageUsers |

### Validation backend

[`BaseController.php`](backend/src/Controllers/BaseController.php) : `validateRequired`, `validateEmail`, `validateDate`, `validateLength`, `sanitizeString`.

Les erreurs 422 renvoient `{ errors: { field: message } }` — traduites côté front par `toAdminErrorMessage`.

---

## Checklist avant merge (admin)

- [ ] Action destructive → ConfirmDialog avec `itemLabel` + `consequences`
- [ ] Save réussi → `notifySuccess` message FR explicite (≥ 3 s)
- [ ] Erreur → `notifyError` avec fallback actionnable (pas de code HTTP)
- [ ] Champs obligatoires → validation onBlur + `error` sous le champ
- [ ] Formulaire long → brouillon localStorage + avertissement si dirty
- [ ] Page complexe → `PageHeader` avec `subtitle` métier
- [ ] Boutons ≥ 44 px, texte ≥ 16 px
- [ ] Suppression → soft-delete / corbeille si entité métier (contacts, activités, tarifs…)
- [ ] Libellés depuis `adminCopy.js`, pas de jargon technique

---

*Dernière mise à jour : audit UX août 2026 — AF Boxing CRM.*
