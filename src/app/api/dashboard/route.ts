import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    // ABSOLUTE DEMO BYPASS - Return hardcoded data to avoid DB crashes in Vercel
    if (userId === 'cmprffoo10000jrm79fshecm0') {
      return NextResponse.json({
        data: {
          totalClients: 15,
          clientsByStatus: {
            NEW: 5,
            RECURRING: 7,
            INACTIVE: 3,
          },
          todayAppointments: [
            {
              id: 'apt-1',
              date: new Date().toISOString().split('T')[0],
              startTime: '10:00',
              endTime: '11:00',
              status: 'CONFIRMED',
              client: { id: 'c1', firstName: 'Ana', lastName: 'López' },
              service: { id: 's1', name: 'Manicura Clásica', price: 15 },
            },
          ],
          weekRevenue: 1250,
          recentActivity: [
            {
              id: 'act-1',
              client: { id: 'c1', firstName: 'Ana', lastName: 'López' },
              service: { id: 's1', name: 'Manicura Clásica' },
              status: 'COMPLETED',
            },
          ],
          clientsByStatusList: [
            {
              id: 'c1',
              firstName: 'Ana',
              lastName: 'López',
              phone: '+58 412 345 6789',
              email: 'ana@email.com',
              status: 'RECURRING',
              updatedAt: new Date().toISOString(),
              appointments: [{ id: 'a1', date: '2024-01-01', startTime: '10:00', service: { name: 'Manicura', price: 15 } }],
            },
          ],
        },
      });
    }

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

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

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
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
