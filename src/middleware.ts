import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { extractToken } from '@/lib/auth';
import { validateCSRF } from '@/lib/csrf';

/**
 * Security middleware — runs on every matched request.
 *
 * Responsibilities:
 * 1. Inject security headers (CSP, HSTS, X-Frame-Options, etc.)
 * 2. Validate auth for protected API routes
 * 3. Block sensitive routes from unauthorized access
 */

// ── Security headers ──

const SECURITY_HEADERS: Record<string, string> = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  // Enable browser XSS filter
  'X-XSS-Protection': '1; mode=block',
  // Referrer policy: send only same-origin
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Permissions: deny all by default, allow what we use
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// CSP: restrict script and style sources
// In Next.js with Turbopack, inline scripts are required for HMR — allow 'unsafe-inline' for scripts
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel.live",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self' https://*.supabase.co https://api.vercel.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

// ── Route protection ──

/**
 * API routes that do NOT require authentication.
 * Everything else under /api/ is protected by default.
 */
const PUBLIC_API_ROUTES = new Set([
  '/api/auth',         // login, register, logout
  '/api/ping',         // health check
  '/api/sanity-check', // internal check
]);

// Routes that should NOT be protected even if under /api/ (they handle their own auth)
const SELF_AUTH_ROUTES = [
  '/api/seed',         // admin seed (has its own check)
  '/api/test-db',      // dev-only
  '/api/download',     // has its own token validation
];

function isPublicRoute(pathname: string): boolean {
  // Exact match for single-level routes like /api/auth
  if (PUBLIC_API_ROUTES.has(pathname)) return true;

  // Prefix match for nested self-auth routes
  for (const prefix of SELF_AUTH_ROUTES) {
    if (pathname.startsWith(prefix)) return true;
  }

  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // ── Add security headers to all responses ──
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  response.headers.set('Content-Security-Policy', CSP);

  // ── CSRF: validate Origin/Referer for mutation methods ──
  if (pathname.startsWith('/api/')) {
    const csrfError = validateCSRF(request);
    if (csrfError) {
      return NextResponse.json(
        { error: csrfError },
        { status: 403 },
      );
    }
  }

  // ── Auth check for protected API routes ──
  if (pathname.startsWith('/api/') && !isPublicRoute(pathname)) {
    try {
      // extractToken reads from httpOnly cookie, with Bearer header fallback
      const token = await extractToken(request);

      if (!token) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 },
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Apply to API routes
    '/api/:path*',
    // Apply to page routes (for security headers)
    '/((?!_next/static|_next/image|favicon.ico|glamcrm-logo.png).*)',
  ],
};
