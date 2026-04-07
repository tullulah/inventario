#!/bin/bash

# Script de backup automático para Inventario
# Crea backup de base de datos y fotos

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="backup_$TIMESTAMP"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

# Días de retención de backups (elimina backups más antiguos)
RETENTION_DAYS=30

echo "🔄 Iniciando backup..."

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"
mkdir -p "$BACKUP_PATH"

# Backup de base de datos
echo "📦 Respaldando base de datos..."
if [ -f "$SCRIPT_DIR/backend/data/inventario.db" ]; then
    cp "$SCRIPT_DIR/backend/data/inventario.db" "$BACKUP_PATH/inventario.db"
    echo "✅ Base de datos respaldada"
else
    echo "⚠️  No se encontró la base de datos"
fi

# Backup de fotos/uploads
echo "📸 Respaldando fotos..."
if [ -d "$SCRIPT_DIR/backend/uploads" ]; then
    cp -r "$SCRIPT_DIR/backend/uploads" "$BACKUP_PATH/uploads"
    PHOTOS_COUNT=$(find "$BACKUP_PATH/uploads" -type f | wc -l)
    echo "✅ $PHOTOS_COUNT archivos respaldados"
else
    echo "⚠️  No se encontró el directorio de uploads"
fi

# Comprimir backup
echo "🗜️  Comprimiendo backup..."
cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"
BACKUP_SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
echo "✅ Backup comprimido: ${BACKUP_NAME}.tar.gz ($BACKUP_SIZE)"

# Limpiar backups antiguos
echo "🧹 Limpiando backups antiguos (> $RETENTION_DAYS días)..."
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
REMAINING=$(ls -1 "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | wc -l)
echo "📦 Backups disponibles: $REMAINING"

echo ""
echo "✅ Backup completado: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
echo "   Fecha: $(date '+%Y-%m-%d %H:%M:%S')"

# Mostrar lista de backups
echo ""
echo "📋 Últimos backups:"
ls -lh "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | tail -5 | awk '{print "   " $9 " (" $5 ")"}'
