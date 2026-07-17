/**
 * CSRF protection utilities.
 *
 * Strategy (OWASP recommended for SPA + API):
 * 1. Validate Origin/Referer header on every mutation request (POST, PUT, PATCH, DELETE).
 * 2. The httpOnly cookie already has sameSite='lax', which prevents basic CSRF.
 * 3. Origin/Referer check adds defense-in-depth against sophisticated attacks.
 */

// Mutation HTTP methods that require CSRF validation
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Routes that are allowed to receive cross-origin mutation requests
// (e.g., login/register must work from any origin)
const CROSS_ORIGIN_ALLOWED = new Set([
  '/api/auth',
]);

function isMutationMethod(method: string): boolean {
  return MUTATION_METHODS.has(method.toUpperCase());
}

function isCrossOriginAllowed(pathname: string): boolean {
  return CROSS_ORIGIN_ALLOWED.has(pathname as any) || 
    Array.from(CROSS_ORIGIN_ALLOWED).some(route => pathname.startsWith(route));
}

/**
 * Extracts the origin from a request by checking the Origin header first,
 * then falling back to the Referer header.
 */
function extractOrigin(request: { headers: Headers }): string | null {
  // Origin header is the most reliable (always sent on cross-origin POST)
  const origin = request.headers.get('Origin');
  if (origin) return origin;

  // Fallback to Referer (less reliable but still useful)
  const referer = request.headers.get('Referer');
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Validates the Origin/Referer header for a mutation request.
 *
 * Returns an error message if validation fails, or `null` if the request is safe.
 */
export function validateCSRF(
  request: { headers: Headers; nextUrl: { origin: string; pathname: string }; method: string },
): string | null {
  const { pathname, origin: serverOrigin } = request.nextUrl;

  // Only validate mutation methods
  if (!isMutationMethod(request.method)) return null;

  // Cross-origin allowed routes skip CSRF check (e.g., login/register)
  if (isCrossOriginAllowed(pathname)) return null;

  const requestOrigin = extractOrigin(request);

  // No Origin or Referer header on a mutation request — block it.
  // Browsers always send Origin on cross-origin POST, so missing it
  // suggests a scripted attack (e.g., from a terminal or a very old browser).
  if (!requestOrigin) {
    return 'CSRF validation failed: missing Origin or Referer header';
  }

  // Compare against our own origin
  if (requestOrigin !== serverOrigin) {
    return `CSRF validation failed: origin mismatch (expected: ${serverOrigin}, received: ${requestOrigin})`;
  }

  return null;
}
