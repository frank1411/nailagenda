import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  console.log('Testing database connection...');
  try {
    // Simple query to check connectivity
    const user = await db.user.findFirst();
    
    return NextResponse.json({ 
      status: 'success', 
      message: 'Database connection successful!',
      userExists: !!user,
      data: user ? { email: user.email, name: user.name } : null
    });
  } catch (error: any) {
    console.error('Database connection error:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Database connection failed',
      error: error.message 
    }, { status: 500 });
  }
}
