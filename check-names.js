const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkNames() {
  const players = await prisma.player.findMany();
  const weirdNames = players.filter(p => p.name.includes("?") || p.name.includes("\uFFFD"));
  console.log("Weird names found:", weirdNames);
  prisma.$disconnect();
}
checkNames();
