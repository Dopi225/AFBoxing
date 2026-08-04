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
   - En production : `APP_ENV=production` et `CORS_ALLOWED_ORIGINS=https://afboxingclub86.com,https://www.afboxingclub86.com`
3. Créer un compte administrateur **fort** (jamais `admin` / `admin123` en prod) :
   ```bash
   php -r "echo password_hash('MOT_DE_PASSE_FORT', PASSWORD_BCRYPT), PHP_EOL;"
   ```
   Puis `INSERT INTO users (username, password, role) VALUES (...);`
   - Seed local uniquement : `backend/database/seed_dev_admin.sql` (mot de passe faible `admin123`)

## API (backend)

- Point d’entrée HTTP : `backend/public/index.php`
- Réécriture Apache (exemple) : toutes les URLs `/api/*` vers `backend/public/index.php`
- Dossiers à permissions d’écriture (propriétaire web, pas world-writable si possible) :
  - `backend/storage/logs`
  - `backend/storage/cache/ratelimit`
  - `backend/storage/backups` (si sauvegardes locales)
  - `backend/public/uploads`
- CORS : `CORS_ALLOWED_ORIGINS` dans `.env` = URL(s) HTTPS du site public

## Frontend (Vite)

1. `npm ci`
2. Build : `npm run build` — sortie dans `dist/`
3. Variables de build :
   - `VITE_API_BASE_URL` : URL publique de l’API si elle diffère de l’origine du site (souvent vide / même origine en prod)
   - En sous-dossier (ex. `/AF/AFBoxing/`), le `base` Vite doit correspondre au chemin de déploiement

Servir `dist/` en statique (nginx, Apache, hébergeur) avec fallback SPA vers `index.html`.

## Sauvegardes BDD

Script fourni : `backend/scripts/backup-db.sh`

Exemple cron quotidien (Hostinger / VPS) :
```cron
15 2 * * * /bin/bash /chemin/vers/backend/scripts/backup-db.sh >> /chemin/vers/backend/storage/logs/backup.log 2>&1
```

**Test de restauration (obligatoire au moins une fois)** :
```bash
gunzip -t backend/storage/backups/afboxing_XXXX.sql.gz   # intégrité gzip
# Sur une base de STAGING (jamais écraser la prod sans filet) :
gunzip -c backend/storage/backups/afboxing_XXXX.sql.gz | mysql -u USER -p DB_STAGING
```

## Rotation des logs

- Monolog : `RotatingFileHandler` (30 jours) sur `storage/logs/app-*.log`
- Script filet : `php backend/scripts/rotate-logs.php` (cron hebdomadaire recommandé)

```cron
0 3 * * 0 php /chemin/vers/backend/scripts/rotate-logs.php
```

## Tests automatisés

- Après `npm install`, première exécution Playwright : `npx playwright install chromium`
- Frontend : `npm test` (Vitest), `npm run test:e2e` (Playwright ; serveur de dev démarré par la config)
- Backend : `cd backend && composer test`
- E2E admin (CRUD CRM, contacts/réponse, saisons) : définir dans l’environnement :
  - `E2E_ADMIN_USER` / `E2E_ADMIN_PASSWORD`
  - `VITE_API_PROXY_TARGET` (ex. `http://localhost/AF/AFBoxing`) pour que Vite proxy `/api` vers Apache
  - Pour la réponse email sans SMTP : `MAIL_DRIVER=log` dans `backend/.env`

## Checklist production

- [ ] HTTPS actif et forcé (HTTP → HTTPS) + HSTS
- [ ] `APP_ENV=production`, messages d’erreur génériques (pas de stack trace client)
- [ ] Secrets uniquement dans `.env` (gitignoré) : `JWT_SECRET`, DB, SMTP
- [ ] `CORS_ALLOWED_ORIGINS` = domaines HTTPS réels uniquement
- [ ] Sauvegardes BDD planifiées **et** restauration testée sur staging
- [ ] Rotation / surveillance des logs (`storage/logs`)
- [ ] Permissions d’écriture minimales sur `storage/*` et `public/uploads`
- [ ] `npm run build` OK ; `VITE_API_BASE_URL` correct si besoin
- [ ] Aucun compte admin faible (`admin`/`admin123`) en production
- [ ] Tests verts (`npm test`, `npm run test:e2e`, `composer test`)
- [ ] `GUIDE_UTILISATION.html` à jour (Équipe, réponses contacts, tarifs/saisons)
