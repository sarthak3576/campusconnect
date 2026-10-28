import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, jsonError, logAudit } from '@/lib/auth-utils';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  type: z.enum(['ROOM', 'EQUIPMENT', 'LAB', 'VEHICLE', 'SPORT']).optional(),
  location: z.string().max(150).nullable().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  status: z.enum(['AVAILABLE', 'MAINTENANCE', 'UNAVAILABLE']).optional(),
  description: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole('ADMIN', 'STAFF');
    const id = Number(params.id);
    const body = await req.json();
    const data = updateSchema.parse(body);
    const resource = await prisma.resource.update({ where: { id }, data });
    await logAudit(user.id, 'UPDATE', 'Resource', id, req.headers.get('x-forwarded-for'));
    return NextResponse.json(resource);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((x) => x.message).join(', ') }, { status: 400 });
    }
    return jsonError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole('ADMIN');
    const id = Number(params.id);
    await prisma.resource.delete({ where: { id } });
    await logAudit(user.id, 'DELETE', 'Resource', id, req.headers.get('x-forwarded-for'));
    return NextResponse.json({ success: true });
  } catch (e) {
    return jsonError(e);
  }
}
