# Sistema de Login y Protección de Rutas - Huachipato Analytics

## Descripción General

Se ha implementado un sistema completo de autenticación y autorización con las siguientes características:

✅ **Login con Email y Contraseña**
✅ **Protección de Rutas con Middleware**
✅ **Tokens JWT para autenticación stateless**
✅ **Hash de contraseñas con bcryptjs**
✅ **Interfaz de login personalizada (diseño proporcionado)**
✅ **Gestión de sesiones en localStorage**
✅ **Botón de logout en Sidebar**

---

## Configuración Required

### 1. Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con lo siguiente:

```env
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/huachipato3"
JWT_SECRET="tu-clave-secreta-cambiar-en-produccion"
```

**JWT_SECRET**: Cambiar a una clave segura en producción.

### 2. Migraciones de Prisma

Ejecuta las migraciones para crear las tablas:

```bash
npx prisma migrate dev --name add-user-model
```

### 3. Seed de Base de Datos

Crea un usuario de prueba:

```bash
npx prisma db seed
```

Credenciales de prueba:
- **Email**: `admin@huachipato.cl`
- **Contraseña**: `admin123`

---

## Flujo de Autenticación

### Página de Login (`/login`)

1. Usuario ingresa email y contraseña
2. Se envía POST a `/api/auth/login`
3. Backend valida credenciales y retorna JWT
4. Token se almacena en `localStorage`
5. Usuario es redirigido a `/jugadores`

### Protección de Rutas

El middleware (`frontend/middleware.ts`) protege todas las rutas excepto `/login`:

- ✅ Rutas públicas: `/login`, `/api/auth/login`
- 🔐 Rutas protegidas: `/`, `/jugadores`, `/ingesta`, `/api/*` (excepto login/register)
- Sin token → Redirige a `/login`
- Token inválido → Redirige a `/login`

### Logout

1. Click en botón "Cerrar Sesión" en Sidebar
2. Token se elimina del `localStorage`
3. Usuario es redirigido a `/login`

---

## Endpoints de API

### 1. POST `/api/auth/login`
Login de usuario
```json
{
  "email": "admin@huachipato.cl",
  "password": "admin123"
}
```

Respuesta:
```json
{
  "message": "Inicio de sesión exitoso",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "admin@huachipato.cl",
    "name": "Administrador",
    "role": "admin"
  }
}
```

### 2. POST `/api/auth/register`
Registrar nuevo usuario
```json
{
  "email": "usuario@huachipato.cl",
  "password": "contraseña123",
  "name": "Nombre del Usuario",
  "role": "user"
}
```

### 3. GET `/api/auth/me`
Obtener usuario actual (requiere header `Authorization: Bearer <token>`)

### 4. POST `/api/auth/logout`
Logout (requiere header `Authorization: Bearer <token>`)

---

## Hook useAuth

Para usar el usuario actual en componentes:

```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';

export default function MiComponente() {
  const { user, loading, logout, isAuthenticated } = useAuth();

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <p>Bienvenido, {user?.name}</p>
      <button onClick={logout}>Cerrar Sesión</button>
    </div>
  );
}
```

---

## Estructura de Archivos

```
frontend/
├── app/
│   ├── login/
│   │   └── page.tsx              # Página de login
│   ├── api/auth/
│   │   ├── jwt-utils.ts          # Utilidades JWT
│   │   ├── login/route.ts        # POST /api/auth/login
│   │   ├── register/route.ts     # POST /api/auth/register
│   │   ├── me/route.ts           # GET /api/auth/me
│   │   └── logout/route.ts       # POST /api/auth/logout
│   └── ...
├── hooks/
│   └── useAuth.ts                # Hook para autenticación
├── components/
│   └── Sidebar.tsx               # Actualizado con logout
├── middleware.ts                 # Protección de rutas
└── ...

prisma/
├── schema.prisma                 # Schema con modelo User
└── seed.ts                       # Seed con usuario de prueba
```

---

## Flujo Completo - Ejemplo

### Usuario Nuevo

1. Accede a `/` → Middleware redirige a `/login` (sin token)
2. Ingresa email y contraseña → POST `/api/auth/login`
3. Backend valida → Retorna JWT
4. Frontend guarda token en localStorage
5. Redirige a `/jugadores`
6. Usuario ve Sidebar con su nombre y botón de logout
7. Click en logout → Token eliminado → Redirige a `/login`

### Usuario Regresando

1. Si token existe en localStorage → Hook useAuth lo valida
2. Si token válido → Muestra contenido
3. Si token expirado → Redirige a `/login`

---

## Seguridad

✅ Contraseñas hasheadas con bcryptjs (salt rounds: 10)
✅ JWT con expiración de 24 horas
✅ Tokens almacenados en localStorage (client-side)
✅ Middleware protege rutas en servidor
✅ Validación de email único
✅ Headers Authorization en peticiones

### Recomendaciones para Producción

- [ ] Cambiar `JWT_SECRET` a una clave fuerte
- [ ] Usar HTTPS siempre
- [ ] Implementar refresh tokens
- [ ] Agregar rate limiting en login
- [ ] Implementar email verification
- [ ] Agregar MFA (autenticación de dos factores)
- [ ] Usar httpOnly cookies en lugar de localStorage

---

## Troubleshooting

### "Token no proporcionado"
- Verifica que el header `Authorization: Bearer <token>` esté presente
- Comprueba que el token no haya expirado (24 horas)

### "Credenciales inválidas"
- Verifica email y contraseña
- Asegúrate de que el usuario existe en la BD

### "Usuario no encontrado"
- Ejecuta `npx prisma db seed` para crear usuario de prueba
- O registra un nuevo usuario en `/api/auth/register`

### Middleware no protege rutas
- Verifica que `frontend/middleware.ts` existe
- Reinicia el servidor de desarrollo
- Comprueba la configuración de `matcher` en el middleware

---

## Próximas Mejoras

- [ ] Refresh tokens
- [ ] Recuperación de contraseña
- [ ] Verificación de email
- [ ] Roles y permisos más granulares
- [ ] Auditoría de login
- [ ] Integración con OAuth (Google, GitHub)

---

## Soporte

Para más información sobre:
- **Next.js Auth**: https://nextjs.org/docs/app/building-your-application/authentication
- **Prisma**: https://www.prisma.io/docs/
- **bcryptjs**: https://github.com/dcodeIO/bcrypt.js
- **jsonwebtoken**: https://github.com/auth0/node-jsonwebtoken
