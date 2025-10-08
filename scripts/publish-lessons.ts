import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function publishAllLessons() {
  console.log('📚 Publicando todas las lecciones...\n');

  const result = await prisma.lesson.updateMany({
    where: {
      publicada: false,
    },
    data: {
      publicada: true,
    },
  });

  console.log(`✅ ${result.count} lecciones publicadas\n`);

  const allLessons = await prisma.lesson.findMany({
    select: {
      id: true,
      titulo: true,
      publicada: true,
    },
  });

  console.log('📖 Estado de lecciones:');
  allLessons.forEach((lesson) => {
    console.log(`   ${lesson.publicada ? '✅' : '❌'} ${lesson.titulo}`);
  });
}

publishAllLessons()
  .then(() => {
    console.log('\n✨ Listo!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
