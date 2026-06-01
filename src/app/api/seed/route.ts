import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const seedSecret = process.env.SEED_SECRET || 'mayenailsart-seed-2024';

    if (!token || token !== seedSecret) {
      return NextResponse.json({ error: 'Token de seguridad no válido o ausente' }, { status: 401 });
    }

    // Check if demo user already exists
    const existingUser = await db.user.findUnique({ where: { email: 'demo@mayenailsart.com' } });
    if (existingUser) {
      return NextResponse.json({
        data: {
          message: 'Demo data already exists',
          user: { id: existingUser.id, email: existingUser.email, name: existingUser.name },
        },
      });
    }


    // Create demo user
    const hashedPassword = await hashPassword('password123');
    const user = await db.user.create({
      data: {
        email: 'demo@mayenailsart.com',
        name: 'Maye García',
        password: hashedPassword,
        salonName: 'CrmNailsAgency Studio',
        salonAddress: 'Calle Principal 123, Caracas',
        role: 'OWNER',
      },
    });

    // Create sample services
    const services = await Promise.all([
      db.service.create({
        data: { name: 'Corte de Pelo', description: 'Corte y estilo personalizado', duration: 30, price: 25.0, category: 'HAIRCUT', userId: user.id },
      }),
      db.service.create({
        data: { name: 'Coloración', description: 'Tinte completo o mechas', duration: 90, price: 60.0, category: 'COLORING', userId: user.id },
      }),
      db.service.create({
        data: { name: 'Brushing', description: 'Secado y peinado profesional', duration: 45, price: 20.0, category: 'STYLING', userId: user.id },
      }),
      db.service.create({
        data: { name: 'Tratamiento Keratina', description: 'Alisado con keratina', duration: 120, price: 85.0, category: 'TREATMENT', userId: user.id },
      }),
      db.service.create({
        data: { name: 'Mechas Balayage', description: 'Técnica de mechas naturales', duration: 120, price: 75.0, category: 'COLORING', userId: user.id },
      }),
      db.service.create({
        data: { name: 'Corte + Brushing', description: 'Corte con secado incluido', duration: 60, price: 38.0, category: 'HAIRCUT', userId: user.id },
      }),
      db.service.create({
        data: { name: 'Hidratación Profunda', description: 'Tratamiento nutritivo capilar', duration: 45, price: 30.0, category: 'TREATMENT', userId: user.id },
      }),
      db.service.create({
        data: { name: 'Peinado Evento', description: 'Peinado para ocasiones especiales', duration: 60, price: 45.0, category: 'STYLING', userId: user.id },
      }),
    ]);

    // Create sample clients
    const clientData = [
      { firstName: 'Ana', lastName: 'López', email: 'ana@email.com', phone: '+34 612 345 678', status: 'RECURRING', preferredStylist: 'María', birthday: '1990-03-15' },
      { firstName: 'Carmen', lastName: 'Rodríguez', email: 'carmen@email.com', phone: '+34 623 456 789', status: 'RECURRING', preferredStylist: 'María', birthday: '1985-07-22' },
      { firstName: 'Laura', lastName: 'Martínez', email: 'laura@email.com', phone: '+34 634 567 890', status: 'NEW', birthday: '1995-11-08' },
      { firstName: 'Elena', lastName: 'Sánchez', email: 'elena@email.com', phone: '+34 645 678 901', status: 'RECURRING', preferredStylist: 'María', birthday: '1988-01-30' },
      { firstName: 'Isabel', lastName: 'García', email: 'isabel@email.com', phone: '+34 656 789 012', status: 'INACTIVE', birthday: '1992-05-14' },
      { firstName: 'Marta', lastName: 'Fernández', email: 'marta@email.com', phone: '+34 667 890 123', status: 'NEW', birthday: '1998-09-25' },
      { firstName: 'Sofía', lastName: 'Torres', email: 'sofia@email.com', phone: '+34 678 901 234', status: 'RECURRING', preferredStylist: 'María', birthday: '1987-12-03' },
      { firstName: 'Paula', lastName: 'Díaz', email: 'paula@email.com', phone: '+34 689 012 345', status: 'INACTIVE', birthday: '1993-04-19' },
      { firstName: 'Lucía', lastName: 'Moreno', email: 'lucia@email.com', phone: '+34 690 123 456', status: 'NEW', birthday: '1996-08-11' },
      { firstName: 'Marina', lastName: 'Jiménez', email: 'marina@email.com', phone: '+34 601 234 567', status: 'RECURRING', preferredStylist: 'María', birthday: '1991-06-27' },
      { firstName: 'Rosa', lastName: 'Hernández', email: 'rosa@email.com', phone: '+34 612 234 567', status: 'INACTIVE', birthday: '1984-02-10' },
      { firstName: 'Teresa', lastName: 'Ruiz', email: 'teresa@email.com', phone: '+34 623 345 678', status: 'NEW', birthday: '1997-10-05' },
      { firstName: 'Beatriz', lastName: 'Álvarez', email: 'beatriz@email.com', phone: '+34 634 456 789', status: 'RECURRING', birthday: '1989-07-18' },
      { firstName: 'Clara', lastName: 'Romero', email: 'clara@email.com', phone: '+34 645 567 890', status: 'NEW', birthday: '1994-03-22' },
    ];

    const clients = await Promise.all(
      clientData.map((c) =>
        db.client.create({
          data: {
            ...c,
            userId: user.id,
          },
        })
      )
    );

    // Create sample appointments
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

    const fiveDaysAgo = new Date(today);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const fiveDaysAgoStr = fiveDaysAgo.toISOString().split('T')[0];

    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];

    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0];

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const inThreeDays = new Date(today);
    inThreeDays.setDate(inThreeDays.getDate() + 3);
    const inThreeDaysStr = inThreeDays.toISOString().split('T')[0];

    const inOneWeek = new Date(today);
    inOneWeek.setDate(inOneWeek.getDate() + 7);
    const inOneWeekStr = inOneWeek.toISOString().split('T')[0];

    const appointmentData = [
      // Past appointments (completed)
      { clientId: clients[0].id, serviceId: services[0].id, date: oneWeekAgoStr, startTime: '10:00', endTime: '10:30', status: 'COMPLETED', notes: 'Corte habitual' },
      { clientId: clients[1].id, serviceId: services[1].id, date: twoWeeksAgoStr, startTime: '11:00', endTime: '12:30', status: 'COMPLETED', notes: 'Color rubio ceniza' },
      { clientId: clients[3].id, serviceId: services[5].id, date: oneWeekAgoStr, startTime: '12:00', endTime: '13:00', status: 'COMPLETED' },
      { clientId: clients[6].id, serviceId: services[3].id, date: fiveDaysAgoStr, startTime: '09:00', endTime: '11:00', status: 'COMPLETED', notes: 'Primera keratina' },
      { clientId: clients[9].id, serviceId: services[0].id, date: threeDaysAgoStr, startTime: '16:00', endTime: '16:30', status: 'COMPLETED' },
      { clientId: clients[12].id, serviceId: services[2].id, date: fiveDaysAgoStr, startTime: '14:00', endTime: '14:45', status: 'COMPLETED' },
      { clientId: clients[0].id, serviceId: services[4].id, date: twoDaysAgoStr, startTime: '10:00', endTime: '12:00', status: 'COMPLETED', notes: 'Balayage natural' },
      { clientId: clients[1].id, serviceId: services[0].id, date: yesterdayStr, startTime: '09:30', endTime: '10:00', status: 'COMPLETED' },
      { clientId: clients[3].id, serviceId: services[6].id, date: yesterdayStr, startTime: '11:00', endTime: '11:45', status: 'COMPLETED' },
      { clientId: clients[9].id, serviceId: services[7].id, date: yesterdayStr, startTime: '13:00', endTime: '14:00', status: 'COMPLETED', notes: 'Peinado para boda' },

      // Past no-show
      { clientId: clients[4].id, serviceId: services[0].id, date: threeDaysAgoStr, startTime: '15:00', endTime: '15:30', status: 'NO_SHOW' },

      // Past cancelled
      { clientId: clients[7].id, serviceId: services[1].id, date: twoDaysAgoStr, startTime: '16:00', endTime: '17:30', status: 'CANCELLED' },

      // Today's appointments
      { clientId: clients[2].id, serviceId: services[5].id, date: todayStr, startTime: '09:00', endTime: '10:00', status: 'CONFIRMED', notes: 'Primera visita' },
      { clientId: clients[0].id, serviceId: services[2].id, date: todayStr, startTime: '10:30', endTime: '11:15', status: 'CONFIRMED' },
      { clientId: clients[5].id, serviceId: services[0].id, date: todayStr, startTime: '12:00', endTime: '12:30', status: 'PENDING' },
      { clientId: clients[6].id, serviceId: services[6].id, date: todayStr, startTime: '16:00', endTime: '16:45', status: 'CONFIRMED' },

      // Future appointments
      { clientId: clients[1].id, serviceId: services[4].id, date: tomorrowStr, startTime: '10:00', endTime: '12:00', status: 'CONFIRMED', notes: 'Mechas para el verano' },
      { clientId: clients[3].id, serviceId: services[3].id, date: inThreeDaysStr, startTime: '09:00', endTime: '11:00', status: 'PENDING' },
      { clientId: clients[8].id, serviceId: services[0].id, date: inThreeDaysStr, startTime: '11:30', endTime: '12:00', status: 'CONFIRMED' },
      { clientId: clients[12].id, serviceId: services[1].id, date: inOneWeekStr, startTime: '10:00', endTime: '11:30', status: 'PENDING' },
      { clientId: clients[9].id, serviceId: services[5].id, date: inOneWeekStr, startTime: '12:00', endTime: '13:00', status: 'CONFIRMED' },
    ];

    await Promise.all(
      appointmentData.map((apt) =>
        db.appointment.create({
          data: {
            ...apt,
            userId: user.id,
          },
        })
      )
    );

    // Create sample client notes
    const noteData = [
      { clientId: clients[0].id, content: 'Prefiere cortes modernos y atrevidos', type: 'PREFERENCE' },
      { clientId: clients[0].id, content: 'Alergia a productos con amoniaco - usar productos sin amoniaco', type: 'ALERT' },
      { clientId: clients[1].id, content: 'Siempre quiere cita los viernes por la mañana', type: 'PREFERENCE' },
      { clientId: clients[3].id, content: 'Cliente muy puntual y agradecida', type: 'NOTE' },
      { clientId: clients[4].id, content: 'Tuvo una mala experiencia en la última visita - seguimiento pendiente', type: 'ALERT' },
      { clientId: clients[6].id, content: 'Cabello muy fino - usar productos voluminizadores', type: 'PREFERENCE' },
      { clientId: clients[7].id, content: 'Canceló última cita por enfermedad', type: 'NOTE' },
      { clientId: clients[9].id, content: 'Prefiere tonos rubio cálido', type: 'PREFERENCE' },
      { clientId: clients[12].id, content: 'Viene referida por Ana López', type: 'NOTE' },
    ];

    await Promise.all(
      noteData.map((note) =>
        db.clientNote.create({ data: note })
      )
    );

    // Create sample automation rules
    const automationData = [
      {
        name: 'Recordatorio 24h',
        description: 'Envía un recordatorio a los clientes 24 horas antes de su cita',
        type: 'REMINDER',
        config: JSON.stringify({ hoursBefore: 24, channel: 'sms' }),
        active: true,
        userId: user.id,
      },
      {
        name: 'Reactivación Clientes Inactivos',
        description: 'Contacta a clientes que no han visitado en 30+ días',
        type: 'REACTIVATION',
        config: JSON.stringify({ inactiveDays: 30, channel: 'whatsapp' }),
        active: true,
        userId: user.id,
      },
      {
        name: 'Programa de Fidelidad',
        description: 'Recompensa a clientes frecuentes cada 5 visitas',
        type: 'LOYALTY',
        config: JSON.stringify({ visitsThreshold: 5, reward: '10% descuento' }),
        active: true,
        userId: user.id,
      },
      {
        name: 'Contacto Inteligente',
        description: 'Analiza la frecuencia de visitas y sugiere el momento óptimo para contactar',
        type: 'SMART_CONTACT',
        config: JSON.stringify({ daysBeforeDue: 3 }),
        active: true,
        userId: user.id,
      },
    ];

    await Promise.all(
      automationData.map((automation) =>
        db.automationRule.create({ data: automation })
      )
    );

    return NextResponse.json({
      data: {
        message: 'Demo data seeded successfully',
        user: { id: user.id, email: user.email, name: user.name },
        counts: {
          services: services.length,
          clients: clients.length,
          appointments: appointmentData.length,
          notes: noteData.length,
          automations: automationData.length,
        },
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
