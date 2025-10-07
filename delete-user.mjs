import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.user.delete({
      where: { email: 'walcocer.1982@gmail.com' }
    });
    console.log('✅ User deleted. Try login again - it will be created automatically');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
