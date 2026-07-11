import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addToCartSchema, updateCartSchema } from '@/lib/validations';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map Decimal to Number for frontend consumption
    const formattedItems = cartItems.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      product: {
        ...item.product,
        price: Number(item.product.price),
      },
    }));

    return NextResponse.json({ data: formattedItems });
  } catch (error) {
    console.error('Fetch cart error:', error);
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
    const result = addToCartSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { productId, quantity, size, color } = result.data;

    // Check if product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isActive) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verify stock availability
    if (product.stockQuantity < quantity) {
      return NextResponse.json({ error: 'Not enough stock available' }, { status: 400 });
    }

    // Check if the item already exists in user's cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        userId: session.user.id,
        productId,
        size: size || null,
        color: color || null,
      },
    });

    let cartItem;

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (product.stockQuantity < newQuantity) {
        return NextResponse.json({ error: 'Not enough stock available' }, { status: 400 });
      }

      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              images: true,
            },
          },
        },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          userId: session.user.id,
          productId,
          quantity,
          size: size || null,
          color: color || null,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              images: true,
            },
          },
        },
      });
    }

    const formattedItem = {
      id: cartItem.id,
      quantity: cartItem.quantity,
      size: cartItem.size,
      color: cartItem.color,
      product: {
        ...cartItem.product,
        price: Number(cartItem.product.price),
      },
    };

    return NextResponse.json({ data: formattedItem }, { status: 201 });
  } catch (error) {
    console.error('Add to cart error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Cart item ID required' }, { status: 400 });
    }

    const body = await request.json();
    const result = updateCartSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid quantity', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { quantity } = result.data;

    // Verify item ownership and stock
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!cartItem || cartItem.userId !== session.user.id) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }

    if (cartItem.product.stockQuantity < quantity) {
      return NextResponse.json({ error: 'Not enough stock available' }, { status: 400 });
    }

    const updated = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: true,
          },
        },
      },
    });

    const formattedItem = {
      id: updated.id,
      quantity: updated.quantity,
      size: updated.size,
      color: updated.color,
      product: {
        ...updated.product,
        price: Number(updated.product.price),
      },
    };

    return NextResponse.json({ data: formattedItem });
  } catch (error) {
    console.error('Update cart error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const clearAll = searchParams.get('clear') === 'true';

    if (clearAll) {
      await prisma.cartItem.deleteMany({
        where: { userId: session.user.id },
      });
      return NextResponse.json({ data: { success: true } });
    }

    if (!id) {
      return NextResponse.json({ error: 'Cart item ID required' }, { status: 400 });
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
    });

    if (!cartItem || cartItem.userId !== session.user.id) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }

    await prisma.cartItem.delete({
      where: { id },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('Delete cart item error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
