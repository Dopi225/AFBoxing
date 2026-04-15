# En-têtes HTTPS (CSP, HSTS, COOP) — activation en production

Ce projet sert le front via Apache ([`public/.htaccess`](../public/.htaccess)) et l’API PHP séparément. Les blocs commentés en bas du `.htaccess` (CSP, HSTS, `X-Frame-Options`, etc.) sont **volontairement désactivés** sur HTTP local pour éviter de casser les polices, l’API ou Vite.

## Quand activer

1. Le site est servi en **HTTPS** avec un certificat valide.
2. Les polices sont soit **self-hostées**, soit toujours autorisées dans la CSP (`fonts.googleapis.com` / `fonts.gstatic.com` si vous gardez Google Fonts).
3. L’origine front et l’URL API (`/api`) sont testées (formulaires, upload, JWT).

## Ordre recommandé

1. Décommenter **`Header set X-Frame-Options "DENY"`** (ou équivalent CSP `frame-ancestors 'none'`) — faible risque.
2. Ajouter une **CSP** progressive : commencer par `default-src 'self'` et élargir selon les erreurs console (scripts Vite hashés, inline minimal).
3. Activer **HSTS** uniquement quand HTTPS est stable :  
   `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`  
   (tester d’abord avec une durée courte, ex. `max-age=86400`).

## COOP / CORP

`Cross-Origin-Opener-Policy` et `Cross-Origin-Resource-Policy` peuvent interférer avec des intégrations tierces. À activer seulement après validation sur préprod.

## Références

- [MDN — Content-Security-Policy](https://developer.mozilla.org/fr/docs/Web/HTTP/CSP)
- [MDN — Strict-Transport-Security](https://developer.mozilla.org/fr/docs/Web/HTTP/Headers/Strict-Transport-Security)
