import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Simple query to check connectivity
    const userCount = await db.user.count();
    
    return NextResponse.json({ 
      status: 'ok', 
      message: 'Database connection successful',
      userCount 
    });
  } catch (error: any) {
    console.error('Database test failed:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Database connection failed',
      error: error.message 
    }, { status: 500 });
  }
}
