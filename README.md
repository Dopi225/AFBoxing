# AF Boxing Club 86 - Site Web

Site web moderne pour l'AF Boxing Club 86, un club de boxe et association socio-éducative basé à Poitiers.

## 🥊 À propos

L'AF Boxing Club 86 est un club de boxe qui propose :
- **Boxe Anglaise** : Éducative, Loisir, Amateur, Handiboxe, Aeroboxe, Boxe Thérapie
- **Programme Socio-éducatif** : Accompagnement scolaire, sorties pédagogiques, aide aux devoirs

## ✨ Fonctionnalités

### Frontend
- 🎨 **Design moderne et responsive** avec animations fluides
- 📱 **Compatible mobile** et tablette
- 🖼️ **Galerie photos interactive** avec lightbox
- 📝 **Formulaire de contact** fonctionnel
- 💰 **Page tarifs** avec modales détaillées
- 📰 **Actualités** avec système de news
- 🗺️ **Intégration Google Maps**
- ⚡ **Performance optimisée** avec Vite

### Administration
- 🔐 **Panneau d'administration** complet et sécurisé
- 📰 **Gestion des actualités** (ajouter, modifier, supprimer)
- 🏆 **Gestion des palmarès** (résultats de compétitions)
- 📅 **Gestion du planning** (horaires et activités)
- 🖼️ **Gestion de la galerie** (photos et catégories)
- 📧 **Gestion des contacts** (demandes de contact, marquer comme lu)
- 👤 **Comptes staff** (admin / éditeur) avec contrôle d’accès par rôle
- 💾 **Backend PHP** (API REST sécurisée + base MySQL pour toutes les données métier)

## 🛠️ Technologies utilisées

- **React 19** - Frontend SPA
- **Vite** - Build tool rapide
- **React Router** - Navigation
- **Framer Motion** - Animations
- **FontAwesome** - Icônes
- **SCSS** - Styles avancés
- **Responsive Design** - Mobile-first
- **PHP 8+ / PDO** - Backend API REST
- **MySQL** - Base de données
- **JWT (firebase/php-jwt)** - Authentification admin
- **Dotenv** - Gestion de la configuration

## 🚀 Installation et lancement (frontend)

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build pour la production
npm run build

# Prévisualiser le build
npm run preview

# Tests (Vitest + Testing Library)
npm test

# Tests E2E (Playwright — installe les navigateurs une première fois : npx playwright install)
npm run test:e2e
```

### Variables d’environnement utiles (backend)

| Variable | Rôle |
|----------|------|
| `APP_ENV` | `production` pour CORS strict et messages d’erreur génériques |
| `JWT_SECRET` | Secret de signature JWT (obligatoire) |
| `CORS_ALLOWED_ORIGINS` | Liste d’origines séparées par des virgules |
| `CORS_STRICT=1` | En dev, n’autoriser que les origines listées (comme en prod) |
| `TRUSTED_PROXY=1` | Derrière reverse proxy : lire `X-Forwarded-For` / `X-Real-IP` pour IP client (rate limit) |

### Tests backend (API PHP)

```bash
cd backend
composer install
composer test
```

## 📁 Structure du projet

```
src/
├── components/          # Composants React
│   ├── Navbar.jsx      # Navigation principale
│   ├── Footer.jsx      # Pied de page
│   ├── Contact.jsx     # Page contact
│   ├── Galerie.jsx     # Galerie photos
│   ├── Tarif.jsx       # Page tarifs
│   ├── admin/          # Composants d'administration
│   │   ├── AdminLogin.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── DashboardHome.jsx
│   │   ├── ManageNews.jsx
│   │   ├── ManagePalmares.jsx
│   │   ├── ManageSchedule.jsx
│   │   ├── ManageGallery.jsx
│   │   └── ManageContacts.jsx
│   └── ...
├── services/           # Services
│   ├── apiService.js   # Appels à l'API backend (auth, news, palmarès, planning, galerie, contacts, upload)
│   └── storageService.js  # Ancien service localStorage (non utilisé en production)
├── style/              # Fichiers SCSS
├── assets/             # Images et médias
├── donnee/             # Données (actualités, infos)
└── App.jsx             # Composant principal
```

## 🗄️ Backend PHP / API REST

Le backend se trouve dans le dossier `backend/` :

```
backend/
├── public/           # Front controller API (index.php)
├── src/
│   ├── Core/         # Router léger
│   ├── Controllers/  # Contrôleurs (Auth, News, Gallery, Schedule, Palmares, Contact, Upload)
│   ├── Models/       # Modèles PDO (User, News, Gallery, Schedule, Palmares, Contact)
│   └── Middlewares/  # Middleware d'authentification JWT
├── config/
│   ├── database.php  # Connexion PDO
│   └── cors.php      # CORS
├── database/
│   └── schema.sql    # Schéma complet + seed admin
└── composer.json
```

### Installation backend

1. **Installer les dépendances PHP** :

```bash
cd backend
composer install
```

2. **Créer la base de données** dans MySQL (via phpMyAdmin ou CLI) en important `backend/database/schema.sql`.

3. **Configurer l'environnement** : créer un fichier `backend/.env` :

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=afboxing
DB_USER=root
DB_PASS=
DB_CHARSET=utf8mb4

JWT_SECRET=change_me_secret
```

