# PostgreSQL Backup & Disaster Recovery Guide

This guide describes operational backup, verification, and point-in-time recovery for the CampusConnect production database.

---

### 1. Database Backup (`pg_dump`)

#### Custom Compressed Format Backup (Recommended)
Produces a compressed binary archive containing schemas, views, stored procedures, triggers, and table records:
```bash
pg_dump -h localhost -p 5432 -U cc_admin -F c -b -v -f "campusconnect_backup_$(date +%Y%m%d_%H%M%S).dump" campusconnect
```

#### Plain SQL Text Dump
Useful for inspecting DDL statements or manual data debugging:
```bash
pg_dump -h localhost -p 5432 -U cc_admin -F p -v -f "campusconnect_schema_data.sql" campusconnect
```

#### Schema-Only Dump (No Records)
```bash
pg_dump -h localhost -p 5432 -U cc_admin --schema-only -f "campusconnect_ddl_only.sql" campusconnect
```

---

### 2. Database Restoration (`pg_restore`)

#### Restoration into a Clean Database
1. Terminate active backend connections and recreate target database:
```sql
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'campusconnect';
DROP DATABASE campusconnect;
CREATE DATABASE campusconnect;
```

2. Restore the binary dump with multi-threaded parallel execution:
```bash
pg_restore -h localhost -p 5432 -U cc_admin -d campusconnect -v -j 4 "campusconnect_backup_20261021_000000.dump"
```

---

### 3. Automated Daily Backup via Cron / Docker
Create a daily scheduled backup script (`backup.sh`):
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/campusconnect"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/cc_backup_$TIMESTAMP.dump"

mkdir -p "$BACKUP_DIR"
export PGPASSWORD="$POSTGRES_PASSWORD"

pg_dump -h db -U cc_admin -F c campusconnect > "$FILENAME"

# Retain only last 14 days of backups
find "$BACKUP_DIR" -type f -name "*.dump" -mtime +14 -exec rm {} \;

echo "Backup created at $FILENAME"
```
Cron entry (runs every night at 2:00 AM):
```cron
0 2 * * * /bin/bash /opt/campusconnect/backup.sh >> /var/log/campusconnect_backup.log 2>&1
```
