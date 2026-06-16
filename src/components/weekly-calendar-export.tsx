'use client';

import { forwardRef } from 'react';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

// ---------------------------------------------------------------------------
// Standalone export poster
// ---------------------------------------------------------------------------
// Rendered off-screen and captured with html-to-image. All styling is INLINE
// with hex colors on purpose: html-to-image does not reliably serialize the
// oklch() colors that Tailwind v4 emits, so we avoid utility classes here.
// ---------------------------------------------------------------------------

const ROSE_GOLD = '#B76E79';
const CHARCOAL = '#2D2D2D';

const POSTER_WIDTH = 1080;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendiente', color: '#eab308' },
  CONFIRMED: { label: 'Confirmada', color: '#22c55e' },
  COMPLETED: { label: 'Completada', color: '#3b82f6' },
  CANCELLED: { label: 'Cancelada', color: '#ef4444' },
  NO_SHOW: { label: 'No asistió', color: '#6b7280' },
};

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export interface ExportAppointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  client: { firstName: string; lastName: string };
  service: { name: string };
}

interface WeeklyExportPosterProps {
  weekStart: Date;
  appointments: ExportAppointment[];
}

function formatTime12(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const WeeklyExportPoster = forwardRef<HTMLDivElement, WeeklyExportPosterProps>(
  function WeeklyExportPoster({ weekStart, appointments }, ref) {
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const weekEnd = addDays(weekStart, 6);

    const aptsByDay = (date: Date): ExportAppointment[] => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return appointments
        .filter((a) => a.date === dateStr)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    };

    const rangeLabel = `${format(weekStart, "d 'de' MMM", { locale: es })} – ${format(
      weekEnd,
      "d 'de' MMM, yyyy",
      { locale: es }
    )}`;

    return (
      <div
        ref={ref}
        style={{
          width: POSTER_WIDTH,
          fontFamily: FONT_STACK,
          background: 'linear-gradient(160deg, #FBF3F1 0%, #FFFFFF 45%)',
          color: CHARCOAL,
          padding: '64px 56px 48px',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div
            style={{
              fontSize: 20,
              letterSpacing: 6,
              fontWeight: 600,
              color: ROSE_GOLD,
              textTransform: 'uppercase',
            }}
          >
            Agenda Semanal
          </div>
          <div
            style={{
              fontSize: 52,
              fontWeight: 800,
              marginTop: 10,
              color: CHARCOAL,
              lineHeight: 1.1,
            }}
          >
            {rangeLabel}
          </div>
          <div
            style={{
              width: 90,
              height: 4,
              borderRadius: 4,
              background: ROSE_GOLD,
              margin: '22px auto 0',
            }}
          />
        </div>

        {/* Days */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {weekDays.map((day, i) => {
            const dayApts = aptsByDay(day);
            return (
              <div
                key={i}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #F0E2DF',
                  borderRadius: 18,
                  boxShadow: '0 6px 18px rgba(183, 110, 121, 0.07)',
                  overflow: 'hidden',
                }}
              >
                {/* Day header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 22px',
                    background: `${ROSE_GOLD}14`,
                    borderBottom: '1px solid #F0E2DF',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                    <span style={{ fontSize: 24, fontWeight: 700, color: CHARCOAL }}>
                      {capitalize(format(day, 'EEEE', { locale: es }))}
                    </span>
                    <span style={{ fontSize: 18, color: ROSE_GOLD, fontWeight: 600 }}>
                      {format(day, "d 'de' MMM", { locale: es })}
                    </span>
                  </div>
                  <span style={{ fontSize: 15, color: '#9C8A87', fontWeight: 500 }}>
                    {dayApts.length === 0
                      ? 'Sin citas'
                      : `${dayApts.length} ${dayApts.length === 1 ? 'cita' : 'citas'}`}
                  </span>
                </div>

                {/* Appointments */}
                {dayApts.length > 0 && (
                  <div style={{ padding: '8px 22px 14px' }}>
                    {dayApts.map((apt) => {
                      const cfg = STATUS_CONFIG[apt.status] || STATUS_CONFIG.PENDING;
                      return (
                        <div
                          key={apt.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            padding: '10px 0',
                            borderBottom: '1px solid #F7F0EE',
                          }}
                        >
                          <div
                            style={{
                              width: 5,
                              alignSelf: 'stretch',
                              minHeight: 38,
                              borderRadius: 4,
                              background: cfg.color,
                            }}
                          />
                          <div style={{ width: 150, flexShrink: 0 }}>
                            <div style={{ fontSize: 18, fontWeight: 700, color: CHARCOAL }}>
                              {formatTime12(apt.startTime)}
                            </div>
                            <div style={{ fontSize: 13, color: '#9C8A87' }}>
                              {formatTime12(apt.endTime)}
                            </div>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 19, fontWeight: 600, color: CHARCOAL }}>
                              {apt.client.firstName} {apt.client.lastName}
                            </div>
                            <div style={{ fontSize: 15, color: '#7A6C6A' }}>
                              {apt.service.name}
                            </div>
                          </div>
                          <span
                            style={{
                              flexShrink: 0,
                              fontSize: 14,
                              fontWeight: 600,
                              color: cfg.color,
                              background: `${cfg.color}1A`,
                              borderRadius: 999,
                              padding: '5px 14px',
                            }}
                          >
                            {cfg.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer: legend */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            marginTop: 36,
            paddingTop: 24,
            borderTop: '1px solid #F0E2DF',
          }}
        >
          {Object.values(STATUS_CONFIG).map((cfg) => (
            <div key={cfg.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{ width: 12, height: 12, borderRadius: 999, background: cfg.color }}
              />
              <span style={{ fontSize: 15, color: '#7A6C6A' }}>{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

export default WeeklyExportPoster;
