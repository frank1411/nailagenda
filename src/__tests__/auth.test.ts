import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthError } from '@/lib/auth';

// ── Mocks ──
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2a$12$hashedpassword'),
    compare: vi.fn(),
  },
  hash: vi.fn().mockResolvedValue('$2a$12$hashedpassword'),
  compare: vi.fn(),
}));

vi.mock('jose', () => {
  const mockInstance = {
    setProtectedHeader: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue('mock-jwt-token'),
  };
  return {
    SignJWT: vi.fn(function () { return mockInstance; }) as any,
    jwtVerify: vi.fn(),
  };
});

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import * as auth from '@/lib/auth';

describe('Auth utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_SECRET = 'test-secret-that-is-at-least-32-chars-long!!';
  });

  // ── Password hashing ──

  describe('hashPassword', () => {
    it('hashes a password with bcrypt', async () => {
      const hash = await auth.hashPassword('my-password');
      expect(bcrypt.hash).toHaveBeenCalledWith('my-password', 12);
      expect(hash).toBe('$2a$12$hashedpassword');
    });
  });

  describe('verifyPassword', () => {
    it('returns true for matching password', async () => {
      (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      const result = await auth.verifyPassword('password', '$2a$12$hash');
      expect(bcrypt.compare).toHaveBeenCalledWith('password', '$2a$12$hash');
      expect(result).toBe(true);
    });

    it('returns false for wrong password', async () => {
      (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      const result = await auth.verifyPassword('wrong', '$2a$12$hash');
      expect(result).toBe(false);
    });
  });

  // ── JWT tokens ──

  describe('createToken', () => {
    it('creates a signed JWT with userId', async () => {
      const token = await auth.createToken('user-123');
      expect(SignJWT).toHaveBeenCalledWith({ userId: 'user-123' });
      expect(token).toBe('mock-jwt-token');
    });
  });

  describe('verifyToken', () => {
    it('returns userId when token is valid', async () => {
      (jwtVerify as ReturnType<typeof vi.fn>).mockResolvedValue({
        payload: { userId: 'user-123' },
      });
      const result = await auth.verifyToken('valid-token');
      expect(result).toEqual({ userId: 'user-123' });
    });

    it('returns null when payload lacks userId', async () => {
      (jwtVerify as ReturnType<typeof vi.fn>).mockResolvedValue({
        payload: { sub: 'user-123' },
      });
      const result = await auth.verifyToken('no-userid');
      expect(result).toBeNull();
    });

    it('returns null when JWT is expired or invalid', async () => {
      (jwtVerify as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('JWT expired'));
      const result = await auth.verifyToken('expired');
      expect(result).toBeNull();
    });
  });

  // ── Cookie helpers ──

  describe('setTokenCookie', () => {
    it('sets the auth cookie on the response', () => {
      const mockSet = vi.fn();
      const response = { cookies: { set: mockSet } } as any;
      auth.setTokenCookie(response, 'token-abc');
      expect(mockSet).toHaveBeenCalledWith('nailagenda-token', 'token-abc', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 604800,
      });
    });

    it('sets secure flag in production', () => {
      const orig = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const mockSet = vi.fn();
      const response = { cookies: { set: mockSet } } as any;
      auth.setTokenCookie(response, 'token-abc');
      expect(mockSet.mock.calls[0][2].secure).toBe(true);
      process.env.NODE_ENV = orig;
    });
  });

  describe('clearTokenCookie', () => {
    it('clears the auth cookie with maxAge 0', () => {
      const mockSet = vi.fn();
      const response = { cookies: { set: mockSet } } as any;
      auth.clearTokenCookie(response);
      expect(mockSet).toHaveBeenCalledWith('nailagenda-token', '', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
    });
  });

  // ── Token extraction ──

  describe('extractToken', () => {
    it('extracts token from cookie', async () => {
      (cookies as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: () => ({ value: 'cookie-token' }),
      });
      const request = { headers: new Map() } as any;
      const token = await auth.extractToken(request);
      expect(token).toBe('cookie-token');
    });

    it('falls back to Authorization header when no cookie', async () => {
      (cookies as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: () => undefined,
      });
      const request = {
        headers: new Map([['Authorization', 'Bearer header-token']]),
      } as any;
      const token = await auth.extractToken(request);
      expect(token).toBe('header-token');
    });

    it('returns null when neither cookie nor header exists', async () => {
      (cookies as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: () => undefined,
      });
      const request = { headers: new Map() } as any;
      const token = await auth.extractToken(request);
      expect(token).toBeNull();
    });

    it('handles cookies() throwing', async () => {
      (cookies as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('no context'));
      const request = {
        headers: new Map([['Authorization', 'Bearer fallback-token']]),
      } as any;
      const token = await auth.extractToken(request);
      expect(token).toBe('fallback-token');
    });
  });

  // ── requireAuth ──

  describe('requireAuth', () => {
    function mockUser(user: Partial<any>) {
      (cookies as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: () => ({ value: 'valid-token' }),
      });
      (jwtVerify as ReturnType<typeof vi.fn>).mockResolvedValue({
        payload: { userId: user.id },
      });
      (db.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(user);
    }

    it('throws AuthError 401 when no token', async () => {
      (cookies as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: () => undefined,
      });
      const request = { headers: new Map() } as any;
      await expect(auth.requireAuth(request)).rejects.toThrow(AuthError);
      await expect(auth.requireAuth(request)).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('throws AuthError 401 when token is invalid', async () => {
      (cookies as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: () => ({ value: 'bad-token' }),
      });
      (jwtVerify as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('bad'));
      const request = { headers: new Map() } as any;
      await expect(auth.requireAuth(request)).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('throws AuthError 404 when user not found', async () => {
      mockUser({ id: 'ghost-user' });
      (db.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      const request = { headers: new Map() } as any;
      await expect(auth.requireAuth(request)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('throws AuthError 403 when user is inactive', async () => {
      mockUser({ id: 'inactive-user' });
      (db.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'inactive-user',
        isActive: false,
        role: 'USER',
      });
      const request = { headers: new Map() } as any;
      await expect(auth.requireAuth(request)).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it('throws AuthError 402 when subscription expired', async () => {
      mockUser({ id: 'expired-user' });
      (db.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'expired-user',
        isActive: true,
        role: 'USER',
        isDemo: false,
        subscriptionExpiresAt: new Date('2020-01-01'),
      });
      const request = { headers: new Map() } as any;
      await expect(auth.requireAuth(request)).rejects.toMatchObject({
        statusCode: 402,
      });
    });

    it('passes for admin with null subscriptionExpiresAt', async () => {
      mockUser({ id: 'admin-user' });
      (db.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'admin-user', isActive: true, role: 'ADMIN',
        isDemo: false, subscriptionExpiresAt: null,
      });
      const request = { headers: new Map() } as any;
      const uid = await auth.requireAuth(request);
      expect(uid).toBe('admin-user');
    });

    it('passes for demo user bypassing subscription check', async () => {
      mockUser({ id: 'demo-user' });
      (db.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'demo-user', isActive: true, role: 'USER',
        isDemo: true, subscriptionExpiresAt: null,
      });
      const request = { headers: new Map() } as any;
      const uid = await auth.requireAuth(request);
      expect(uid).toBe('demo-user');
    });
  });

  // ── requireAdmin ──

  describe('requireAdmin', () => {
    it('throws AuthError 403 when user is not admin', async () => {
      (cookies as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: () => ({ value: 'user-token' }),
      });
      (jwtVerify as ReturnType<typeof vi.fn>).mockResolvedValue({
        payload: { userId: 'regular-user' },
      });
      (db.user.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          id: 'regular-user', isActive: true, role: 'USER',
          isDemo: false, subscriptionExpiresAt: new Date('2099-01-01'),
        })
        .mockResolvedValueOnce({ id: 'regular-user', role: 'USER' });
      const request = { headers: new Map() } as any;
      await expect(auth.requireAdmin(request)).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it('returns userId when user is admin', async () => {
      (cookies as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: () => ({ value: 'admin-token' }),
      });
      (jwtVerify as ReturnType<typeof vi.fn>).mockResolvedValue({
        payload: { userId: 'superadmin' },
      });
      (db.user.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          id: 'superadmin', isActive: true, role: 'ADMIN',
          isDemo: false, subscriptionExpiresAt: null,
        })
        .mockResolvedValueOnce({ id: 'superadmin', role: 'ADMIN' });
      const request = { headers: new Map() } as any;
      const uid = await auth.requireAdmin(request);
      expect(uid).toBe('superadmin');
    });
  });

  // ── AuthError class ──

  describe('AuthError', () => {
    it('creates an error with status code', () => {
      const err = new AuthError('Sin permisos', 403);
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('Sin permisos');
      expect(err.statusCode).toBe(403);
      expect(err.name).toBe('AuthError');
    });
  });
});
