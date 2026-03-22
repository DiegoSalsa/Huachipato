# 📋 Estructura del Proyecto - Backend y Frontend Separados

## 🎯 Organización General

El proyecto está dividido en dos carpetas principales en la raíz:

```
huachipato-app/
├── frontend/          🎨 Interfaz de usuario (componentes, páginas, estilos)
├── backend/           ⚙️  Lógica de negocio (handlers, servicios)
├── prisma/            🗄️  Base de datos
└── public/            📦 Archivos estáticos
```

## 🎨 Frontend (`frontend/`)

Contiene toda la interfaz de usuario y componentes React.

### Estructura
```
frontend/
├── app/                    # Next.js App Router
│   ├── api/               # Routes API
│   ├── jugadores/         # Páginas de jugadores
│   ├── ingesta/           # Página de importación
│   ├── medico/            # Registros médicos
│   ├── rendimiento/       # Dashboard de rendimiento
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── components/             # Componentes reutilizables
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── PlayerCard.tsx
│   ├── RadarChart.tsx
│   ├── SegmentFilter.tsx
│   ├── StatCard.tsx
│   └── index.ts           # Re-exportaciones
│
└── lib/                    # Utilidades
    ├── db.ts             # Configuración Prisma
    ├── types.ts          # Tipos compartidos
    └── index.ts          # Re-exportaciones
```

### Rutas disponibles
```
GET    /                     Dashboard principal
GET    /jugadores            Listado de jugadores
GET    /jugadores/[id]       Detalle de jugador
GET    /ingesta              Importar datos
GET    /medico               Registros médicos
GET    /rendimiento          Dashboard de rendimiento
```

## ⚙️ Backend (`backend/`)

Contiene la lógica de negocio, handlers y servicios de API.

### Estructura
```
backend/
└── api/
    ├── players.ts          # Lógica de jugadores
    ├── sessions.ts         # Lógica de sesiones
    ├── metrics.ts          # Lógica de métricas
    ├── medical.ts          # Lógica de registros médicos
    ├── upload.ts           # Lógica de importación
    └── README.md
```

### Endpoints API
```
POST   /api/players              Crear jugador
GET    /api/players              Listar jugadores
GET    /api/players/[id]         Obtener jugador

POST   /api/sessions             Crear sesión
GET    /api/sessions             Listar sesiones
GET    /api/sessions/[id]        Obtener sesión

GET    /api/metrics              Listar métricas
POST   /api/metrics              Crear métrica

POST   /api/medical              Crear registro médico
GET    /api/medical              Listar registros médicos

POST   /api/upload               Importar datos (Excel)
```

## 🔄 Cómo Funcionan Juntos

```
1. Usuario interactúa con página (frontend/app/)
                    ↓
2. Componentes React renderizan UI (frontend/components/)
                    ↓
3. Página llama a endpoint API (frontend/app/api/*)
                    ↓
4. Route handler importa lógica (backend/api/*.ts)
                    ↓
5. Backend ejecuta lógica de negocio
                    ↓
6. Consulta a base de datos (Prisma)
                    ↓
7. Respuesta JSON al frontend
```

## 📁 Rutas de Imports

### Componentes
```typescript
// Opción 1: Importar específico
import Header from '@/components/Header';

// Opción 2: Desde el índice
import { Header, Sidebar } from '@/components';
```

### Librerías y Tipos
```typescript
// Opción 1: Importar específico
import { db } from '@/lib/db';
import type { Player } from '@/lib/types';

// Opción 2: Desde el índice
import { db } from '@/lib';
```

### Backend
```typescript
// Importar lógica del backend desde un Route Handler
import { getPlayers, createPlayer } from '@/backend/api/players';
```

## 🛠️ Mejores Prácticas

### Frontend (`frontend/`)
- ✅ Componentes React puros
- ✅ Hooks y estado local
- ✅ Llamadas a API endpoints
- ✅ Estilos con Tailwind CSS
- ❌ NO hacer lógica de BD

### Backend (`backend/api/`)
- ✅ Funciones de lógica de negocio
- ✅ Validaciones
- ✅ Consultas a Prisma
- ✅ Manejo de errores
- ❌ NO renderizar componentes React

