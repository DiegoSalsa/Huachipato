# Huachipato - Sistema de Análisis de Rendimiento

Plataforma web para monitoreo y análisis de rendimiento de jugadores de fútbol. Permite gestionar datos de sesiones de entrenamiento, métricas de desempeño y registros médicos de forma centralizada.

## Características

✅ **Gestión de Jugadores** - Crear y organizar perfiles de jugadores por categoría  
✅ **Sesiones de Entrenamiento** - Registrar sesiones con análisis segmentado  
✅ **Métricas de Rendimiento** - Distancia total, velocidad máxima, sprints, aceleraciones, etc.  
✅ **Registros Médicos** - Peso, altura, composición corporal, pruebas de rendimiento  
✅ **Dashboard Interactivo** - Visualización de datos con gráficos y filtros  
✅ **Importar Datos** - Carga de información desde archivos Excel  

## Tecnologías

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Base de Datos:** SQLite
- **Otros:** XLSX (importación de datos)

## Instalación

### Requisitos
- Node.js 18+
- npm o yarn

### Setup

```bash
# Clonar repositorio
git clone <repository-url>
cd huachipato-app

# Instalar dependencias
npm install

# Configurar base de datos
npx prisma migrate dev
npx prisma db seed

# Variables de entorno
# Crear archivo .env.local con:
DATABASE_URL="file:./dev.db"
```

## Scripts

```bash
npm run dev      # Iniciar servidor de desarrollo (localhost:3000)
npm run build    # Construir para producción
npm start        # Ejecutar versión producción
npm run lint     # Validar código con ESLint
```

## Estructura del Proyecto

```
huachipato-app/
├── frontend/                     # 🎨 Frontend - UI e interfaz
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API Routes (importan lógica del backend)
│   │   │   ├── medical/route.ts
│   │   │   ├── metrics/route.ts
│   │   │   ├── players/route.ts
│   │   │   ├── sessions/route.ts
│   │   │   └── upload/route.ts
│   │   ├── jugadores/            # Páginas de gestión de jugadores
│   │   ├── ingesta/              # Página de importación de datos
│   │   ├── medico/               # Página de registros médicos
│   │   ├── rendimiento/          # Dashboard de rendimiento
│   │   ├── layout.tsx            # Layout principal
│   │   ├── page.tsx              # Página de inicio
│   │   └── globals.css
│   ├── components/               # Componentes React reutilizables
│   │   ├── Header.tsx
│   │   ├── PlayerCard.tsx
│   │   ├── RadarChart.tsx
│   │   ├── SegmentFilter.tsx
│   │   ├── Sidebar.tsx
│   │   ├── StatCard.tsx
│   │   └── index.ts
│   └── lib/                      # Utilidades del frontend
│       ├── db.ts                 # Configuración de Prisma
│       ├── types.ts              # Tipos TypeScript
│       └── index.ts
│
├── backend/                      # ⚙️ Backend - Lógica de negocio
│   └── api/                      # Handlers y servicios de API
│       ├── README.md
│       ├── players.ts            # Lógica de jugadores
│       ├── sessions.ts           # Lógica de sesiones
│       ├── metrics.ts            # Lógica de métricas
│       ├── medical.ts            # Lógica de registros médicos
│       └── upload.ts             # Lógica de importación
│
├── prisma/                       # 🗄️ Base de datos
│   ├── schema.prisma
│   └── seed.ts
│
├── public/                       # Archivos estáticos
├── next.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## Base de Datos

Modelos principales:
- **Player** - Información de jugadores
- **Session** - Sesiones de entrenamiento
- **Segment** - Segmentos dentro de sesiones
- **PlayerMetric** - Métricas de rendimiento
- **MedicalRecord** - Registros médicos y pruebas

## Uso

1. **Crear Jugadores** - Navegar a "Jugadores" y agregar nuevo jugador
2. **Registrar Sesiones** - En "Ingesta", importar datos desde archivo Excel
3. **Ver Rendimiento** - Consultar métricas en dashboard de rendimiento
4. **Registros Médicos** - Documentar evaluaciones en sección "Médico"

## Ejemplos de Imports

### Componentes
```typescript
// ✅ Importar desde frontend/components
import { Header, Sidebar } from '@/components';
// o
import Header from '@/components/Header';
```

### Librerías
```typescript
// ✅ Tipos desde frontend/lib
import type { Player } from '@/lib/types';

// ✅ Prisma desde backend/lib
import { prisma } from '@/backend/lib/db';
```

### Backend
```typescript
// ✅ Importar lógica del backend
import { listPlayers } from '@/backend/api/players';
```

## Licencia

Privado - Uso interno únicamente

