import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, verifyPassword, createToken, requireAuth, AuthError, setTokenCookie, clearTokenCookie } from '@/lib/auth';
import { registerSchema, loginSchema } from '@/lib/validations';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

// ── Rate limit configs ──
// Login: 5 attempts per IP per minute (prevents brute force)
// Register: 3 attempts per IP per hour (prevents mass account creation)
const LOGIN_RATE_LIMIT = { max: 5, windowMs: 60_000, keyPrefix: 'auth:login' };
const REGISTER_RATE_LIMIT = { max: 3, windowMs: 3_600_000, keyPrefix: 'auth:register' };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    const clientIP = getClientIP(request);

    if (action === 'register') {
      // Rate limit: 3 registrations per IP per hour
      const rateLimit = checkRateLimit(clientIP, REGISTER_RATE_LIMIT);
      if (!rateLimit.allowed) {
        const minutes = Math.ceil(rateLimit.resetIn / 60_000);
        return NextResponse.json(
          { error: `Demasiados registros. Intenta de nuevo en ${minutes} minuto${minutes === 1 ? '' : 's'}.` },
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)),
              'X-RateLimit-Limit': String(rateLimit.limit),
              'X-RateLimit-Remaining': String(rateLimit.remaining),
              'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetIn / 1000)),
            },
          },
        );
      }

      const parsed = registerSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      const { email, name, password, salonName } = parsed.data;
      const existing = await db.user.findUnique({ where: { email } });
      if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
      const hashedPassword = await hashPassword(password);
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
      const user = await db.user.create({ 
        data: { 
          email, 
          name, 
          password: hashedPassword, 
          salonName: salonName || 'Mi Peluquería',
          subscriptionExpiresAt: expirationDate
        } 
      });
      const token = await createToken(user.id);
      const response = NextResponse.json({ data: { user: { id: user.id, email: user.email, name: user.name, salonName: user.salonName, role: user.role, isDemo: user.isDemo }, token }, }, { status: 201 });
      setTokenCookie(response, token);
      return response;
    }

    if (action === 'login') {
      // Rate limit: 5 login attempts per IP per minute
      const rateLimit = checkRateLimit(clientIP, LOGIN_RATE_LIMIT);
      if (!rateLimit.allowed) {
        const seconds = Math.ceil(rateLimit.resetIn / 1000);
        return NextResponse.json(
          { error: `Demasiados intentos. Intenta de nuevo en ${seconds} segundo${seconds === 1 ? '' : 's'}.` },
          {
            status: 429,
            headers: {
              'Retry-After': String(seconds),
              'X-RateLimit-Limit': String(rateLimit.limit),
              'X-RateLimit-Remaining': String(rateLimit.remaining),
              'X-RateLimit-Reset': String(seconds),
            },
          },
        );
      }

      const parsed = loginSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      const { email, password } = parsed.data;
      const user = await db.user.findUnique({ where: { email } });
      if (!user || !(await verifyPassword(password, user.password))) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      const token = await createToken(user.id);
      const response = NextResponse.json({ data: { user: { id: user.id, email: user.email, name: user.name, salonName: user.salonName, role: user.role, isDemo: user.isDemo }, token } });
      setTokenCookie(response, token);
      return response;
    }

    if (action === 'logout') {
      const response = NextResponse.json({ data: { message: 'Logged out' } });
      clearTokenCookie(response);
      return response;
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ data: user });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
