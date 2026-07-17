import { describe, it, expect } from 'vitest';
import { validateCSRF } from '@/lib/csrf';

function mockRequest(method: string, pathname: string, origin?: string, referer?: string) {
  const headers = new Map<string, string>();
  if (origin) headers.set('Origin', origin);
  if (referer) headers.set('Referer', referer);

  return {
    method,
    headers: {
      get: (name: string) => headers.get(name) ?? null,
    } as Headers,
    nextUrl: {
      origin: 'http://localhost:3000',
      pathname,
    },
  } as any;
}

describe('validateCSRF', () => {
  // ── Safe: GET requests are never validated ──
  it('does not validate GET requests', () => {
    const req = mockRequest('GET', '/api/clients', 'http://evil.com');
    expect(validateCSRF(req)).toBeNull();
  });

  it('does not validate HEAD or OPTIONS requests', () => {
    const req = mockRequest('OPTIONS', '/api/clients', 'http://evil.com');
    expect(validateCSRF(req)).toBeNull();
  });

  // ── Safe: same-origin requests ──
  it('passes same-origin POST requests', () => {
    const req = mockRequest('POST', '/api/clients', 'http://localhost:3000');
    expect(validateCSRF(req)).toBeNull();
  });

  it('passes same-origin PUT requests', () => {
    const req = mockRequest('PUT', '/api/clients/1', 'http://localhost:3000');
    expect(validateCSRF(req)).toBeNull();
  });

  it('passes same-origin DELETE requests', () => {
    const req = mockRequest('DELETE', '/api/clients/1', 'http://localhost:3000');
    expect(validateCSRF(req)).toBeNull();
  });

  it('passes same-origin PATCH requests', () => {
    const req = mockRequest('PATCH', '/api/clients/1', 'http://localhost:3000');
    expect(validateCSRF(req)).toBeNull();
  });

  // ── Blocked: cross-origin ──
  it('blocks cross-origin POST', () => {
    const req = mockRequest('POST', '/api/clients', 'http://evil.com');
    expect(validateCSRF(req)).toContain('origin mismatch');
  });

  it('blocks cross-origin DELETE', () => {
    const req = mockRequest('DELETE', '/api/clients/1', 'http://salondecompetencia.com');
    expect(validateCSRF(req)).toContain('origin mismatch');
  });

  // ── Missing Origin / Referer ──
  it('blocks POST with no Origin and no Referer', () => {
    const req = mockRequest('POST', '/api/clients');
    expect(validateCSRF(req)).toContain('missing Origin or Referer');
  });

  it('uses Referer as fallback when Origin is missing', () => {
    const req = mockRequest('POST', '/api/clients', undefined, 'http://localhost:3000/some-page');
    expect(validateCSRF(req)).toBeNull();
  });

  it('blocks Referer from different origin', () => {
    const req = mockRequest('POST', '/api/clients', undefined, 'http://evil.com/some-page');
    expect(validateCSRF(req)).toContain('origin mismatch');
  });

  // ── Exempt routes ──
  it('allows cross-origin POST to /api/auth (login)', () => {
    const req = mockRequest('POST', '/api/auth', 'http://evil.com');
    expect(validateCSRF(req)).toBeNull();
  });

  it('allows cross-origin PATCH to /api/auth (multi-part auth)', () => {
    const req = mockRequest('PATCH', '/api/auth', 'http://evil.com');
    expect(validateCSRF(req)).toBeNull();
  });

  // ── Edge cases ──
  it('handles malformed Referer gracefully', () => {
    const req = mockRequest('POST', '/api/clients', undefined, 'not-a-url');
    expect(validateCSRF(req)).toContain('missing Origin or Referer');
  });

  it('handles production origin correctly', () => {
    const req = {
      method: 'POST',
      headers: { get: () => 'https://nailagenda.vercel.app' } as Headers,
      nextUrl: { origin: 'https://nailagenda.vercel.app', pathname: '/api/clients' },
    } as any;
    expect(validateCSRF(req)).toBeNull();
  });
});
