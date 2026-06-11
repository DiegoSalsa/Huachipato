const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Configurando usuarios con roles...\n");

  const salt = await bcrypt.genSalt(10);

  // ─── 1. Actualizar admin existente ────────────────────────────────
  try {
    const admin = await prisma.user.update({
      where: { email: "admin@huachipato.cl" },
      data: { role: "admin" },
    });
    console.log(`✅ Admin actualizado: ${admin.email} → role: ${admin.role}`);
  } catch (e) {
    console.log("⚠️  admin@huachipato.cl no existe, creando...");
    const hashedPw = await bcrypt.hash("admin123", salt);
    const admin = await prisma.user.create({
      data: {
        email: "admin@huachipato.cl",
        password: hashedPw,
        name: "Administrador",
        role: "admin",
      },
    });
    console.log(`✅ Admin creado: ${admin.email} / admin123 → role: ${admin.role}`);
  }

  // ─── 2. Crear usuario Médico ──────────────────────────────────────
  const medicoEmail = "medico@huachipato.cl";
  const existingMedico = await prisma.user.findUnique({ where: { email: medicoEmail } });
  if (existingMedico) {
    await prisma.user.update({ where: { email: medicoEmail }, data: { role: "medico" } });
    console.log(`✅ Médico actualizado: ${medicoEmail} → role: medico`);
  } else {
    const hashedPw = await bcrypt.hash("medico123", salt);
    const user = await prisma.user.create({
      data: {
        email: medicoEmail,
        password: hashedPw,
        name: "Dr. Personal Médico",
        role: "medico",
      },
    });
    console.log(`✅ Médico creado: ${user.email} / medico123 → role: ${user.role}`);
  }

  // ─── 3. Crear usuario GPS ─────────────────────────────────────────
  const gpsEmail = "gps@huachipato.cl";
  const existingGps = await prisma.user.findUnique({ where: { email: gpsEmail } });
  if (existingGps) {
    await prisma.user.update({ where: { email: gpsEmail }, data: { role: "gps" } });
    console.log(`✅ GPS actualizado: ${gpsEmail} → role: gps`);
  } else {
    const hashedPw = await bcrypt.hash("gps123", salt);
    const user = await prisma.user.create({
      data: {
        email: gpsEmail,
        password: hashedPw,
        name: "Personal GPS",
        role: "gps",
      },
    });
    console.log(`✅ GPS creado: ${user.email} / gps123 → role: ${user.role}`);
  }

  console.log("\n🎉 ¡Listo! Resumen de credenciales:");
  console.log("┌──────────────────────────┬──────────────┬──────────┐");
  console.log("│ Email                    │ Contraseña   │ Rol      │");
  console.log("├──────────────────────────┼──────────────┼──────────┤");
  console.log("│ admin@huachipato.cl      │ admin123     │ admin    │");
  console.log("│ medico@huachipato.cl     │ medico123    │ medico   │");
  console.log("│ gps@huachipato.cl        │ gps123       │ gps      │");
  console.log("└──────────────────────────┴──────────────┴──────────┘");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
