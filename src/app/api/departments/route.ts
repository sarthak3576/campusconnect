import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, jsonError, logAudit } from '@/lib/auth-utils';
import { z } from 'zod';

const createSchema = z.object({
  code: z.string().min(2).max(20),
  name: z.string().min(2).max(100),
  description: z.string().optional(),
});

export async function GET() {
  try {
    await requireAuth();
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { users: true, complaints: true } } },
    });
    return NextResponse.json(departments);
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole('ADMIN');
    const body = await req.json();
    const data = createSchema.parse(body);
    const department = await prisma.department.create({ data });
    await logAudit(user.id, 'CREATE', 'Department', department.id, req.headers.get('x-forwarded-for'));
    return NextResponse.json(department, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((x) => x.message).join(', ') }, { status: 400 });
    }
    return jsonError(e);
  }
}
