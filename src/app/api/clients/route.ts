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
      const clients = await db.client.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: {
          appointments: {
            orderBy: { date: 'desc' },
            include: { service: true },
          },
        },
      });

      const clientsWithStats = clients.map((client) => {
        const { appointments, ...rest } = client;
        const totalVisits = appointments.filter((a) => a.status === 'COMPLETED').length;
        const lastAppointment = appointments[0] || null;
        return {
          ...rest,
          totalVisits,
          lastAppointment,
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
