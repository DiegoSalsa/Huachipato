import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Real data from STATSports PDF — Session March 14, 2026
const PLAYERS = [
  { name: "R Caroca", position: "Defensa Central" },
  { name: "N Vargas", position: "Lateral Izquierdo" },
  { name: "N Carcamo", position: "Volante Central" },
  { name: "Mellado", position: "Mediocampista" },
  { name: "Malanca", position: "Mediocampista" },
  { name: "M Leon", position: "Mediocampista" },
  { name: "M Briceño", position: "Defensa Central" },
  { name: "L Velasquez", position: "Mediocampista" },
  { name: "L Altamirano", position: "Lateral Derecho" },
  { name: "K Altez", position: "Defensa Central" },
  { name: "J Figueroa", position: "Volante Central" },
  { name: "H Antiñirre", position: "Mediocampista" },
  { name: "Guaiquil", position: "Delantero" },
  { name: "E Cañete", position: "Extremo Izquierdo" },
  { name: "C Toro", position: "Extremo Derecho" },
  { name: "C Herrera", position: "Defensa Central" },
  { name: "Arriagada", position: "Lateral Derecho" },
  { name: "Ampuero", position: "Extremo Izquierdo" },
  { name: "Cris Martinez", position: "Delantero" },
  { name: "Torres", position: "Volante Central" },
  { name: "Sepulveda", position: "Mediocampista" },
  { name: "S Silva", position: "Mediocampista" },
  { name: "Rodriguez", position: "Delantero" },
];

// Entire Session metrics — [dist, dMin, maxSpd, hsr, distZ5, distZ6, sprCount, sprDist, acc, dec]
const ENTIRE_SESSION: Record<string, number[]> = {
  "R Caroca":      [4248, 56, 23.51, 93, 93, 16, 0, 0, 51, 32],
  "N Vargas":      [3662, 48, 25.44, 66, 66, 3, 0, 0, 63, 23],
  "N Carcamo":     [4932, 65, 25.59, 39, 39, 0, 0, 0, 52, 58],
  "Mellado":       [4153, 55, 27.22, 59, 59, 0, 1, 13, 80, 48],
  "Malanca":       [4393, 57, 26.51, 168, 168, 0, 0, 0, 60, 28],
  "M Leon":        [4563, 60, 25.68, 42, 42, 0, 0, 0, 56, 53],
  "M Briceño":     [4331, 57, 26.77, 108, 108, 19, 0, 0, 41, 31],
  "L Velasquez":   [5537, 73, 29.38, 85, 85, 0, 1, 0, 83, 47],
  "L Altamirano":  [3605, 47, 25.92, 51, 51, 0, 0, 0, 42, 27],
  "K Altez":       [5138, 68, 27.10, 26, 26, 0, 0, 0, 56, 58],
  "J Figueroa":    [4805, 63, 24.04, 93, 93, 10, 0, 0, 50, 31],
  "H Antiñirre":   [4838, 64, 26.87, 66, 66, 0, 0, 0, 54, 63],
  "Guaiquil":      [3995, 53, 25.77, 39, 39, 0, 0, 0, 52, 42],
  "E Cañete":      [4256, 56, 9.05, 59, 59, 0, 0, 0, 50, 24],
  "C Toro":        [4398, 58, 26.25, 168, 168, 0, 4, 99, 75, 36],
  "C Herrera":     [4516, 60, 27.22, 42, 42, 3, 0, 0, 52, 63],
  "Arriagada":     [4821, 64, 25.77, 108, 108, 5, 0, 0, 78, 35],
  "Ampuero":       [5123, 68, 24.43, 150, 150, 13, 0, 0, 56, 55],
  "Cris Martinez": [5201, 69, 25.34, 86, 86, 0, 1, 0, 28, 0],
  "Torres":        [3765, 50, 25.77, 108, 108, 0, 0, 0, 37, 25],
  "Sepulveda":     [3894, 51, 25.43, 42, 42, 0, 1, 0, 32, 16],
  "S Silva":       [5201, 69, 26.88, 168, 168, 0, 0, 0, 63, 32],
  "Rodriguez":     [4339, 57, 25.34, 59, 59, 0, 1, 0, 51, 32],
};

