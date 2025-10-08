/**
 * Script para actualizar el rol de un usuario
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateUserRole() {
  try {
    const email = 'walcocer.1982@gmail.com';
    const newRole = 'STUDENT'; // Cambia a STUDENT para probar la interfaz de estudiante

    console.log(`🔄 Actualizando rol de ${email} a ${newRole}...`);

    const user = await prisma.user.update({
      where: { email },
      data: { role: newRole }
    });

    console.log(`✅ Rol actualizado exitosamente`);
    console.log(`   Usuario: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rol: ${user.role}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserRole();
