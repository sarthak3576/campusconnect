import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, jsonError, logAudit } from '@/lib/auth-utils';
import { z } from 'zod';

const updateSchema = z.object({
  role: z.enum(['ADMIN', 'STAFF', 'STUDENT']).optional(),
  departmentId: z.number().int().positive().nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireRole('ADMIN');
    const id = Number(params.id);
    const body = await req.json();
    const data = updateSchema.parse(body);
    const user = await prisma.user.update({ where: { id }, data });
    await logAudit(admin.id, 'UPDATE', 'User', id, req.headers.get('x-forwarded-for'));
    return NextResponse.json({ id: user.id, name: user.name, role: user.role });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((x) => x.message).join(', ') }, { status: 400 });
    }
    return jsonError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireRole('ADMIN');
    const id = Number(params.id);
    if (id === admin.id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }
    await prisma.user.delete({ where: { id } });
    await logAudit(admin.id, 'DELETE', 'User', id, req.headers.get('x-forwarded-for'));
    return NextResponse.json({ success: true });
  } catch (e) {
    return jsonError(e);
  }
}
