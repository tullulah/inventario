#!/bin/bash

# Script para restaurar un backup

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/backups"

# Mostrar backups disponibles
echo "📦 Backups disponibles:"
echo ""
ls -1t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | nl -w2 -s') '

if [ ! "$(ls -A $BACKUP_DIR/backup_*.tar.gz 2>/dev/null)" ]; then
    echo "❌ No hay backups disponibles"
    exit 1
fi

echo ""
read -p "Número del backup a restaurar (o 'q' para cancelar): " SELECTION

if [ "$SELECTION" = "q" ]; then
    echo "❌ Restauración cancelada"
    exit 0
fi

BACKUP_FILE=$(ls -1t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | sed -n "${SELECTION}p")

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ Selección inválida"
    exit 1
fi

echo ""
echo "⚠️  ADVERTENCIA: Esto sobrescribirá los datos actuales"
echo "   Backup seleccionado: $(basename $BACKUP_FILE)"
echo ""
read -p "¿Continuar? (escribe 'SI' para confirmar): " CONFIRM

if [ "$CONFIRM" != "SI" ]; then
    echo "❌ Restauración cancelada"
    exit 0
fi

echo ""
echo "🔄 Restaurando backup..."

# Crear backup de seguridad antes de restaurar
echo "📦 Creando backup de seguridad de datos actuales..."
SAFETY_BACKUP="$BACKUP_DIR/pre_restore_$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf "$SAFETY_BACKUP" -C "$SCRIPT_DIR" backend/data backend/uploads 2>/dev/null
echo "✅ Backup de seguridad creado: $(basename $SAFETY_BACKUP)"

# Extraer backup temporal
TEMP_DIR=$(mktemp -d)
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"
BACKUP_NAME=$(basename "$BACKUP_FILE" .tar.gz)

# Restaurar base de datos
if [ -f "$TEMP_DIR/$BACKUP_NAME/inventario.db" ]; then
    echo "📦 Restaurando base de datos..."
    cp "$TEMP_DIR/$BACKUP_NAME/inventario.db" "$SCRIPT_DIR/backend/data/inventario.db"
    echo "✅ Base de datos restaurada"
else
    echo "⚠️  No se encontró base de datos en el backup"
fi

# Restaurar fotos
if [ -d "$TEMP_DIR/$BACKUP_NAME/uploads" ]; then
    echo "📸 Restaurando fotos..."
    rm -rf "$SCRIPT_DIR/backend/uploads"
    cp -r "$TEMP_DIR/$BACKUP_NAME/uploads" "$SCRIPT_DIR/backend/uploads"
    PHOTOS_COUNT=$(find "$SCRIPT_DIR/backend/uploads" -type f | wc -l)
    echo "✅ $PHOTOS_COUNT archivos restaurados"
else
    echo "⚠️  No se encontraron fotos en el backup"
fi

# Limpiar
rm -rf "$TEMP_DIR"

echo ""
echo "✅ Restauración completada"
echo "   Backup de seguridad guardado en: $(basename $SAFETY_BACKUP)"
