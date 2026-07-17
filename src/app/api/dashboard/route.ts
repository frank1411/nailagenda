import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { FALLBACKS, DEMO_USER_ID, shouldUseFallbacks } from '@/lib/fallbacks';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);
      const weekStartStr = sevenDaysAgo.toISOString().split('T')[0];

      // Paralelizar todas las queries independientes
      const [
        totalClients,
        clientsNew,
        clientsRecurring,
        clientsInactive,
        todayAppointments,
        completedWeekAppointments,
        recentActivity,
        clientsByStatusList,
      ] = await Promise.all([
        db.client.count({ where: { userId } }),
        db.client.count({ where: { userId, status: 'NEW' } }),
        db.client.count({ where: { userId, status: 'RECURRING' } }),
        db.client.count({ where: { userId, status: 'INACTIVE' } }),
        db.appointment.findMany({
          where: { userId, date: todayStr },
          include: {
            client: { select: { id: true, firstName: true, lastName: true } },
            service: true,
          },
          orderBy: { startTime: 'asc' },
        }),
        db.appointment.findMany({
          where: {
            userId,
            status: 'COMPLETED',
            date: { gte: weekStartStr, lte: todayStr },
          },
          include: { service: true },
        }),
        db.appointment.findMany({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          take: 10,
          include: {
            client: { select: { id: true, firstName: true, lastName: true } },
            service: { select: { id: true, name: true } },
          },
        }),
        // Clients con solo la última cita (take: 1), no todas
        db.client.findMany({
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
            _count: {
              select: { appointments: { where: { status: 'COMPLETED' } } },
            },
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
        }),
      ]);

      // Calcular revenue semanal
      const weekRevenue = completedWeekAppointments.reduce(
        (sum, apt) => sum + (apt.service?.price || 0),
        0,
      );

      // Mapear clientsByStatusList con totalVisits desde el contador agregado de Prisma
      const clientsWithStats = clientsByStatusList.map((client) => {
        const { appointments, _count, ...rest } = client;
        return {
          ...rest,
          totalVisits: _count.appointments,
          lastAppointment: appointments[0] || null,
        };
      });

      const response = NextResponse.json({
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
          clientsByStatusList: clientsWithStats,
        },
      });

      // Cache: 30 segundos stale, 5 minutos fresh en CDN/browser
      response.headers.set(
        'Cache-Control',
        'public, s-maxage=60, stale-while-revalidate=30',
      );

      return response;
    } catch (dbError) {
      console.error('DB Error in dashboard GET:', dbError);
      if (!shouldUseFallbacks()) {
        return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
      }
      return NextResponse.json({ data: FALLBACKS.dashboard });
    }
  } catch (error) {
  } catch (error) {
    return handleApiError(error, 'Dashboard');
  }
}
