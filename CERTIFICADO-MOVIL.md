# 📱 Instalar Certificado en Dispositivos Móviles

## ✅ Tu Mac ya confía en el certificado

El certificado mkcert ya está instalado en tu Mac. Ahora Chrome, Safari, Firefox y todos los navegadores confiarán en `https://localhost:3443` y `https://192.168.1.128:3443` sin advertencias.

## 📱 Para acceder desde tu móvil

### 1️⃣ Exportar el certificado CA

El archivo CA está en: `/Users/daniel/Library/Application Support/mkcert/rootCA.pem`

Puedes compartirlo vía AirDrop, email, o copiarlo a un servidor:

```bash
# Copiar a la carpeta del proyecto para fácil acceso
cp "/Users/daniel/Library/Application Support/mkcert/rootCA.pem" ~/Desktop/rootCA.pem
```

### 2️⃣ Instalar en iOS (iPhone/iPad)

1. **Envía el archivo `rootCA.pem` al móvil** (por AirDrop, email, o WhatsApp)
2. **Abre el archivo** en el móvil - iOS dirá "Perfil descargado"
3. **Ve a Ajustes → Perfil descargado** y pulsa "Instalar"
4. **Introduce tu código de desbloqueo**
5. **Ve a Ajustes → General → Información → Ajustes de confianza de certificados**
6. **Activa el interruptor** junto a "mkcert"

### 3️⃣ Instalar en Android

1. **Envía el archivo `rootCA.pem` al móvil**
2. **Renombra el archivo** de `rootCA.pem` a `rootCA.crt` (Android no reconoce .pem)
3. **Ve a Ajustes → Seguridad → Cifrado y credenciales → Instalar certificado**
4. **Selecciona "Certificado de CA"**
5. **Busca y selecciona** el archivo `rootCA.crt`
6. **Dale un nombre** (por ejemplo: "mkcert local")

### 4️⃣ Acceder a la web desde el móvil

**Asegúrate de estar en la misma red WiFi que tu Mac**

Luego abre en tu móvil:
```
https://192.168.1.128:5173
```

**✅ Ya no debería aparecer advertencia de certificado**

---

## 🌐 URLs disponibles

- **En tu Mac:**
  - `https://localhost:3443` (backend)
  - `https://localhost:5173` (frontend)

- **Desde otros dispositivos en la red:**
  - `https://192.168.1.128:3443` (backend)
  - `https://192.168.1.128:5173` (frontend)

---

## 🔧 Solución de problemas

### El móvil sigue mostrando advertencia
- Verifica que instalaste el certificado CA (no el certificado del servidor)
- En iOS, asegúrate de activar la confianza en "Ajustes de confianza de certificados"
- Reinicia el navegador del móvil

### No puedo conectar al servidor
- Verifica que estás en la misma red WiFi
- Comprueba que los servidores están corriendo (ver terminal)
- Prueba con `http://192.168.1.128:5173` primero (sin https) para verificar conectividad

### El certificado expiró
Los certificados de mkcert duran 2+ años. Para renovar:
```bash
cd /Users/daniel/projects/Inventario/backend
mkcert localhost 127.0.0.1 192.168.1.128 ::1
# Reinicia el servidor backend
```

---

## 🔐 Ventajas de mkcert

✅ **Confianza automática en tu Mac** - Sin advertencias en ningún navegador
✅ **Válido para localhost y tu IP local** - Funciona desde otros dispositivos
✅ **Válido 2+ años** - No caduca rápidamente
✅ **Fácil de compartir** - Una sola CA para todos tus proyectos
✅ **Seguro** - La CA solo funciona en tu red local

---

## 📝 Notas

- El certificado es válido hasta: **6 Mayo 2028**
- La CA solo está en tu Mac y los dispositivos donde la instales
- Es completamente seguro para desarrollo local
- No funciona para dominios públicos de internet (solo local)
