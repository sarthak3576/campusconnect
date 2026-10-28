import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export type Role = 'ADMIN' | 'STAFF' | 'STUDENT';

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    throw new ApiError(401, 'Unauthorized');
  }
  return session.user;
}

export async function requireRole(...roles: Role[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role as Role)) {
    throw new ApiError(403, 'Forbidden');
  }
  return user;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function jsonError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'A record with this value already exists' }, { status: 409 });
    }
    // Raw SQL / trigger SIGNAL error (e.g., booking overlap trigger)
    if (err.code === 'P2010') {
      const raw = (err.meta as any)?.message ?? '';
      const match = raw.match(/(?:SQLSTATE.*?: |ERROR.*?: )(.*)$/m);
      const msg = match ? match[1].trim() : 'Database constraint violation';
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Database error' }, { status: 400 });
  }
  // MySQL trigger SIGNAL / stored procedure exceptions surface as unknown request errors.
  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    const m = err.message.match(/message: "([^"]+)"/);
    if (m) return NextResponse.json({ error: m[1] }, { status: 400 });
  }
  console.error(err);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export async function logAudit(
  userId: number | null,
  action: string,
  entity: string,
  entityId: number | null,
  ipAddress?: string | null,
) {
  try {
    await prisma.auditLog.create({
      data: { userId, action, entity, entityId, ipAddress },
    });
  } catch (e) {
    console.error('Audit log failed', e);
  }
}
