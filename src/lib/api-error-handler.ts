import { NextResponse } from 'next/server';
import { AppError, InternalError } from '@/lib/errors';

/**
 * Log level for each HTTP status code range.
 */
function logLevel(status: number): 'error' | 'warn' | 'info' {
  if (status >= 500) return 'error';
  if (status >= 400) return 'warn';
  return 'info';
}

/**
 * Centralized error handler for API routes.
 *
 * Reemplaza el boilerplate:
 *   try { ... } catch (error) {
 *     if (error instanceof AuthError) return NextResponse.json(...);
 *     console.error('...', error);
 *     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
 *   }
 *
 * Uso:
 *   return await handleApiError(error, 'Admin users list');
 */
export function handleApiError(
  error: unknown,
  context: string,
): NextResponse {
  // ── AppError → respuesta conocida ──
  if (error instanceof AppError) {
    log(context, logLevel(error.statusCode), error.message, { code: error.code, details: error.details });
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.statusCode },
    );
  }

  // ── Error desconocido → 500 ──
  const internal = new InternalError();
  log(context, 'error', internal.message, { originalError: extractMessage(error) });
  return NextResponse.json(
    { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
    { status: 500 },
  );
}

/**
 * Log estructurado con timestamp y contexto.
 * En producción se podría conectar a un servicio externo (pino, winston, etc.).
 */
function log(context: string, level: 'error' | 'warn' | 'info', message: string, meta?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${context}]`;

  if (level === 'error') {
    console.error(prefix, message, meta ?? '');
  } else if (level === 'warn') {
    console.warn(prefix, message, meta ?? '');
  } else {
    console.log(prefix, message, meta ?? '');
  }
}

function extractMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
