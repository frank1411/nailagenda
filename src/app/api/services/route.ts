import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { createServiceSchema } from '@/lib/validations';
import { FALLBACKS, shouldUseFallbacks } from '@/lib/fallbacks';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    try {
      const services = await db.service.findMany({
        where: { userId, active: true },
        orderBy: { name: 'asc' },
      });

      return NextResponse.json({ data: services });
    } catch (dbError) {
      console.error('DB Error in services GET:', dbError);
      if (!shouldUseFallbacks()) {
        return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
      }
      return NextResponse.json({ data: FALLBACKS.services });
    }
  } catch (error) {
  } catch (error) {
    return handleApiError(error, 'Services');
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
  } catch (error) {
    return handleApiError(error, 'Services');
  }
}
