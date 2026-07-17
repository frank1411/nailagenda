import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { createAppointmentSchema } from '@/lib/validations';
import { FALLBACKS, shouldUseFallbacks } from '@/lib/fallbacks';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = { userId };

    if (date) {
      where.date = date;
    } else if (startDate && endDate) {
      where.date = { gte: startDate, lte: endDate };
    } else if (startDate) {
      where.date = { gte: startDate };
    } else if (endDate) {
      where.date = { lte: endDate };
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (status) {
      where.status = status;
    }

    try {
      const appointments = await db.appointment.findMany({
        where,
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        include: {
          client: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
          service: true,
        },
      });

      return NextResponse.json({ data: appointments });
    } catch (dbError) {
      console.error('DB Error in appointments GET:', dbError);
      if (!shouldUseFallbacks()) {
        return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
      }
      return NextResponse.json({ data: FALLBACKS.appointments });
    }
  } catch (error) {
  } catch (error) {
    return handleApiError(error, 'Appointments');
  }
}

function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  return start1 < end2 && start2 < end1;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const body = await request.json();

    const parsed = createAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { clientId, serviceId, date, startTime, endTime, notes, status } = parsed.data;

    // Verify client belongs to user
    const client = await db.client.findFirst({ where: { id: clientId, userId } });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Verify service belongs to user
    const service = await db.service.findFirst({ where: { id: serviceId, userId } });
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Overlap check: find appointments on the same date for this user
    const sameDayAppointments = await db.appointment.findMany({
      where: {
        userId,
        date,
        status: { notIn: ['CANCELLED'] },
      },
    });

    const hasOverlap = sameDayAppointments.some((apt) =>
      timesOverlap(startTime, endTime, apt.startTime, apt.endTime)
    );

    if (hasOverlap) {
      return NextResponse.json(
        { error: 'Appointment time overlaps with an existing appointment' },
        { status: 409 }
      );
    }

    const appointment = await db.appointment.create({
      data: {
        clientId,
        serviceId,
        date,
        startTime,
        endTime,
        notes: notes || null,
        status,
        userId,
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
        service: true,
      },
    });

    return NextResponse.json({ data: appointment }, { status: 201 });
  } catch (error) {
  } catch (error) {
    return handleApiError(error, 'Appointments');
  }
}
