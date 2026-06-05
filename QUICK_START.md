# 🚀 Setup Rápido - Sistema de Login Huachipato

## Paso 1: Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto (junto a `package.json`):

```env
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/huachipato3"
JWT_SECRET="cambiar-esto-a-una-clave-segura-en-produccion"
```

## Paso 2: Ejecutar Migraciones

```bash
npx prisma migrate dev --name add-user-model
```

## Paso 3: Crear Usuario de Prueba

```bash
npx prisma db seed
```

**Credenciales de prueba:**
- Email: `admin@huachipato.cl`
- Contraseña: `admin123`

## Paso 4: Iniciar el Servidor

```bash
npm run dev
```

## Paso 5: Probar

1. Abre http://localhost:3000
2. Serás redirigido a http://localhost:3000/login
3. Usa las credenciales de prueba
4. ¡Listo! Ya estás autenticado

## 📁 Archivos Creados/Modificados

### Nuevos Archivos:
- ✅ `frontend/app/login/page.tsx` - Página de login
- ✅ `frontend/app/api/auth/jwt-utils.ts` - Utilidades JWT
- ✅ `frontend/app/api/auth/login/route.ts` - Endpoint de login
- ✅ `frontend/app/api/auth/me/route.ts` - Endpoint de usuario actual
- ✅ `frontend/app/api/auth/logout/route.ts` - Endpoint de logout
- ✅ `frontend/app/api/auth/register/route.ts` - Endpoint de registro
- ✅ `frontend/middleware.ts` - Protección de rutas
- ✅ `frontend/hooks/useAuth.ts` - Hook de autenticación
- ✅ `AUTH_SETUP.md` - Documentación completa
- ✅ `.env.example` - Template de variables

### Modificados:
- ✅ `prisma/schema.prisma` - Agregado modelo User
- ✅ `prisma/seed.ts` - Seed con usuario de prueba
- ✅ `frontend/components/Sidebar.tsx` - Agregado botón de logout
- ✅ `package.json` - Nuevas dependencias: next-auth, bcryptjs, jsonwebtoken

## 🔐 Características Implementadas

✅ Login con email y contraseña
✅ Hash de contraseñas con bcryptjs
✅ Tokens JWT con expiración
✅ Middleware que protege todas las rutas
✅ Página de login con diseño personalizado
✅ Gestión de sesiones en localStorage
✅ Hook useAuth para usar datos del usuario
✅ Botón de logout en Sidebar
✅ Endpoint de registro para nuevos usuarios
✅ Validación de tokens en endpoints

## 🔗 URLs Importantes

- **Login**: http://localhost:3000/login
- **Dashboard**: http://localhost:3000
- **Jugadores**: http://localhost:3000/jugadores
- **Ingesta**: http://localhost:3000/ingesta

## 📚 Documentación

Ver [AUTH_SETUP.md](./AUTH_SETUP.md) para documentación completa sobre:
- Endpoints de API
- Hook useAuth
- Flujo de autenticación
- Troubleshooting
- Recomendaciones de seguridad

## ⚠️ Importante

1. Cambia `JWT_SECRET` a una clave segura en producción
2. No commits `.env.local` (está en .gitignore)
3. Usa HTTPS en producción
4. Los tokens expiran en 24 horas

¡Listo! Tu sistema de autenticación está completamente funcional.
