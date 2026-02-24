#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# AdMaster Pro - PostgreSQL Database Backup Script
# ═══════════════════════════════════════════════════════════════════
#
# Description:
#   Creates a compressed backup of the PostgreSQL database and
#   uploads it to an S3 bucket. Supports automatic retention
#   and cleanup of old backups.
#
# Usage:
#   ./backup-db.sh [daily|weekly|manual]
#
# Setup on Lightsail:
#   1. Copy this script to /home/ubuntu/scripts/backup-db.sh
#   2. chmod +x /home/ubuntu/scripts/backup-db.sh
#   3. Add to crontab:
#      0 3 * * * /home/ubuntu/scripts/backup-db.sh daily >> /var/log/db-backup.log 2>&1
#      0 4 * * 0 /home/ubuntu/scripts/backup-db.sh weekly >> /var/log/db-backup.log 2>&1
#
# Requirements:
#   - pg_dump installed
#   - AWS CLI configured (for S3 uploads)
#   - DATABASE_URL environment variable
#
# ═══════════════════════════════════════════════════════════════════

set -e

# ─── Configuration ───────────────────────────────────────────────────
BACKUP_TYPE="${1:-manual}"
BACKUP_DIR="/home/ubuntu/backups"
S3_BUCKET="${S3_BACKUP_BUCKET:-}"  # Optional: S3 bucket for offsite backup
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
DATE_STAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="admasterpro"

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

# ─── Pre-flight Checks ───────────────────────────────────────────────
if [ -z "$DATABASE_URL" ]; then
    error "DATABASE_URL not set. Ensure .env file exists."
fi

# Create backup directory if needed
mkdir -p "$BACKUP_DIR"

# ─── Create Backup ───────────────────────────────────────────────────
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${BACKUP_TYPE}_${DATE_STAMP}.sql.gz"

log "Starting $BACKUP_TYPE backup..."
log "Output: $BACKUP_FILE"

# Parse DATABASE_URL and run pg_dump
# Format: postgresql://user:password@host:port/database
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"

if [ ! -f "$BACKUP_FILE" ]; then
    error "Backup file was not created"
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "Backup created: $BACKUP_SIZE"

# ─── Upload to S3 (Optional) ─────────────────────────────────────────
if [ -n "$S3_BUCKET" ]; then
    log "Uploading to S3: s3://$S3_BUCKET/backups/"
    
    if command -v aws &> /dev/null; then
        aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/backups/" --storage-class STANDARD_IA
        log "S3 upload complete"
    else
        log "WARNING: AWS CLI not installed. Skipping S3 upload."
    fi
fi

# ─── Cleanup Old Backups ─────────────────────────────────────────────
log "Cleaning up backups older than $RETENTION_DAYS days..."

# Local cleanup
find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
LOCAL_COUNT=$(find "$BACKUP_DIR" -name "*.sql.gz" -type f | wc -l)
log "Local backups remaining: $LOCAL_COUNT"

# S3 cleanup (if configured)
if [ -n "$S3_BUCKET" ] && command -v aws &> /dev/null; then
    # S3 lifecycle rules should handle this, but we can also clean manually
    log "Note: Configure S3 lifecycle rules for automatic S3 cleanup"
fi

# ─── Verification ────────────────────────────────────────────────────
# Quick verification that the backup is valid
if gzip -t "$BACKUP_FILE" 2>/dev/null; then
    log "Backup verification: OK (gzip integrity check passed)"
else
    error "Backup verification FAILED - file may be corrupted"
fi

log "Backup complete: $BACKUP_FILE"

# ─── Summary ─────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " Backup Summary"
echo "═══════════════════════════════════════════════════════════════"
echo " Type:     $BACKUP_TYPE"
echo " File:     $BACKUP_FILE"
echo " Size:     $BACKUP_SIZE"
echo " Local:    $LOCAL_COUNT backups on disk"
if [ -n "$S3_BUCKET" ]; then
    echo " S3:       s3://$S3_BUCKET/backups/"
fi
echo "═══════════════════════════════════════════════════════════════"
