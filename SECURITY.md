# 🔒 Guide de Sécurité - AF Boxing Club 86

## Vue d'ensemble

Ce document décrit les mesures de sécurité implémentées dans l'application et les bonnes pratiques à suivre en production.

## ✅ Mesures de sécurité implémentées

### 1. CORS (Cross-Origin Resource Sharing)

- **Configuration stricte** : Les origines autorisées sont configurées via `CORS_ALLOWED_ORIGINS` dans `.env`
- **Production** : Refus automatique des requêtes depuis des origines non autorisées
- **Développement** : Fallback permissif uniquement en mode développement

**Fichier** : `backend/config/cors.php`

### 2. Validation des données

Tous les endpoints valident :
- **Format email** : Validation RFC-compliant
- **Format dates** : Format YYYY-MM-DD strict
- **Longueurs de champs** : Limites min/max pour tous les champs texte
- **Types de données** : Vérification des types attendus

**Fichiers** : `backend/src/Controllers/BaseController.php` et tous les contrôleurs

### 3. Sanitization des inputs

- **Protection XSS** : Tous les inputs sont sanitizés avant stockage
- **Limitation de longueur** : Prévention des attaques par buffer overflow
- **Normalisation** : Nettoyage des caractères spéciaux

### 4. Rate Limiting

- **Login** : 5 tentatives par 15 minutes par IP/username
- **Contact** : 3 messages par heure par IP
- **Stockage** : Fichiers JSON avec expiration automatique

**Fichier** : `backend/src/Core/RateLimiter.php`

### 5. Authentification JWT

- **Tokens sécurisés** : Expiration après 3 heures
- **Secret fort requis** : Minimum 32 caractères recommandé
- **Validation stricte** : Vérification de l'utilisateur en base à chaque requête

**Fichiers** : `backend/src/Controllers/AuthController.php`, `backend/src/Middlewares/AuthMiddleware.php`

### 6. Upload de fichiers

- **Validation MIME** : Seuls JPEG, PNG, WebP, GIF acceptés
- **Taille limitée** : Maximum 5 Mo par fichier
- **Noms sécurisés** : Génération aléatoire pour éviter les collisions
- **Chemins sécurisés** : Prévention des traversées de répertoire

**Fichier** : `backend/src/Controllers/UploadController.php`

### 7. Gestion d'erreurs

- **Logging structuré** : Toutes les erreurs sont loggées avec contexte
- **Production** : Messages d'erreur génériques (pas de détails techniques)
- **Développement** : Messages détaillés pour faciliter le debug

**Fichiers** : `backend/src/Core/Logger.php`, `backend/public/index.php`

### 8. Base de données

- **Requêtes préparées** : Protection contre les injections SQL
- **PDO strict** : `ATTR_EMULATE_PREPARES = false`
- **Charset UTF-8** : Support complet Unicode

## ⚠️ Checklist de déploiement en production

### Configuration

- [ ] Copier `backend/.env.example` vers `backend/.env`
- [ ] Définir `APP_ENV=production`
- [ ] Générer un `JWT_SECRET` fort (32+ caractères) : `openssl rand -base64 32`
- [ ] Configurer `CORS_ALLOWED_ORIGINS` avec tous les domaines autorisés
- [ ] Configurer les identifiants de base de données sécurisés

### Base de données

- [ ] Changer le mot de passe admin par défaut
- [ ] Créer un utilisateur avec mot de passe fort :
  ```sql
  INSERT INTO users (username, password, role) 
  VALUES ('admin', '$2y$10$...', 'admin');
  ```
  Hash généré avec : `php -r "echo password_hash('votre_mot_de_passe', PASSWORD_BCRYPT);"`
- [ ] Supprimer l'utilisateur par défaut si nécessaire

### Permissions fichiers

- [ ] `backend/storage/logs/` : 775 (écriture logs)
- [ ] `backend/storage/cache/` : 775 (cache rate limiting)
- [ ] `backend/public/uploads/` : 775 (upload images)
- [ ] `.env` : 600 (lecture seule pour le serveur web)

### Serveur web

- [ ] Désactiver l'affichage des erreurs PHP en production
- [ ] Configurer HTTPS (SSL/TLS)
- [ ] Configurer les headers de sécurité (HSTS, CSP, etc.)
- [ ] Vérifier que `backend/public/` est le document root (pas `backend/`)

### Monitoring

- [ ] Surveiller les logs dans `backend/storage/logs/app.log`
- [ ] Surveiller les tentatives de rate limiting
- [ ] Configurer des alertes pour les erreurs critiques

## 🐛 Gestion des vulnérabilités

Si vous découvrez une vulnérabilité de sécurité :

1. **Ne pas créer d'issue publique** sur GitHub
2. Contacter directement l'équipe de développement
3. Fournir des détails sur la vulnérabilité et les étapes de reproduction

## 📚 Ressources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PHP Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/PHP_Configuration_Cheat_Sheet.html)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

## 🔄 Mises à jour de sécurité

Les mises à jour de sécurité doivent être appliquées immédiatement en production. Surveillez les dépendances pour les vulnérabilités connues :

```bash
cd backend
composer audit
```

