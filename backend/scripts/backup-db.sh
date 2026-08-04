#!/usr/bin/env bash
# Sauvegarde MySQL AF Boxing — à planifier en cron quotidien (hôte / Hostinger).
# Restauration (TESTEZ-LA au moins une fois) :
#   gunzip -c backups/afboxing_YYYYMMDD.sql.gz | mysql -u USER -p DB_NAME
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ROOT}/.env"
BACKUP_DIR="${BACKUP_DIR:-${ROOT}/storage/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Fichier .env introuvable : $ENV_FILE" >&2
  exit 1
fi

# Charge DB_* depuis .env (lignes simples KEY=VALUE)
set -a
# shellcheck disable=SC1090
source <(grep -E '^(DB_HOST|DB_PORT|DB_NAME|DB_USER|DB_PASS)=' "$ENV_FILE" | sed 's/\r$//')
set +a

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d_%H%M%S)"
OUT="${BACKUP_DIR}/afboxing_${STAMP}.sql.gz"

export MYSQL_PWD="${DB_PASS:-}"
mysqldump \
  -h "${DB_HOST:-127.0.0.1}" \
  -P "${DB_PORT:-3306}" \
  -u "${DB_USER}" \
  --single-transaction \
  --routines \
  --triggers \
  "${DB_NAME}" | gzip -c > "$OUT"
unset MYSQL_PWD

# Purge des sauvegardes trop anciennes
find "$BACKUP_DIR" -name 'afboxing_*.sql.gz' -type f -mtime "+${KEEP_DAYS}" -delete

echo "OK : $OUT"
echo "Test de restauration recommandé :"
echo "  gunzip -t \"$OUT\" && echo 'archive gzip OK'"
