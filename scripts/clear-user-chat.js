/**
 * Script para limpiar el historial de chat de un usuario específico
 * Uso: node scripts/clear-user-chat.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearUserChat() {
  const userEmail = 'walcocer.1982@gmail.com';

  try {
    console.log(`\n🔍 Buscando usuario: ${userEmail}...`);

    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      console.log(`❌ Usuario no encontrado: ${userEmail}`);
      return;
    }

    console.log(`✅ Usuario encontrado: ${user.name} (ID: ${user.id})`);

    // Buscar todas las sesiones del usuario
    const sessions = await prisma.studentSession.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        lessonId: true,
        chatHistory: true,
      },
    });

    console.log(`📊 Sesiones encontradas: ${sessions.length}`);

    if (sessions.length === 0) {
      console.log('✅ No hay sesiones para limpiar');
      return;
    }

    // Limpiar el chatHistory de cada sesión y resetear a M0
    let updatedCount = 0;
    for (const session of sessions) {
      const chatHistory = Array.isArray(session.chatHistory) ? session.chatHistory : [];

      await prisma.studentSession.update({
        where: { id: session.id },
        data: {
          chatHistory: [],
          currentState: 'INTRODUCING',
          currentMomento: 'M0',
          currentQuestion: null,
          metadata: {}, // Limpiar también metadata (progreso, intentos, etc.)
        },
      });

      console.log(`  ✅ Reseteada sesión ${session.id} → M0 (${chatHistory.length} mensajes limpiados)`);
      updatedCount++;
    }

    console.log(`\n✅ Proceso completado:`);
    console.log(`   - Sesiones actualizadas: ${updatedCount}`);
    console.log(`   - Sesiones sin cambios: ${sessions.length - updatedCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
clearUserChat();
