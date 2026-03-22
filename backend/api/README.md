# Backend API Services

Esta carpeta contiene servicios de negocio. No exponen HTTP directamente.

## Modulos
- `players.ts`: consultas de jugadores y detalle por id.
- `sessions.ts`: consultas de sesiones y detalle por id.
- `metrics.ts`: filtros y agregaciones de metricas.
- `medical.ts`: listado y creacion de registros medicos.
- `upload.ts`: procesamiento de planillas Excel e importacion de datos.

## Uso desde route handlers

```ts
import { listPlayers } from "@/backend/api/players";
import { NextResponse } from "next/server";

export async function GET() {
  const players = await listPlayers();
  return NextResponse.json(players);
}
```

## Regla
Los archivos de `frontend/app/api/*` deben actuar solo como adaptadores HTTP y delegar toda logica a estos servicios.