### Route Handlers (`frontend/app/api/`)
- ✅ Importar funciones de `@/backend/api/`
- ✅ Parsear request/response
- ✅ Retornar JSON
- ✅ Mínima lógica propia

## 📝 Ejemplo de Implementación

### 1️⃣ Crear función en backend
**`backend/api/players.ts`**
```typescript
import { db } from '@/lib/db';

export async function getPlayers() {
  return await db.player.findMany();
}

export async function createPlayer(name: string) {
  return await db.player.create({
    data: { name }
  });
}
```

### 2️⃣ Usar en route handler
**`frontend/app/api/players/route.ts`**
```typescript
import { getPlayers, createPlayer } from '@/backend/api/players';

export async function GET() {
  const players = await getPlayers();
  return Response.json(players);
}

export async function POST(req: Request) {
  const { name } = await req.json();
  const player = await createPlayer(name);
  return Response.json(player);
}
```

### 3️⃣ Consumir desde componente
**`frontend/components/PlayerList.tsx`**
```typescript
'use client';
import { useEffect, useState } from 'react';

interface Player {
  id: number;
  name: string;
}

export default function PlayerList() {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    fetch('/api/players')
      .then(r => r.json())
      .then(data => setPlayers(data));
  }, []);

  return (
    <div>
      {players.map(player => (
        <div key={player.id}>{player.name}</div>
      ))}
    </div>
  );
}
```

## ✅ Configuración Completada

- ✅ `next.config.ts` - Apunta a `frontend/` como raíz
- ✅ `tsconfig.json` - Paths actualizados (`@/*` → `./frontend/*`)
- ✅ Carpetas `frontend/` y `backend/` creadas
- ✅ Re-exportaciones en `index.ts` para imports fáciles

## 🚀 Próximos Pasos

1. Actualizar imports en archivos existentes si es necesario
2. Implementar funciones de lógica en `backend/api/`
3. Crear route handlers en `frontend/app/api/`
4. Asegurar flujo datos: Componente → API Route → Backend → BD

### 📄 Páginas (`src/app/`)
Las páginas reales se ubican en `src/app/` (requerimiento de Next.js):

```
/                  Dashboard principal (src/app/page.tsx)
/jugadores         Gestión de jugadores (src/app/jugadores/page.tsx)
/jugadores/[id]    Detalle de jugador (src/app/jugadores/[id]/page.tsx)
/ingesta           Importar datos (src/app/ingesta/page.tsx)
/medico            Registros médicos (src/app/medico/page.tsx)
/rendimiento       Dashboard de rendimiento (src/app/rendimiento/page.tsx)
```

## 📦 Carpetas Compartidas

### `src/lib/` (re-exportaciones)
Mantiene compatibilidad con imports antiguos. Re-exporta desde `src/frontend/lib/`.

### `src/components/` (re-exportaciones)
Mantiene compatibilidad con imports antiguos. Re-exporta desde `src/frontend/components/`.

## 🔄 Flujo de Dependencias

```
Página (src/app/*.tsx)
    ↓
Componentes (src/frontend/components/)
    ↓
Tipos & DB (src/frontend/lib/)
    ↓
API Route (src/app/api/*)
    ↓
Handlers (src/backend/api/)
    ↓
Base de datos (Prisma)
```

## 💡 Mejores Prácticas

1. **Backend** (`src/backend/api/`)
   - Lógica de negocio
   - Validaciones
   - Consultas a BD
   - Manejo de errores

2. **Frontend** (`src/frontend/components/` y `lib/`)
   - Componentes React
   - Tipos TypeScript
   - Hooks personalizados
   - Utilidades de UI

3. **Rutas** (`src/app/api/` y `src/app/[route]`)
   - Solo importar y llamar funciones del backend
   - Mínima lógica propia

## ✅ Actualización de Imports

Al migrar código, usa los nuevos paths:

**Componentes:**
```typescript
// ❌ Antiguo
import Header from '../components/Header';

// ✅ Nuevo
import { Header } from '@/frontend/components';
```

**Librerías:**
```typescript
// ❌ Antiguo
import { db } from '@/lib/db';

// ✅ Nuevo
import { db } from '@/frontend/lib/db';
```

Los aliases antiguos en `src/components/` y `src/lib/` seguirán funcionando temporalmente para compatibilidad.
