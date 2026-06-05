import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("📝 Creando usuario de prueba...\n");

  // Verificar si el usuario ya existe
  const existingUser = await prisma.user.findUnique({
    where: { email: "admin@huachipato.cl" },
  });

  if (existingUser) {
    console.log("✓ Usuario ya existe");
    return;
  }

  // Hashear contraseña
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("admin123", salt);

  // Crear usuario
  const user = await prisma.user.create({
    data: {
      email: "admin@huachipato.cl",
      password: hashedPassword,
      name: "Administrador",
      role: "admin",
    },
  });

  console.log(`✓ Usuario creado exitosamente:`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Contraseña: admin123`);
  console.log(`  Rol: ${user.role}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
