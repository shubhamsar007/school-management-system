import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Seed system permissions
  const permissions = [
    // Students module
    { module: 'students', resource: 'student', action: 'view' },
    { module: 'students', resource: 'student', action: 'create' },
    { module: 'students', resource: 'student', action: 'update' },
    { module: 'students', resource: 'student', action: 'delete' },
    { module: 'students', resource: 'student', action: 'export' },
    // Fees module
    { module: 'fees', resource: 'invoice', action: 'view' },
    { module: 'fees', resource: 'invoice', action: 'create' },
    { module: 'fees', resource: 'payment', action: 'create' },
    { module: 'fees', resource: 'report', action: 'view' },
    // Attendance module
    { module: 'attendance', resource: 'student_attendance', action: 'view' },
    { module: 'attendance', resource: 'student_attendance', action: 'mark' },
    { module: 'attendance', resource: 'employee_attendance', action: 'view' },
    { module: 'attendance', resource: 'employee_attendance', action: 'mark' },
    // Leave module
    { module: 'leave', resource: 'leave_request', action: 'view' },
    { module: 'leave', resource: 'leave_request', action: 'create' },
    { module: 'leave', resource: 'leave_request', action: 'approve' },
    // Timetable module
    { module: 'academics', resource: 'timetable', action: 'view' },
    { module: 'academics', resource: 'timetable', action: 'create' },
    { module: 'academics', resource: 'timetable', action: 'update' },
    // Reports
    { module: 'reports', resource: 'report', action: 'view' },
    { module: 'reports', resource: 'report', action: 'export' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { module_resource_action: perm },
      update: {},
      create: { ...perm, description: `${perm.action} ${perm.resource}` },
    });
  }

  console.log(`Seeded ${permissions.length} permissions`);
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
