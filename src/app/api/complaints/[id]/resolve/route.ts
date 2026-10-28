import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, jsonError, logAudit } from '@/lib/auth-utils';
import { z } from 'zod';

const schema = z.object({ comment: z.string().min(1).max(500) });

// Uses the stored procedure sp_resolve_complaint (raw SQL is allowed for
// advanced database features such as stored procedures).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole('ADMIN', 'STAFF');
    const id = Number(params.id);
    const body = await req.json();
    const { comment } = schema.parse(body);

    try {
      await prisma.$executeRaw`CALL sp_resolve_complaint(${id}, ${user.id}, ${comment})`;
    } catch {
      // Fallback for SQLite / engines without stored procedures
      await prisma.$transaction(async (tx) => {
        const current = await tx.complaint.findUnique({ where: { id } });
        if (!current) throw new Error('Complaint not found');
        await tx.complaint.update({
          where: { id },
          data: { status: 'RESOLVED', resolvedAt: new Date(), updatedAt: new Date() },
        });
        await tx.complaintUpdate.create({
          data: {
            complaintId: id,
            userId: user.id,
            comment,
            statusFrom: current.status,
            statusTo: 'RESOLVED',
          },
        });
      });
    }
    await logAudit(user.id, 'RESOLVE', 'Complaint', id, req.headers.get('x-forwarded-for'));

    const updated = await prisma.complaint.findUnique({ where: { id } });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((x) => x.message).join(', ') }, { status: 400 });
    }
    return jsonError(e);
  }
}