4. **Configurer le VirtualHost / URL** sous XAMPP, par exemple :

- URL publique de l'API : `http://localhost/AF/AFBoxing/backend/public`

5. **Configurer le frontend** : dans le projet React, créer un fichier `.env` :

```env
VITE_API_BASE_URL=http://localhost/AF/AFBoxing/backend/public
```

Le frontend utilisera automatiquement cette URL pour tous les appels API.

### Endpoints principaux

- **Auth**
  - `POST /api/auth/login` – login admin (`username`, `password`) → JWT (`iss`, `aud`, `jti`)
  - `POST /api/auth/logout` – révoque le `jti` courant (blacklist locale) puis le client supprime le token
  - `GET /api/auth/me` – infos de l’admin connecté

- **News**
  - `GET /api/news?page=1&per_page=500` – liste paginée `{ data, meta }`
  - `GET /api/news/{id}`
  - `POST /api/news` *(admin, JWT)*
  - `PUT /api/news/{id}` *(admin, JWT)*
  - `DELETE /api/news/{id}` *(admin, JWT)*

- **Galerie**
  - `GET /api/gallery`
  - `POST /api/gallery` *(admin, JWT)*
  - `DELETE /api/gallery/{id}` *(admin, JWT)*

- **Planning**
  - `GET /api/schedule`
  - `POST /api/schedule` *(admin, JWT, mode bulk ou unitaire)*
  - `PUT /api/schedule/{id}` *(admin, JWT)*
  - `DELETE /api/schedule/{id}` *(admin, JWT)*

- **Palmarès**
  - `GET /api/palmares`
  - `POST /api/palmares` *(admin, JWT)*
  - `PUT /api/palmares/{id}` *(admin, JWT)*
  - `DELETE /api/palmares/{id}` *(admin, JWT)*

- **Contacts**
  - `POST /api/contact` – formulaire public
  - `GET /api/contacts` *(admin, JWT)*
  - `PUT /api/contacts/{id}/read` *(admin, JWT)*
  - `DELETE /api/contacts/{id}` *(admin, JWT)*

- **Upload d’images**
  - `POST /api/upload` *(admin, JWT)*  
    - `multipart/form-data` avec :
      - `file`: fichier image
      - `folder`: `news` | `gallery` | `palmares` | `settings`…
    - Réponse : `{ url, folder, name }`

### Schéma de données (simplifié)

- **users** : `id`, `username`, `password` (hash Bcrypt), `role`, `created_at`
- **news** : `id`, `title`, `date`, `summary`, `description`, `image`, `created_at`
- **gallery** : `id`, `title`, `description`, `image`, `category`, `created_at`
- **schedule** : `id`, `day`, `time_range` (ex: "18h00-19h00"), `activity`, `level`
- **palmares** : `id`, `title`, `date`, `location`, `category`, `result`, `boxer`, `details`, `image`, `year`
- **contacts** : `id`, `name`, `email`, `message`, `is_read`, `created_at`

## 🎯 Pages disponibles

### Pages publiques
- **/** - Page d'accueil avec vidéo et actualités
- **/apropos** - Présentation du club
- **/activite** - Activités proposées
- **/equipe** - Présentation de l'équipe
- **/galerie** - Galerie photos interactive
- **/horaire** - Planning et horaires
- **/contact** - Formulaire de contact et informations
- **/tarif** - Tarifs et inscriptions
- **/partenaire** - Nos partenaires
- **/palmares** - Palmarès et résultats
- **/actualite** - Toutes les actualités
- **/news** - Page dédiée aux actualités

### Pages d'administration
- **/admin/login** - Connexion à l'administration
- **/admin/dashboard** - Tableau de bord
- **/admin/news** - Gestion des actualités
- **/admin/palmares** - Gestion des palmarès
- **/admin/schedule** - Gestion du planning
- **/admin/gallery** - Gestion de la galerie
- **/admin/contacts** - Gestion des demandes de contact

## 🔐 Administration

### Accès au panneau d'administration

1. Accédez à `/admin/login`
2. Connectez-vous avec vos identifiants administrateur

