# Inventario - Sistema de Gestión de Almacén

Sistema de inventario con captura de fotos desde móvil y clasificación automática con YOLO.

## 🎯 Características

- **PWA (Progressive Web App)**: Instalable en iPhone/Android sin necesidad de App Store
- **Captura de fotos**: Acceso directo a la cámara del móvil
- **Organización jerárquica**: Estanterías → Baldas → Cajas → Items
- **Clasificación automática**: Pre-clasificación con YOLO (opcional)
- **Revisión manual**: Segunda pasada desde el navegador para validar/corregir
- **Búsqueda y filtros**: Encuentra rápidamente cualquier item
- **Offline-ready**: Funciona sin conexión (PWA)

## 📁 Estructura del Proyecto

```
Inventario/
├── frontend/          # React + Vite (PWA)
├── backend/           # Node.js + Express + SQLite
├── yolo-service/      # Python + FastAPI + YOLO (opcional)
└── package.json       # Monorepo config
```

## 🚀 Instalación Rápida

### 1. Instalar dependencias

```bash
npm install
```

### 2. Iniciar en desarrollo

```bash
npm run dev
```

Esto iniciará:
- Frontend en http://localhost:5173
- Backend en http://localhost:3001

### 3. Acceder desde el móvil

Para acceder desde tu iPhone en la misma red WiFi:

1. Obtén la IP de tu ordenador: `ifconfig | grep "inet " | grep -v 127.0.0.1`
2. Abre en Safari: `http://TU_IP:5173`
3. Toca "Compartir" → "Añadir a pantalla de inicio"

## 📱 Uso desde iPhone

1. **Abre la app** desde el icono en la pantalla de inicio
2. **Selecciona ubicación**: Estantería → Balda → Caja
3. **Captura fotos** de cada item
4. **Los items se guardan** automáticamente como "pendientes de revisión"

## 💻 Uso desde Browser (Revisión)

1. Abre http://localhost:5173 en tu ordenador
2. Ve a "Revisar clasificaciones"
3. Para cada item:
   - Verifica/corrige el nombre
   - Asigna una categoría
   - Aprueba o elimina

## 🤖 Clasificación con YOLO (Opcional)

El servicio YOLO permite pre-clasificar automáticamente las imágenes.

### Instalación

```bash
cd yolo-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Ejecución

```bash
python main.py
```

El servicio estará en http://localhost:8000

### Modelos disponibles

- `yolov8n.pt` - Nano (rápido, menos preciso) - **Por defecto**
- `yolov8s.pt` - Small
- `yolov8m.pt` - Medium
- `yolov8l.pt` - Large (lento, más preciso)

## 🛠️ API Endpoints

### Backend (Node.js)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/stats` | Estadísticas generales |
| GET | `/api/ubicaciones/estanterias` | Listar estanterías |
| GET | `/api/ubicaciones/arbol` | Árbol completo de ubicaciones |
| GET | `/api/items` | Listar items (con filtros) |
| GET | `/api/items/pendientes` | Items sin revisar |
| POST | `/api/fotos/captura` | Capturar item + foto |
| PATCH | `/api/items/:id/revisar` | Marcar como revisado |

### YOLO Service (Python)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/health` | Estado del servicio |
| POST | `/classify` | Clasificar imagen |
| GET | `/classes` | Clases disponibles |

## 📦 Producción

### Build

```bash
npm run build
```

### Ejecutar

```bash
NODE_ENV=production npm start
```

El frontend se servirá desde el backend en http://localhost:3001

## 🔧 Configuración

### Variables de entorno

```bash
# Backend
PORT=3001                              # Puerto del servidor
NODE_ENV=production                    # Modo producción

# YOLO Service
YOLO_MODEL=yolov8n.pt                 # Modelo a usar
YOLO_SERVICE_URL=http://localhost:8000 # URL del servicio YOLO
```

## 📋 Base de Datos

SQLite con las siguientes tablas:

- `estanterias` - Ubicaciones principales
- `baldas` - Niveles dentro de cada estantería
- `cajas` - Contenedores en cada balda
- `items` - Objetos inventariados
- `fotos` - Imágenes de cada item
- `categorias` - Categorías personalizadas

Los datos se guardan en `backend/data/inventario.db`

## 🐛 Solución de Problemas

### La cámara no funciona en iPhone

- Asegúrate de acceder por HTTPS o localhost
- Permite el acceso a la cámara cuando Safari lo solicite
- Recarga la página si cambias los permisos

### El servicio YOLO es lento

- Usa un modelo más pequeño: `YOLO_MODEL=yolov8n.pt`
- La primera inferencia es más lenta (carga del modelo)

### No puedo acceder desde el móvil

- Verifica que estés en la misma red WiFi
- Comprueba que el firewall permita conexiones al puerto 5173
- En Mac: Preferencias del Sistema → Seguridad → Firewall

## 📄 Licencia

MIT
