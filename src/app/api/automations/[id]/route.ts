import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { updateAutomationSchema } from '@/lib/validations';
import { handleApiError } from '@/lib/api-error-handler';

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

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (config !== undefined) updateData.config = config as object;
    if (active !== undefined) updateData.active = active;

    const automation = await db.automationRule.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: automation });
  } catch (error) {
  } catch (error) {
    return handleApiError(error, 'Automation');
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
  } catch (error) {
    return handleApiError(error, 'Automation');
  }
}
