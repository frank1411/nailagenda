/**
 * google-calendar-sync.ts
 *
 * Utilidad para sincronizar citas de Nailagenda con Google Calendar.
 * Se llama automáticamente desde los handlers de Appointment.
 */

import { db } from './db';
import { createEvent, updateEvent, deleteEvent } from './google-calendar';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface AppointmentSyncData {
  id: string;
  date: string;          // YYYY-MM-DD
  startTime: string;     // HH:mm
  endTime: string;       // HH:mm
  status: string;
  notes: string | null;
  clientName: string;
  serviceName: string;
  userName: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toISO(date: string, time: string): string {
  return `${date}T${time}:00-06:00`; // America/Mexico_City
}

function buildSummary(a: AppointmentSyncData): string {
  return `${a.serviceName} — ${a.clientName}`;
}

function buildDescription(a: AppointmentSyncData): string {
  const lines = [
    `Cliente: ${a.clientName}`,
    `Servicio: ${a.serviceName}`,
    `Estilista: ${a.userName}`,
  ];
  if (a.notes) lines.push(`Notas: ${a.notes}`);
  return lines.join('\n');
}

const STATUS_MAP: Record<string, string> = {
  PENDING: 'confirmed',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'cancelled',
};

// ---------------------------------------------------------------------------
// Sync — Create
// ---------------------------------------------------------------------------

export async function syncAppointmentCreated(
  userId: string,
  appointment: AppointmentSyncData,
): Promise<string | null> {
  if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) return null;

  try {
    const event = await createEvent(userId, {
      summary: buildSummary(appointment),
      description: buildDescription(appointment),
      startDateTime: toISO(appointment.date, appointment.startTime),
      endDateTime: toISO(appointment.date, appointment.endTime),
    });

    if (event.id) {
      // Guardar eventId en la cita para futuras actualizaciones
      // Usamos una columna googleEventId — se agrega en el schema
      return event.id;
    }
  } catch {
    // Silently fail — el usuario puede hacer sync manual
  }

  return null;
}

// ---------------------------------------------------------------------------
// Sync — Update
// ---------------------------------------------------------------------------

export async function syncAppointmentUpdated(
  userId: string,
  googleEventId: string | null,
  appointment: AppointmentSyncData,
): Promise<string | null> {
  if (!googleEventId) {
    // No hay evento previo — crear uno nuevo
    return syncAppointmentCreated(userId, appointment);
  }

  if (appointment.status === 'CANCELLED') {
    await syncAppointmentDeleted(userId, googleEventId);
    return null;
  }

  try {
    await updateEvent(userId, googleEventId, {
      summary: buildSummary(appointment),
      description: buildDescription(appointment),
      startDateTime: toISO(appointment.date, appointment.startTime),
      endDateTime: toISO(appointment.date, appointment.endTime),
    });
    return googleEventId;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Sync — Delete
// ---------------------------------------------------------------------------

export async function syncAppointmentDeleted(
  userId: string,
  googleEventId: string,
): Promise<void> {
  try {
    await deleteEvent(userId, googleEventId);
  } catch {
    // Silently fail
  }
}
