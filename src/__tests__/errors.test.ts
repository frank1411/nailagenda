import { describe, it, expect } from 'vitest';
import {
  AppError,
  NotFoundError,
  ValidationError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  PaymentRequiredError,
  RateLimitError,
  InternalError,
} from '@/lib/errors';

describe('AppError hierarchy', () => {
  describe('AppError (base)', () => {
    it('creates with message and statusCode', () => {
      const err = new AppError('Algo salió mal', 400);
      expect(err.message).toBe('Algo salió mal');
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe('BAD_REQUEST');
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe('AppError');
    });

    it('uses provided code when given', () => {
      const err = new AppError('Custom', 422, 'CUSTOM_CODE');
      expect(err.code).toBe('CUSTOM_CODE');
    });

    it('attaches details', () => {
      const details = { field: 'email', reason: 'already taken' };
      const err = new AppError('Conflict', 409, 'CONFLICT', details);
      expect(err.details).toEqual(details);
    });

    it('auto-maps status codes to codes', () => {
      expect(new AppError('', 400).code).toBe('BAD_REQUEST');
      expect(new AppError('', 401).code).toBe('UNAUTHORIZED');
      expect(new AppError('', 404).code).toBe('NOT_FOUND');
      expect(new AppError('', 500).code).toBe('INTERNAL_ERROR');
      expect(new AppError('', 999).code).toBe('ERROR');
    });
  });

  describe('NotFoundError', () => {
    it('defaults to 404 / NOT_FOUND', () => {
      const err = new NotFoundError();
      expect(err.statusCode).toBe(404);
      expect(err.code).toBe('NOT_FOUND');
      expect(err.message).toBe('Recurso no encontrado');
    });

    it('accepts custom message', () => {
      const err = new NotFoundError('Cliente no existe');
      expect(err.message).toBe('Cliente no existe');
    });

    it('is instance of AppError', () => {
      expect(new NotFoundError()).toBeInstanceOf(AppError);
    });
  });

  describe('ValidationError', () => {
    it('defaults to 400 / VALIDATION_ERROR', () => {
      const err = new ValidationError();
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('ConflictError', () => {
    it('defaults to 409 / CONFLICT', () => {
      const err = new ConflictError();
      expect(err.statusCode).toBe(409);
      expect(err.code).toBe('CONFLICT');
    });
  });

  describe('UnauthorizedError', () => {
    it('defaults to 401 / UNAUTHORIZED', () => {
      const err = new UnauthorizedError();
      expect(err.statusCode).toBe(401);
      expect(err.code).toBe('UNAUTHORIZED');
    });
  });

  describe('ForbiddenError', () => {
    it('defaults to 403 / FORBIDDEN', () => {
      const err = new ForbiddenError();
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe('FORBIDDEN');
    });
  });

  describe('PaymentRequiredError', () => {
    it('defaults to 402 / PAYMENT_REQUIRED', () => {
      const err = new PaymentRequiredError();
      expect(err.statusCode).toBe(402);
      expect(err.code).toBe('PAYMENT_REQUIRED');
    });
  });

  describe('RateLimitError', () => {
    it('defaults to 429 / RATE_LIMIT', () => {
      const err = new RateLimitError();
      expect(err.statusCode).toBe(429);
      expect(err.code).toBe('RATE_LIMIT');
    });
  });

  describe('InternalError', () => {
    it('defaults to 500 / INTERNAL_ERROR', () => {
      const err = new InternalError();
      expect(err.statusCode).toBe(500);
      expect(err.code).toBe('INTERNAL_ERROR');
    });
  });
});
