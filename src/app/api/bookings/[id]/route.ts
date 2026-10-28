import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, jsonError, logAudit } from '@/lib/auth-utils';
import { z } from 'zod';

const updateSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED']),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const id = Number(params.id);
    const body = await req.json();
    const data = updateSchema.parse(body);

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Students may only cancel their own bookings; approval is staff/admin only.
    if (data.status === 'CANCELLED') {
      if (booking.userId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (user.role === 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: data.status },
    });

    await logAudit(user.id, 'UPDATE', 'Booking', id, req.headers.get('x-forwarded-for'));
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((x) => x.message).join(', ') }, { status: 400 });
    }
    return jsonError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole('ADMIN', 'STAFF');
    const id = Number(params.id);
    await prisma.booking.delete({ where: { id } });
    await logAudit(user.id, 'DELETE', 'Booking', id, req.headers.get('x-forwarded-for'));
    return NextResponse.json({ success: true });
  } catch (e) {
    return jsonError(e);
  }
}
