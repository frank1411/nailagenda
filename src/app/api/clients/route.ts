import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';
import { createClientSchema } from '@/lib/validations';
import { FALLBACKS } from '@/lib/fallbacks';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = { userId };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    try {
      // Usar _count agregado de Prisma en lugar de traer todas las citas
      // y solo la última cita (take: 1), no todas
      const clients = await db.client.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          notes: true,
          preferredStylist: true,
          birthday: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          // Contador agregado — lo calcula PostgreSQL, no carga datos
          _count: {
            select: { appointments: { where: { status: 'COMPLETED' } } },
          },
          // Solo traer la última cita, no todas
          appointments: {
            orderBy: { date: 'desc' },
            take: 1,
            select: {
              id: true,
              date: true,
              startTime: true,
              status: true,
              service: { select: { name: true, price: true } },
            },
          },
        },
      });

      const clientsWithStats = clients.map((client) => {
        const { appointments, _count, ...rest } = client;
        return {
          ...rest,
          totalVisits: _count.appointments,
          lastAppointment: appointments[0] || null,
        };
      });

      return NextResponse.json({ data: clientsWithStats });
    } catch (dbError) {
      console.error('DB Error in clients GET, using fallbacks:', dbError);
      return NextResponse.json({ data: FALLBACKS.clients });
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Clients list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const body = await request.json();

    const parsed = createClientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { firstName, lastName, email, phone, notes, preferredStylist, birthday, status } = parsed.data;

    const client = await db.client.create({
      data: {
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        notes: notes || null,
        preferredStylist: preferredStylist || null,
        birthday: birthday || null,
        status,
        userId,
      },
    });

    return NextResponse.json({ data: client }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Client create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
