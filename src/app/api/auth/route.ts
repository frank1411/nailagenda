import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, verifyPassword, createToken, requireAuth, AuthError } from '@/lib/auth';
import { registerSchema, loginSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'register') {
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
      return NextResponse.json({ data: { user: { id: user.id, email: user.email, name: user.name, salonName: user.salonName, role: user.role }, token }, }, { status: 201 });
    }

    if (action === 'login') {
      const parsed = loginSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      const { email, password } = parsed.data;
      const user = await db.user.findUnique({ where: { email } });
      if (!user || !(await verifyPassword(password, user.password))) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      const token = await createToken(user.id);
      return NextResponse.json({ data: { user: { id: user.id, email: user.email, name: user.name, salonName: user.salonName, role: user.role }, token } });
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
