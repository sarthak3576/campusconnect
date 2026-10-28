#!/usr/bin/env bash
# CampusConnect database restore from a mysqldump backup file
set -euo pipefail

DB_NAME="${DB_NAME:-campusconnect}"
DB_USER="${DB_USER:-campus}"
DB_PASSWORD="${DB_PASSWORD:-campus_pass}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <backup-file.sql[.gz]>"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "Restoring $DB_NAME from $BACKUP_FILE ..."

restore() {
  if command -v mysql >/dev/null 2>&1; then
    mysql --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" --password="$DB_PASSWORD" "$DB_NAME"
  else
    docker exec -i campusconnect-mysql mysql -uroot -proot_pass "$DB_NAME"
  fi
}

case "$BACKUP_FILE" in
  *.gz) gunzip -c "$BACKUP_FILE" | restore ;;
  *) restore < "$BACKUP_FILE" ;;
esac

echo "Restore complete."
