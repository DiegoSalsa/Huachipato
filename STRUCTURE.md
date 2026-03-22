# Estructura del Proyecto

## Objetivo
Separar claramente responsabilidades:
- `frontend/`: UI, rutas web y capa HTTP.
- `backend/`: logica de negocio y acceso a datos.

## Arbol principal

```text
huachipato-app/
|-- frontend/
|   |-- app/
|   |   |-- api/                # Route handlers de Next (capa HTTP)
|   |   |-- jugadores/
|   |   |-- ingesta/
|   |   |-- medico/
|   |   |-- rendimiento/
|   |   |-- layout.tsx
|   |   |-- page.tsx
|   |   `-- globals.css
|   |-- components/             # Componentes React reutilizables
|   `-- lib/                    # Tipos y utilidades de frontend
|
|-- backend/
|   |-- api/                    # Servicios de dominio (logica de negocio)
|   |   |-- medical.ts
|   |   |-- metrics.ts
|   |   |-- players.ts
|   |   |-- sessions.ts
|   |   `-- upload.ts
|   `-- lib/
|       `-- db.ts               # Cliente Prisma
|
|-- prisma/
|   |-- schema.prisma
|   `-- seed.ts
|-- public/
|-- package.json
|-- tsconfig.json
`-- README.md
```

## Regla de dependencias

```text
frontend/app/* (paginas y route handlers)
  -> backend/api/* (servicios)
  -> backend/lib/db.ts (Prisma)
  -> base de datos
```

## Responsabilidades por capa

### Frontend
- Renderizar UI.
- Consumir endpoints (`/api/*`).
- En `frontend/app/api/*`: parsear request y devolver response.
- No contener consultas Prisma directas.

### Backend
- Centralizar la logica de negocio.
- Validar entradas de dominio.
- Ejecutar operaciones de base de datos.
- Ser reutilizable desde cualquier route handler.

## Convencion de imports

```ts
// Route handlers -> backend
import { listPlayers } from "@/backend/api/players";

// Backend -> db
import { prisma } from "@/backend/lib/db";

// Frontend UI -> componentes/tipos
import { Header } from "@/components";
import type { PlayerSummary } from "@/lib/types";
```

## Checklist rapido
- Si un archivo usa Prisma/XLSX para persistencia, debe vivir en `backend/`.
- Si un archivo devuelve `NextResponse` o lee `NextRequest`, debe vivir en `frontend/app/api/`.
- Si un cambio de negocio afecta varios endpoints, se implementa una vez en `backend/api/*`.
