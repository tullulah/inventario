# Sistema de Autenticación

## Credenciales por defecto

**Usuario:** `admin`  
**Contraseña:** `admin123`

⚠️ **IMPORTANTE:** Cambia la contraseña inmediatamente después del primer login.

## Cambiar contraseña

1. Inicia sesión con las credenciales por defecto
2. Ve a **Ajustes** (última opción del menú inferior)
3. Haz clic en la pestaña **Cuenta**
4. Haz clic en **Cambiar contraseña**
5. Introduce tu contraseña actual y la nueva
6. Guarda los cambios

## Seguridad

- Las contraseñas están hasheadas con bcrypt
- Los tokens JWT expiran en 7 días
- Todas las rutas API están protegidas excepto `/api/auth/login`
- El token se guarda en localStorage

## Variables de entorno

Puedes cambiar el secret de JWT creando un archivo `.env` en `backend/`:

```env
JWT_SECRET=tu-secret-super-seguro-aqui
```

## Cerrar sesión

Puedes cerrar sesión desde **Ajustes → Cuenta → Cerrar sesión**
