/**
 * Jerarquía de errores para la aplicación.
 *
 * Uso: throw new NotFoundError('Cliente no encontrado');
 *
 * El API error handler (api-error-handler.ts) captura estos errores
 * y devuelve una respuesta JSON estandarizada.
 *
 * Formato de respuesta:
 *   { error: { code: string, message: string, details?: any } }
 */

export class AppError extends Error {
  /** Código HTTP */
  statusCode: number;
  /** Código interno legible para el frontend (ej. 'NOT_FOUND', 'VALIDATION_ERROR') */
  code: string;
  /** Detalles adicionales (errores de validación, etc.) */
  details?: unknown;

  constructor(message: string, statusCode: number, code?: string, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code ?? statusCodeToCode(statusCode);
    this.details = details;
  }
}

// ── Errores específicos ──

export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado', details?: unknown) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Datos inválidos', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflicto con el estado actual', details?: unknown) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acceso denegado') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class PaymentRequiredError extends AppError {
  constructor(message = 'Suscripción expirada') {
    super(message, 402, 'PAYMENT_REQUIRED');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Demasiadas solicitudes. Intenta de nuevo más tarde.') {
    super(message, 429, 'RATE_LIMIT');
  }
}

export class InternalError extends AppError {
  constructor(message = 'Error interno del servidor', details?: unknown) {
    super(message, 500, 'INTERNAL_ERROR', details);
  }
}

// ── Helper ──

function statusCodeToCode(status: number): string {
  const map: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    402: 'PAYMENT_REQUIRED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'RATE_LIMIT',
    500: 'INTERNAL_ERROR',
  };
  return map[status] ?? 'ERROR';
}