// Rondo metrics
const RONDO: Record<string, number[]> = {
  "R Caroca":      [1071, 53, 23.51, 22, 22, 0, 0, 0, 16, 6],
  "N Vargas":      [899, 44, 20.97, 15, 15, 0, 0, 0, 29, 2],
  "N Carcamo":     [1007, 49, 25.59, 52, 52, 0, 0, 0, 22, 11],
  "Mellado":       [1178, 58, 27.22, 10, 10, 0, 0, 0, 26, 1],
  "Malanca":       [1090, 53, 21.49, 49, 49, 0, 0, 0, 16, 6],
  "M Leon":        [1184, 58, 24.81, 53, 53, 0, 0, 0, 7, 7],
  "M Briceño":     [988, 48, 22.09, 11, 11, 0, 0, 0, 19, 1],
  "L Velasquez":   [1339, 66, 26.26, 53, 53, 0, 0, 0, 21, 9],
  "L Altamirano":  [909, 45, 21.41, 9, 9, 0, 0, 0, 24, 4],
  "K Altez":       [1132, 56, 24.27, 34, 34, 0, 0, 0, 17, 7],
  "J Figueroa":    [1106, 54, 23.52, 47, 47, 0, 0, 0, 23, 15],
  "H Antiñirre":   [1395, 68, 26.87, 55, 55, 0, 0, 0, 15, 0],
  "Guaiquil":      [1048, 51, 22.95, 31, 31, 6, 0, 0, 14, 0],
  "E Cañete":      [1298, 64, 9.05, 15, 15, 6, 0, 0, 20, 0],
  "C Toro":        [1130, 55, 22.88, 39, 39, 0, 1, 0, 14, 4],
  "C Herrera":     [1071, 53, 26.43, 26, 26, 0, 0, 0, 0, 0],
  "Arriagada":     [1118, 55, 24.37, 27, 27, 5, 0, 0, 23, 0],
  "Ampuero":       [1338, 66, 22.37, 62, 62, 0, 0, 0, 0, 0],
  "Cris Martinez": [1321, 65, 25.34, 40, 40, 0, 1, 0, 6, 5],
  "Torres":        [963, 47, 24.19, 19, 19, 0, 0, 0, 15, 10],
  "Sepulveda":     [1016, 50, 25.43, 40, 40, 0, 1, 0, 23, 6],
  "S Silva":       [1321, 65, 26.88, 64, 64, 0, 0, 0, 26, 13],
  "Rodriguez":     [987, 48, 25.34, 37, 37, 0, 0, 0, 22, 12],
};

