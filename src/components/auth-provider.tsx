'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth';
import type { ServerUser } from '@/lib/get-server-user';

interface AuthProviderProps {
  user: ServerUser;
  children: React.ReactNode;
}

/**
 * Hydrates the auth store with user data fetched server-side.
 *
 * How it works:
 * - Layout (Server Component) calls getServerUser() and passes the result here.
 * - On first mount, we set the auth store state immediately:
 *   - If the server found a valid session → `initialized: true` + `user: {...}`
 *     → page.tsx skips the loading spinner and renders the app immediately.
 *   - If the server found NO session → `initialized: true` + `user: null`
 *     → page.tsx shows the LandingPage immediately.
 * - page.tsx still calls init() as a safety net for edge cases
 *   (e.g. Authorization-header-based auth that the server couldn't read).
 */
export function AuthProvider({ user, children }: AuthProviderProps) {
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    if (user) {
      useAuthStore.setState({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isDemo: user.isDemo,
          salonName: user.salonName,
          phone: user.phone ?? undefined,
          salonAddress: user.salonAddress ?? undefined,
          image: user.image ?? undefined,
          subscriptionExpiresAt: user.subscriptionExpiresAt ?? undefined,
        },
        initialized: true,
        loading: false,
      });
    } else {
      // No session detected server-side → mark as initialized so the
      // landing page renders immediately without a loading spinner.
      useAuthStore.setState({
        user: null,
        initialized: true,
        loading: false,
      });
    }
  }, [user]);

  return <>{children}</>;
}
