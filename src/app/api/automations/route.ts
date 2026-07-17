import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';
import { createAutomationSchema } from '@/lib/validations';
import { FALLBACKS, shouldUseFallbacks } from '@/lib/fallbacks';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    try {
      const automations = await db.automationRule.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { logs: true } },
        },
      });

      return NextResponse.json({ data: automations });
    } catch (dbError) {
      console.error('DB Error in automations GET:', dbError);
      if (!shouldUseFallbacks()) {
        return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
      }
      return NextResponse.json({ data: FALLBACKS.automations });
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Automations list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const body = await request.json();

    const parsed = createAutomationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { name, description, type, config, active } = parsed.data;

    const automation = await db.automationRule.create({
      data: {
        name,
        description: description || null,
        type,
        config: (config ?? {}) as object,
        active,
        userId,
      },
    });

    return NextResponse.json({ data: automation }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Automation create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
