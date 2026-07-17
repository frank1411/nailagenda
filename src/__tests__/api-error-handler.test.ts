import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError, NotFoundError } from '@/lib/errors';

// ── Mock de NextResponse ──
const mockJson = vi.fn();
vi.mock('next/server', () => ({
  NextResponse: {
    json: (...args: unknown[]) => {
      mockJson(...args);
      return { _mock: true, args };
    },
  },
}));

// Importamos el handler (vitest hoísta los mocks antes de los imports)
import { handleApiError } from '@/lib/api-error-handler';

describe('handleApiError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('with AppError instances', () => {
    it('returns 400 for ValidationError', () => {
      const err = new AppError('Invalid email', 400, 'VALIDATION_ERROR');
      handleApiError(err, 'Test');

      expect(mockJson).toHaveBeenCalledWith(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid email' } },
        { status: 400 },
      );
    });

    it('returns 404 for NotFoundError', () => {
      handleApiError(new NotFoundError('User not found'), 'Users');

      expect(mockJson).toHaveBeenCalledWith(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 },
      );
    });

    it('returns 401 for UnauthorizedError', () => {
      handleApiError(new AppError('Login required', 401, 'UNAUTHORIZED'), 'Auth');

      expect(mockJson).toHaveBeenCalledWith(
        { error: { code: 'UNAUTHORIZED', message: 'Login required' } },
        { status: 401 },
      );
    });

    it('returns 429 for RateLimitError', () => {
      handleApiError(new AppError('Too many', 429, 'RATE_LIMIT'), 'Rate limit');

      expect(mockJson).toHaveBeenCalledWith(
        { error: { code: 'RATE_LIMIT', message: 'Too many' } },
        { status: 429 },
      );
    });
  });

  describe('with unknown errors', () => {
    it('returns 500 for plain Error', () => {
      handleApiError(new Error('DB connection failed'), 'Users');

      expect(mockJson).toHaveBeenCalledWith(
        { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
        { status: 500 },
      );
    });

    it('returns 500 for string error', () => {
      handleApiError('something crashed', 'Test');

      expect(mockJson).toHaveBeenCalledWith(
        { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
        { status: 500 },
      );
    });

    it('returns 500 for null', () => {
      handleApiError(null, 'Test');

      expect(mockJson).toHaveBeenCalledWith(
        { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
        { status: 500 },
      );
    });
  });

  describe('response format', () => {
    it('returns standardised { error: { code, message } }', () => {
      handleApiError(new AppError('Test', 400), 'Test');
      const call = mockJson.mock.calls[0];
      const body = call[0];
      expect(body).toHaveProperty('error');
      expect(body.error).toHaveProperty('code');
      expect(body.error).toHaveProperty('message');
      expect(body.error).not.toHaveProperty('details');
    });
  });
});
