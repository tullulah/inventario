#!/bin/bash
# Generar certificado con mkcert para HTTPS

# Instalar mkcert si no está instalado
if ! command -v mkcert &> /dev/null; then
    echo "❌ mkcert no está instalado. Instalando..."
    brew install mkcert
    mkcert -install
fi

# Generar certificado para localhost y la IP local
mkcert -key-file localhost+3-key.pem -cert-file localhost+3.pem localhost 127.0.0.1 ::1 192.168.1.128

echo "✅ Certificados generados con mkcert para:"
echo "   - localhost"
echo "   - 127.0.0.1"
echo "   - ::1"
echo "   - 192.168.1.128"
