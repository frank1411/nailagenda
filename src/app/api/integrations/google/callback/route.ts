import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * GET /api/integrations/google/callback
 *
 * Google redirige aquí tras la autorización del usuario.
 * Canjea el code por tokens y los guarda en BD.
 * PÚBLICO — Google no manda auth cookies.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // userId
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/settings?google=error&reason=${error}`, request.url),
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings?google=error&reason=missing_params', request.url),
      );
    }

    const { handleCallback } = await import('@/lib/google-calendar');
    await handleCallback(code, state);

    return NextResponse.redirect(
      new URL('/settings?google=connected', request.url),
    );
  } catch (error) {
    return handleApiError(error, 'Google Calendar callback');
  }
}
