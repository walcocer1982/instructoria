const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSession() {
  try {
    const sessions = await prisma.studentSession.findMany({
      where: {
        user: {
          email: 'walcocer.1982@gmail.com'
        },
        completedAt: null
      },
      include: {
        lesson: true
      },
      orderBy: {
        lastActivity: 'desc'
      }
    });

    if (sessions.length === 0) {
      console.log('No hay sesiones activas');
      return;
    }

    const session = sessions[0];
    console.log('\n📊 SESIÓN ACTIVA:');
    console.log('Lección:', session.lesson.titulo);
    console.log('Momento actual:', session.currentMomento);
    console.log('Estado:', session.currentState);

    console.log('\n📋 EVIDENCIAS EN LECCIÓN M0:');
    const m0 = session.lesson.momentos.find(m => m.id === 'M0');
    console.log(JSON.stringify(m0.evidencias, null, 2));

    console.log('\n🔍 METADATA.evidence_attempts:');
    const ea = session.metadata?.evidence_attempts || {};
    console.log(JSON.stringify(ea, null, 2));

    console.log('\n📝 ÚLTIMOS 5 MENSAJES:');
    const messages = session.chatHistory.slice(-5);
    messages.forEach((msg, i) => {
      console.log(`\n[${i}] ${msg.role} - ${msg.message_type}`);
      console.log(`Content: ${msg.content.substring(0, 150)}...`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSession();
