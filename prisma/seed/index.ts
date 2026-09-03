import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function d(iso: string) { return new Date(iso); }

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱  Seeding database…\n');

  // ── 1. Permissions ───────────────────────────────────────────────────────────

  const permissions = [
    { module: 'students',  resource: 'student',            action: 'view'   },
    { module: 'students',  resource: 'student',            action: 'create' },
    { module: 'students',  resource: 'student',            action: 'update' },
    { module: 'students',  resource: 'student',            action: 'delete' },
    { module: 'students',  resource: 'student',            action: 'export' },
    { module: 'fees',      resource: 'invoice',            action: 'view'   },
    { module: 'fees',      resource: 'invoice',            action: 'create' },
    { module: 'fees',      resource: 'payment',            action: 'create' },
    { module: 'fees',      resource: 'report',             action: 'view'   },
    { module: 'attendance',resource: 'student_attendance', action: 'view'   },
    { module: 'attendance',resource: 'student_attendance', action: 'mark'   },
    { module: 'attendance',resource: 'employee_attendance',action: 'view'   },
    { module: 'attendance',resource: 'employee_attendance',action: 'mark'   },
    { module: 'leave',     resource: 'leave_request',      action: 'view'   },
    { module: 'leave',     resource: 'leave_request',      action: 'create' },
    { module: 'leave',     resource: 'leave_request',      action: 'approve'},
    { module: 'academics', resource: 'timetable',          action: 'view'   },
    { module: 'academics', resource: 'timetable',          action: 'create' },
    { module: 'academics', resource: 'timetable',          action: 'update' },
    { module: 'reports',   resource: 'report',             action: 'view'   },
    { module: 'reports',   resource: 'report',             action: 'export' },
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { module_resource_action: p },
      update: {},
      create: { ...p, description: `${p.action} ${p.resource}` },
    });
  }
  console.log(`✅  ${permissions.length} permissions`);

  // ── 2. Organization ───────────────────────────────────────────────────────────

  const org = await prisma.organization.upsert({
    where: { code: 'SUNRISE-001' },
    update: {},
    create: {
      name:     'Sunrise Public School',
      code:     'SUNRISE-001',
      type:     'SCHOOL',
      email:    'admin@sunriseschool.edu.in',
      phone:    '+91-11-2345-6789',
      website:  'https://sunriseschool.edu.in',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      country:  'IN',
      status:   'ACTIVE',
    },
  });
  console.log(`✅  Organization: ${org.name}`);

  // ── 3. Campus ─────────────────────────────────────────────────────────────────

  const campus = await prisma.campus.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'MAIN' } },
    update: {},
    create: {
      organizationId: org.id,
      name:           'Main Campus',
      code:           'MAIN',
      phone:          '+91-11-2345-6789',
      email:          'main@sunriseschool.edu.in',
      status:         'ACTIVE',
    },
  });
  console.log(`✅  Campus: ${campus.name}`);

  // ── 3b. Departments ───────────────────────────────────────────────────────────

  const departmentRows = [
    { name: 'Mathematics',        code: 'MATH'  },
    { name: 'Science',            code: 'SCI'   },
    { name: 'English',            code: 'ENG'   },
    { name: 'Social Studies',     code: 'SST'   },
    { name: 'Computer Science',   code: 'CS'    },
    { name: 'Physical Education', code: 'PE'    },
    { name: 'Arts & Craft',       code: 'ARTS'  },
    { name: 'Administration',     code: 'ADMIN' },
  ];

  let deptCount = 0;
  for (const dept of departmentRows) {
    const existing = await prisma.department.findFirst({
      where: { organizationId: org.id, code: dept.code },
    });
    if (!existing) {
      await prisma.department.create({
        data: { organizationId: org.id, name: dept.name, code: dept.code, status: 'ACTIVE' },
      });
      deptCount++;
    }
  }
  console.log(`✅  ${departmentRows.length} departments (${deptCount} created)`);

  // ── 3c. Designations ──────────────────────────────────────────────────────────

  const designationRows = [
    { name: 'Principal',              code: 'PRINCIPAL'    },
    { name: 'Vice Principal',         code: 'VP'           },
    { name: 'Head of Department',     code: 'HOD'          },
    { name: 'Senior Teacher',         code: 'SR_TEACHER'   },
    { name: 'Teacher',                code: 'TEACHER'      },
    { name: 'Assistant Teacher',      code: 'ASST_TEACHER' },
    { name: 'Lab Assistant',          code: 'LAB_ASST'     },
    { name: 'Administrative Officer', code: 'ADMIN_OFF'    },
    { name: 'Accountant',             code: 'ACCOUNTANT'   },
    { name: 'Librarian',              code: 'LIBRARIAN'    },
    { name: 'Counsellor',             code: 'COUNSELLOR'   },
    { name: 'Peon',                   code: 'PEON'         },
  ];

  let desigCount = 0;
  for (const desig of designationRows) {
    const existing = await prisma.designation.findFirst({
      where: { organizationId: org.id, code: desig.code },
    });
    if (!existing) {
      await prisma.designation.create({
        data: { organizationId: org.id, name: desig.name, code: desig.code, status: 'ACTIVE' },
      });
      desigCount++;
    }
  }
  console.log(`✅  ${designationRows.length} designations (${desigCount} created)`);

  // ── 3d. Employee Types ────────────────────────────────────────────────────────

  const employeeTypeRows = [
    { name: 'Permanent Teaching Staff',     code: 'PERM_TEACH',     category: 'TEACHING'     },
    { name: 'Contract Teaching Staff',      code: 'CONTRACT_TEACH', category: 'TEACHING'     },
    { name: 'Guest / Visiting Faculty',     code: 'VISITING',       category: 'TEACHING'     },
    { name: 'Permanent Non-Teaching Staff', code: 'PERM_NON_TEACH', category: 'NON_TEACHING' },
    { name: 'Contract Non-Teaching Staff',  code: 'CONTRACT_NON',   category: 'NON_TEACHING' },
  ];

  let etCount = 0;
  for (const et of employeeTypeRows) {
    const existing = await prisma.employeeType.findFirst({
      where: { organizationId: org.id, code: et.code },
    });
    if (!existing) {
      await prisma.employeeType.create({
        data: { organizationId: org.id, name: et.name, code: et.code, category: et.category, status: 'ACTIVE' },
      });
      etCount++;
    }
  }
  console.log(`✅  ${employeeTypeRows.length} employee types (${etCount} created)`);

  // ── 4. Admin User ─────────────────────────────────────────────────────────────

  const ADMIN_EMAIL    = 'admin@sunriseschool.edu.in';
  const ADMIN_PASSWORD = 'Admin@1234';

  const existingAdminUser = await prisma.user.findFirst({
    where: { organizationId: org.id, email: ADMIN_EMAIL },
  });

  if (!existingAdminUser) {
    // Need a Person record first
    const adminPerson = await prisma.person.create({
      data: {
        firstName: 'Super',
        lastName:  'Admin',
        gender:    'MALE',
        email:     ADMIN_EMAIL,
      },
    });

    const passwordHash = await argon2.hash(ADMIN_PASSWORD);
    await prisma.user.create({
      data: {
        organizationId: org.id,
        personId:       adminPerson.id,
        email:          ADMIN_EMAIL,
        username:       'admin',
        passwordHash,
        status:         'ACTIVE',
      },
    });
    console.log(`✅  Admin user created — email: ${ADMIN_EMAIL}  password: ${ADMIN_PASSWORD}`);
  } else {
    console.log(`✅  Admin user already exists — email: ${ADMIN_EMAIL}  password: ${ADMIN_PASSWORD}`);
  }

  // ── 4. Academic Years ─────────────────────────────────────────────────────────

  const ay2425 = await prisma.academicYear.upsert({
    where: { organizationId_code: { organizationId: org.id, code: '2024-25' } },
    update: {},
    create: {
      organizationId: org.id,
      name:      '2024-25',
      code:      '2024-25',
      startDate: d('2024-04-01'),
      endDate:   d('2025-03-31'),
      status:    'CLOSED',
      isCurrent: false,
    },
  });

  const ay2526 = await prisma.academicYear.upsert({
    where: { organizationId_code: { organizationId: org.id, code: '2025-26' } },
    update: {},
    create: {
      organizationId: org.id,
      name:      '2025-26',
      code:      '2025-26',
      startDate: d('2025-04-01'),
      endDate:   d('2026-03-31'),
      status:    'CLOSED',
      isCurrent: false,
    },
  });

  const ay2627 = await prisma.academicYear.upsert({
    where: { organizationId_code: { organizationId: org.id, code: '2026-27' } },
    update: { isCurrent: true, status: 'ACTIVE' },
    create: {
      organizationId: org.id,
      name:      '2026-27',
      code:      '2026-27',
      startDate: d('2026-04-01'),
      endDate:   d('2027-03-31'),
      status:    'ACTIVE',
      isCurrent: true,
    },
  });
  console.log(`✅  Academic years: 2024-25, 2025-26, 2026-27`);

  // ── 5. Classes ────────────────────────────────────────────────────────────────

  const classRows = [
    { name: 'Class 1',  code: 'CL01', level: 1,  displayOrder: 1  },
    { name: 'Class 2',  code: 'CL02', level: 2,  displayOrder: 2  },
    { name: 'Class 3',  code: 'CL03', level: 3,  displayOrder: 3  },
    { name: 'Class 4',  code: 'CL04', level: 4,  displayOrder: 4  },
    { name: 'Class 5',  code: 'CL05', level: 5,  displayOrder: 5  },
    { name: 'Class 6',  code: 'CL06', level: 6,  displayOrder: 6  },
    { name: 'Class 7',  code: 'CL07', level: 7,  displayOrder: 7  },
    { name: 'Class 8',  code: 'CL08', level: 8,  displayOrder: 8  },
    { name: 'Class 9',  code: 'CL09', level: 9,  displayOrder: 9  },
    { name: 'Class 10', code: 'CL10', level: 10, displayOrder: 10 },
  ];

  const classes: Record<string, { id: string }> = {};
  for (const c of classRows) {
    let cls = await prisma.academicClass.findFirst({ where: { organizationId: org.id, code: c.code } });
    if (!cls) {
      cls = await prisma.academicClass.create({ data: { organizationId: org.id, ...c, status: 'ACTIVE' } });
    }
    classes[c.code] = cls;
  }
  console.log(`✅  ${classRows.length} classes`);

  // ── 6. Sections ───────────────────────────────────────────────────────────────
  // Classes 1–5: A, B, C  |  Classes 6–10: A, B, C, D

  const sections: Record<string, Record<string, { id: string }>> = {};
  for (const c of classRows) {
    const names = c.level <= 5 ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D'];
    sections[c.code] = {};
    for (const sn of names) {
      let sec = await prisma.section.findUnique({
        where: { campusId_academicClassId_code: { campusId: campus.id, academicClassId: classes[c.code]!.id, code: sn } },
      });
      if (!sec) {
        sec = await prisma.section.create({
          data: { campusId: campus.id, academicClassId: classes[c.code]!.id, name: sn, code: sn, capacity: 40, status: 'ACTIVE' },
        });
      }
      sections[c.code]![sn] = sec;
    }
  }
  console.log(`✅  Sections created`);

  // ── 7. Students ───────────────────────────────────────────────────────────────

  /**
   * Schema: { admNo, firstName, middleName?, lastName, dob, gender, email, phone,
   *           bloodGroup?, status, admDate, joinDate, cls, sec, roll,
   *           prevCls?, prevSec?,   <-- for enrollment history
   *           guardian: { firstName, lastName, gender, phone, email?, relationship, occupation?, employer? }
   *           guardian2?           <-- optional second guardian
   * }
   */
  const studentData = [
    // ── Class 6 – Section A ──
    {
      admNo: 'ADM-2024-001', firstName: 'Aarav',    lastName: 'Mehta',      dob: '2014-03-15', gender: 'MALE',   email: 'aarav.mehta@student.in',     phone: null,           bloodGroup: 'B+',  status: 'ACTIVE',   admDate: '2024-04-01', joinDate: '2024-04-08', cls: 'CL06', sec: 'A', roll: '01', prevCls: 'CL05', prevSec: 'A',
      guardian: { firstName: 'Rohit',    lastName: 'Mehta',      gender: 'MALE',   phone: '+91 98220 41187', email: 'rohit.mehta@gmail.com',    relationship: 'FATHER', occupation: 'Software Engineer', employer: 'Infosys Ltd' },
    },
    {
      admNo: 'ADM-2024-002', firstName: 'Diya',     lastName: 'Krishnan',   dob: '2014-07-22', gender: 'FEMALE', email: 'diya.k@student.in',          phone: null,           bloodGroup: 'A+',  status: 'ACTIVE',   admDate: '2024-04-01', joinDate: '2024-04-08', cls: 'CL06', sec: 'A', roll: '02', prevCls: 'CL05', prevSec: 'B',
      guardian: { firstName: 'Latha',    lastName: 'Krishnan',   gender: 'FEMALE', phone: '+91 99401 20934', email: 'latha.krishnan@gmail.com',  relationship: 'MOTHER', occupation: 'Doctor',            employer: 'Apollo Hospital' },
    },
    {
      admNo: 'ADM-2024-003', firstName: 'Ishaan',   lastName: 'Bose',       dob: '2014-01-10', gender: 'MALE',   email: 'ishaan.b@student.in',        phone: null,           bloodGroup: 'O+',  status: 'ACTIVE',   admDate: '2024-04-01', joinDate: '2024-04-08', cls: 'CL06', sec: 'A', roll: '03', prevCls: 'CL05', prevSec: 'A',
      guardian: { firstName: 'Sujoy',    lastName: 'Bose',       gender: 'MALE',   phone: '+91 98301 77420', email: null,                       relationship: 'FATHER', occupation: 'Business Owner',    employer: null },
    },
    {
      admNo: 'ADM-2024-004', firstName: 'Kavya',    lastName: 'Nair',       dob: '2014-09-05', gender: 'FEMALE', email: null,                         phone: null,           bloodGroup: 'AB+', status: 'ACTIVE',   admDate: '2024-04-01', joinDate: '2024-04-08', cls: 'CL06', sec: 'A', roll: '04',
      guardian: { firstName: 'Priya',    lastName: 'Nair',       gender: 'FEMALE', phone: '+91 94470 18823', email: 'priya.nair@gmail.com',      relationship: 'MOTHER', occupation: 'Teacher',           employer: 'DPS School' },
    },
    {
      admNo: 'ADM-2024-005', firstName: 'Arjun',    lastName: 'Verma',      dob: '2014-02-28', gender: 'MALE',   email: null,                         phone: null,           bloodGroup: 'B-',  status: 'ACTIVE',   admDate: '2024-04-01', joinDate: '2024-04-08', cls: 'CL06', sec: 'A', roll: '05',
      guardian: { firstName: 'Suresh',   lastName: 'Verma',      gender: 'MALE',   phone: '+91 98110 33201', email: null,                       relationship: 'FATHER', occupation: 'Bank Manager',      employer: 'SBI' },
    },

    // ── Class 6 – Section B ──
    {
      admNo: 'ADM-2024-006', firstName: 'Rohan',    lastName: 'Sharma',     dob: '2014-05-18', gender: 'MALE',   email: null,                         phone: null,           bloodGroup: 'A-',  status: 'ACTIVE',   admDate: '2024-04-01', joinDate: '2024-04-08', cls: 'CL06', sec: 'B', roll: '01',
      guardian: { firstName: 'Rakesh',   lastName: 'Sharma',     gender: 'MALE',   phone: '+91 97113 56783', email: 'rakesh.sharma@gmail.com',   relationship: 'FATHER', occupation: 'CA',                employer: 'Self Employed' },
    },
    {
      admNo: 'ADM-2024-007', firstName: 'Priya',    lastName: 'Gupta',      dob: '2014-11-30', gender: 'FEMALE', email: null,                         phone: null,           bloodGroup: 'O-',  status: 'ACTIVE',   admDate: '2024-04-01', joinDate: '2024-04-08', cls: 'CL06', sec: 'B', roll: '02',
      guardian: { firstName: 'Alka',     lastName: 'Gupta',      gender: 'FEMALE', phone: '+91 93119 44412', email: null,                       relationship: 'MOTHER', occupation: 'Homemaker',         employer: null },
    },

    // ── Class 7 – Section A ──
    {
      admNo: 'ADM-2023-001', firstName: 'Ananya',   lastName: 'Singh',      dob: '2013-06-14', gender: 'FEMALE', email: 'ananya.s@student.in',        phone: null,           bloodGroup: 'A+',  status: 'ACTIVE',   admDate: '2023-04-01', joinDate: '2023-04-10', cls: 'CL07', sec: 'A', roll: '01', prevCls: 'CL06', prevSec: 'A',
      guardian: { firstName: 'Rajesh',   lastName: 'Singh',      gender: 'MALE',   phone: '+91 98765 12345', email: 'rajesh.singh@gmail.com',    relationship: 'FATHER', occupation: 'IPS Officer',       employer: 'Government of India' },
    },
    {
      admNo: 'ADM-2023-002', firstName: 'Vihaan',   lastName: 'Patel',      dob: '2013-08-03', gender: 'MALE',   email: null,                         phone: null,           bloodGroup: 'B+',  status: 'ACTIVE',   admDate: '2023-04-01', joinDate: '2023-04-10', cls: 'CL07', sec: 'A', roll: '02', prevCls: 'CL06', prevSec: 'B',
      guardian: { firstName: 'Manish',   lastName: 'Patel',      gender: 'MALE',   phone: '+91 90012 67834', email: null,                       relationship: 'FATHER', occupation: 'Pharma Distributor', employer: 'Patel Pharma' },
    },
    {
      admNo: 'ADM-2023-003', firstName: 'Shreya',   lastName: 'Reddy',      dob: '2013-04-22', gender: 'FEMALE', email: 'shreya.r@student.in',        phone: null,           bloodGroup: 'O+',  status: 'ACTIVE',   admDate: '2023-04-01', joinDate: '2023-04-10', cls: 'CL07', sec: 'A', roll: '03', prevCls: 'CL06', prevSec: 'A',
      guardian: { firstName: 'Sunita',   lastName: 'Reddy',      gender: 'FEMALE', phone: '+91 94444 09821', email: 'sunita.reddy@gmail.com',    relationship: 'MOTHER', occupation: 'Architect',         employer: 'Urban Design Studio' },
    },
    {
      admNo: 'ADM-2023-004', firstName: 'Aditya',   lastName: 'Kumar',      dob: '2013-12-19', gender: 'MALE',   email: null,                         phone: null,           bloodGroup: 'AB-', status: 'ACTIVE',   admDate: '2023-04-01', joinDate: '2023-04-10', cls: 'CL07', sec: 'A', roll: '04',
      guardian: { firstName: 'Vinod',    lastName: 'Kumar',      gender: 'MALE',   phone: '+91 98001 33782', email: null,                       relationship: 'FATHER', occupation: 'Shopkeeper',        employer: null },
    },

    // ── Class 7 – Section B ──
    {
      admNo: 'ADM-2023-005', firstName: 'Tanvi',    lastName: 'Joshi',      dob: '2013-03-07', gender: 'FEMALE', email: null,                         phone: null,           bloodGroup: 'B+',  status: 'ACTIVE',   admDate: '2023-04-01', joinDate: '2023-04-10', cls: 'CL07', sec: 'B', roll: '01',
      guardian: { firstName: 'Hemant',   lastName: 'Joshi',      gender: 'MALE',   phone: '+91 97722 44501', email: 'hemant.joshi@gmail.com',    relationship: 'FATHER', occupation: 'Journalist',        employer: 'Times of India' },
    },
    {
      admNo: 'ADM-2023-006', firstName: 'Sai',      lastName: 'Prasad',     dob: '2013-09-15', gender: 'MALE',   email: null,                         phone: null,           bloodGroup: 'O+',  status: 'ACTIVE',   admDate: '2023-04-01', joinDate: '2023-04-10', cls: 'CL07', sec: 'B', roll: '02',
      guardian: { firstName: 'Lakshmi',  lastName: 'Prasad',     gender: 'FEMALE', phone: '+91 91234 56789', email: 'lakshmi.prasad@gmail.com',  relationship: 'MOTHER', occupation: 'Nurse',             employer: 'AIIMS Delhi' },
    },

    // ── Class 8 – Section A ──
    {
      admNo: 'ADM-2022-001', firstName: 'Saanvi',   lastName: 'Deshpande',  dob: '2012-07-08', gender: 'FEMALE', email: 'saanvi.d@student.in',        phone: null,           bloodGroup: 'A+',  status: 'ACTIVE',   admDate: '2022-04-01', joinDate: '2022-04-05', cls: 'CL08', sec: 'A', roll: '01', prevCls: 'CL07', prevSec: 'A',
      guardian: { firstName: 'Meera',    lastName: 'Deshpande',  gender: 'FEMALE', phone: '+91 90280 33176', email: 'meera.deshpande@gmail.com', relationship: 'MOTHER', occupation: 'Professor',         employer: 'IIT Delhi' },
    },
    {
      admNo: 'ADM-2022-002', firstName: 'Kabir',    lastName: 'Joshi',      dob: '2012-03-25', gender: 'MALE',   email: null,                         phone: null,           bloodGroup: 'O+',  status: 'ACTIVE',   admDate: '2022-04-01', joinDate: '2022-04-05', cls: 'CL08', sec: 'A', roll: '02', prevCls: 'CL07', prevSec: 'B',
      guardian: { firstName: 'Deepak',   lastName: 'Joshi',      gender: 'MALE',   phone: '+91 98112 77831', email: null,                       relationship: 'FATHER', occupation: 'Advocate',          employer: 'High Court, Delhi' },
    },
    {
      admNo: 'ADM-2022-003', firstName: 'Meera',    lastName: 'Iyer',       dob: '2012-09-11', gender: 'FEMALE', email: 'meera.iyer@student.in',      phone: null,           bloodGroup: 'B+',  status: 'ACTIVE',   admDate: '2022-04-01', joinDate: '2022-04-05', cls: 'CL08', sec: 'A', roll: '03', prevCls: 'CL07', prevSec: 'A',
      guardian: { firstName: 'Ramesh',   lastName: 'Iyer',       gender: 'MALE',   phone: '+91 94478 12234', email: 'ramesh.iyer@gmail.com',     relationship: 'FATHER', occupation: 'Chartered Accountant', employer: 'Deloitte' },
    },
    {
      admNo: 'ADM-2022-004', firstName: 'Dev',      lastName: 'Malhotra',   dob: '2012-01-17', gender: 'MALE',   email: null,                         phone: null,           bloodGroup: 'AB+', status: 'ACTIVE',   admDate: '2022-04-01', joinDate: '2022-04-05', cls: 'CL08', sec: 'A', roll: '04', prevCls: 'CL07', prevSec: 'A',
      guardian: { firstName: 'Pawan',    lastName: 'Malhotra',   gender: 'MALE',   phone: '+91 98180 90211', email: null,                       relationship: 'FATHER', occupation: 'Army Officer',      employer: 'Indian Army' },
    },
    {
      admNo: 'ADM-2022-005', firstName: 'Riya',     lastName: 'Choudhary',  dob: '2012-05-29', gender: 'FEMALE', email: 'riya.c@student.in',          phone: null,           bloodGroup: 'A-',  status: 'ACTIVE',   admDate: '2022-04-01', joinDate: '2022-04-05', cls: 'CL08', sec: 'A', roll: '05', prevCls: 'CL07', prevSec: 'B',
      guardian: { firstName: 'Nidhi',    lastName: 'Choudhary',  gender: 'FEMALE', phone: '+91 93221 87712', email: 'nidhi.choudhary@gmail.com', relationship: 'MOTHER', occupation: 'Dentist',           employer: 'Private Practice' },
    },

    // ── Class 8 – Section B ──
    {
      admNo: 'ADM-2022-006', firstName: 'Nikhil',   lastName: 'Rana',       dob: '2012-06-12', gender: 'MALE',   email: null,                         phone: null,           bloodGroup: 'O+',  status: 'ACTIVE',   admDate: '2022-04-01', joinDate: '2022-04-05', cls: 'CL08', sec: 'B', roll: '01', prevCls: 'CL07', prevSec: 'B',
      guardian: { firstName: 'Vikas',    lastName: 'Rana',       gender: 'MALE',   phone: '+91 98730 44519', email: null,                       relationship: 'FATHER', occupation: 'Civil Engineer',    employer: 'L&T Construction' },
    },
    {
      admNo: 'ADM-2022-007', firstName: 'Pooja',    lastName: 'Jain',       dob: '2012-10-04', gender: 'FEMALE', email: 'pooja.j@student.in',         phone: null,           bloodGroup: 'B+',  status: 'ACTIVE',   admDate: '2022-04-01', joinDate: '2022-04-05', cls: 'CL08', sec: 'B', roll: '02', prevCls: 'CL07', prevSec: 'A',
      guardian: { firstName: 'Sunil',    lastName: 'Jain',       gender: 'MALE',   phone: '+91 99012 55342', email: 'sunil.jain@gmail.com',      relationship: 'FATHER', occupation: 'Diamond Merchant',  employer: 'Jain Jewellers' },
    },
    {
      admNo: 'ADM-2022-008', firstName: 'Harsh',    lastName: 'Agarwal',    dob: '2012-02-16', gender: 'MALE',   email: null,                         phone: null,           bloodGroup: 'O-',  status: 'ACTIVE',   admDate: '2022-04-01', joinDate: '2022-04-05', cls: 'CL08', sec: 'B', roll: '03', prevCls: 'CL07', prevSec: 'B',
      guardian: { firstName: 'Renu',     lastName: 'Agarwal',    gender: 'FEMALE', phone: '+91 97113 22890', email: null,                       relationship: 'MOTHER', occupation: 'Homemaker',         employer: null },
    },
    {
      admNo: 'ADM-2022-009', firstName: 'Tanya',    lastName: 'Sethi',      dob: '2012-08-27', gender: 'FEMALE', email: 'tanya.s@student.in',         phone: null,           bloodGroup: 'A+',  status: 'ACTIVE',   admDate: '2022-04-01', joinDate: '2022-04-05', cls: 'CL08', sec: 'B', roll: '04', prevCls: 'CL07', prevSec: 'A',
      guardian: { firstName: 'Anil',     lastName: 'Sethi',      gender: 'MALE',   phone: '+91 98110 65302', email: 'anil.sethi@gmail.com',      relationship: 'FATHER', occupation: 'Businessman',       employer: 'Sethi Exports' },
    },

    // ── Class 8 – Section C ──
    {
      admNo: 'ADM-2022-010', firstName: 'Siddharth', lastName: 'Das',       dob: '2012-04-09', gender: 'MALE',   email: null,                         phone: null,           bloodGroup: 'B-',  status: 'ACTIVE',   admDate: '2022-04-01', joinDate: '2022-04-05', cls: 'CL08', sec: 'C', roll: '01', prevCls: 'CL07', prevSec: 'C',
      guardian: { firstName: 'Tapan',    lastName: 'Das',        gender: 'MALE',   phone: '+91 94441 78903', email: null,                       relationship: 'FATHER', occupation: 'Economist',         employer: 'RBI' },
    },
    {
      admNo: 'ADM-2022-011', firstName: 'Nisha',    lastName: 'Pillai',     dob: '2012-12-01', gender: 'FEMALE', email: 'nisha.p@student.in',         phone: null,           bloodGroup: 'AB+', status: 'ACTIVE',   admDate: '2022-04-01', joinDate: '2022-04-05', cls: 'CL08', sec: 'C', roll: '02', prevCls: 'CL07', prevSec: 'C',
      guardian: { firstName: 'Vinayak',  lastName: 'Pillai',     gender: 'MALE',   phone: '+91 98881 23441', email: 'vinayak.pillai@gmail.com',  relationship: 'FATHER', occupation: 'Marine Engineer',   employer: 'Shipping Corp of India' },
    },
    {
      admNo: 'ADM-2022-012', firstName: 'Yash',     lastName: 'Tiwari',     dob: '2012-07-21', gender: 'MALE',   email: null,                         phone: null,           bloodGroup: 'O+',  status: 'ACTIVE',   admDate: '2022-04-01', joinDate: '2022-04-05', cls: 'CL08', sec: 'C', roll: '03',
      guardian: { firstName: 'Shivani',  lastName: 'Tiwari',     gender: 'FEMALE', phone: '+91 93012 56781', email: null,                       relationship: 'MOTHER', occupation: 'School Principal',  employer: 'Kendriya Vidyalaya' },
    },

    // ── Class 9 – Section A ──
    {
      admNo: 'ADM-2021-001', firstName: 'Manav',    lastName: 'Kapoor',     dob: '2011-05-14', gender: 'MALE',   email: 'manav.k@student.in',         phone: null,           bloodGroup: 'A+',  status: 'ACTIVE',   admDate: '2021-04-01', joinDate: '2021-04-06', cls: 'CL09', sec: 'A', roll: '01', prevCls: 'CL08', prevSec: 'A',
      guardian: { firstName: 'Sanjay',   lastName: 'Kapoor',     gender: 'MALE',   phone: '+91 98200 11223', email: 'sanjay.kapoor@gmail.com',   relationship: 'FATHER', occupation: 'Film Producer',     employer: 'Kapoor Films' },
    },
    {
      admNo: 'ADM-2021-002', firstName: 'Akanksha', lastName: 'Tripathi',   dob: '2011-09-28', gender: 'FEMALE', email: 'akanksha.t@student.in',      phone: null,           bloodGroup: 'B+',  status: 'ACTIVE',   admDate: '2021-04-01', joinDate: '2021-04-06', cls: 'CL09', sec: 'A', roll: '02', prevCls: 'CL08', prevSec: 'B',
      guardian: { firstName: 'Asha',     lastName: 'Tripathi',   gender: 'FEMALE', phone: '+91 97221 34892', email: null,                       relationship: 'MOTHER', occupation: 'IAS Officer',       employer: 'Government of UP' },
    },
    {
      admNo: 'ADM-2021-003', firstName: 'Arnav',    lastName: 'Bhatnagar',  dob: '2011-03-07', gender: 'MALE',   email: null,                         phone: null,           bloodGroup: 'O+',  status: 'ACTIVE',   admDate: '2021-04-01', joinDate: '2021-04-06', cls: 'CL09', sec: 'A', roll: '03', prevCls: 'CL08', prevSec: 'A',
      guardian: { firstName: 'Mukesh',   lastName: 'Bhatnagar',  gender: 'MALE',   phone: '+91 98441 77219', email: 'mukesh.bhatnagar@gmail.com', relationship: 'FATHER', occupation: 'Pilot',             employer: 'Air India' },
    },
    {
      admNo: 'ADM-2021-004', firstName: 'Kiara',    lastName: 'Saxena',     dob: '2011-11-15', gender: 'FEMALE', email: 'kiara.s@student.in',         phone: null,           bloodGroup: 'AB+', status: 'ACTIVE',   admDate: '2021-04-01', joinDate: '2021-04-06', cls: 'CL09', sec: 'A', roll: '04', prevCls: 'CL08', prevSec: 'C',
      guardian: { firstName: 'Geeta',    lastName: 'Saxena',     gender: 'FEMALE', phone: '+91 99112 34221', email: 'geeta.saxena@gmail.com',    relationship: 'MOTHER', occupation: 'Psychologist',      employer: 'NIMHANS' },
    },

    // ── Class 9 – Section B ──
    {
      admNo: 'ADM-2021-005', firstName: 'Rahul',    lastName: 'Sharma',     dob: '2011-02-20', gender: 'MALE',   email: 'rahul.sharma@student.in',    phone: null,           bloodGroup: 'B+',  status: 'ACTIVE',   admDate: '2021-04-01', joinDate: '2021-04-06', cls: 'CL09', sec: 'B', roll: '01', prevCls: 'CL08', prevSec: 'B',
      guardian: { firstName: 'Deepak',   lastName: 'Sharma',     gender: 'MALE',   phone: '+91 98221 44112', email: 'deepak.sharma@gmail.com',   relationship: 'FATHER', occupation: 'IT Manager',        employer: 'TCS' },
    },

    // ── Class 10 – Section A ──
    {
      admNo: 'ADM-2020-001', firstName: 'Aisha',    lastName: 'Qureshi',    dob: '2010-06-20', gender: 'FEMALE', email: 'aisha.q@student.in',         phone: null,           bloodGroup: 'A+',  status: 'ACTIVE',   admDate: '2020-04-01', joinDate: '2020-04-07', cls: 'CL10', sec: 'A', roll: '01', prevCls: 'CL09', prevSec: 'A',
      guardian: { firstName: 'Nasreen',  lastName: 'Qureshi',    gender: 'FEMALE', phone: '+91 98220 11876', email: 'nasreen.qureshi@gmail.com', relationship: 'MOTHER', occupation: 'Urdu Professor',    employer: 'Delhi University' },
    },
    {
      admNo: 'ADM-2020-002', firstName: 'Vikram',   lastName: 'Srivastava', dob: '2010-02-11', gender: 'MALE',   email: null,                         phone: null,           bloodGroup: 'O+',  status: 'ACTIVE',   admDate: '2020-04-01', joinDate: '2020-04-07', cls: 'CL10', sec: 'A', roll: '02', prevCls: 'CL09', prevSec: 'B',
      guardian: { firstName: 'Ramendra', lastName: 'Srivastava', gender: 'MALE',   phone: '+91 97441 22318', email: null,                       relationship: 'FATHER', occupation: 'Judge',             employer: 'Allahabad High Court' },
    },
    {
      admNo: 'ADM-2020-003', firstName: 'Simran',   lastName: 'Kaur',       dob: '2010-08-03', gender: 'FEMALE', email: 'simran.kaur@student.in',     phone: null,           bloodGroup: 'B+',  status: 'ACTIVE',   admDate: '2020-04-01', joinDate: '2020-04-07', cls: 'CL10', sec: 'A', roll: '03', prevCls: 'CL09', prevSec: 'A',
      guardian: { firstName: 'Gurpreet', lastName: 'Singh',      gender: 'MALE',   phone: '+91 98001 55789', email: 'gurpreet.singh@gmail.com',  relationship: 'FATHER', occupation: 'Textile Exporter',  employer: 'Kaur Fabrics' },
    },

    // ── Class 10 – Section B (one inactive student) ──
    {
      admNo: 'ADM-2020-004', firstName: 'Parth',    lastName: 'Desai',      dob: '2010-04-14', gender: 'MALE',   email: null,                         phone: null,           bloodGroup: 'O-',  status: 'INACTIVE', admDate: '2020-04-01', joinDate: '2020-04-07', cls: 'CL10', sec: 'B', roll: '01', prevCls: 'CL09', prevSec: 'B',
      guardian: { firstName: 'Kiran',    lastName: 'Desai',      gender: 'FEMALE', phone: '+91 94470 88123', email: null,                       relationship: 'MOTHER', occupation: 'Interior Designer',  employer: 'Desai Interiors' },
    },
  ] as const;

  let studentCount  = 0;
  let guardianCount = 0;
  let enrollCount   = 0;

  for (const s of studentData) {
    // Check if student already exists
    const existing = await prisma.student.findUnique({
      where: { organizationId_admissionNumber: { organizationId: org.id, admissionNumber: s.admNo } },
    });

    let studentId: string;

    if (existing) {
      studentId = existing.id;
    } else {
      // Create person for student
      const person = await prisma.person.create({
        data: {
          firstName:   s.firstName,
          lastName:    s.lastName,
          dateOfBirth: d(s.dob),
          gender:      s.gender,
          email:       s.email ?? null,
          phone:       s.phone ?? null,
          bloodGroup:  s.bloodGroup ?? null,
          nationality: 'Indian',
        },
      });

      // Create student
      const student = await prisma.student.create({
        data: {
          organizationId:  org.id,
          personId:        person.id,
          admissionNumber: s.admNo,
          admissionDate:   d(s.admDate),
          joiningDate:     d(s.joinDate),
          studentStatus:   s.status,
          currentCampusId: campus.id,
        },
      });
      studentId = student.id;
      studentCount++;
    }

    // ── Guardian ─────────────────────────────────────────────────────────────────
    const existingLinks = await prisma.studentGuardian.findMany({ where: { studentId } });

    if (existingLinks.length === 0) {
      const g = s.guardian;
      const gPerson = await prisma.person.create({
        data: {
          firstName: g.firstName,
          lastName:  g.lastName,
          gender:    g.gender,
          phone:     g.phone,
          email:     g.email ?? null,
        },
      });
      const guardian = await prisma.guardian.create({
        data: {
          personId:   gPerson.id,
          occupation: g.occupation ?? null,
          employer:   g.employer  ?? null,
        },
      });
      await prisma.studentGuardian.create({
        data: {
          studentId,
          guardianId:             guardian.id,
          relationship:           g.relationship,
          isPrimary:              true,
          isEmergencyContact:     true,
          canPickup:              true,
          canReceiveNotifications:true,
        },
      });
      guardianCount++;
    }

    // ── Enroll in 2026-27 (current) ──────────────────────────────────────────────
    const clsId     = classes[s.cls]!.id;
    const secId     = sections[s.cls]![s.sec]!.id;

    const existingEnroll = await prisma.studentEnrollment.findUnique({
      where: { studentId_academicYearId: { studentId, academicYearId: ay2627.id } },
    });

    if (!existingEnroll) {
      await prisma.studentEnrollment.create({
        data: {
          studentId,
          academicYearId: ay2627.id,
          campusId:       campus.id,
          classId:        clsId,
          sectionId:      secId,
          rollNumber:     s.roll,
          enrollmentDate: d('2026-04-01'),
          status:         'ACTIVE',
        },
      });
      enrollCount++;
    }

    // ── Enroll in 2025-26 (previous year — for students with prevCls) ────────────
    if ('prevCls' in s && s.prevCls) {
      const prevClsId  = classes[s.prevCls]!.id;
      const prevSecId  = sections[s.prevCls]![s.prevSec!]!.id;

      const existingPrev = await prisma.studentEnrollment.findUnique({
        where: { studentId_academicYearId: { studentId, academicYearId: ay2526.id } },
      });

      if (!existingPrev) {
        await prisma.studentEnrollment.create({
          data: {
            studentId,
            academicYearId:  ay2526.id,
            campusId:        campus.id,
            classId:         prevClsId,
            sectionId:       prevSecId,
            rollNumber:      s.roll,
            enrollmentDate:  d('2025-04-01'),
            status:          'PROMOTED',
            promotionStatus: 'PROMOTED',
          },
        });
        enrollCount++;
      }

      // ── Enroll in 2024-25 for Class 8+ students ──────────────────────────────
      if (parseInt(s.cls.replace('CL0', '').replace('CL', '')) >= 8) {
        const existingPrev2 = await prisma.studentEnrollment.findUnique({
          where: { studentId_academicYearId: { studentId, academicYearId: ay2425.id } },
        });
        if (!existingPrev2) {
          // Two years ago class
          const level = parseInt(s.cls.replace('CL0', '').replace('CL', ''));
          const twoYearsAgoCode = `CL${String(level - 2).padStart(2, '0')}`;
          if (classes[twoYearsAgoCode] && sections[twoYearsAgoCode]?.['A']) {
            await prisma.studentEnrollment.create({
              data: {
                studentId,
                academicYearId:  ay2425.id,
                campusId:        campus.id,
                classId:         classes[twoYearsAgoCode]!.id,
                sectionId:       sections[twoYearsAgoCode]!['A']!.id,
                rollNumber:      s.roll,
                enrollmentDate:  d('2024-04-01'),
                status:          'PROMOTED',
                promotionStatus: 'PROMOTED',
              },
            });
            enrollCount++;
          }
        }
      }
    }
  }

  console.log(`✅  ${studentCount} students created (${studentData.length - studentCount} already existed)`);
  console.log(`✅  ${guardianCount} guardians linked`);
  console.log(`✅  ${enrollCount} enrollments created`);

  console.log('\n🎉  Seeding complete!');
  console.log(`\n   Organization : Sunrise Public School`);
  console.log(`   Campus       : Main Campus`);
  console.log(`   Students     : ${studentData.length} total across Class 6–10`);
  console.log(`   Run \`pnpm db:seed\` again any time — it is idempotent.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
