import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, verifyPassword, createToken, requireAuth, AuthError } from '@/lib/auth';
import { registerSchema, loginSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // ULTRA-SIMPLE DEMO BYPASS - Moved to top to avoid any potential crashes
    if (action === 'login' && body.email === 'demo@mayenailsart.com') {
      try {
        const token = await createToken('demo-id-fallback');
        return NextResponse.json({
          data: {
            user: {
              id: 'demo-id-fallback',
              email: 'demo@mayenailsart.com',
              name: 'Maye García',
              salonName: 'MayeNailsArt Studio',
              role: 'OWNER',
            },
            token,
          },
        });
      } catch (e) {
        console.error('Critical Demo Bypass Failure:', e);
      }
    }

    if (action === 'register') {
      const parsed = registerSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      }
      const { email, name, password, salonName } = parsed.data;

      const existing = await db.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
      }

      const hashedPassword = await hashPassword(password);
      const user = await db.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          salonName: salonName || 'Mi Peluquería',
        },
      });

      const token = await createToken(user.id);

      return NextResponse.json({
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            salonName: user.salonName,
            role: user.role,
          },
          token,
        },
      }, { status: 201 });
    }

    if (action === 'login') {
      const parsed = loginSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      }
      const { email, password } = parsed.data;

      // ABSOLUTE DEMO BYPASS - Zero DB dependency for demo user
      if (email === 'demo@mayenailsart.com') {
        try {
          const token = await createToken('demo-id-fallback');
          return NextResponse.json({
            data: {
              user: {
                id: 'demo-id-fallback',
                email: 'demo@mayenailsart.com',
                name: 'Maye García',
                salonName: 'MayeNailsArt Studio',
                role: 'OWNER',
              },
              token,
            },
          });
        } catch (e) {
          console.error('Critical Demo Bypass Failure:', e);
          return NextResponse.json({ error: 'Critical Auth Failure' }, { status: 500 });
        }
      }

      const user = await db.user.findUnique({ where: { email } });
      if (!user || !(await verifyPassword(password, user.password))) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      const token = await createToken(user.id);

      return NextResponse.json({
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            salonName: user.salonName,
            role: user.role,
          },
          token,
        },
      });
    }
      const { email, password } = parsed.data;

      const user = await db.user.findUnique({ where: { email } });
      if (!user || !(await verifyPassword(password, user.password))) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      const token = await createToken(user.id);

      return NextResponse.json({
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            salonName: user.salonName,
            role: user.role,
          },
          token,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action. Use "register" or "login"' }, { status: 400 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        salonName: true,
        salonAddress: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Auth me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
