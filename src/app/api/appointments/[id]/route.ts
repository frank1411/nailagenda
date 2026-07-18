import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { updateAppointmentSchema } from '@/lib/validations';
import { handleApiError } from '@/lib/api-error-handler';

function fireSyncUpdate(userId: string, appointment: {
  id: string; date: string; startTime: string; endTime: string;
  status: string; notes: string | null; googleEventId: string | null;
  client: { firstName: string; lastName: string };
  service: { name: string };
}) {
  import('@/lib/google-calendar-sync').then(mod =>
    mod.syncAppointmentUpdated(userId, appointment.googleEventId, {
      id: appointment.id,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      notes: appointment.notes,
      clientName: `${appointment.client.firstName} ${appointment.client.lastName}`,
      serviceName: appointment.service.name,
      userName: '',
    }).then(newEventId => {
      if (newEventId && newEventId !== appointment.googleEventId) {
        import('@/lib/db').then(({ db }) =>
          db.appointment.update({
            where: { id: appointment.id },
            data: { googleEventId: newEventId },
          })
        );
      }
    })
  ).catch(() => {});
}

function fireSyncDelete(userId: string, googleEventId: string | null) {
  if (!googleEventId) return;
  import('@/lib/google-calendar-sync').then(mod =>
    mod.syncAppointmentDeleted(userId, googleEventId)
  ).catch(() => {});
}

function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  return start1 < end2 && start2 < end1;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);

    const { id } = await params;

    const existing = await db.appointment.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const body = await request.json();

    const parsed = updateAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { date, startTime, endTime, notes, status } = parsed.data;

    // If time or date is being changed, do overlap check
    const newDate = date ?? existing.date;
    const newStartTime = startTime ?? existing.startTime;
    const newEndTime = endTime ?? existing.endTime;

    if (date !== undefined || startTime !== undefined || endTime !== undefined) {
      const sameDayAppointments = await db.appointment.findMany({
        where: {
          userId,
          date: newDate,
          status: { notIn: ['CANCELLED'] },
          id: { not: id },
        },
      });

      const hasOverlap = sameDayAppointments.some((apt) =>
        timesOverlap(newStartTime, newEndTime, apt.startTime, apt.endTime)
      );

      if (hasOverlap) {
        return NextResponse.json(
          { error: 'Appointment time overlaps with an existing appointment' },
          { status: 409 }
        );
      }
    }

    const appointment = await db.appointment.update({
      where: { id },
      data: {
        ...(date !== undefined && { date }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status }),
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
        service: true,
      },
    });

    // Auto-sync a Google Calendar (fire-and-forget)
    fireSyncUpdate(userId, {
      ...appointment,
      googleEventId: existing.googleEventId,
    });

    return NextResponse.json({ data: appointment });
  } catch (error) {
    return handleApiError(error, 'Appointment update');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);

    const { id } = await params;

    const existing = await db.appointment.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    await db.appointment.delete({ where: { id } });

    // Auto-sync eliminar evento de Google Calendar
    fireSyncDelete(userId, existing.googleEventId);

    return NextResponse.json({ data: { message: 'Appointment deleted' } });
  } catch (error) {
    return handleApiError(error, 'Appointment delete');
  }
}
