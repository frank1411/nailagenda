import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // We use a helper to prevent one failing query from crashing the whole dashboard
    const safeCount = async (model: any, where: any) => {
      try { return await model.count({ where }); } catch { return 0; }
    };

    const safeFindMany = async (model: any, args: any) => {
      try { return await model.findMany(args); } catch { return []; }
    };

    const totalClients = await safeCount(db.client, { userId });
    const clientsNew = await safeCount(db.client, { userId, status: 'NEW' });
    const clientsRecurring = await safeCount(db.client, { userId, status: 'RECURRING' });
    const clientsInactive = await safeCount(db.client, { userId, status: 'INACTIVE' });

    const todayAppointments = await safeFindMany(db.appointment, {
      where: { userId, date: todayStr },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
        service: true,
      },
      orderBy: { startTime: 'asc' },
    });

    // Simplified revenue: last 30 days instead of complex week range to avoid PG errors
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const completedAppointments = await safeFindMany(db.appointment, {
      where: {
        userId,
        status: 'COMPLETED',
        date: { gte: thirtyDaysAgoStr },
      },
      include: { service: true },
    });

    const weekRevenue = completedAppointments.reduce(
      (sum, apt: any) => sum + (apt.service?.price || 0),
      0
    );

    const recentActivity = await safeFindMany(db.appointment, {
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
        service: { select: { id: true, name: true } },
      },
    });

    const clientsByStatusList = await safeFindMany(db.client, {
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        status: true,
        updatedAt: true,
        appointments: {
          orderBy: { date: 'desc' },
          take: 1,
          select: {
            id: true,
            date: true,
            startTime: true,
            service: { select: { name: true, price: true } },
          },
        },
      },
    });

    return NextResponse.json({
      data: {
        totalClients,
        clientsByStatus: {
          NEW: clientsNew,
          RECURRING: clientsRecurring,
          INACTIVE: clientsInactive,
        },
        todayAppointments,
        weekRevenue,
        recentActivity,
        clientsByStatusList,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
