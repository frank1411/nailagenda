import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * GET /api/integrations/google/auth
 *
 * Inicia el flujo OAuth: retorna la URL para redirigir al usuario a Google.
 * El userId se pasa como state en la URL de OAuth.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);
    const { getAuthURL } = await import('@/lib/google-calendar');
    const url = getAuthURL(userId);

    return NextResponse.json({ url });
  } catch (error) {
    return handleApiError(error, 'Google Calendar auth');
  }
}
