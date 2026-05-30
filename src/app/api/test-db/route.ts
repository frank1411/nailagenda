import { NextResponse } from 'next/server';

export async function GET() {
  console.log('Checking environment...');
  
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ 
      status: 'error', 
      message: 'DATABASE_URL is missing in environment variables' 
    }, { status: 500 });
  }

  try {
    // Lazy load DB to prevent module-level crashes
    const { db } = await import('@/lib/db');
    console.log('Prisma client loaded. Attempting query...');
    
    const user = await db.user.findFirst();
    
    return NextResponse.json({ 
      status: 'success', 
      message: 'Database connection successful!',
      userExists: !!user
    });
  } catch (error: any) {
    console.error('DATABASE_ERROR:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Database connection failed',
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
