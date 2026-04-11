const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const result = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'PastPaper' AND column_name = 'marksSheetUrl'`;
    console.log('Column check result:', result);
  } catch (err) {
    console.error('Error checking column:', err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
