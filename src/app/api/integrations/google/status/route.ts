import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-error-handler';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/integrations/google/status
 *
 * Retorna si el usuario tiene Google Calendar conectado.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);
    const { getConnectionStatus } = await import('@/lib/google-calendar');
    const status = await getConnectionStatus(userId);

    return NextResponse.json(status);
  } catch (error) {
    return handleApiError(error, 'Google Calendar status');
  }
}
