import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { updateClientSchema } from '@/lib/validations';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);

    const { id } = await params;

    const client = await db.client.findFirst({
      where: { id, userId },
      include: {
        clientNotes: { orderBy: { createdAt: 'desc' } },
        appointments: {
          orderBy: { date: 'desc' },
          include: { service: true },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ data: client });
  } catch (error) {
  } catch (error) {
    return handleApiError(error, 'Client');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);

    const { id } = await params;

    const existing = await db.client.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await request.json();

    const parsed = updateClientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { firstName, lastName, email, phone, notes, preferredStylist, birthday, status } = parsed.data;

    const client = await db.client.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(notes !== undefined && { notes }),
        ...(preferredStylist !== undefined && { preferredStylist }),
        ...(birthday !== undefined && { birthday }),
        ...(status !== undefined && { status }),
      },
    });

    return NextResponse.json({ data: client });
  } catch (error) {
  } catch (error) {
    return handleApiError(error, 'Client');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);

    const { id } = await params;

    const existing = await db.client.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    await db.client.delete({ where: { id } });

    return NextResponse.json({ data: { message: 'Client deleted' } });
  } catch (error) {
  } catch (error) {
    return handleApiError(error, 'Client');
  }
}
