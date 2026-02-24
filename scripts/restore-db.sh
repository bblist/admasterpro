#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# AdMaster Pro - Database Restore Script
# ═══════════════════════════════════════════════════════════════════
#
# Description:
#   Restores the PostgreSQL database from a backup file.
#
# Usage:
#   ./restore-db.sh <backup-file.sql.gz>
#   ./restore-db.sh /home/ubuntu/backups/admasterpro_daily_20250225_030000.sql.gz
#
# WARNING:
#   This will DROP and RECREATE the database. All existing data will be lost.
#   Always backup the current database before restoring!
#
# ═══════════════════════════════════════════════════════════════════

set -e

# ─── Configuration ───────────────────────────────────────────────────
BACKUP_FILE="$1"

# Load environment variables
if [ -f /home/ubuntu/admasterpro/.env ]; then
    export $(grep -E '^DATABASE_URL=' /home/ubuntu/admasterpro/.env | xargs)
fi

# ─── Helpers ─────────────────────────────────────────────────────────
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

error() {
    log "ERROR: $1"
    exit 1
}

# ─── Validations ─────────────────────────────────────────────────────
if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup-file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -lh /home/ubuntu/backups/*.sql.gz 2>/dev/null || echo "  No backups found"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    error "Backup file not found: $BACKUP_FILE"
fi

if [ -z "$DATABASE_URL" ]; then
    error "DATABASE_URL not set. Ensure .env file exists."
fi

# ─── Confirmation ────────────────────────────────────────────────────
echo "═══════════════════════════════════════════════════════════════"
echo " DATABASE RESTORE"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo " Backup file: $BACKUP_FILE"
echo " Target DB:   $DATABASE_URL"
echo ""
echo " ⚠️  WARNING: This will OVERWRITE all existing data!"
echo ""
read -p " Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    log "Restore cancelled by user"
    exit 0
fi

# ─── Stop Application ────────────────────────────────────────────────
log "Stopping application..."
pm2 stop admasterpro || true
sleep 2

# ─── Create Pre-Restore Backup ───────────────────────────────────────
log "Creating pre-restore backup..."
DATE_STAMP=$(date +%Y%m%d_%H%M%S)
PRE_RESTORE_BACKUP="/home/ubuntu/backups/admasterpro_pre-restore_${DATE_STAMP}.sql.gz"
pg_dump "$DATABASE_URL" | gzip > "$PRE_RESTORE_BACKUP" || true
log "Pre-restore backup: $PRE_RESTORE_BACKUP"

# ─── Restore Database ────────────────────────────────────────────────
log "Restoring database from $BACKUP_FILE..."

# Decompress and restore
gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"

if [ $? -eq 0 ]; then
    log "Database restored successfully"
else
    error "Database restore failed. Pre-restore backup available at: $PRE_RESTORE_BACKUP"
fi

# ─── Restart Application ─────────────────────────────────────────────
log "Restarting application..."
pm2 restart admasterpro

# ─── Verification ────────────────────────────────────────────────────
sleep 5
log "Running health check..."
curl -s http://localhost:3000/api/health | head -c 200
echo ""

log "Restore complete!"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " Restore Summary"
echo "═══════════════════════════════════════════════════════════════"
echo " Restored from: $BACKUP_FILE"
echo " Pre-restore backup: $PRE_RESTORE_BACKUP"
echo " Application status: $(pm2 status admasterpro --no-color | grep admasterpro)"
echo "═══════════════════════════════════════════════════════════════"