> ⚠️ **Sécurité** : En production, changez impérativement le mot de passe par défaut.  
> Pour créer un utilisateur avec un mot de passe fort :
> ```sql
> INSERT INTO users (username, password, role) 
> VALUES ('admin', '$2y$10$...', 'admin');
> ```
> Le hash peut être généré avec : `php -r "echo password_hash('votre_mot_de_passe', PASSWORD_BCRYPT);"`

### Fonctionnalités d'administration

#### 📰 Gestion des actualités
- Ajouter de nouvelles actualités
- Modifier les actualités existantes
- Supprimer des actualités
- Gérer les dates, titres, descriptions et images

#### 🏆 Gestion des palmarès
- Ajouter des résultats de compétitions
- Modifier les palmarès existants
- Gérer les catégories (Boxe Amateur, Éducative, Handiboxe, etc.)
- Définir les résultats (Champion, Vainqueur, Médaillé, etc.)

#### 📅 Gestion du planning
- Modifier les horaires par jour de la semaine
- Ajouter/supprimer des activités
- Définir les créneaux horaires et niveaux

#### 🖼️ Gestion de la galerie
- Ajouter des photos avec titre et description
- Catégoriser les images
- Modifier ou supprimer des photos

#### 📧 Gestion des contacts
- Voir toutes les demandes de contact
- Marquer les messages comme lus/non lus
- Filtrer par statut (tous, lus, non lus)
- Supprimer les demandes traitées

### Stockage des données

Toutes les données métier (**news, palmarès, planning, galerie, contacts, auth**) sont désormais stockées dans la **base MySQL** via l’API PHP (PDO).  
Le frontend ne conserve dans le `localStorage` que le **token JWT** d’authentification admin.

## 📞 Contact

- **Adresse** : 2 rue Gabriel Morain, 86000 Poitiers
- **Téléphone** : 06 37 23 26 98
- **Email** : afboxingclub86@gmail.com
- **Facebook** : [AF Boxing Club 86](https://www.facebook.com/afboxingclub86)
- **Instagram** : [@afboxingclub86](https://www.instagram.com/afboxingclub86)

## 🏆 Mission

"Boxer ensemble pour mieux vivre ensemble" - L'AF Boxing Club 86 s'engage à promouvoir la boxe comme outil d'éducation, d'inclusion sociale et de bien-être pour tous les âges.

## 📝 Notes de développement

- L'API backend est déjà intégrée et utilisée par tout le frontend (aucun `localStorage` pour les données métier).
- L'URL d'API est configurable via `VITE_API_BASE_URL`.
- Les identifiants d'administration par défaut sont fournis via le script SQL et **doivent être changés en production**.
- Les uploads d'images sont stockés dans `backend/public/uploads/...` et servis directement au frontend.

## 🔒 Sécurité

### Mesures de sécurité implémentées

- ✅ **CORS sécurisé** : Configuration stricte des origines autorisées (pas de `*` en production)
- ✅ **Validation des données** : Validation email, dates, longueurs de champs
- ✅ **Sanitization** : Protection contre XSS sur tous les inputs
- ✅ **Rate limiting** : Protection contre les attaques brute force (login et contact)
- ✅ **JWT sécurisé** : Authentification par token avec expiration
- ✅ **Gestion d'erreurs** : Logging structuré sans révéler d'informations sensibles en production
- ✅ **Upload sécurisé** : Validation des types MIME et taille des fichiers

### Configuration de production

1. **Variables d'environnement** : Copiez `backend/.env.example` vers `backend/.env` et configurez :
   - `APP_ENV=production`
   - `JWT_SECRET` : Générez un secret fort (min 32 caractères)
   - `CORS_ALLOWED_ORIGINS` : Liste complète des domaines autorisés
   - `DB_*` : Identifiants de base de données sécurisés

2. **Mot de passe admin** : Changez le mot de passe par défaut en base de données

3. **Permissions fichiers** : Vérifiez que `backend/storage/` et `backend/public/uploads/` ont les bonnes permissions

## Checklist déploiement (smoke)

1. `composer install --no-dev` dans `backend/` ; `npm ci` puis `npm run build` à la racine.
2. Copier `backend/.env.example` vers `backend/.env`, renseigner `APP_ENV=production`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`, base de données.
3. Vérifier que l’URL de l’API répond : `GET /api/news` (JSON `{ data, meta }`).
4. Vérifier login admin : `POST /api/auth/login`, puis `GET /api/auth/me` avec `Authorization: Bearer …`.
5. Déployer le dossier `dist/` (frontend) et pointer `VITE_API_BASE_URL` vers l’URL publique du `backend/public`.
6. Lancer les tests : `npm test`, `cd backend && composer test`, optionnel `npm run test:e2e` (nécessite `npx playwright install`).
