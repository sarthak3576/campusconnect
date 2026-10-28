import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, jsonError } from '@/lib/auth-utils';

export async function GET(_req: NextRequest) {
  try {
    const user = await requireAuth();

    // Aggregate queries + view read in parallel.
    const [
      complaintCount,
      openComplaints,
      resolvedComplaints,
      resourceCount,
      availableResources,
      bookingCount,
      myComplaints,
      myBookings,
      recentComplaints,
      statsRaw,
    ] = await Promise.all([
      prisma.complaint.count(),
      prisma.complaint.count({ where: { status: 'OPEN' } }),
      prisma.complaint.count({ where: { status: 'RESOLVED' } }),
      prisma.resource.count(),
      prisma.resource.count({ where: { status: 'AVAILABLE' } }),
      prisma.booking.count(),
      prisma.complaint.count({ where: { userId: user.id } }),
      prisma.booking.count({ where: { userId: user.id } }),
      prisma.complaint.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true } },
          category: { select: { name: true } },
        },
      }),
      // Read from the aggregate view v_complaint_stats.
      prisma.$queryRaw`SELECT status, total, urgent_count FROM v_complaint_stats ORDER BY total DESC`,
    ]);

    // MySQL COUNT/SUM return BigInt; convert to Number for JSON serialization.
    const complaintStats = (statsRaw as any[]).map((s) => ({
      status: s.status,
      total: Number(s.total),
      urgent_count: Number(s.urgent_count),
    }));

    return NextResponse.json({
      complaintCount,
      openComplaints,
      resolvedComplaints,
      resourceCount,
      availableResources,
      bookingCount,
      myComplaints,
      myBookings,
      recentComplaints,
      complaintStats,
      role: user.role,
    });
  } catch (e) {
    return jsonError(e);
  }
}