// Reducido metrics
const REDUCIDO: Record<string, number[]> = {
  "R Caroca":      [2728, 75, 23.33, 54, 54, 0, 0, 0, 22, 25],
  "N Vargas":      [2465, 68, 25.44, 73, 73, 10, 0, 0, 25, 19],
  "N Carcamo":     [3351, 93, 22.87, 31, 31, 0, 0, 0, 34, 41],
  "Mellado":       [2451, 68, 23.85, 44, 44, 0, 0, 0, 33, 28],
  "Malanca":       [2810, 78, 26.51, 125, 125, 0, 0, 0, 36, 17],
  "M Leon":        [2987, 83, 25.68, 38, 38, 0, 0, 0, 27, 29],
  "M Briceño":     [2810, 78, 26.77, 73, 73, 0, 5, 17, 21, 21],
  "L Velasquez":   [3612, 100, 29.38, 37, 37, 0, 3, 21, 32, 32],
  "L Altamirano":  [2203, 61, 25.92, 61, 61, 0, 0, 0, 24, 20],
  "K Altez":       [3343, 93, 27.10, 12, 12, 0, 0, 0, 18, 41],
  "J Figueroa":    [3126, 86, 24.04, 49, 49, 0, 0, 0, 37, 18],
  "H Antiñirre":   [3059, 85, 25.13, 59, 59, 0, 0, 0, 28, 37],
  "Guaiquil":      [2512, 69, 25.77, 9, 9, 0, 0, 0, 20, 28],
  "E Cañete":      [2720, 75, 5.35, 87, 87, 0, 0, 0, 27, 20],
  "C Toro":        [2958, 82, 26.25, 105, 105, 0, 1, 36, 43, 42],
  "C Herrera":     [2943, 81, 27.22, 16, 16, 3, 0, 0, 32, 27],
  "Arriagada":     [3094, 86, 25.77, 72, 72, 0, 0, 0, 37, 25],
  "Ampuero":       [3393, 94, 24.43, 82, 82, 0, 0, 0, 43, 36],
  "Cris Martinez": [3134, 87, 25.34, 47, 47, 0, 0, 0, 12, 0],
  "Torres":        [2397, 66, 25.77, 89, 89, 0, 0, 0, 14, 14],
  "Sepulveda":     [2492, 69, 20.43, 29, 29, 0, 0, 0, 9, 9],
  "S Silva":       [3235, 89, 25.47, 72, 72, 0, 0, 0, 30, 14],
  "Rodriguez":     [2821, 78, 23.36, 21, 21, 0, 0, 0, 26, 18],
};

