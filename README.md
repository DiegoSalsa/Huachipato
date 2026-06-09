# Huachipato - Sistema de Analisis de Rendimiento Deportivo

Plataforma web desarrollada para el Club Deportivo Huachipato que permite monitorear y analizar el rendimiento fisico de los jugadores del plantel profesional. El sistema centraliza la ingesta de datos GPS de entrenamientos, calcula automaticamente los indices de carga aguda y cronica (ACS), y gestiona fichas clinicas del cuerpo medico.

Proyecto desarrollado como Practica Profesional II.

---

## Funcionalidades

### Monitor ACS (Agudo:Cronico Semanal)
- Calculo automatico del ratio de carga aguda vs cronica por jugador
- Semaforo de riesgo de lesion en cuatro niveles: Bajo, Optimo, Cuidado y Alto Riesgo
- Periodos de calculo configurables a 28 o 21 dias
- Selector de semana para consultar datos historicos
- Generacion de reportes PDF con identidad visual del club

### Gestion de Jugadores
- Alta de jugadores con asignacion de posicion
- Perfil individual con graficos de evolucion historica del ACS
- Cambio de posicion desde el perfil del jugador
- Carga de foto de perfil

### Ingesta de Datos GPS
- Carga de archivos CSV y Excel con datos de sesiones de entrenamiento
- Procesamiento automatico: calculo de reportes diarios, estadisticas semanales y ratios ACS
- Vista previa de los datos antes de confirmar la carga

### Panel Medico
- Listado del plantel con estado de salud actual (Sano / Lesionado)
- Registro de lesiones con tipo, gravedad, fecha y dias estimados de recuperacion
- Ficha clinica deslizable con historial de lesiones y contexto ACS del jugador
- Filtros por estado de salud

### Resumen Diario y Semanal
- Vista consolidada de metricas GPS del dia seleccionado
- Acumulado semanal con dias de actividad por jugador
- KPIs agregados del plantel

---

## Stack Tecnologico

| Capa | Tecnologia |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| Frontend | React 19, TypeScript |
| Estilos | Tailwind CSS v4 |
| Base de datos | PostgreSQL (Supabase) |
| ORM | Prisma 6 |
| Autenticacion | JWT con bcrypt |
| Reportes PDF | jsPDF + jspdf-autotable |
| Iconos | Material Symbols, Lucide React |
| Fuentes | Manrope (via next/font) |

---

## Requisitos

- Node.js 18 o superior
- npm
- PostgreSQL (o cuenta en Supabase)

---

## Instalacion

```bash
# Clonar repositorio
git clone https://github.com/DiegoSalsa/Huachipato.git
cd Huachipato/huachipato-app

# Instalar dependencias
npm install

# Configurar variables de entorno
# Crear archivo .env con las siguientes variables:
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
JWT_SECRET="clave-secreta"

# Generar cliente Prisma y aplicar migraciones
npx prisma generate
npx prisma migrate dev

# Crear usuario administrador
node create-user.js

# Iniciar servidor de desarrollo
npm run dev
```

La aplicacion estara disponible en `http://localhost:3000`.

---

## Scripts

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Compila para produccion |
| `npm start` | Ejecuta la version compilada |
| `npm run lint` | Valida el codigo con ESLint |

---

## Estructura del Proyecto

```
huachipato-app/
├── frontend/
│   ├── app/
│   │   ├── (auth)/              Paginas protegidas (dashboard, jugadores, medico, etc.)
│   │   ├── api/                 API Routes
│   │   │   ├── acwr/            Calculo de ratios ACS
│   │   │   ├── players/         CRUD de jugadores
│   │   │   ├── medico/          Lesiones y fichas clinicas
│   │   │   ├── overview/        Resumen diario y semanal
│   │   │   └── upload/          Ingesta de archivos GPS
│   │   ├── login/               Pagina de inicio de sesion
│   │   ├── layout.tsx           Layout raiz con optimizacion de fuentes
│   │   └── globals.css          Estilos globales y tema
│   ├── components/              Componentes reutilizables
│   │   ├── Sidebar.tsx          Navegacion lateral y barra inferior movil
│   │   ├── AcwrBadge.tsx        Badge de semaforo de riesgo
│   │   ├── ClinicalFileSlideOver.tsx  Ficha clinica deslizable
│   │   ├── HuachipatoLoader.tsx Indicador de carga con logo del club
│   │   └── ProtectedLayout.tsx  Wrapper de autenticacion
│   └── lib/
│       ├── services/
│       │   ├── acwr.ts          Motor de calculo ACS
│       │   ├── weekly-aggregator.ts  Agregador de estadisticas semanales
│       │   └── daily-weekly-overview.ts  Resumen diario y semanal
│       ├── report-generator.ts  Generador de reportes PDF
│       └── prisma.ts            Cliente Prisma
├── prisma/
│   └── schema.prisma            Modelos de datos
├── public/
│   └── huachipato-logo.png      Logo del club
└── package.json
```

---

## Modelos de Datos

| Modelo | Descripcion |
|--------|-------------|
| User | Usuarios del sistema con roles y autenticacion |
| Player | Jugadores del plantel con posicion y foto |
| GpsDailySession | Sesiones GPS individuales por dia |
| GpsDailyReport | Reporte consolidado diario por jugador |
| WeeklyStat | Estadisticas semanales agregadas |
| Injury | Registro de lesiones con tipo, gravedad y estado |

---

## Uso

1. Iniciar sesion con las credenciales del usuario creado
2. Navegar a Ingesta de Datos y subir un archivo CSV o Excel con datos GPS
3. El sistema procesa automaticamente los datos y calcula los ratios ACS
4. Consultar el Monitor ACS para ver el estado del plantel
5. Acceder al perfil de cada jugador para ver su evolucion historica
6. Utilizar el Panel Medico para registrar y consultar lesiones
7. Descargar reportes PDF desde el Monitor ACS

---

## Licencia

Proyecto privado. Uso exclusivo del Club Deportivo Huachipato.
