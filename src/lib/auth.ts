import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BCRYPT_ROUNDS = 12;
const TOKEN_EXPIRY = '7d';
const COOKIE_NAME = 'nailagenda-token';

// AUTH_SECRET is required. The app will not start without it.
// Generate with: openssl rand -base64 32
function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      'AUTH_SECRET environment variable is required but not set.\n' +
      'Generate one with: openssl rand -base64 32\n' +
      'Add it to your .env file or production environment.'
    );
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.userId !== 'string') return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

// ── Cookie helpers ──

/** Number of seconds in 7 days for cookie maxAge */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function setTokenCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
}

export function clearTokenCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

// ── Token extraction ──

/**
 * Extract token from either the httpOnly cookie (preferred) or the
 * Authorization header (legacy — for backward compatibility during migration).
 */
async function extractToken(request: Request): Promise<string | null> {
  // 1. Try cookie first
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (token) return token;
  } catch {
    // cookies() throws if not in a request context — fall through
  }

  // 2. Fallback to Authorization header (legacy localStorage clients)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return null;
}

export function getSessionUserId(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  // Note: verifyToken is async, so we return the token for later verification
  // This is a sync helper for route handlers that should use requireAuth() instead
  return null;
}

// Proper async auth check for API routes
export async function requireAuth(request: Request): Promise<string> {
  const token = await extractToken(request);

  if (!token) {
    throw new AuthError('No se proporcionó un token de autenticación válido', 401);
  }

  const session = await verifyToken(token);

  if (!session) {
    throw new AuthError('Sesión expirada o token inválido', 401);
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, isActive: true, role: true, subscriptionExpiresAt: true, isDemo: true },
  });

  if (!user) {
    throw new AuthError('Usuario no encontrado', 404);
  }

  if (!user.isActive) {
    throw new AuthError('Esta cuenta ha sido inhabilitada', 403);
  }

  // Check subscription expiration for non-admin and non-demo users
  // Users with null subscriptionExpiresAt are treated as expired (except admin/demo)
  const isDemoUser = user.isDemo === true;
  if (user.role !== 'ADMIN' && !isDemoUser) {
    if (!user.subscriptionExpiresAt || new Date() > user.subscriptionExpiresAt) {
      throw new AuthError('Suscripción expirada. Por favor, contacta al administrador para renovar.', 402);
    }
  }

  return user.id;
}

export async function requireAdmin(request: Request): Promise<string> {
  const userId = await requireAuth(request);
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || user.role !== 'ADMIN') {
    throw new AuthError('Acceso denegado: se requieren permisos de administrador', 403);
  }

  return userId;
}

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AuthError';
  }
}
