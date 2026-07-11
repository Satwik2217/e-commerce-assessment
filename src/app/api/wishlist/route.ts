import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const wishlist = await prisma.wishlist.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: true,
            stockQuantity: true,
          },
        },
      },
      orderBy: { id: 'desc' }, // Sort by date added (id is DateTime in our schema)
    });

    const formattedList = wishlist.map((item) => ({
      ...item,
      product: {
        ...item.product,
        price: Number(item.product.price),
      },
    }));

    return NextResponse.json({ data: formattedList });
  } catch (error) {
    console.error('Fetch wishlist error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if it already exists in the wishlist
    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    });

    if (existing) {
      // Remove it
      await prisma.wishlist.delete({
        where: {
          userId_productId: {
            userId: session.user.id,
            productId,
          },
        },
      });
      return NextResponse.json({ data: { isWishlisted: false } });
    } else {
      // Add it
      await prisma.wishlist.create({
        data: {
          userId: session.user.id,
          productId,
        },
      });
      return NextResponse.json({ data: { isWishlisted: true } }, { status: 201 });
    }
  } catch (error) {
    console.error('Toggle wishlist error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
