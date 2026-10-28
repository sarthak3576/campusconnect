import { PrismaClient } from '@prisma/client';
import { Role, ResourceType, ResourceStatus, BookingStatus, Priority, ComplaintStatus } from '../src/types/enums';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('password123', 10);

  // Clean up existing records for idempotent seeding
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.complaintUpdate.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.department.deleteMany();

  // Departments
  const deptIT = await prisma.department.create({ data: { code: 'IT', name: 'Information Technology', description: 'IT infrastructure and services' } });
  const deptFacilities = await prisma.department.create({ data: { code: 'FAC', name: 'Facilities Management', description: 'Campus buildings and maintenance' } });
  const deptHostel = await prisma.department.create({ data: { code: 'HOSTEL', name: 'Hostel Administration', description: 'Student accommodation services' } });
  const deptLibrary = await prisma.department.create({ data: { code: 'LIB', name: 'Library', description: 'Central library and study resources' } });

  // Categories
  const catPlumbing = await prisma.category.create({ data: { name: 'Plumbing', description: 'Water, drainage, and sanitation issues' } });
  const catElectrical = await prisma.category.create({ data: { name: 'Electrical', description: 'Power, lighting, and electrical faults' } });
  const catInternet = await prisma.category.create({ data: { name: 'Internet & WiFi', description: 'Network and connectivity problems' } });
  const catHousekeeping = await prisma.category.create({ data: { name: 'Housekeeping', description: 'Cleanliness and sanitation' } });
  const catOther = await prisma.category.create({ data: { name: 'Other', description: 'Miscellaneous complaints' } });

  // Users (single table, role distinguishes permissions)
  const admin = await prisma.user.create({ data: { email: 'admin@campus.edu', passwordHash: hash, name: 'Aisha Administrator', role: Role.ADMIN, departmentId: deptIT.id, phone: '9000000001' } });
  const staff1 = await prisma.user.create({ data: { email: 'staff.facilities@campus.edu', passwordHash: hash, name: 'Ravi Kumar', role: Role.STAFF, departmentId: deptFacilities.id, phone: '9000000002' } });
  const staff2 = await prisma.user.create({ data: { email: 'staff.it@campus.edu', passwordHash: hash, name: 'Meera Nair', role: Role.STAFF, departmentId: deptIT.id, phone: '9000000003' } });
  const student1 = await prisma.user.create({ data: { email: 'student1@campus.edu', passwordHash: hash, name: 'Arjun Sharma', role: Role.STUDENT, departmentId: null, phone: '9000000004' } });
  const student2 = await prisma.user.create({ data: { email: 'student2@campus.edu', passwordHash: hash, name: 'Priya Patel', role: Role.STUDENT, departmentId: null, phone: '9000000005' } });
  const student3 = await prisma.user.create({ data: { email: 'student3@campus.edu', passwordHash: hash, name: 'Omar Farooq', role: Role.STUDENT, departmentId: null, phone: '9000000006' } });

  // Resources
  await prisma.resource.createMany({
    data: [
      { name: 'Seminar Hall A', type: ResourceType.ROOM, location: 'Block A, 2nd Floor', capacity: 120, status: ResourceStatus.AVAILABLE },
      { name: 'Conference Room B', type: ResourceType.ROOM, location: 'Block B, 1st Floor', capacity: 20, status: ResourceStatus.AVAILABLE },
      { name: 'Computer Lab 1', type: ResourceType.LAB, location: 'IT Block', capacity: 40, status: ResourceStatus.AVAILABLE },
      { name: 'Projector Kit', type: ResourceType.EQUIPMENT, location: 'AV Store', capacity: 1, status: ResourceStatus.AVAILABLE },
      { name: 'College Bus', type: ResourceType.VEHICLE, location: 'Transport Yard', capacity: 50, status: ResourceStatus.MAINTENANCE },
      { name: 'Football Ground', type: ResourceType.SPORT, location: 'Sports Complex', capacity: 30, status: ResourceStatus.AVAILABLE },
    ],
  });

  const resources = await prisma.resource.findMany();
  const seminar = resources.find((r) => r.name === 'Seminar Hall A')!;
  const projector = resources.find((r) => r.name === 'Projector Kit')!;
  const lab = resources.find((r) => r.name === 'Computer Lab 1')!;

  // Complaints
  await prisma.complaint.create({
    data: {
      title: 'Leaking tap in Hostel Block C',
      description: 'The washbasin tap in room C-204 has been leaking continuously for two days.',
      status: ComplaintStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      userId: student1.id,
      categoryId: catPlumbing.id,
      departmentId: deptHostel.id,
      updates: {
        create: [
          { userId: staff1.id, comment: 'Assigned to plumbing team.', statusFrom: ComplaintStatus.OPEN, statusTo: ComplaintStatus.IN_PROGRESS },
        ],
      },
    },
  });

  await prisma.complaint.create({
    data: {
      title: 'WiFi not working in Library 2nd floor',
      description: 'No internet access on the second floor reading area since yesterday morning.',
      status: ComplaintStatus.OPEN,
      priority: Priority.URGENT,
      userId: student2.id,
      categoryId: catInternet.id,
      departmentId: deptIT.id,
    },
  });

  await prisma.complaint.create({
    data: {
      title: 'Flickering lights in Seminar Hall A',
      description: 'Two tube lights flicker constantly during evening classes.',
      status: ComplaintStatus.RESOLVED,
      priority: Priority.MEDIUM,
      userId: student3.id,
      categoryId: catElectrical.id,
      departmentId: deptFacilities.id,
      resolvedAt: new Date(),
    },
  });

  // Bookings
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  await prisma.booking.create({
    data: {
      resourceId: seminar.id,
      userId: student1.id,
      startTime: new Date(tomorrow.getTime() + 9 * 60 * 60 * 1000),
      endTime: new Date(tomorrow.getTime() + 11 * 60 * 60 * 1000),
      purpose: 'Tech club meeting',
      status: BookingStatus.APPROVED,
    },
  });

  await prisma.booking.create({
    data: {
      resourceId: projector.id,
      userId: staff2.id,
      startTime: new Date(dayAfter.getTime() + 10 * 60 * 60 * 1000),
      endTime: new Date(dayAfter.getTime() + 12 * 60 * 60 * 1000),
      purpose: 'Guest lecture presentation',
      status: BookingStatus.PENDING,
    },
  });

  await prisma.booking.create({
    data: {
      resourceId: lab.id,
      userId: student2.id,
      startTime: new Date(dayAfter.getTime() + 14 * 60 * 60 * 1000),
      endTime: new Date(dayAfter.getTime() + 16 * 60 * 60 * 1000),
      purpose: 'Practical exam practice',
      status: BookingStatus.APPROVED,
    },
  });

  console.log('Seed complete. Login emails: admin@campus.edu, staff.it@campus.edu, student1@campus.edu (password: password123)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
