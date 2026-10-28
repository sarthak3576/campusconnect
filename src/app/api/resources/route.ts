import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, jsonError, logAudit } from '@/lib/auth-utils';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(2).max(150),
  type: z.enum(['ROOM', 'EQUIPMENT', 'LAB', 'VEHICLE', 'SPORT']),
  location: z.string().max(150).optional(),
  capacity: z.number().int().positive().optional(),
  status: z.enum(['AVAILABLE', 'MAINTENANCE', 'UNAVAILABLE']).default('AVAILABLE'),
  description: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = req.nextUrl;
    const search = searchParams.get('search') ?? '';
    const type = searchParams.get('type') ?? undefined;
    const status = searchParams.get('status') ?? undefined;
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize')) || 10));

    const where: Prisma.ResourceWhereInput = {
      ...(search ? { name: { contains: search } } : {}),
      ...(type ? { type: type as any } : {}),
      ...(status ? { status: status as any } : {}),
    };

    const [total, items] = await prisma.$transaction([
      prisma.resource.count({ where }),
      prisma.resource.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { bookings: true } } },
      }),
    ]);

    return NextResponse.json({ data: items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole('ADMIN', 'STAFF');
    const body = await req.json();
    const data = createSchema.parse(body);
    const resource = await prisma.resource.create({ data });
    await logAudit(user.id, 'CREATE', 'Resource', resource.id, req.headers.get('x-forwarded-for'));
    return NextResponse.json(resource, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((x) => x.message).join(', ') }, { status: 400 });
    }
    return jsonError(e);
  }
}
