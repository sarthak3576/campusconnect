import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, jsonError, logAudit } from '@/lib/auth-utils';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'STAFF', 'STUDENT']),
  departmentId: z.number().int().positive().nullable().optional(),
  phone: z.string().max(20).optional(),
});

export async function GET() {
  try {
    await requireRole('ADMIN');
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        departmentId: true,
        createdAt: true,
        department: { select: { name: true } },
      },
    });
    return NextResponse.json(users);
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole('ADMIN');
    const body = await req.json();
    const data = createSchema.parse(body);

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
        departmentId: data.departmentId ?? null,
        phone: data.phone ?? null,
      },
    });

    await logAudit(admin.id, 'CREATE', 'User', user.id, req.headers.get('x-forwarded-for'));
    return NextResponse.json(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      { status: 201 },
    );
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((x) => x.message).join(', ') }, { status: 400 });
    }
    return jsonError(e);
  }
}
