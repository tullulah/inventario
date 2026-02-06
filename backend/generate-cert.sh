#!/bin/bash
# Generar certificado autofirmado para HTTPS

openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
  -subj "/C=ES/ST=Spain/L=Madrid/O=Inventario/CN=localhost"

echo "✅ Certificados generados: cert.pem y key.pem"
