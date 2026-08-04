#!/usr/bin/env bash
# Permissions minimales recommandées (Linux / Hostinger SSH).
# À adapter au user du serveur web (souvent www-data, nobody, ou votre user).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB_USER="${WEB_USER:-$(whoami)}"

mkdir -p \
  "$ROOT/storage/logs" \
  "$ROOT/storage/cache/ratelimit" \
  "$ROOT/storage/backups" \
  "$ROOT/public/uploads"

chmod 750 "$ROOT/storage" "$ROOT/storage/logs" "$ROOT/storage/cache" "$ROOT/storage/cache/ratelimit" "$ROOT/storage/backups" || true
chmod 750 "$ROOT/public/uploads" || true

# Si vous pouvez chown (sudo) :
# chown -R "$WEB_USER:$WEB_USER" "$ROOT/storage" "$ROOT/public/uploads"

echo "Dossiers prêts. Propriétaire conseillé : $WEB_USER"
echo "Vérifiez que le PHP-FPM / Apache peut écrire dans storage/ et public/uploads/"
