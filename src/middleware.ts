import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting store (in-memory, per-instance)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = {
  auth: 5,      // 5 auth attempts per minute
  api: 60,      // 60 API calls per minute
  seed: 2,      // 2 seed calls per minute
};

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-real-ip') ||
         request.headers.get('x-forwarded-for')?.split(',')[0] ||
         'unknown';
}

function checkRateLimit(key: string, maxRequests: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  // Cleanup: remove expired entries to prevent memory leak
  if (rateLimitMap.size > 1000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (now > v.resetTime) {
        rateLimitMap.delete(k);
      }
    }
  }

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  entry.count++;
  return entry.count <= maxRequests;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Security headers for all responses
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Rate limiting
  const clientIp = getClientIp(request);

  if (pathname.startsWith('/api/auth')) {
    if (!checkRateLimit(`auth:${clientIp}`, RATE_LIMIT_MAX.auth)) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Por favor, espera un momento.' },
        { status: 429 }
      );
    }
    } else if (pathname === '/api/seed') {
      if (!checkRateLimit(`seed:${clientIp}`, RATE_LIMIT_MAX.seed)) {
        return NextResponse.json(
          { error: 'Demasiados intentos. Por favor, espera.' },
          { status: 429 }
        );
      }
    } else if (pathname.startsWith('/api/')) {
    if (!checkRateLimit(`api:${clientIp}`, RATE_LIMIT_MAX.api)) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Por favor, espera un momento.' },
        { status: 429 }
      );
    }
  }

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
