const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create courses
  const courses = await Promise.all([
    prisma.course.upsert({
      where: { name: 'Labour Law I' },
      update: {},
      create: {
        name: 'Labour Law I',
        professor: 'Ravi A. Malhotra',
        courseCode: 'CML 3233',
      },
    }),
    prisma.course.upsert({
      where: { name: 'Studies in Public Law' },
      update: {},
      create: {
        name: 'Studies in Public Law',
        professor: 'Andres Drew',
        courseCode: 'CML 4104',
      },
    }),
    prisma.course.upsert({
      where: { name: 'Studies in International Law' },
      update: {},
      create: {
        name: 'Studies in International Law',
        professor: 'Aram Kerkonian',
        courseCode: 'CML 4108',
      },
    }),
    prisma.course.upsert({
      where: { name: 'Globalization and Law' },
      update: {},
      create: {
        name: 'Globalization and Law',
        professor: 'Errol Mendes',
        courseCode: 'CML 4150',
      },
    }),
    prisma.course.upsert({
      where: { name: 'Mediation Theory and Practice' },
      update: {},
      create: {
        name: 'Mediation Theory and Practice',
        professor: 'Emilia Péch',
        courseCode: 'CML 2320',
      },
    }),
  ]);

  console.log('✅ Created/updated courses');

  // Create course schedules
  const schedules = [
    // Labour Law I - Monday 2:30PM-3:50PM & Wednesday 1:00PM-2:20PM
    {
      courseId: courses[0].id,
      dayOfWeek: 0, // Monday
      startTime: '14:30',
      endTime: '15:50',
      room: '57 Louis Pasteur (FTX) 137',
      locationCode: 'FTX',
      section: 'A00',
    },
    {
      courseId: courses[0].id,
      dayOfWeek: 2, // Wednesday
      startTime: '13:00',
      endTime: '14:20',
      room: '57 Louis Pasteur (FTX) 137',
      locationCode: 'FTX',
      section: 'A00',
    },
    // Studies in Public Law - Monday 4:00PM-6:50PM
    {
      courseId: courses[1].id,
      dayOfWeek: 0, // Monday
      startTime: '16:00',
      endTime: '18:50',
      room: '57 Louis Pasteur (FTX) 413',
      locationCode: 'FTX',
      section: 'B00',
    },
    // Studies in International Law - Tuesday 5:30PM-8:20PM
    {
      courseId: courses[2].id,
      dayOfWeek: 1, // Tuesday
      startTime: '17:30',
      endTime: '20:20',
      room: '57 Louis Pasteur (FTX) 402',
      locationCode: 'FTX',
      section: 'A00',
    },
    // Globalization and Law - Tuesday 2:30PM-3:50PM & Thursday 2:30PM-3:50PM
    {
      courseId: courses[3].id,
      dayOfWeek: 1, // Tuesday
      startTime: '14:30',
      endTime: '15:50',
      room: '57 Louis Pasteur (FTX) 315',
      locationCode: 'FTX',
      section: 'A00',
    },
    {
      courseId: courses[3].id,
      dayOfWeek: 3, // Thursday
      startTime: '14:30',
      endTime: '15:50',
      room: '57 Louis Pasteur (FTX) 315',
      locationCode: 'FTX',
      section: 'A00',
    },
    // Mediation Theory and Practice - Wednesday 5:30PM-8:20PM
    {
      courseId: courses[4].id,
      dayOfWeek: 2, // Wednesday
      startTime: '17:30',
      endTime: '20:20',
      room: '120 University (FSS) 14001',
      locationCode: 'FSS',
      section: 'A00',
    },
  ];

  // Delete existing schedules
  await prisma.courseSchedule.deleteMany({});

  // Create schedules
  for (const schedule of schedules) {
    await prisma.courseSchedule.create({
      data: schedule,
    });
  }

  console.log('✅ Created course schedules');
  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
