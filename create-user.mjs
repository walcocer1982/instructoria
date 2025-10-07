import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: 'walcocer.1982@gmail.com' }
    });

    if (existing) {
      console.log('✅ User already exists:', existing);
      return;
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        email: 'walcocer.1982@gmail.com',
        name: 'Walter Cocer',
        role: 'STUDENT',
        emailVerified: new Date(),
      }
    });

    console.log('✅ User created successfully:');
    console.log(JSON.stringify(user, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
