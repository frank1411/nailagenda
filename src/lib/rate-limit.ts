/**
 * Simple in-memory rate limiter for API routes.
 *
 * For serverless deployments (Vercel), the state resets on cold starts.
 * This provides basic protection against brute-force attacks without
 * requiring external infrastructure. For production at scale, consider
 * @upstash/ratelimit with Redis or a similar distributed solution.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 60 seconds
const CLEANUP_INTERVAL = 60_000;
let lastCleanup = 0;

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  }
}

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  max: number;
  /** Window size in milliseconds */
  windowMs: number;
  /** Key prefix for the store (e.g., "auth:login") */
  keyPrefix: string;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Time in ms until the window resets */
  resetIn: number;
  /** Remaining requests in this window */
  remaining: number;
  /** Total limit */
  limit: number;
}

/**
 * Check rate limit for a given key (usually IP or IP+action).
 * Returns the result synchronously — no async overhead.
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): RateLimitResult {
  cleanup();

  const key = `${config.keyPrefix}:${identifier}`;
  const now = Date.now();

  let entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    // Start a new window
    entry = { count: 0, resetAt: now + config.windowMs };
    store.set(key, entry);
  }

  entry.count++;

  const allowed = entry.count <= config.max;
  const resetIn = entry.resetAt - now;
  const remaining = Math.max(0, config.max - entry.count);

  return { allowed, resetIn, remaining, limit: config.max };
}

/**
 * Extract the client IP from a Next.js request.
 * Handles Vercel's x-forwarded-for and x-real-ip headers.
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;
  return '127.0.0.1';
}
