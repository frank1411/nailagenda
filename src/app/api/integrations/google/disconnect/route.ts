import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-error-handler';
import { requireAuth } from '@/lib/auth';

/**
 * POST /api/integrations/google/disconnect
 *
 * Desconecta Google Calendar del usuario.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);
    const { disconnect } = await import('@/lib/google-calendar');
    await disconnect(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'Google Calendar disconnect');
  }
}
