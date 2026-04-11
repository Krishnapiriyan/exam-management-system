const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── 1. Seed Subjects ──────────────────────────────────────────────────────
  const subjects = [
    'Mathematics',
    'Biology',
    'Chemistry',
    'Physics',
    'Information and Communication Technology',
  ];

  for (const name of subjects) {
    await prisma.subject.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('✅ Subjects seeded');

  // ── 2. Seed Default Admin ─────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('Admin@1234', 10);
  await prisma.admin.upsert({
    where: { email: 'admin@ems.com' },
    update: {},
    create: {
      name: 'System Administrator',
      email: 'admin@ems.com',
      password: hashedPassword,
    },
  });
  console.log('✅ Default admin seeded  →  admin@ems.com / Admin@1234');

  // ── 3. Seed Default SiteSettings ──────────────────────────────────────────
  const existing = await prisma.siteSettings.findFirst();
  if (!existing) {
    await prisma.siteSettings.create({
      data: {
        homeTitle: 'Welcome to the Exam Management System',
        homeDescription:
          'Your central portal for exam schedules, results, and past papers.',
      },
    });
    console.log('✅ Default site settings seeded');
  }

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
