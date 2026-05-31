import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';
import { FALLBACKS, DEMO_USER_ID } from '@/lib/fallbacks';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const totalClients = await db.client.count({ where: { userId } });
      const clientsNew = await db.client.count({ where: { userId, status: 'NEW' } });
      const clientsRecurring = await db.client.count({ where: { userId, status: 'RECURRING' } });
      const clientsInactive = await db.client.count({ where: { userId, status: 'INACTIVE' } });

      const todayAppointments = await db.appointment.findMany({
        where: { userId, date: todayStr },
        include: {
          client: { select: { id: true, firstName: true, lastName: true } },
          service: true,
        },
        orderBy: { startTime: 'asc' },
      });

      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);
      const weekStartStr = sevenDaysAgo.toISOString().split('T')[0];
      const weekEndStr = todayStr;

      const completedWeekAppointments = await db.appointment.findMany({
        where: {
          userId,
          status: 'COMPLETED',
          date: { gte: weekStartStr, lte: weekEndStr },
        },
        include: { service: true },
      });

      const weekRevenue = completedWeekAppointments.reduce(
        (sum, apt) => sum + (apt.service?.price || 0),
        0
      );

      const recentActivity = await db.appointment.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        include: {
          client: { select: { id: true, firstName: true, lastName: true } },
          service: { select: { id: true, name: true } },
        },
      });

      const clientsByStatusList = await db.client.findMany({
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
    } catch (dbError) {
      console.error('DB Error in dashboard GET, using fallbacks:', dbError);
      return NextResponse.json({ data: FALLBACKS.dashboard });
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
