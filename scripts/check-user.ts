import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
  const email = 'walcocer.1982@gmail.com';

  console.log(`🔍 Buscando usuario: ${email}\n`);

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      studentSessions: {
        take: 5,
        orderBy: {
          startedAt: 'desc',
        },
      },
    },
  });

  if (!user) {
    console.log('❌ Usuario no encontrado');
    return;
  }

  console.log('✅ Usuario encontrado:');
  console.log(`   ID: ${user.id}`);
  console.log(`   Nombre: ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Rol: ${user.role}`);
  console.log(`   Creado: ${user.createdAt}`);
  console.log(`\n📚 Sesiones de estudiante: ${user.studentSessions.length}`);

  if (user.studentSessions.length > 0) {
    console.log('\nÚltimas sesiones:');
    user.studentSessions.forEach((session, i) => {
      console.log(`   ${i + 1}. ID: ${session.id}`);
      console.log(`      Lección: ${session.lessonId}`);
      console.log(`      Estado: ${session.currentState}`);
      console.log(`      Iniciada: ${session.startedAt}`);
      console.log(`      Completada: ${session.completedAt || 'No'}\n`);
    });
  }
}

checkUser()
  .then(() => {
    console.log('✨ Listo!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
