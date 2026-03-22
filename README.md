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
src/
├── app/
│   ├── api/              # API Routes (jugadores, sesiones, métricas, medico)
│   ├── jugadores/        # Gestión de jugadores
│   ├── ingesta/          # Importación de datos
│   ├── medico/           # Registros médicos
│   ├── rendimiento/      # Dashboard de rendimiento
│   └── layout.tsx        # Layout principal
├── components/           # Componentes React reutilizables
│   ├── Sidebar.tsx
│   ├── PlayerCard.tsx
│   ├── RadarChart.tsx
│   └── SegmentFilter.tsx
└── lib/
    ├── db.ts            # Configuración de Prisma
    └── types.ts         # Tipos TypeScript
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

## Licencia

Privado - Uso interno únicamente
