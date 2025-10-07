import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if session table exists by trying to count
    const sessionCount = await prisma.authSession.count();
    console.log('✅ AuthSession table exists. Count:', sessionCount);
    
    const userCount = await prisma.user.count();
    console.log('✅ User table exists. Count:', userCount);
    
    const accountCount = await prisma.account.count();
    console.log('✅ Account table exists. Count:', accountCount);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
