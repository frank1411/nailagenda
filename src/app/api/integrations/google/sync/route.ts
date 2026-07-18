import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error-handler';
import { db } from '@/lib/db';

/**
 * POST /api/integrations/google/sync
 *
 * Sincroniza manualmente todas las citas activas con Google Calendar.
 * Crea eventos para citas que no tienen googleEventId.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    // Verificar que tenga Google Calendar conectado
    const token = await db.googleCalendarToken.findUnique({ where: { userId } });
    if (!token) {
      return NextResponse.json(
        { error: { code: 'NOT_CONNECTED', message: 'Google Calendar no conectado' } },
        { status: 400 },
      );
    }

    const { createEvent } = await import('@/lib/google-calendar');
    const { syncAppointmentCreated } = await import('@/lib/google-calendar-sync');

    // Obtener citas activas sin evento de Google
    const appointments = await db.appointment.findMany({
      where: {
        userId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        googleEventId: null,
      },
      include: {
        client: { select: { firstName: true, lastName: true } },
        service: { select: { name: true } },
        user: { select: { name: true } },
      },
    });

    let synced = 0;
    let errors = 0;

    for (const apt of appointments) {
      try {
        const event = await createEvent(userId, {
          summary: `${apt.service.name} — ${apt.client.firstName} ${apt.client.lastName}`,
          description: `Cliente: ${apt.client.firstName} ${apt.client.lastName}\nServicio: ${apt.service.name}\nEstilista: ${apt.user.name}`,
          startDateTime: `${apt.date}T${apt.startTime}:00-06:00`,
          endDateTime: `${apt.date}T${apt.endTime}:00-06:00`,
        });

        if (event.id) {
          await db.appointment.update({
            where: { id: apt.id },
            data: { googleEventId: event.id },
          });
          synced++;
        }
      } catch {
        errors++;
      }
    }

    return NextResponse.json({ synced, errors, total: appointments.length });
  } catch (error) {
    return handleApiError(error, 'Google Calendar sync');
  }
}
