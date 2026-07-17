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

    // Calculate tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    for (const rule of automations) {
      const ruleResult = {
        ruleId: rule.id,
        ruleName: rule.name,
        ruleType: rule.type,
        actions: [] as Array<{ clientId: string; clientName: string; action: string; details: string }>,
      };

      switch (rule.type) {
        case 'REMINDER': {
          // Find appointments in next 24h that need reminders
          const upcomingAppointments = await db.appointment.findMany({
            where: {
              userId,
              date: { gte: todayStr, lte: tomorrowStr },
              status: { in: ['PENDING', 'CONFIRMED'] },
            },
            include: { client: true, service: true },
          });

          for (const apt of upcomingAppointments) {
            const clientName = `${apt.client.firstName} ${apt.client.lastName}`;
            ruleResult.actions.push({
              clientId: apt.clientId,
              clientName,
              action: 'SEND_REMINDER',
              details: `Appointment reminder: ${apt.service.name} on ${apt.date} at ${apt.startTime}`,
            });

            // Log the action
            await db.automationLog.create({
              data: {
                action: 'SEND_REMINDER',
                result: `Reminder for ${clientName}: ${apt.service.name} on ${apt.date} at ${apt.startTime}`,
                ruleId: rule.id,
                clientId: apt.clientId,
              },
            });
          }
          break;
        }

        case 'REACTIVATION': {
          // Find clients inactive for 30+ days
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
                details: `Inactive since ${lastAppointment.date}. Last visit: ${lastAppointment.date}. Consider reaching out.`,
              });

              await db.automationLog.create({
                data: {
                  action: 'REACTIVATION_OUTREACH',
                  result: `Reactivation outreach for ${clientName}. Inactive since ${lastAppointment.date}.`,
                  ruleId: rule.id,
                  clientId: client.id,
                },
              });
            }
          }

          // Also check RECURRING/NEW clients with no appointments in 30+ days
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
              details: `No appointments in 30+ days. Consider reaching out.`,
            });

            await db.automationLog.create({
              data: {
                action: 'REACTIVATION_OUTREACH',
                result: `Reactivation outreach for ${clientName}. No recent appointments.`,
                ruleId: rule.id,
                clientId: client.id,
              },
            });
          }
          break;
        }

        case 'LOYALTY': {
          // Find recurring clients eligible for loyalty rewards (5+ completed appointments)
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
                details: `Completed ${completedCount} visits! Eligible for loyalty reward.`,
              });

              await db.automationLog.create({
                data: {
                  action: 'LOYALTY_REWARD',
                  result: `Loyalty reward for ${clientName}. ${completedCount} completed visits.`,
                  ruleId: rule.id,
                  clientId: client.id,
                },
              });
            }
          }
          break;
        }

        case 'SMART_CONTACT': {
          // Analyze each client's visit frequency and suggest optimal contact time
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

            const clientName = `${client.firstName} ${client.lastName}`;

            // Calculate average days between visits
            const dates = client.appointments.map((a) => new Date(a.date)).sort((a, b) => b.getTime() - a.getTime());
            let totalDays = 0;
            for (let i = 0; i < dates.length - 1; i++) {
              const diff = (dates[i].getTime() - dates[i + 1].getTime()) / (1000 * 60 * 60 * 24);
              totalDays += diff;
            }
            const avgDaysBetween = Math.round(totalDays / (dates.length - 1));

            // Calculate days since last visit
            const lastVisitDate = dates[0];
            const daysSinceLastVisit = Math.round((today.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));

            // If approaching the average interval, suggest contact
            const optimalContactDay = Math.max(1, avgDaysBetween - 3);
            if (daysSinceLastVisit >= optimalContactDay) {
              ruleResult.actions.push({
                clientId: client.id,
                clientName,
                action: 'SMART_CONTACT',
                details: `Visit frequency: every ${avgDaysBetween} days. Last visit: ${daysSinceLastVisit} days ago. Optimal time to reach out!`,
              });

              await db.automationLog.create({
                data: {
                  action: 'SMART_CONTACT',
                  result: `Smart contact for ${clientName}. Avg ${avgDaysBetween} days between visits, ${daysSinceLastVisit} days since last visit.`,
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
  } catch (error) {
    return handleApiError(error, 'Automations run');
  }
}
