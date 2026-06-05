const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("📝 Creando usuario de prueba...\n");

  try {
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
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
