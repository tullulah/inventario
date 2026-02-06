# Inventario - Sistema de Gestión

## 🔒 Configuración HTTPS

### Backend
El servidor ya está configurado para usar HTTPS. Los certificados fueron generados automáticamente.

Para acceder:
- HTTP: http://localhost:3001
- **HTTPS: https://localhost:3443** (recomendado)

### Frontend
El frontend usa Vite con SSL básico.

Para acceder:
- **HTTPS: https://localhost:5173** (recomendado)

### ⚠️ Certificado Autofirmado

Los certificados son autofirmados, por lo que el navegador mostrará una advertencia de seguridad.

**Para aceptar el certificado:**

1. **Chrome/Edge:**
   - Click en "Avanzado" o "Advanced"
   - Click en "Continuar a localhost (no seguro)" o "Proceed to localhost (unsafe)"

2. **Firefox:**
   - Click en "Avanzado" o "Advanced"
   - Click en "Aceptar el riesgo y continuar" o "Accept the Risk and Continue"

3. **Safari:**
   - Click en "Mostrar detalles"
   - Click en "visitar este sitio web"

### 📱 En dispositivos móviles (misma red WiFi)

1. Averigua tu IP local:
   ```bash
   # En Mac/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # En Windows
   ipconfig
   ```

2. Accede desde el móvil usando tu IP:
   - Frontend: https://TU_IP:5173
   - Backend: https://TU_IP:3443

3. Acepta el certificado en el móvil de la misma manera

## 🧭 Navegación con Breadcrumb

Ahora todas las páginas (excepto el inicio) muestran un breadcrumb en la parte superior que indica dónde estás y te permite navegar hacia atrás fácilmente.

Ejemplo: `Inicio > Ubicaciones > Caja #12`

## 🚀 Inicio Rápido

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

Luego abre: **https://localhost:5173**

## 📋 Características

- ✅ Sistema de ubicaciones (estanterías → baldas → cajas)
- ✅ Gestión de items con fotos
- ✅ Impresión de etiquetas con QR codes
- ✅ Cola de impresión para hojas A4 (8 etiquetas de 105×74mm)
- ✅ Breadcrumb de navegación
- ✅ HTTPS para acceso seguro desde móviles
