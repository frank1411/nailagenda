import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { createNoteSchema } from '@/lib/validations';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);

    const { id: clientId } = await params;

    const client = await db.client.findFirst({ where: { id: clientId, userId } });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const notes = await db.clientNote.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: notes });
  } catch (error) {
    return handleApiError(error, 'Client notes');
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);

    const { id: clientId } = await params;

    const client = await db.client.findFirst({ where: { id: clientId, userId } });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await request.json();

    const parsed = createNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { content, type } = parsed.data;

    const note = await db.clientNote.create({
      data: {
        content,
        type,
        clientId,
      },
    });

    return NextResponse.json({ data: note }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Client notes');
  }
}
