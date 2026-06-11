const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function mergePlayers(badPlayer, goodName) {
  let goodPlayer = await prisma.player.findUnique({ where: { name: goodName } });
  
  if (!goodPlayer) {
    console.log(`Good player ${goodName} not found, renaming ${badPlayer.name} instead.`);
    await prisma.player.update({
      where: { id: badPlayer.id },
      data: { name: goodName }
    });
    return;
  }

  console.log(`Merging ${badPlayer.name} into ${goodName}...`);
  
  // 1. Update GpsDailySession
  await prisma.gpsDailySession.updateMany({
    where: { playerId: badPlayer.id },
    data: { playerId: goodPlayer.id }
  });

  // 2. Update WeeklyStat (careful with unique constraints on playerId_year_weekNumber)
  // If both players have stats for the same week, we should ideally add them up or just let the most recent override.
  // For simplicity, we can fetch all bad weekly stats and upsert them into the good player
  const badStats = await prisma.weeklyStat.findMany({ where: { playerId: badPlayer.id } });
  for (const stat of badStats) {
    const existing = await prisma.weeklyStat.findUnique({
      where: {
        playerId_year_weekNumber: {
          playerId: goodPlayer.id,
          year: stat.year,
          weekNumber: stat.weekNumber
        }
      }
    });
    
    if (existing) {
      await prisma.weeklyStat.update({
        where: { id: existing.id },
        data: {
          totalDistance: existing.totalDistance + stat.totalDistance,
          highVelocity: existing.highVelocity + stat.highVelocity,
          mechanicalImpacts: existing.mechanicalImpacts + stat.mechanicalImpacts
        }
      });
      await prisma.weeklyStat.delete({ where: { id: stat.id } });
    } else {
      await prisma.weeklyStat.update({
        where: { id: stat.id },
        data: { playerId: goodPlayer.id }
      });
    }
  }

  // 3. Update Injuries
  await prisma.injury.updateMany({
    where: { playerId: badPlayer.id },
    data: { playerId: goodPlayer.id }
  });

  // 4. Delete bad player
  await prisma.player.delete({ where: { id: badPlayer.id } });
  console.log(`Merged and deleted ${badPlayer.name}.`);
}

async function fixNames() {
  const players = await prisma.player.findMany();
  for (const p of players) {
    if (p.name.includes("?")) {
      let goodName = null;
      if (p.name === "LEANDRO D?AZ") goodName = "LEANDRO DIAZ";
      else if (p.name === "MARIO BRICE?O") goodName = "MARIO BRICENO";
      else goodName = p.name.replace(/\?/g, "");

      await mergePlayers(p, goodName);
    }
  }
  console.log("Done fixing names.");
  prisma.$disconnect();
}
fixNames();
