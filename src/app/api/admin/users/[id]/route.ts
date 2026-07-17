import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error-handler';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const body = await request.json();
 
    if (body.extendSubscription === true) {
      const user = await db.user.findUnique({ where: { id } });
      if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
      
      const currentExpiration = user.subscriptionExpiresAt || new Date();
      const newExpiration = new Date(Math.max(currentExpiration.getTime(), Date.now()));
      newExpiration.setDate(newExpiration.getDate() + 30);

      const updatedUser = await db.user.update({
        where: { id },
        data: { subscriptionExpiresAt: newExpiration },
        select: { id: true, email: true, subscriptionExpiresAt: true },
      });
      return NextResponse.json({ data: updatedUser });
    }

    if (typeof body.isActive !== 'boolean') {
      return NextResponse.json({ error: 'El campo isActive debe ser un booleano' }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id },
      data: { isActive: body.isActive },
      select: { id: true, email: true, isActive: true },
    });

    return NextResponse.json({ data: user });
  } catch (error) {
    return handleApiError(error, 'Admin user update');
  }
}
