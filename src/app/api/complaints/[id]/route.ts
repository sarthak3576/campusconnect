import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, jsonError, logAudit } from '@/lib/auth-utils';
import { z } from 'zod';

const updateSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  departmentId: z.number().int().positive().nullable().optional(),
  comment: z.string().min(1).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const id = Number(params.id);
    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        category: true,
        department: true,
        updates: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { id: true, name: true, role: true } } },
        },
      },
    });
    if (!complaint) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(complaint);
  } catch (e) {
    return jsonError(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const id = Number(params.id);
    const body = await req.json();
    const data = updateSchema.parse(body);

    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Ownership / role check: student can only edit their own; staff/admin can edit any.
    if (user.role === 'STUDENT' && complaint.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const previousStatus = complaint.status;
    const newStatus = data.status ?? previousStatus;
    const resolvedAt =
      newStatus === 'RESOLVED' && previousStatus !== 'RESOLVED' ? new Date() : complaint.resolvedAt;

    const updated = await prisma.$transaction(async (tx) => {
      const c = await tx.complaint.update({
        where: { id },
        data: {
          status: data.status,
          priority: data.priority,
          departmentId: data.departmentId,
          resolvedAt,
        },
      });
      if (data.comment) {
        await tx.complaintUpdate.create({
          data: {
            complaintId: id,
            userId: user.id,
            comment: data.comment,
            statusFrom: previousStatus,
            statusTo: newStatus,
          },
        });
      }
      return c;
    });

    await logAudit(user.id, 'UPDATE', 'Complaint', id, req.headers.get('x-forwarded-for'));
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
    await prisma.complaint.delete({ where: { id } });
    await logAudit(user.id, 'DELETE', 'Complaint', id, req.headers.get('x-forwarded-for'));
    return NextResponse.json({ success: true });
  } catch (e) {
    return jsonError(e);
  }
}
