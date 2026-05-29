import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';
import { createServiceSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const services = await db.service.findMany({
      where: { userId, active: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: services });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Services list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const body = await request.json();

    const parsed = createServiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { name, description, duration, price, category } = parsed.data;

    const service = await db.service.create({
      data: {
        name,
        description: description || null,
        duration,
        price,
        category,
        userId,
      },
    });

    return NextResponse.json({ data: service }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Service create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
