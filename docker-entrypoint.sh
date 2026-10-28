#!/bin/sh
set -e

DB_HOST="${DB_HOST:-mysql}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-campus}"
DB_PASSWORD="${DB_PASSWORD:-campus_pass}"
DB_NAME="${DB_NAME:-campusconnect}"

echo "==> Waiting for MySQL at ${DB_HOST}:${DB_PORT} ..."
until mysqladmin ping -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" --skip-ssl --silent 2>/dev/null; do
  echo "    database not ready yet, retrying in 2s..."
  sleep 2
done
echo "==> MySQL is ready."

echo "==> Applying Prisma migrations ..."
npx prisma migrate deploy

echo "==> Applying views / stored procedures / triggers ..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" --skip-ssl "$DB_NAME" < /app/prisma/sql/advanced.sql

echo "==> Checking for existing data ..."
COUNT="$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" --skip-ssl "$DB_NAME" -N -s -e "SELECT COUNT(*) FROM User;" 2>/dev/null || echo 0)"
if [ "$COUNT" = "0" ]; then
  echo "==> Database empty, seeding demo data ..."
  npm run db:seed
else
  echo "==> Database already contains ${COUNT} users, skipping seed."
fi

echo "==> Starting application ..."
exec "$@"
