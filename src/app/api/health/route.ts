import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const url = process.env.DATABASE_URL || 'NOT SET';
    const masked = url.replace(/:([^@]{4})[^@]*@/, ':****@');
    const count = await prisma.category.count();
    return NextResponse.json({ status: 'ok', dbUrl: masked, categoryCount: count });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error.message, code: error.code },
      { status: 500 }
    );
  }
}
