import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, jsonError } from '@/lib/auth-utils';

export async function GET() {
  try {
    const user = await requireAuth();
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    const unread = await prisma.notification.count({ where: { userId: user.id, isRead: false } });
    return NextResponse.json({ notifications, unread });
  } catch (e) {
    return jsonError(e);
  }
}

export async function PATCH() {
  try {
    const user = await requireAuth();
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return jsonError(e);
  }
}
