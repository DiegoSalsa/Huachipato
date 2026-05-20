import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Clean Seed — Huachipato ACWR System
 *
 * Deletes ALL data and resets the database to a clean state.
 * Ready for real data ingestion from CSV/Excel uploads.
 */
async function main() {
  console.log("🧹 Limpiando base de datos huachipato3...\n");

  // Delete in dependency order
  const deletedWeekly = await prisma.weeklyStat.deleteMany();
  console.log(`  ✓ weekly_stats:          ${deletedWeekly.count} registros eliminados`);

  const deletedDaily = await prisma.gpsDailyReport.deleteMany();
  console.log(`  ✓ gps_daily_reports:     ${deletedDaily.count} registros eliminados`);

  const deletedSessions = await prisma.gpsDailySession.deleteMany();
  console.log(`  ✓ gps_daily_sessions:    ${deletedSessions.count} registros eliminados`);

  const deletedPlayers = await prisma.player.deleteMany();
  console.log(`  ✓ players:               ${deletedPlayers.count} registros eliminados`);

  // Reset auto-increment sequences (PostgreSQL)
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE IF EXISTS gps_daily_reports_id_seq RESTART WITH 1;`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE IF EXISTS gps_daily_sessions_id_seq RESTART WITH 1;`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE IF EXISTS weekly_stats_id_seq RESTART WITH 1;`,
  );

  console.log("\n  ✓ Secuencias de IDs reiniciadas");

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ Base de datos limpia y lista para ingesta real.");
  console.log("   Sube archivos CSV/Excel desde la interfaz web.\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
