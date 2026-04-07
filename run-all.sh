#!/bin/bash

# Script para arrancar frontend y backend
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 Arrancando Inventario..."
echo ""

# Función para matar procesos al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo servicios..."
    pkill -P $$ 2>/dev/null
    exit 0
}

trap cleanup INT TERM

# Matar procesos previos en los puertos
echo "🧹 Limpiando procesos previos..."
pkill -f "node.*index.js" 2>/dev/null
pkill -f "node.*vite" 2>/dev/null
sleep 1

# Arrancar backend
echo "📦 Arrancando backend en https://localhost:3443..."
(cd "$ROOT_DIR/backend" && npm run dev) &
BACKEND_PID=$!

# Arrancar frontend
echo "🌐 Arrancando frontend en https://localhost:5173..."
(cd "$ROOT_DIR/frontend" && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "✅ Servicios iniciados:"
echo "   Backend:  https://localhost:3443 (PID: $BACKEND_PID)"
echo "   Frontend: https://localhost:5173 (PID: $FRONTEND_PID)"
echo "   También disponible en: https://192.168.1.128:5173"
echo ""
echo "Presiona Ctrl+C para detener todos los servicios"

# Esperar a que terminen los procesos
wait
