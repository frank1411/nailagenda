import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';
import { updateAutomationSchema } from '@/lib/validations';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);

    const { id } = await params;

    const existing = await db.automationRule.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    const body = await request.json();

    const parsed = updateAutomationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { name, description, type, config, active } = parsed.data;

    const automation = await db.automationRule.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(config !== undefined && { config: JSON.stringify(config) }),
        ...(active !== undefined && { active }),
      },
    });

    return NextResponse.json({ data: automation });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Automation update error:', error);
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

    const existing = await db.automationRule.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    await db.automationRule.delete({ where: { id } });

    return NextResponse.json({ data: { message: 'Automation deleted' } });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Automation delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
