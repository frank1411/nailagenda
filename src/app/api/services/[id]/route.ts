import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';
import { updateServiceSchema } from '@/lib/validations';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);

    const { id } = await params;

    const existing = await db.service.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const body = await request.json();

    const parsed = updateServiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { name, description, duration, price, category, active } = parsed.data;

    const service = await db.service.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(duration !== undefined && { duration }),
        ...(price !== undefined && { price }),
        ...(category !== undefined && { category }),
        ...(active !== undefined && { active }),
      },
    });

    return NextResponse.json({ data: service });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Service update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);

    const { id } = await params;

    const existing = await db.service.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Soft delete
    await db.service.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ data: { message: 'Service deactivated' } });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Service delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
