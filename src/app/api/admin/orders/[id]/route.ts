import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { orderStatusSchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const result = orderStatusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid order status', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { status } = result.data;

    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ data: order });
  } catch (error) {
    console.error('Admin update order status error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
