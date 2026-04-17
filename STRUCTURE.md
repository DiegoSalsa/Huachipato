# Estructura del Proyecto — Huachipato ACWR Monitor

## Objetivo

Separar responsabilidades:
- `frontend/`: UI, páginas, route handlers HTTP.
- `backend/`: lógica de negocio, servicios, acceso a datos.
- `prisma/`: esquema de BD y seed.

## Árbol principal

```text
huachipato-app/
├── backend/
│   ├── api/                         # Servicios de dominio (lógica de negocio)
│   │   ├── players.ts               # CRUD de jugadores
│   │   └── upload.ts                # Parseo CSV/Excel (diario + semanal)
│   ├── lib/                         # Utilidades compartidas
│   │   ├── db.ts                    # Cliente Prisma (singleton)
│   │   └── utils.ts                 # normalizeName, parseFloat/Int, cleanNumeric
│   └── services/                    # Servicios de cálculo
│       ├── acwr.ts                  # Motor ACWR (ratios, semáforo, riesgo)
│       └── weekly-aggregator.ts     # Agregador diario → semanal
│
├── frontend/
│   ├── app/
│   │   ├── api/                     # Route Handlers (capa HTTP)
│   │   │   ├── acwr/route.ts        # GET /api/acwr
│   │   │   ├── players/route.ts     # GET|POST /api/players
│   │   │   └── upload/route.ts      # POST /api/upload
│   │   ├── ingesta/page.tsx         # Página de ingesta (diario + semanal)
│   │   ├── jugadores/page.tsx       # Página de jugadores
│   │   ├── page.tsx                 # Dashboard ACWR (página principal)
│   │   ├── layout.tsx               # Layout raíz
│   │   └── globals.css              # Estilos globales + Tailwind
│   └── components/                  # Componentes React reutilizables
│       ├── AcwrBadge.tsx            # Badge de riesgo (semáforo 4 colores)
│       └── Sidebar.tsx              # Navegación lateral + móvil
│
├── prisma/
│   ├── schema.prisma                # Esquema PostgreSQL (players, gps, weekly)
│   └── seed.ts                      # Seed de limpieza (borra todo, resetea IDs)
│
├── .env                             # DATABASE_URL
├── package.json
├── tsconfig.json
└── next.config.ts
```

## Regla de dependencias

```text
frontend/app/page.tsx (UI)
  → fetch("/api/acwr")
    → frontend/app/api/acwr/route.ts (HTTP)
      → backend/services/acwr.ts (lógica)
        → backend/lib/db.ts (Prisma)
          → PostgreSQL (huachipato3)
```

## Responsabilidades por capa

### `backend/lib/`
- **db.ts**: Singleton de PrismaClient (hot-reload safe).
- **utils.ts**: Funciones puras reutilizables (normalización, parsing).

### `backend/api/`
- Lógica de negocio independiente del framework HTTP.
- Validación de dominio.
- Operaciones de base de datos.

### `backend/services/`
- Cálculos complejos (ACWR, agregación semanal).
- No dependen del framework HTTP.

### `frontend/app/api/`
- Route Handlers de Next.js (parsean request → llaman backend → devuelven response).
- NO contienen lógica de negocio.

### `frontend/components/`
- Componentes React reutilizables.
- Solo UI, sin lógica de datos.

## Convención de imports

```ts
// Route handlers → backend
import { listPlayers } from "@/backend/api/players";
import { computeAllPlayersACWR } from "@/backend/services/acwr";

// Backend → db + utils
import { prisma } from "@/backend/lib/db";
import { normalizeName, parseFloatSafe } from "@/backend/lib/utils";

// Frontend UI → componentes
import Sidebar from "@/components/Sidebar";
import AcwrBadge from "@/components/AcwrBadge";
```

## Checklist rápido

- ✅ Si usa Prisma/XLSX → vive en `backend/`
- ✅ Si devuelve `NextResponse` → vive en `frontend/app/api/`
- ✅ Si es UI React → vive en `frontend/components/` o `frontend/app/`
- ✅ Si es una función pura reutilizable → vive en `backend/lib/utils.ts`
