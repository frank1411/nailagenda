import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

const COOKIE_NAME = 'nailagenda-token';

export type ServerUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  isDemo: boolean;
  salonName: string;
  phone: string | null;
  salonAddress: string | null;
  image: string | null;
  subscriptionExpiresAt: string | null;
} | null;

/**
 * Reads the auth cookie, verifies the JWT, and fetches the user from DB.
 * Returns `null` when there is no valid session.
 * Intended to be called from Server Components (layouts, pages).
 */
export async function getServerUser(): Promise<ServerUser> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const session = await verifyToken(token);
    if (!session) return null;

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isDemo: true,
        salonName: true,
        phone: true,
        salonAddress: true,
        image: true,
        subscriptionExpiresAt: true,
      },
    });

    if (!user) return null;

    return {
      ...user,
      subscriptionExpiresAt: user.subscriptionExpiresAt?.toISOString() ?? null,
    };
  } catch {
    return null;
  }
}
