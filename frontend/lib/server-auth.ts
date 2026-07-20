import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/app/api/auth/jwt-utils";
import { isSquad, type Squad } from "@/lib/squads";

export type AppRole = "medico" | "gps" | "admin";

export interface RequestContext {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: AppRole;
    squad: Squad;
  };
  squad: Squad;
}

export async function getRequestContext(
  request: NextRequest,
  allowedRoles?: AppRole[],
): Promise<RequestContext | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, role: true, squad: true, status: true },
  });

  if (!user || user.status !== "ACTIVE" || !["medico", "gps", "admin"].includes(user.role)) return null;
  const role = user.role as AppRole;
  if (allowedRoles && !allowedRoles.includes(role)) return null;

  const requestedSquad = request.cookies.get("active_squad")?.value;
  const squad = role === "admin" && isSquad(requestedSquad)
    ? requestedSquad
    : (user.squad as Squad);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role,
      squad: user.squad as Squad,
    },
    squad,
  };
}

export function unauthorized() {
  return NextResponse.json(
    { error: "No autorizado para acceder a esta información" },
    { status: 401 },
  );
}
