import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, jsonError, logAudit } from '@/lib/auth-utils';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
});

export async function GET() {
  try {
    await requireAuth();
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { complaints: true } } },
    });
    return NextResponse.json(categories);
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole('ADMIN');
    const body = await req.json();
    const data = createSchema.parse(body);
    const category = await prisma.category.create({ data });
    await logAudit(user.id, 'CREATE', 'Category', category.id, req.headers.get('x-forwarded-for'));
    return NextResponse.json(category, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((x) => x.message).join(', ') }, { status: 400 });
    }
    return jsonError(e);
  }
}
