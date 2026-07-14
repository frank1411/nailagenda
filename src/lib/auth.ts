import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { db } from '@/lib/db';

const BCRYPT_ROUNDS = 12;
const TOKEN_EXPIRY = '7d';

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

export function getSessionUserId(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  // Note: verifyToken is async, so we return the token for later verification
  // This is a sync helper for route handlers that should use requireAuth() instead
  return null;
}

// Proper async auth check for API routes
export async function requireAuth(request: Request): Promise<string> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthError('No se proporcionó un token de autenticación válido', 401);
  }

  const token = authHeader.slice(7);
  const session = await verifyToken(token);

  if (!session) {
    throw new AuthError('Sesión expirada o token inválido', 401);
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, isActive: true, role: true, subscriptionExpiresAt: true },
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
