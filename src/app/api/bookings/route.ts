import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, jsonError, logAudit } from '@/lib/auth-utils';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

const createSchema = z.object({
  resourceId: z.number().int().positive(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  purpose: z.string().max(255).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = req.nextUrl;
    const status = searchParams.get('status') ?? undefined;
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize')) || 10));

    const where: Prisma.BookingWhereInput = {
      // Students only see their own bookings; staff/admin see all.
      ...(user.role === 'STUDENT' ? { userId: user.id } : {}),
      ...(status ? { status: status as any } : {}),
    };

    const [total, items] = await prisma.$transaction([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        orderBy: { startTime: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          resource: { select: { id: true, name: true, type: true, location: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return NextResponse.json({ data: items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const data = createSchema.parse(body);

    if (new Date(data.endTime) <= new Date(data.startTime)) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    // The trg_booking_overlap_check trigger rejects double-bookings.
    const booking = await prisma.booking.create({
      data: {
        resourceId: data.resourceId,
        userId: user.id,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        purpose: data.purpose ?? null,
      },
    });

    await logAudit(user.id, 'CREATE', 'Booking', booking.id, req.headers.get('x-forwarded-for'));
    return NextResponse.json(booking, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((x) => x.message).join(', ') }, { status: 400 });
    }
    return jsonError(e);
  }
}
