// Shared types for API responses

export interface PlayerSummary {
  id: number;
  name: string;
  position: string;
  number: number | null;
  category: string;
  imageUrl: string;
}

export interface PlayerWithMetrics extends PlayerSummary {
  latestMetric: MetricData | null;
  medicalRecords: MedicalData[];
}

export interface SessionSummary {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  totalPlayers: number;
  fileName: string;
  segments: SegmentSummary[];
}

export interface SegmentSummary {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  duration: string;
}

export interface MetricData {
  id: number;
  playerId: number;
  sessionId: number;
  segmentId: number | null;
  totalDistance: number;
  dMin: number;
  maxSpeed: number;
  hsr: number;
  distZ5: number;
  distZ6: number;
  sprintCount: number;
  sprintDist: number;
  acc: number;
  dec: number;
  playerName?: string;
  segmentName?: string;
}

export interface MedicalData {
  id: number;
  playerId: number;
  date: string;
  weight: number | null;
  height: number | null;
  fatPct: number | null;
  musclePct: number | null;
  jumpCMJ: number | null;
  sprint10m: number | null;
  status: string;
  notes: string;
}

export interface DashboardData {
  session: SessionSummary | null;
  players: (PlayerSummary & { metric: MetricData | null; status: "optimal" | "warning" | "danger" })[];
  averages: MetricAverages;
}

export interface MetricAverages {
  totalDistance: number;
  dMin: number;
  maxSpeed: number;
  hsr: number;
  distZ6: number;
  acc: number;
  dec: number;
}
