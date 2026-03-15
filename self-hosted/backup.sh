#!/bin/bash
# =============================================================================
# CFO Family — Database Backup Script
# Chay tu dong bang cron: 0 2 * * * /path/to/backup.sh
# Giu lai 30 ban backup gan nhat
# =============================================================================

BACKUP_DIR="/nas_data/augustNg/File/Family Budget/self-hosted/backups"
DB_NAME="cfo_family"
DB_USER="cfo_admin"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"
MAX_BACKUPS=30

# Tao backup
echo "[$(date)] Bat dau backup database..."
PGPASSWORD='CfoFamily2024!Secure' pg_dump -h 127.0.0.1 -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "[$(date)] Backup thanh cong: $BACKUP_FILE ($SIZE)"
else
    echo "[$(date)] LOI: Backup that bai!"
    exit 1
fi

# Xoa backup cu (giu lai MAX_BACKUPS ban)
cd "$BACKUP_DIR"
ls -t ${DB_NAME}_*.sql.gz 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm
echo "[$(date)] Da don dep backup cu. Con lai: $(ls ${DB_NAME}_*.sql.gz 2>/dev/null | wc -l) ban."
