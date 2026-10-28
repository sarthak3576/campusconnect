#!/usr/bin/env bash
# CampusConnect database backup using mysqldump (native MySQL tool)
set -euo pipefail

DB_NAME="${DB_NAME:-campusconnect}"
DB_USER="${DB_USER:-campus}"
DB_PASSWORD="${DB_PASSWORD:-campus_pass}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"

BACKUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUTFILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql"

echo "Backing up $DB_NAME to $OUTFILE ..."

if command -v mysqldump >/dev/null 2>&1; then
  mysqldump --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" --password="$DB_PASSWORD" \
    --single-transaction --routines --triggers --events "$DB_NAME" > "$OUTFILE"
else
  # Fall back to running mysqldump inside the Docker container
  docker exec campusconnect-mysql mysqldump -uroot -proot_pass \
    --single-transaction --routines --triggers --events "$DB_NAME" > "$OUTFILE"
fi

gzip -f "$OUTFILE"
echo "Backup complete: ${OUTFILE}.gz"
