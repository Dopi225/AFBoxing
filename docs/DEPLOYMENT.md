# Déploiement AF Boxing (frontend + API PHP)

## Prérequis

- PHP 8.2+ avec extensions `pdo_mysql`, `json`, `fileinfo` (uploads), `mbstring`
- MySQL / MariaDB 10.5+
- Node.js 20+ pour construire le frontend (Vite)

## Base de données

1. Importer le schéma : `backend/database/schema.sql`
2. Copier `backend/.env.example` vers `backend/.env` et renseigner :
   - `DB_*` (hôte, base, utilisateur, mot de passe)
   - `JWT_SECRET` : chaîne aléatoire longue (≥ 32 caractères)
3. Créer un compte administrateur (hash bcrypt) dans la table `users` ou via l’interface une fois l’API démarrée.

## API (backend)

- Point d’entrée HTTP : `backend/public/index.php`
- Réécriture Apache (exemple) : toutes les URLs `/api/*` vers `backend/public/index.php`
- Dossiers à permissions d’écriture : `backend/storage/logs`, `backend/storage/cache/ratelimit`, `backend/public/uploads`
- CORS : ajuster `CORS_ALLOWED_ORIGINS` dans `.env` avec l’URL du site public (HTTPS en production)

## Frontend (Vite)

1. `npm ci`
2. Build : `npm run build` — sortie dans `dist/`
3. Variables de build :
   - `VITE_API_BASE_URL` : URL publique de l’API si elle diffère de l’origine du site (ex. `https://api.example.com` ou même origine avec sous-chemin)
   - En sous-dossier (ex. `/AF/AFBoxing/`), le `base` Vite doit correspondre au chemin de déploiement

Servir `dist/` en statique (nginx, Apache, hébergeur statique) avec fallback SPA vers `index.html` pour le routage React.

## Tests automatisés

- Après `npm install`, première exécution Playwright : `npx playwright install chromium`
- Frontend : `npm test` (Vitest), `npm run test:e2e` (Playwright ; serveur de dev démarré par la config)
- Backend : `cd backend && composer test`
- E2E admin optionnel : définir `E2E_ADMIN_USER` et `E2E_ADMIN_PASSWORD` dans l’environnement

## Checklist production

- HTTPS activé
- `APP_ENV=production` et messages d’erreur génériques côté API
- Sauvegardes BDD planifiées
- Rotation / surveillance des fichiers de log dans `backend/storage/logs`
