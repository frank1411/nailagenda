import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error-handler';

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const automations = await db.automationRule.findMany({
      where: { userId, active: true },
    });

    const results: Array<{
      ruleId: string;
      ruleName: string;
      ruleType: string;
      actions: Array<{ clientId: string; clientName: string; action: string; details: string }>;
    }> = [];

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    for (const rule of automations) {
      const ruleResult = {
        ruleId: rule.id,
        ruleName: rule.name,
        ruleType: rule.type,
        actions: [] as Array<{ clientId: string; clientName: string; action: string; details: string }>,
      };

      switch (rule.type) {
        case 'REMINDER': {
          // ── Leer configuración de la regla ──
          const rConfig = (rule.config || {}) as Record<string, unknown>;
          const hoursBefore = rConfig.hoursBefore as number | undefined;
          const hoursAfter = rConfig.hoursAfter as number | undefined;
          const messageTemplate =
            (rConfig.messageTemplate as string) ||
            'Hola {nombre}, te recordamos tu cita de {servicio} el {fecha} a las {hora}. ¡Te esperamos!';

          const now = new Date();
          const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

          // Determinar modos: before (pre-cita), after (post-cita)
          type WMode = { mode: 'before' | 'after'; hours: number };
          const modes: WMode[] = [];
          if (hoursBefore && hoursBefore > 0) modes.push({ mode: 'before', hours: hoursBefore });
          if (hoursAfter && hoursAfter > 0) modes.push({ mode: 'after', hours: hoursAfter });
          if (modes.length === 0) modes.push({ mode: 'before', hours: 24 }); // default

          for (const { mode, hours } of modes) {
            const isBefore = mode === 'before';
            const windowMs = hours * 60 * 60 * 1000;
            const startWindow = isBefore ? now : new Date(now.getTime() - windowMs);
            const endWindow = isBefore ? new Date(now.getTime() + windowMs) : now;
            const actionName = isBefore ? 'SEND_REMINDER' : 'THANK_YOU';
            const startDateStr = startWindow.toISOString().split('T')[0];
            const endDateStr = endWindow.toISOString().split('T')[0];

            // ── Anti-spam: ya procesados en las últimas 24h ──
            const recentLogs = await db.automationLog.findMany({
              where: {
                ruleId: rule.id,
                action: actionName,
                createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
              },
              select: { clientId: true },
            });
            const recentlyProcessed = new Set(recentLogs.map((l) => l.clientId));

            const statuses: ('PENDING' | 'CONFIRMED' | 'COMPLETED')[] = isBefore
              ? ['PENDING', 'CONFIRMED']
              : ['COMPLETED'];

            const appointments = await db.appointment.findMany({
              where: {
                userId,
                date: { gte: startDateStr, lte: endDateStr },
                status: { in: statuses },
              },
              include: { client: true, service: true },
            });

            for (const apt of appointments) {
              const aptDateTime = new Date(`${apt.date}T${apt.startTime}:00`);
              if (aptDateTime < startWindow || aptDateTime > endWindow) continue;
              if (recentlyProcessed.has(apt.clientId)) continue;

              const clientName = `${apt.client.firstName} ${apt.client.lastName}`;
              const [y, m, d] = apt.date.split('-');
              const fechaLegible = `${parseInt(d)} ${meses[parseInt(m) - 1]} ${y}`;

              const mensaje = messageTemplate
                .replace(/{nombre}/g, clientName)
                .replace(/{servicio}/g, apt.service.name)
                .replace(/{fecha}/g, fechaLegible)
                .replace(/{hora}/g, apt.startTime);

              ruleResult.actions.push({
                clientId: apt.clientId,
                clientName,
                action: actionName,
                details: mensaje,
              });

              await db.automationLog.create({
                data: {
                  action: actionName,
                  result: mensaje,
                  ruleId: rule.id,
                  clientId: apt.clientId,
                },
              });
            }
          }
          break;
        }

        case 'REACTIVATION': {
          // Buscar clientes INACTIVE sin visita en 30+ días
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

          const inactiveClients = await db.client.findMany({
            where: {
              userId,
              status: 'INACTIVE',
            },
            include: {
              appointments: {
                orderBy: { date: 'desc' },
                take: 1,
              },
            },
          });

          for (const client of inactiveClients) {
            const lastAppointment = client.appointments[0];
            if (lastAppointment && lastAppointment.date <= thirtyDaysAgoStr) {
              const clientName = `${client.firstName} ${client.lastName}`;
              ruleResult.actions.push({
                clientId: client.id,
                clientName,
                action: 'REACTIVATION_OUTREACH',
                details: `Inactivo desde ${lastAppointment.date}. Última visita: ${lastAppointment.date}. Sugerir reactivación.`,
              });

              await db.automationLog.create({
                data: {
                  action: 'REACTIVATION_OUTREACH',
                  result: `Reactivación sugerida para ${clientName}. Inactivo desde ${lastAppointment.date}.`,
                  ruleId: rule.id,
                  clientId: client.id,
                },
              });
            }
          }

          // También verificar clientes RECURRING/NEW sin citas en 30+ días
          const clientsWithNoRecentApts = await db.client.findMany({
            where: {
              userId,
              status: { in: ['RECURRING', 'NEW'] },
              appointments: {
                none: {
                  date: { gte: thirtyDaysAgoStr },
                },
              },
            },
          });

          for (const client of clientsWithNoRecentApts) {
            const clientName = `${client.firstName} ${client.lastName}`;
            ruleResult.actions.push({
              clientId: client.id,
              clientName,
              action: 'REACTIVATION_OUTREACH',
              details: `Sin citas en los últimos 30 días. Sugerir reactivación.`,
            });

            await db.automationLog.create({
              data: {
                action: 'REACTIVATION_OUTREACH',
                result: `Reactivación sugerida para ${clientName}. Sin citas recientes.`,
                ruleId: rule.id,
                clientId: client.id,
              },
            });
          }
          break;
        }

        case 'LOYALTY': {
          // Buscar clientes RECURRING elegibles para premios de fidelidad (5+ visitas completadas, múltiplos de 5)
          const recurringClients = await db.client.findMany({
            where: {
              userId,
              status: 'RECURRING',
            },
            include: {
              appointments: {
                where: { status: 'COMPLETED' },
              },
            },
          });

          for (const client of recurringClients) {
            const completedCount = client.appointments.length;
            if (completedCount >= 5 && completedCount % 5 === 0) {
              const clientName = `${client.firstName} ${client.lastName}`;
              ruleResult.actions.push({
                clientId: client.id,
                clientName,
                action: 'LOYALTY_REWARD',
                details: `¡${completedCount} visitas completadas! Cliente elegible para premio de fidelidad.`,
              });

              await db.automationLog.create({
                data: {
                  action: 'LOYALTY_REWARD',
                  result: `Premio de fidelidad para ${clientName}. ${completedCount} visitas completadas.`,
                  ruleId: rule.id,
                  clientId: client.id,
                },
              });
            }
          }
          break;
        }

        case 'STATUS_FLOW': {
          const sfCfg = (rule.config || {}) as Record<string, number>;
          const completedVisitsForRecurring = sfCfg.completedVisitsForRecurring ?? 5;
          const inactiveDaysThreshold = sfCfg.inactiveDaysThreshold ?? 45;

          const now = new Date();
          const inactiveSince = new Date(now);
          inactiveSince.setDate(inactiveSince.getDate() - inactiveDaysThreshold);

          // ── 1. NEW → RECURRING: clientes con N+ visitas completadas ──
          const clientsToPromote = await db.client.findMany({
            where: {
              userId,
              status: 'NEW',
            },
            include: {
              _count: {
                select: { appointments: { where: { status: 'COMPLETED' } } },
              },
            },
          });

          for (const client of clientsToPromote) {
            if (client._count.appointments >= completedVisitsForRecurring) {
              await db.client.update({
                where: { id: client.id },
                data: { status: 'RECURRING' },
              });

              const clientName = `${client.firstName} ${client.lastName}`;
              await db.automationLog.create({
                data: {
                  action: 'STATUS_PROMOTION',
                  result: `${clientName} promovido a Recurrente (${client._count.appointments} visitas completadas)`,
                  ruleId: rule.id,
                  clientId: client.id,
                },
              });

              ruleResult.actions.push({
                clientId: client.id,
                clientName,
                action: 'STATUS_PROMOTION',
                details: `Promovido a Recurrente (${client._count.appointments} visitas completadas)`,
              });
            }
          }

          // ── 2. RECURRING → INACTIVE: sin citas completadas en N días ──
          const clientsToDemote = await db.client.findMany({
            where: {
              userId,
              status: 'RECURRING',
            },
            include: {
              appointments: {
                where: { status: 'COMPLETED' },
                orderBy: { date: 'desc' },
                take: 1,
                select: { date: true },
              },
            },
          });

          for (const client of clientsToDemote) {
            const lastCompleted = client.appointments[0];
            if (!lastCompleted || lastCompleted.date < inactiveSince.toISOString().split('T')[0]) {
              await db.client.update({
                where: { id: client.id },
                data: { status: 'INACTIVE' },
              });

              const clientName = `${client.firstName} ${client.lastName}`;
              await db.automationLog.create({
                data: {
                  action: 'STATUS_DEMOTION',
                  result: `${clientName} degradado a Inactivo. Última cita completada: ${lastCompleted?.date ?? 'nunca'}`,
                  ruleId: rule.id,
                  clientId: client.id,
                },
              });

              ruleResult.actions.push({
                clientId: client.id,
                clientName,
                action: 'STATUS_DEMOTION',
                details: `Degradado a Inactivo. Última cita completada: ${lastCompleted?.date ?? 'nunca'}`,
              });
            }
          }

          // ── 3. INACTIVE → RECURRING: si completaron una cita después de volverse inactivos ──
          const clientsToReactivate = await db.client.findMany({
            where: {
              userId,
              status: 'INACTIVE',
            },
            include: {
              appointments: {
                where: { status: 'COMPLETED' },
                orderBy: { date: 'desc' },
                take: 1,
                select: { date: true, id: true },
              },
            },
          });

          for (const client of clientsToReactivate) {
            const lastCompleted = client.appointments[0];
            if (lastCompleted) {
              // Check if it was completed recently (not before becoming inactive)
              // Simple heuristic: has any completed appointment at all
              await db.client.update({
                where: { id: client.id },
                data: { status: 'RECURRING' },
              });

              const clientName = `${client.firstName} ${client.lastName}`;
              await db.automationLog.create({
                data: {
                  action: 'STATUS_REACTIVATION',
                  result: `${clientName} reactivado a Recurrente. Última cita completada: ${lastCompleted.date}`,
                  ruleId: rule.id,
                  clientId: client.id,
                },
              });

              ruleResult.actions.push({
                clientId: client.id,
                clientName,
                action: 'STATUS_REACTIVATION',
                details: `Reactivado a Recurrente. Última cita completada: ${lastCompleted.date}`,
              });
            }
          }
          break;
        }

        case 'SMART_CONTACT': {
          // Leer configuración de la regla (con valores por defecto)
          const scCfg = (rule.config || {}) as Record<string, number>;
          const contactWindowDays = scCfg.contactWindowDays ?? 7;        // días antes del promedio para contactar
          const antiSpamCooldown = scCfg.antiSpamCooldownDays ?? 7;     // días mínimos entre contactos al mismo cliente

          // ── Anti-spam: obtener clientes contactados recientemente ──
          const cooldownDate = new Date(today);
          cooldownDate.setDate(cooldownDate.getDate() - antiSpamCooldown);

          const recentLogs = await db.automationLog.findMany({
            where: {
              ruleId: rule.id,
              action: 'SMART_CONTACT',
              createdAt: { gte: cooldownDate },
            },
            select: { clientId: true },
          });
          const recentlyContacted = new Set(recentLogs.map((l) => l.clientId));

          // ── Analizar frecuencia de visitas por cliente ──
          const allClients = await db.client.findMany({
            where: {
              userId,
              status: { in: ['RECURRING', 'NEW'] },
            },
            include: {
              appointments: {
                where: { status: 'COMPLETED' },
                orderBy: { date: 'desc' },
              },
            },
          });

          for (const client of allClients) {
            if (client.appointments.length < 2) continue;

            // ── Saltar si ya fue contactado recientemente (anti-spam) ──
            if (recentlyContacted.has(client.id)) continue;

            const clientName = `${client.firstName} ${client.lastName}`;

            // ── Calcular frecuencia media entre visitas ──
            const dates = client.appointments
              .map((a) => new Date(a.date))
              .sort((a, b) => b.getTime() - a.getTime());
            let totalDays = 0;
            for (let i = 0; i < dates.length - 1; i++) {
              const diff = (dates[i].getTime() - dates[i + 1].getTime()) / (1000 * 60 * 60 * 24);
              totalDays += diff;
            }
            const avgDaysBetween = Math.round(totalDays / (dates.length - 1));

            // ── Días desde la última visita ──
            const lastVisitDate = dates[0];
            const daysSinceLastVisit = Math.round(
              (today.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            // ── Umbral de contacto proporcional ──
            // Offset = 15% del promedio (proporcional), con máximo contactWindowDays
            const pctOffset = Math.max(1, Math.round(avgDaysBetween * 0.15));
            const effectiveOffset = Math.min(pctOffset, contactWindowDays);
            const optimalContactDay = Math.max(1, avgDaysBetween - effectiveOffset);

            if (daysSinceLastVisit >= optimalContactDay) {
              // Calcular fecha óptima de contacto
              const optimalDate = new Date(lastVisitDate);
              optimalDate.setDate(optimalDate.getDate() + optimalContactDay);
              const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
              const fechaOptima = `${optimalDate.getDate()} ${meses[optimalDate.getMonth()]} ${optimalDate.getFullYear()}`;

              ruleResult.actions.push({
                clientId: client.id,
                clientName,
                action: 'SMART_CONTACT',
                details: `Frecuencia de visita: cada ${avgDaysBetween} días. Última visita: hace ${daysSinceLastVisit} días. Contactar antes: ${fechaOptima}.`,
              });

              await db.automationLog.create({
                data: {
                  action: 'SMART_CONTACT',
                  result: `Contacto inteligente para ${clientName}. Promedio ${avgDaysBetween} días entre visitas, ${daysSinceLastVisit} días desde la última visita.`,
                  ruleId: rule.id,
                  clientId: client.id,
                },
              });
            }
          }
          break;
        }
      }

      results.push(ruleResult);
    }

    return NextResponse.json({
      data: {
        rulesProcessed: automations.length,
        results,
        runAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error, 'Automations run');
  }
}