// Medical sample data
const MEDICAL_DATA = [
  { name: "L Velasquez", records: [
    { date: "2024-01-12", weight: 72.4, height: 178.5, fatPct: 11.8, musclePct: 48.2, jumpCMJ: 42.5, sprint10m: 1.62, status: "Óptimo" },
    { date: "2023-11-08", weight: 71.8, height: 178.2, fatPct: 12.1, musclePct: 47.8, jumpCMJ: 41.2, sprint10m: 1.65, status: "Estable" },
    { date: "2023-08-22", weight: 71.2, height: 178.0, fatPct: 12.5, musclePct: 47.1, jumpCMJ: 40.8, sprint10m: 1.68, status: "Estable" },
    { date: "2023-06-15", weight: 70.5, height: 177.8, fatPct: 13.2, musclePct: 46.5, jumpCMJ: 39.5, sprint10m: 1.71, status: "Monitoreo" },
  ]},
  { name: "Cris Martinez", records: [
    { date: "2024-01-12", weight: 68.2, height: 175.0, fatPct: 10.5, musclePct: 49.0, jumpCMJ: 44.0, sprint10m: 1.58, status: "Óptimo" },
    { date: "2023-11-08", weight: 67.8, height: 174.8, fatPct: 11.0, musclePct: 48.5, jumpCMJ: 43.2, sprint10m: 1.60, status: "Estable" },
  ]},
  { name: "K Altez", records: [
    { date: "2024-01-12", weight: 76.0, height: 182.0, fatPct: 12.8, musclePct: 47.5, jumpCMJ: 38.0, sprint10m: 1.72, status: "Estable" },
    { date: "2023-11-08", weight: 75.5, height: 181.8, fatPct: 13.2, musclePct: 47.0, jumpCMJ: 37.5, sprint10m: 1.75, status: "Estable" },
  ]},
  { name: "Ampuero", records: [
    { date: "2024-01-12", weight: 65.8, height: 172.0, fatPct: 10.2, musclePct: 49.5, jumpCMJ: 45.0, sprint10m: 1.55, status: "Óptimo" },
  ]},
  { name: "C Toro", records: [
    { date: "2024-01-12", weight: 70.0, height: 176.5, fatPct: 11.5, musclePct: 48.0, jumpCMJ: 41.0, sprint10m: 1.64, status: "Monitoreo" },
  ]},
];

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.playerMetric.deleteMany();
  await prisma.segment.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.session.deleteMany();
  await prisma.player.deleteMany();

  // Create players
  const playerMap: Record<string, number> = {};
  for (const p of PLAYERS) {
    const player = await prisma.player.create({
      data: { name: p.name, position: p.position, category: "Sub-17" },
    });
    playerMap[p.name] = player.id;
  }
  console.log(`✅ Created ${PLAYERS.length} players`);

  // Create session
  const session = await prisma.session.create({
    data: {
      date: new Date("2026-03-14"),
      startTime: "10:09:02",
      endTime: "11:25:39",
      duration: "01:16:37",
      totalPlayers: 24,
      fileName: "StatSports_Report_2026_03_14_10_09_02.pdf",
    },
  });
  console.log(`✅ Created session: March 14, 2026`);

  // Create segments
  const rondoSegment = await prisma.segment.create({
    data: {
      sessionId: session.id,
      name: "Rondo",
      startTime: "10:24:05",
      endTime: "10:44:29",
      duration: "00:20:23",
    },
  });

  const reducidoSegment = await prisma.segment.create({
    data: {
      sessionId: session.id,
      name: "Reducido",
      startTime: "10:49:25",
      endTime: "11:25:36",
      duration: "00:36:10",
    },
  });
  console.log(`✅ Created 2 segments: Rondo, Reducido`);

  // Insert metrics for Entire Session (segmentId = null means "entire")
  for (const [name, m] of Object.entries(ENTIRE_SESSION)) {
    const playerId = playerMap[name];
    if (!playerId) continue;
    await prisma.playerMetric.create({
      data: {
        playerId, sessionId: session.id, segmentId: null,
        totalDistance: m[0], dMin: m[1], maxSpeed: m[2], hsr: m[3],
        distZ5: m[4], distZ6: m[5], sprintCount: m[6], sprintDist: m[7],
        acc: m[8], dec: m[9],
      },
    });
  }
  console.log(`✅ Inserted ${Object.keys(ENTIRE_SESSION).length} Entire Session metrics`);

  // Insert Rondo metrics
  for (const [name, m] of Object.entries(RONDO)) {
    const playerId = playerMap[name];
    if (!playerId) continue;
    await prisma.playerMetric.create({
      data: {
        playerId, sessionId: session.id, segmentId: rondoSegment.id,
        totalDistance: m[0], dMin: m[1], maxSpeed: m[2], hsr: m[3],
        distZ5: m[4], distZ6: m[5], sprintCount: m[6], sprintDist: m[7],
        acc: m[8], dec: m[9],
      },
    });
  }
  console.log(`✅ Inserted Rondo metrics`);

  // Insert Reducido metrics
  for (const [name, m] of Object.entries(REDUCIDO)) {
    const playerId = playerMap[name];
    if (!playerId) continue;
    await prisma.playerMetric.create({
      data: {
        playerId, sessionId: session.id, segmentId: reducidoSegment.id,
        totalDistance: m[0], dMin: m[1], maxSpeed: m[2], hsr: m[3],
        distZ5: m[4], distZ6: m[5], sprintCount: m[6], sprintDist: m[7],
        acc: m[8], dec: m[9],
      },
    });
  }
  console.log(`✅ Inserted Reducido metrics`);

  // Insert medical records
  for (const entry of MEDICAL_DATA) {
    const playerId = playerMap[entry.name];
    if (!playerId) continue;
    for (const r of entry.records) {
      await prisma.medicalRecord.create({
        data: {
          playerId,
          date: new Date(r.date),
          weight: r.weight,
          height: r.height,
          fatPct: r.fatPct,
          musclePct: r.musclePct,
          jumpCMJ: r.jumpCMJ,
          sprint10m: r.sprint10m,
          status: r.status,
        },
      });
    }
  }
  console.log(`✅ Inserted medical records`);

  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
