import { listMetricsWithAverages } from "@/backend/api/metrics";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const segmentId = searchParams.get("segmentId");
  const playerId = searchParams.get("playerId");

  const parsedSessionId = sessionId ? parseInt(sessionId, 10) : undefined;
  const parsedPlayerId = playerId ? parseInt(playerId, 10) : undefined;

  const parsedSegmentId =
    segmentId === "null" || segmentId === ""
      ? null
      : segmentId
        ? parseInt(segmentId, 10)
        : undefined;

  const result = await listMetricsWithAverages({
    sessionId: parsedSessionId,
    segmentId: parsedSegmentId,
    playerId: parsedPlayerId,
  });

  return NextResponse.json(result);
}
