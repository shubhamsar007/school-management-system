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

  // ── 10. Employees ─────────────────────────────────────────────────────────────

  const [deptMap, desigMap, etMap] = await Promise.all([
    prisma.department.findMany({ where: { organizationId: org.id }, select: { id: true, code: true } }),
    prisma.designation.findMany({ where: { organizationId: org.id }, select: { id: true, code: true } }),
    prisma.employeeType.findMany({ where: { organizationId: org.id }, select: { id: true, code: true } }),
  ]);
  const dept  = Object.fromEntries(deptMap.map((r) => [r.code, r.id]));
  const desig = Object.fromEntries(desigMap.map((r) => [r.code, r.id]));
  const et    = Object.fromEntries(etMap.map((r) => [r.code, r.id]));

  // ── Seed helpers ──
  function pick<T>(arr: readonly T[], idx: number): T { return arr[Math.abs(idx) % arr.length]!; }

  const DEGREES      = ['B.Ed', 'M.Ed', 'B.Sc', 'M.Sc', 'B.A', 'M.A', 'B.Com', 'B.Tech', 'M.Tech', 'Ph.D'] as const;
  const SPECS        = ['Mathematics', 'Physics', 'Chemistry', 'English Literature', 'History', 'Computer Science', 'Physical Education', 'Fine Arts', 'Economics', 'Geography'] as const;
  const INSTITUTES   = ['Delhi University', 'Mumbai University', 'JNU New Delhi', 'BHU Varanasi', 'Bangalore University', 'Pune University', 'Hyderabad University', 'Calcutta University', 'Madras University', 'AMU Aligarh'] as const;
  const BANKS = [
    { name: 'State Bank of India',  ifsc: 'SBIN0000123', acPfx: '10234' },
    { name: 'HDFC Bank',            ifsc: 'HDFC0001234', acPfx: '50123' },
    { name: 'ICICI Bank',           ifsc: 'ICIC0002345', acPfx: '00223' },
    { name: 'Punjab National Bank', ifsc: 'PUNB0003456', acPfx: '24681' },
    { name: 'Bank of Baroda',       ifsc: 'BARB0004567', acPfx: '31245' },
    { name: 'Canara Bank',          ifsc: 'CNRB0005678', acPfx: '41589' },
    { name: 'Axis Bank',            ifsc: 'UTIB0006789', acPfx: '91001' },
    { name: 'Kotak Mahindra Bank',  ifsc: 'KKBK0007890', acPfx: '71234' },
  ] as const;
  const PREV_ORGS      = ['Kendriya Vidyalaya', 'Navodaya Vidyalaya', 'DPS School', 'Ryan International', 'St. Xavier School', 'The Heritage School', 'Modern School', 'Springdales School'] as const;
  const TRAIN_TITLES   = ['Effective Classroom Management', 'Digital Tools for Teaching', 'Child Safety & POCSO', 'NEP 2020 Workshop', 'Activity-Based Learning', 'Assessment Techniques', 'First Aid & Emergency Response', 'Leadership Development', 'Data-Driven Teaching', 'Inclusive Education'] as const;
  const TRAIN_PROVS    = ['CBSE Training Centre', 'NCERT', 'British Council', 'State Education Dept', 'Diksha Platform', 'Internal HR Workshop'] as const;
  const TRAIN_TYPES    = ['INDUCTION', 'PROFESSIONAL_DEVELOPMENT', 'COMPLIANCE', 'SKILLS', 'LEADERSHIP'] as const;
  const CRITERIA_NAMES = ['Subject Knowledge', 'Classroom Management', 'Student Engagement', 'Punctuality & Attendance', 'Team Collaboration', 'Communication Skills', 'Administrative Compliance', 'Innovation in Teaching'] as const;
  const GOAL_TEXTS     = ['Complete NEP 2020 training by December', 'Maintain attendance above 95%', 'Implement 2 new teaching methodologies per term', 'Conduct 1 PTM per month', 'Mentor 2 junior staff', 'Complete digital literacy certification', 'Lead departmental project by year-end', 'Submit research paper to state journal'] as const;
  const ONBOARD_TASKS  = [
    { name: 'Submit identity proof',           category: 'DOCUMENTS',    req: true  },
    { name: 'Submit educational certificates', category: 'DOCUMENTS',    req: true  },
    { name: 'Submit previous employer NOC',    category: 'DOCUMENTS',    req: false },
    { name: 'Complete HR induction session',   category: 'ORIENTATION',  req: true  },
    { name: 'Campus tour',                     category: 'ORIENTATION',  req: false },
    { name: 'IT account setup',                category: 'IT_SETUP',     req: true  },
    { name: 'Email account activation',        category: 'IT_SETUP',     req: true  },
    { name: 'ID card issued',                  category: 'ID_CARD',      req: true  },
    { name: 'Sign employment agreement',       category: 'HR',           req: true  },
    { name: 'Bank account details submitted',  category: 'PAYROLL',      req: true  },
  ];

  const employeeData = [
    // ── Principal & Leadership ──────────────────────────────────────────────────
    { empNo: 'EMP-000', fn: 'Rajendra', ln: 'Kulkarni',  g: 'MALE',   dob: '1968-04-05', email: 'principal@sunriseschool.edu.in',         ph: '+91-9810000001', dept: 'ADMIN', desig: 'PRINCIPAL',    et: 'PERM_NON_TEACH', j: '2000-06-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'O+' },
    { empNo: 'EMP-021', fn: 'Supriya',  ln: 'Kapoor',    g: 'FEMALE', dob: '1972-09-18', email: 'vp@sunriseschool.edu.in',                ph: '+91-9810002100', dept: 'ADMIN', desig: 'VP',           et: 'PERM_NON_TEACH', j: '2005-04-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'A+' },
    // ── Mathematics ─────────────────────────────────────────────────────────────
    { empNo: 'EMP-001', fn: 'Anjali',   ln: 'Sharma',    g: 'FEMALE', dob: '1980-03-15', email: 'anjali.sharma@sunriseschool.edu.in',     ph: '+91-9810001001', dept: 'MATH',  desig: 'HOD',          et: 'PERM_TEACH',     j: '2015-06-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'B+' },
    { empNo: 'EMP-007', fn: 'Sunita',   ln: 'Rao',       g: 'FEMALE', dob: '1979-12-01', email: 'sunita.rao@sunriseschool.edu.in',        ph: '+91-9810001007', dept: 'MATH',  desig: 'SR_TEACHER',   et: 'PERM_TEACH',     j: '2008-04-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'A-' },
    { empNo: 'EMP-012', fn: 'Suresh',   ln: 'Gupta',     g: 'MALE',   dob: '1977-10-08', email: 'suresh.gupta@sunriseschool.edu.in',      ph: '+91-9810001012', dept: 'MATH',  desig: 'TEACHER',      et: 'PERM_TEACH',     j: '2005-04-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'O+' },
    { empNo: 'EMP-028', fn: 'Tejal',    ln: 'Shah',      g: 'FEMALE', dob: '1985-06-12', email: 'tejal.shah@sunriseschool.edu.in',        ph: '+91-9810002800', dept: 'MATH',  desig: 'SR_TEACHER',   et: 'PERM_TEACH',     j: '2013-04-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'B-' },
    { empNo: 'EMP-029', fn: 'Prem',     ln: 'Chandra',   g: 'MALE',   dob: '1990-03-22', email: 'prem.chandra@sunriseschool.edu.in',      ph: '+91-9810002900', dept: 'MATH',  desig: 'TEACHER',      et: 'PERM_TEACH',     j: '2016-07-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'A+' },
    { empNo: 'EMP-030', fn: 'Fatima',   ln: 'Siddiqui',  g: 'FEMALE', dob: '1992-11-08', email: 'fatima.siddiqui@sunriseschool.edu.in',  ph: '+91-9810003000', dept: 'MATH',  desig: 'TEACHER',      et: 'PERM_TEACH',     j: '2018-04-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'AB+' },
    { empNo: 'EMP-055', fn: 'Rohit',    ln: 'Saxena',    g: 'MALE',   dob: '1994-07-30', email: 'rohit.saxena@sunriseschool.edu.in',      ph: '+91-9810005500', dept: 'MATH',  desig: 'TEACHER',      et: 'PERM_TEACH',     j: '2021-06-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'O-' },
    { empNo: 'EMP-031', fn: 'Arun',     ln: 'Bhat',      g: 'MALE',   dob: '1997-04-15', email: 'arun.bhat@sunriseschool.edu.in',         ph: '+91-9810003100', dept: 'MATH',  desig: 'ASST_TEACHER', et: 'CONTRACT_TEACH', j: '2023-06-01', status: 'PROBATION',      eType: 'FULL_TIME', bg: 'B+' },
    { empNo: 'EMP-060', fn: 'Shreya',   ln: 'Pillai',    g: 'FEMALE', dob: '1999-02-18', email: 'shreya.pillai@sunriseschool.edu.in',    ph: '+91-9810006000', dept: 'MATH',  desig: 'ASST_TEACHER', et: 'CONTRACT_TEACH', j: '2024-06-01', status: 'PROBATION',      eType: 'FULL_TIME', bg: 'A+' },
    // ── Science ──────────────────────────────────────────────────────────────────
    { empNo: 'EMP-022', fn: 'Narender', ln: 'Kumar',     g: 'MALE',   dob: '1973-05-25', email: 'narender.kumar@sunriseschool.edu.in',   ph: '+91-9810002200', dept: 'SCI',   desig: 'HOD',          et: 'PERM_TEACH',     j: '2007-04-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'B+' },
    { empNo: 'EMP-002', fn: 'Ramesh',   ln: 'Verma',     g: 'MALE',   dob: '1975-07-22', email: 'ramesh.verma@sunriseschool.edu.in',     ph: '+91-9810001002', dept: 'SCI',   desig: 'SR_TEACHER',   et: 'PERM_TEACH',     j: '2010-04-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'O+' },
    { empNo: 'EMP-032', fn: 'Vinita',   ln: 'Patel',     g: 'FEMALE', dob: '1987-09-14', email: 'vinita.patel@sunriseschool.edu.in',     ph: '+91-9810003200', dept: 'SCI',   desig: 'TEACHER',      et: 'PERM_TEACH',     j: '2015-07-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'A+' },
    { empNo: 'EMP-033', fn: 'Gopal',    ln: 'Soni',      g: 'MALE',   dob: '1989-02-07', email: 'gopal.soni@sunriseschool.edu.in',       ph: '+91-9810003300', dept: 'SCI',   desig: 'TEACHER',      et: 'PERM_TEACH',     j: '2017-04-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'O-' },
    { empNo: 'EMP-056', fn: 'Varsha',   ln: 'Gupta',     g: 'FEMALE', dob: '1993-12-20', email: 'varsha.gupta@sunriseschool.edu.in',     ph: '+91-9810005600', dept: 'SCI',   desig: 'TEACHER',      et: 'PERM_TEACH',     j: '2021-07-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'B+' },
    { empNo: 'EMP-008', fn: 'Kiran',    ln: 'Mehta',     g: 'MALE',   dob: '1992-04-19', email: 'kiran.mehta@sunriseschool.edu.in',      ph: '+91-9810001008', dept: 'SCI',   desig: 'ASST_TEACHER', et: 'CONTRACT_TEACH', j: '2022-06-01', status: 'PROBATION',      eType: 'FULL_TIME', bg: 'A-' },
    { empNo: 'EMP-034', fn: 'Mamta',    ln: 'Rawat',     g: 'FEMALE', dob: '1998-07-11', email: 'mamta.rawat@sunriseschool.edu.in',      ph: '+91-9810003400', dept: 'SCI',   desig: 'ASST_TEACHER', et: 'CONTRACT_TEACH', j: '2024-04-01', status: 'PROBATION',      eType: 'FULL_TIME', bg: 'AB-' },
    { empNo: 'EMP-015', fn: 'Lakshmi',  ln: 'Pillai',    g: 'FEMALE', dob: '1986-09-29', email: 'lakshmi.pillai@sunriseschool.edu.in',  ph: '+91-9810001015', dept: 'SCI',   desig: 'LAB_ASST',     et: 'PERM_NON_TEACH', j: '2013-07-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'A+' },
    { empNo: 'EMP-053', fn: 'Nirmala',  ln: 'Thakur',    g: 'FEMALE', dob: '1991-03-05', email: 'nirmala.thakur@sunriseschool.edu.in',  ph: '+91-9810005300', dept: 'SCI',   desig: 'LAB_ASST',     et: 'PERM_NON_TEACH', j: '2017-07-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'O+' },
    { empNo: 'EMP-054', fn: 'Deepak',   ln: 'Malhotra',  g: 'MALE',   dob: '1995-10-28', email: 'deepak.malhotra@sunriseschool.edu.in', ph: '+91-9810005400', dept: 'SCI',   desig: 'LAB_ASST',     et: 'CONTRACT_NON',   j: '2022-07-01', status: 'PROBATION',      eType: 'FULL_TIME', bg: 'B-' },
    { empNo: 'EMP-020', fn: 'Pooja',    ln: 'Chauhan',   g: 'FEMALE', dob: '1996-12-25', email: 'pooja.chauhan@sunriseschool.edu.in',   ph: '+91-9810001020', dept: 'SCI',   desig: 'LAB_ASST',     et: 'CONTRACT_NON',   j: '2024-01-15', status: 'PROBATION',      eType: 'FULL_TIME', bg: 'A+' },
    { empNo: 'EMP-061', fn: 'Mukesh',   ln: 'Jha',       g: 'MALE',   dob: '1998-05-14', email: 'mukesh.jha@sunriseschool.edu.in',      ph: '+91-9810006100', dept: 'SCI',   desig: 'ASST_TEACHER', et: 'CONTRACT_TEACH', j: '2024-07-01', status: 'PROBATION',      eType: 'FULL_TIME', bg: 'O+' },
    // ── English ──────────────────────────────────────────────────────────────────
    { empNo: 'EMP-023', fn: 'Divya',    ln: 'Menon',     g: 'FEMALE', dob: '1976-11-30', email: 'divya.menon@sunriseschool.edu.in',      ph: '+91-9810002300', dept: 'ENG',   desig: 'HOD',          et: 'PERM_TEACH',     j: '2009-04-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'B+' },
    { empNo: 'EMP-009', fn: 'Deepa',    ln: 'Krishnan',  g: 'FEMALE', dob: '1987-08-23', email: 'deepa.krishnan@sunriseschool.edu.in',  ph: '+91-9810001009', dept: 'ENG',   desig: 'SR_TEACHER',   et: 'PERM_TEACH',     j: '2014-04-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'A+' },
    { empNo: 'EMP-003', fn: 'Priya',    ln: 'Nair',      g: 'FEMALE', dob: '1988-11-05', email: 'priya.nair@sunriseschool.edu.in',      ph: '+91-9810001003', dept: 'ENG',   desig: 'TEACHER',      et: 'PERM_TEACH',     j: '2018-07-15', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'O+' },
    { empNo: 'EMP-035', fn: 'Manish',   ln: 'Pandey',    g: 'MALE',   dob: '1990-08-19', email: 'manish.pandey@sunriseschool.edu.in',   ph: '+91-9810003500', dept: 'ENG',   desig: 'TEACHER',      et: 'PERM_TEACH',     j: '2016-04-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'B+' },
    { empNo: 'EMP-036', fn: 'Smita',    ln: 'Naik',      g: 'FEMALE', dob: '1993-01-14', email: 'smita.naik@sunriseschool.edu.in',      ph: '+91-9810003600', dept: 'ENG',   desig: 'TEACHER',      et: 'PERM_TEACH',     j: '2019-06-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'A-' },
    { empNo: 'EMP-057', fn: 'Alka',     ln: 'Jain',      g: 'FEMALE', dob: '1995-09-03', email: 'alka.jain@sunriseschool.edu.in',       ph: '+91-9810005700', dept: 'ENG',   desig: 'TEACHER',      et: 'PERM_TEACH',     j: '2022-04-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'O+' },
    { empNo: 'EMP-013', fn: 'Neha',     ln: 'Agarwal',   g: 'FEMALE', dob: '1995-03-22', email: 'neha.agarwal@sunriseschool.edu.in',    ph: '+91-9810001013', dept: 'ENG',   desig: 'ASST_TEACHER', et: 'VISITING',       j: '2024-06-01', status: 'ACTIVE',         eType: 'PART_TIME', bg: 'B+' },
    { empNo: 'EMP-037', fn: 'Harish',   ln: 'Bisht',     g: 'MALE',   dob: '1997-06-22', email: 'harish.bisht@sunriseschool.edu.in',    ph: '+91-9810003700', dept: 'ENG',   desig: 'ASST_TEACHER', et: 'CONTRACT_TEACH', j: '2024-07-01', status: 'PROBATION',      eType: 'FULL_TIME', bg: 'AB+' },
    { empNo: 'EMP-062', fn: 'Leela',    ln: 'Prasad',    g: 'FEMALE', dob: '1999-11-09', email: 'leela.prasad@sunriseschool.edu.in',    ph: '+91-9810006200', dept: 'ENG',   desig: 'ASST_TEACHER', et: 'CONTRACT_TEACH', j: '2024-07-01', status: 'PROBATION',      eType: 'FULL_TIME', bg: 'A+' },
    // ── Social Studies ───────────────────────────────────────────────────────────
    { empNo: 'EMP-024', fn: 'Rakesh',   ln: 'Tripathi',  g: 'MALE',   dob: '1971-08-14', email: 'rakesh.tripathi@sunriseschool.edu.in', ph: '+91-9810002400', dept: 'SST',   desig: 'HOD',          et: 'PERM_TEACH',     j: '2006-04-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'B+' },
    { empNo: 'EMP-014', fn: 'Mohan',    ln: 'Das',       g: 'MALE',   dob: '1982-07-11', email: 'mohan.das@sunriseschool.edu.in',        ph: '+91-9810001014', dept: 'SST',   desig: 'SR_TEACHER',   et: 'PERM_TEACH',     j: '2011-04-01', status: 'ON_LEAVE',       eType: 'FULL_TIME', bg: 'O-' },
    { empNo: 'EMP-038', fn: 'Gita',     ln: 'Rao',       g: 'FEMALE', dob: '1983-04-27', email: 'gita.rao@sunriseschool.edu.in',         ph: '+91-9810003800', dept: 'SST',   desig: 'SR_TEACHER',   et: 'PERM_TEACH',     j: '2012-07-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'A+' },
    { empNo: 'EMP-004', fn: 'Vikram',   ln: 'Singh',     g: 'MALE',   dob: '1985-02-28', email: 'vikram.singh@sunriseschool.edu.in',    ph: '+91-9810001004', dept: 'SST',   desig: 'TEACHER',      et: 'PERM_TEACH',     j: '2016-04-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'B-' },
    { empNo: 'EMP-039', fn: 'Ajay',     ln: 'Bansal',    g: 'MALE',   dob: '1989-10-15', email: 'ajay.bansal@sunriseschool.edu.in',     ph: '+91-9810003900', dept: 'SST',   desig: 'TEACHER',      et: 'PERM_TEACH',     j: '2017-07-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'O+' },
    { empNo: 'EMP-040', fn: 'Ritu',     ln: 'Sharma',    g: 'FEMALE', dob: '1993-06-02', email: 'ritu.sharma@sunriseschool.edu.in',     ph: '+91-9810004000', dept: 'SST',   desig: 'TEACHER',      et: 'PERM_TEACH',     j: '2020-04-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'A+' },
    { empNo: 'EMP-058', fn: 'Naveen',   ln: 'Rao',       g: 'MALE',   dob: '1995-03-17', email: 'naveen.rao@sunriseschool.edu.in',      ph: '+91-9810005800', dept: 'SST',   desig: 'TEACHER',      et: 'PERM_TEACH',     j: '2022-06-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'B+' },
    { empNo: 'EMP-065', fn: 'Tara',     ln: 'Devi',      g: 'FEMALE', dob: '1978-09-01', email: 'tara.devi@sunriseschool.edu.in',       ph: '+91-9810006500', dept: 'SST',   desig: 'TEACHER',      et: 'PERM_TEACH',     j: '2008-04-01', status: 'EXIT_INITIATED', eType: 'FULL_TIME', bg: 'O+' },
    // ── Computer Science ─────────────────────────────────────────────────────────
    { empNo: 'EMP-025', fn: 'Anjana',   ln: 'Sinha',     g: 'FEMALE', dob: '1979-12-20', email: 'anjana.sinha@sunriseschool.edu.in',    ph: '+91-9810002500', dept: 'CS',    desig: 'HOD',          et: 'PERM_TEACH',     j: '2011-07-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'A-' },
    { empNo: 'EMP-042', fn: 'Sandhya',  ln: 'Tyagi',     g: 'FEMALE', dob: '1984-07-09', email: 'sandhya.tyagi@sunriseschool.edu.in',  ph: '+91-9810004200', dept: 'CS',    desig: 'SR_TEACHER',   et: 'PERM_TEACH',     j: '2014-04-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'B+' },
    { empNo: 'EMP-005', fn: 'Meena',    ln: 'Iyer',      g: 'FEMALE', dob: '1990-06-10', email: 'meena.iyer@sunriseschool.edu.in',      ph: '+91-9810001005', dept: 'CS',    desig: 'TEACHER',      et: 'PERM_TEACH',     j: '2019-06-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'O+' },
    { empNo: 'EMP-041', fn: 'Prakash',  ln: 'Mishra',    g: 'MALE',   dob: '1991-04-23', email: 'prakash.mishra@sunriseschool.edu.in', ph: '+91-9810004100', dept: 'CS',    desig: 'TEACHER',      et: 'PERM_TEACH',     j: '2018-07-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'A+' },
    { empNo: 'EMP-059', fn: 'Pooja',    ln: 'Mathur',    g: 'FEMALE', dob: '1994-08-16', email: 'pooja.mathur@sunriseschool.edu.in',   ph: '+91-9810005900', dept: 'CS',    desig: 'TEACHER',      et: 'PERM_TEACH',     j: '2022-04-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'B-' },
    { empNo: 'EMP-010', fn: 'Rahul',    ln: 'Joshi',     g: 'MALE',   dob: '1993-01-30', email: 'rahul.joshi@sunriseschool.edu.in',    ph: '+91-9810001010', dept: 'CS',    desig: 'ASST_TEACHER', et: 'CONTRACT_TEACH', j: '2023-06-01', status: 'PROBATION',      eType: 'FULL_TIME', bg: 'O+' },
    // ── Physical Education ───────────────────────────────────────────────────────
    { empNo: 'EMP-026', fn: 'Baldev',   ln: 'Rana',      g: 'MALE',   dob: '1975-01-30', email: 'baldev.rana@sunriseschool.edu.in',     ph: '+91-9810002600', dept: 'PE',    desig: 'HOD',          et: 'PERM_TEACH',     j: '2008-07-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'B+' },
    { empNo: 'EMP-006', fn: 'Arjun',    ln: 'Patel',     g: 'MALE',   dob: '1983-09-14', email: 'arjun.patel@sunriseschool.edu.in',    ph: '+91-9810001006', dept: 'PE',    desig: 'TEACHER',      et: 'PERM_TEACH',     j: '2012-07-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'A+' },
    { empNo: 'EMP-043', fn: 'Rahul',    ln: 'Bhatt',     g: 'MALE',   dob: '1993-07-07', email: 'rahul.bhatt@sunriseschool.edu.in',    ph: '+91-9810004300', dept: 'PE',    desig: 'TEACHER',      et: 'PERM_TEACH',     j: '2019-04-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'O+' },
    { empNo: 'EMP-044', fn: 'Anjali',   ln: 'Verma',     g: 'FEMALE', dob: '1996-05-23', email: 'anjali.verma@sunriseschool.edu.in',   ph: '+91-9810004400', dept: 'PE',    desig: 'TEACHER',      et: 'PERM_TEACH',     j: '2022-07-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'A-' },
    // ── Arts & Craft ─────────────────────────────────────────────────────────────
    { empNo: 'EMP-027', fn: 'Madhuri',  ln: 'Desai',     g: 'FEMALE', dob: '1978-03-14', email: 'madhuri.desai@sunriseschool.edu.in',  ph: '+91-9810002700', dept: 'ARTS',  desig: 'HOD',          et: 'PERM_TEACH',     j: '2010-04-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'A+' },
    { empNo: 'EMP-011', fn: 'Kavya',    ln: 'Reddy',     g: 'FEMALE', dob: '1991-05-17', email: 'kavya.reddy@sunriseschool.edu.in',    ph: '+91-9810001011', dept: 'ARTS',  desig: 'TEACHER',      et: 'PERM_TEACH',     j: '2020-07-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'B+' },
    { empNo: 'EMP-045', fn: 'Vinod',    ln: 'Saxena',    g: 'MALE',   dob: '1988-12-01', email: 'vinod.saxena@sunriseschool.edu.in',   ph: '+91-9810004500', dept: 'ARTS',  desig: 'TEACHER',      et: 'PERM_TEACH',     j: '2016-07-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'O+' },
    { empNo: 'EMP-046', fn: 'Preethi',  ln: 'Kumar',     g: 'FEMALE', dob: '1992-09-25', email: 'preethi.kumar@sunriseschool.edu.in', ph: '+91-9810004600', dept: 'ARTS',  desig: 'TEACHER',      et: 'PERM_TEACH',     j: '2019-04-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'B-' },
    // ── Administration ───────────────────────────────────────────────────────────
    { empNo: 'EMP-016', fn: 'Geeta',    ln: 'Bose',      g: 'FEMALE', dob: '1984-02-14', email: 'geeta.bose@sunriseschool.edu.in',     ph: '+91-9810001016', dept: 'ADMIN', desig: 'ADMIN_OFF',    et: 'PERM_NON_TEACH', j: '2017-04-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'A+' },
    { empNo: 'EMP-047', fn: 'Ramesh',   ln: 'Babu',      g: 'MALE',   dob: '1980-07-20', email: 'ramesh.babu@sunriseschool.edu.in',    ph: '+91-9810004700', dept: 'ADMIN', desig: 'ADMIN_OFF',    et: 'PERM_NON_TEACH', j: '2014-04-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'O+' },
    { empNo: 'EMP-048', fn: 'Archana',  ln: 'Singh',     g: 'FEMALE', dob: '1990-03-08', email: 'archana.singh@sunriseschool.edu.in', ph: '+91-9810004800', dept: 'ADMIN', desig: 'ADMIN_OFF',    et: 'PERM_NON_TEACH', j: '2021-04-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'B+' },
    { empNo: 'EMP-017', fn: 'Santosh',  ln: 'Tiwari',    g: 'MALE',   dob: '1989-11-20', email: 'santosh.tiwari@sunriseschool.edu.in', ph: '+91-9810001017', dept: 'ADMIN', desig: 'ACCOUNTANT',   et: 'PERM_NON_TEACH', j: '2019-04-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'A+' },
    { empNo: 'EMP-049', fn: 'Sunil',    ln: 'Aggarwal',  g: 'MALE',   dob: '1981-06-15', email: 'sunil.aggarwal@sunriseschool.edu.in', ph: '+91-9810004900', dept: 'ADMIN', desig: 'ACCOUNTANT',   et: 'PERM_NON_TEACH', j: '2012-04-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'B+' },
    { empNo: 'EMP-050', fn: 'Kavita',   ln: 'Yadav',     g: 'FEMALE', dob: '1986-08-28', email: 'kavita.yadav@sunriseschool.edu.in',  ph: '+91-9810005000', dept: 'ADMIN', desig: 'ACCOUNTANT',   et: 'CONTRACT_NON',   j: '2018-07-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'O+' },
    { empNo: 'EMP-018', fn: 'Usha',     ln: 'Menon',     g: 'FEMALE', dob: '1981-06-03', email: 'usha.menon@sunriseschool.edu.in',     ph: '+91-9810001018', dept: 'ADMIN', desig: 'LIBRARIAN',    et: 'PERM_NON_TEACH', j: '2009-07-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'A-' },
    { empNo: 'EMP-051', fn: 'Rajan',    ln: 'Pillai',    g: 'MALE',   dob: '1985-11-12', email: 'rajan.pillai@sunriseschool.edu.in',  ph: '+91-9810005100', dept: 'ADMIN', desig: 'LIBRARIAN',    et: 'PERM_NON_TEACH', j: '2016-04-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'B+' },
    { empNo: 'EMP-019', fn: 'Dinesh',   ln: 'Yadav',     g: 'MALE',   dob: '1994-08-16', email: 'dinesh.yadav@sunriseschool.edu.in',  ph: '+91-9810001019', dept: 'ADMIN', desig: 'COUNSELLOR',   et: 'CONTRACT_NON',   j: '2023-04-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'O+' },
    { empNo: 'EMP-052', fn: 'Sneha',    ln: 'Bose',      g: 'FEMALE', dob: '1991-07-04', email: 'sneha.bose@sunriseschool.edu.in',    ph: '+91-9810005200', dept: 'ADMIN', desig: 'COUNSELLOR',   et: 'PERM_NON_TEACH', j: '2020-07-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'A+' },
    { empNo: 'EMP-063', fn: 'Ravi',     ln: 'Shankar',   g: 'MALE',   dob: '1975-02-28', email: 'ravi.shankar@sunriseschool.edu.in',  ph: '+91-9810006300', dept: 'ADMIN', desig: 'PEON',         et: 'PERM_NON_TEACH', j: '2003-06-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'B+' },
    { empNo: 'EMP-064', fn: 'Kamal',    ln: 'Mishra',    g: 'MALE',   dob: '1982-10-19', email: 'kamal.mishra@sunriseschool.edu.in',  ph: '+91-9810006400', dept: 'ADMIN', desig: 'PEON',         et: 'PERM_NON_TEACH', j: '2015-04-01', status: 'ACTIVE',         eType: 'FULL_TIME', bg: 'O-' },
  ];

  // ── Create employees, collect IDs ─────────────────────────────────────────────
  type EmpInfo = { id: string; joining: string; status: string; desig: string; i: number };
  const empIdMap: Record<string, EmpInfo> = {};
  let empCount = 0;

  for (let i = 0; i < employeeData.length; i++) {
    const e = employeeData[i]!;
    let emp = await prisma.employee.findFirst({ where: { organizationId: org.id, employeeNumber: e.empNo } });

    if (!emp) {
      const person = await prisma.person.create({
        data: {
          firstName:   e.fn,
          lastName:    e.ln,
          gender:      e.g,
          dateOfBirth: d(e.dob),
          email:       e.email,
          phone:       e.ph,
          bloodGroup:  e.bg,
          nationality: 'Indian',
        },
      });
      const probation = e.status === 'PROBATION';
      emp = await prisma.employee.create({
        data: {
          organizationId:   org.id,
          personId:         person.id,
          employeeNumber:   e.empNo,
          joiningDate:      d(e.j),
          employmentStatus: e.status,
          employmentType:   e.eType,
          campusId:         campus.id,
          departmentId:     dept[e.dept]   ?? null,
          designationId:    desig[e.desig] ?? null,
          employeeTypeId:   et[e.et]       ?? null,
          ...(probation ? {
            probationStart: d(e.j),
            probationEnd:   new Date(new Date(e.j).setMonth(new Date(e.j).getMonth() + 6)),
          } : {}),
        },
      });
      empCount++;
    }
    empIdMap[e.empNo] = { id: emp.id, joining: e.j, status: e.status, desig: e.desig, i };
  }
  console.log(`✅  ${employeeData.length} employees (${empCount} created)`);

  // ── Sub-data for all employees ────────────────────────────────────────────────
  let qualCount = 0, expCount = 0, bankCount = 0, assetCount = 0;
  let trainCount = 0, perfCount = 0, eventCount = 0, onboardCount = 0;

  for (const [, info] of Object.entries(empIdMap)) {
    const { id: employeeId, joining, status, desig: desigCode, i } = info;
    const joinYear  = parseInt(joining.slice(0, 4));
    const isVeteran = joinYear <= 2010;
    const isSenior  = joinYear <= 2015;
    const isHOD     = ['HOD', 'PRINCIPAL', 'VP'].includes(desigCode);
    const isSrRole  = ['SR_TEACHER', 'HOD', 'PRINCIPAL', 'VP'].includes(desigCode);
    const isLaborOrPeon = ['PEON', 'LAB_ASST'].includes(desigCode);

    // ── Qualifications ──────────────────────────────────────────────────────────
    if (await prisma.employeeQualification.count({ where: { employeeId } }) === 0) {
      await prisma.employeeQualification.create({ data: {
        employeeId,
        degree:             pick(DEGREES, i),
        institution:        pick(INSTITUTES, i),
        specialization:     pick(SPECS, i),
        startYear:          joinYear - 7,
        endYear:            joinYear - 5,
        percentage:         65 + (i % 20),
        verificationStatus: 'VERIFIED',
      }});
      await prisma.employeeQualification.create({ data: {
        employeeId,
        degree:             'B.Ed',
        institution:        pick(INSTITUTES, i + 3),
        startYear:          joinYear - 4,
        endYear:            joinYear - 3,
        percentage:         70 + (i % 15),
        verificationStatus: 'VERIFIED',
      }});
      if (isSenior || isHOD) {
        await prisma.employeeQualification.create({ data: {
          employeeId,
          degree:             isHOD ? 'Ph.D' : 'M.Ed',
          institution:        pick(INSTITUTES, i + 5),
          specialization:     pick(SPECS, i + 2),
          startYear:          joinYear - 3,
          endYear:            joinYear - 1,
          percentage:         72 + (i % 18),
          verificationStatus: isHOD ? 'VERIFIED' : 'PENDING',
        }});
      }
      qualCount++;
    }

    // ── Experience ──────────────────────────────────────────────────────────────
    if (await prisma.employeeExperience.count({ where: { employeeId } }) === 0 && isSenior) {
      await prisma.employeeExperience.create({ data: {
        employeeId,
        organization:    pick(PREV_ORGS, i),
        designation:     isSrRole ? 'Senior Teacher' : 'Teacher',
        startDate:       d(`${joinYear - 5}-04-01`),
        endDate:         d(`${joinYear - 1}-03-31`),
        reasonForLeaving: 'Better opportunity',
      }});
      if (isVeteran) {
        await prisma.employeeExperience.create({ data: {
          employeeId,
          organization:    pick(PREV_ORGS, i + 4),
          designation:     'Teacher',
          startDate:       d(`${joinYear - 10}-04-01`),
          endDate:         d(`${joinYear - 6}-03-31`),
          reasonForLeaving: 'Career growth',
        }});
      }
      expCount++;
    }

    // ── Bank Detail ─────────────────────────────────────────────────────────────
    if (await prisma.employeeBankDetail.count({ where: { employeeId } }) === 0) {
      const bank = pick(BANKS, i);
      await prisma.employeeBankDetail.create({ data: {
        employeeId,
        bankName:      bank.name,
        accountNumber: `${bank.acPfx}${String(i + 100).padStart(6, '0')}`,
        ifscCode:      bank.ifsc,
        accountType:   'SAVINGS',
        isPrimary:     true,
      }});
      bankCount++;
    }

    // ── Assets ──────────────────────────────────────────────────────────────────
    if (await prisma.employeeAsset.count({ where: { employeeId } }) === 0) {
      await prisma.employeeAsset.create({ data: {
        organizationId: org.id, employeeId,
        assetType: 'ID_CARD', assetCode: `ID-EMP${String(i).padStart(3,'0')}`,
        description: 'Employee Photo ID Card', issueDate: d(joining), condition: 'GOOD',
      }});
      if (!isLaborOrPeon) {
        await prisma.employeeAsset.create({ data: {
          organizationId: org.id, employeeId,
          assetType: 'LAPTOP', assetCode: `LT-EMP${String(i).padStart(3,'0')}`,
          description: 'Dell Latitude 5520', issueDate: d(joining), condition: 'GOOD', issuedBy: 'IT Department',
        }});
      }
      if (isSrRole) {
        await prisma.employeeAsset.create({ data: {
          organizationId: org.id, employeeId,
          assetType: 'KEY', assetCode: `KEY-EMP${String(i).padStart(3,'0')}`,
          description: 'Department room key', issueDate: d(joining), condition: 'GOOD',
        }});
      }
      assetCount++;
    }

    // ── Training Records ────────────────────────────────────────────────────────
    if (await prisma.trainingRecord.count({ where: { employeeId } }) === 0) {
      const numTrainings = isVeteran ? 3 : isSenior ? 2 : 1;
      for (let t = 0; t < numTrainings; t++) {
        const yr = Math.min(joinYear + t, 2025);
        await prisma.trainingRecord.create({ data: {
          employeeId,
          title:              pick(TRAIN_TITLES, i + t),
          trainingType:       pick(TRAIN_TYPES, i + t),
          provider:           pick(TRAIN_PROVS, i + t),
          startDate:          d(`${yr}-07-01`),
          endDate:            d(`${yr}-07-05`),
          durationHours:      8 + (t * 8),
          verificationStatus: 'VERIFIED',
        }});
      }
      trainCount++;
    }

    // ── Performance Review ──────────────────────────────────────────────────────
    if (await prisma.performanceReview.count({ where: { employeeId } }) === 0 && joinYear <= 2024) {
      const rating = parseFloat((3.5 + ((i * 3) % 15) / 10).toFixed(1));
      const review = await prisma.performanceReview.create({ data: {
        organizationId: org.id, employeeId,
        academicYearId: ay2526.id,
        reviewType:     'ANNUAL',
        reviewedBy:     'Principal',
        reviewDate:     d('2026-03-15'),
        overallRating:  rating,
        remarks:        'Consistent performance. Recommended for continued engagement.',
        status:         'COMPLETED',
      }});
      for (let c = 0; c < 4; c++) {
        await prisma.performanceCriteria.create({ data: {
          reviewId:     review.id,
          criteriaName: pick(CRITERIA_NAMES, i + c),
          rating:       parseFloat((3.5 + ((i + c) % 15) / 10).toFixed(1)),
        }});
      }
      for (let g = 0; g < 2; g++) {
        await prisma.performanceGoal.create({ data: {
          reviewId: review.id,
          goal:     pick(GOAL_TEXTS, i + g),
          status:   g === 0 ? 'COMPLETED' : 'IN_PROGRESS',
        }});
      }
      perfCount++;
    }

    // ── Lifecycle Events ────────────────────────────────────────────────────────
    if (await prisma.employeeLifecycleEvent.count({ where: { employeeId } }) === 0) {
      await prisma.employeeLifecycleEvent.create({ data: {
        employeeId, eventType: 'JOINED', fromStatus: null, toStatus: 'ONBOARDING',
        effectiveDate: d(joining), reason: 'New hire', performedBy: 'HR Department',
      }});
      if (joinYear <= 2023) {
        const confirmDate = new Date(joining);
        confirmDate.setMonth(confirmDate.getMonth() + 6);
        await prisma.employeeLifecycleEvent.create({ data: {
          employeeId, eventType: 'CONFIRMED', fromStatus: 'PROBATION', toStatus: 'ACTIVE',
          effectiveDate: confirmDate, reason: 'Probation completed successfully', performedBy: 'Principal',
        }});
      }
      if (isVeteran || (isSenior && isHOD)) {
        const promoteDate = new Date(joining);
        promoteDate.setFullYear(promoteDate.getFullYear() + 5);
        await prisma.employeeLifecycleEvent.create({ data: {
          employeeId, eventType: 'PROMOTED', fromStatus: 'ACTIVE', toStatus: 'ACTIVE',
          effectiveDate: promoteDate, reason: 'Exceptional performance and seniority', performedBy: 'Management',
        }});
      }
      if (status === 'EXIT_INITIATED') {
        await prisma.employeeLifecycleEvent.create({ data: {
          employeeId, eventType: 'EXIT_INITIATED', fromStatus: 'ACTIVE', toStatus: 'EXIT_INITIATED',
          effectiveDate: d('2026-08-01'), reason: 'Relocation to another city', performedBy: 'HR Department',
        }});
      }
      if (status === 'ON_LEAVE') {
        await prisma.employeeLifecycleEvent.create({ data: {
          employeeId, eventType: 'ON_LEAVE', fromStatus: 'ACTIVE', toStatus: 'ON_LEAVE',
          effectiveDate: d('2026-06-01'), reason: 'Medical leave approved', performedBy: 'HR Department',
        }});
      }
      eventCount++;
    }

    // ── Onboarding (joining 2022+) ──────────────────────────────────────────────
    if (joinYear >= 2022 && !(await prisma.employeeOnboarding.findFirst({ where: { employeeId } }))) {
      const isNewJoiner = joinYear >= 2024;
      const onboarding  = await prisma.employeeOnboarding.create({ data: {
        employeeId,
        status:      isNewJoiner ? 'IN_PROGRESS' : 'COMPLETED',
        completedAt: isNewJoiner ? null : d(`${joinYear}-10-01`),
      }});
      for (let t = 0; t < ONBOARD_TASKS.length; t++) {
        const task        = ONBOARD_TASKS[t]!;
        const isDone      = !isNewJoiner || t < 6;
        await prisma.onboardingTask.create({ data: {
          onboardingId: onboarding.id,
          taskName:     task.name,
          category:     task.category,
          isRequired:   task.req,
          isCompleted:  isDone,
          completedAt:  isDone ? d(`${joinYear}-08-15`) : null,
          completedBy:  isDone ? 'HR Department' : null,
        }});
      }
      onboardCount++;
    }
  }

  console.log(`✅  Sub-data: qualifications(${qualCount}), experience(${expCount}), bank(${bankCount}), assets(${assetCount})`);
  console.log(`✅  Sub-data: training(${trainCount}), performance(${perfCount}), events(${eventCount}), onboarding(${onboardCount})`);

  console.log('\n🎉  Seeding complete!');
  console.log(`\n   Organization : Sunrise Public School`);
  console.log(`   Campus       : Main Campus`);
  console.log(`   Students     : ${studentData.length} total across Class 6–10`);
  console.log(`   Run \`pnpm db:seed\` again any time — it is idempotent.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
