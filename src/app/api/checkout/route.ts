import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkoutSchema } from '@/lib/validations';
import { z } from 'zod';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    // Support checkout schema with optional couponCode field
    const result = checkoutSchema
      .extend({
        couponCode: z.string().optional().nullable(),
      })
      .safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const {
      shippingName,
      shippingAddress,
      shippingCity,
      shippingPostal,
      shippingCountry,
      couponCode,
    } = result.data;

    // Fetch user's cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 });
    }

    // Calculate subtotal
    const subtotal = cartItems.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0
    );

    // Apply Coupon if provided
    let discountAmount = 0;
    let couponId: string | null = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
      });

      if (!coupon || !coupon.isActive) {
        return NextResponse.json({ error: 'Invalid or inactive coupon code' }, { status: 400 });
      }

      if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
        return NextResponse.json({ error: 'Coupon code has expired' }, { status: 400 });
      }

      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return NextResponse.json({ error: 'Coupon usage limit has been reached' }, { status: 400 });
      }

      if (coupon.minOrderValue && subtotal < Number(coupon.minOrderValue)) {
        return NextResponse.json(
          { error: `Minimum order value for this coupon is ${Number(coupon.minOrderValue)}` },
          { status: 400 }
        );
      }

      couponId = coupon.id;
      if (coupon.discountType === 'PERCENTAGE') {
        discountAmount = (subtotal * Number(coupon.discountValue)) / 100;
      } else {
        discountAmount = Number(coupon.discountValue);
      }

      // Ensure discount doesn't exceed subtotal
      discountAmount = Math.min(discountAmount, subtotal);
    }

    // Calculate shipping (Free above 499, else 99)
    const shippingCost = subtotal >= 499 ? 0 : 99;
    const totalAmount = subtotal - discountAmount + shippingCost;

    // Execute atomic Prisma transaction
    const order = await prisma.$transaction(async (tx) => {
      // 1. Validate stock and decrement it for each product
      for (const item of cartItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Product ${item.product.name} not found`);
        }

        if (product.stockQuantity < item.quantity) {
          throw new Error(
            `Insufficient stock for ${product.name}. Only ${product.stockQuantity} items available.`
          );
        }

        // Decrement product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      // 2. Increment coupon usage if coupon applied
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        });
      }

      // 3. Create the Order
      const newOrder = await tx.order.create({
        data: {
          userId: session.user.id,
          totalAmount,
          discountAmount,
          shippingName,
          shippingAddress,
          shippingCity,
          shippingPostal,
          shippingCountry,
          status: 'PLACED',
          paymentMethod: 'simulated',
          couponId,
          // 4. Create the Order Items
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              name: item.product.name,
              price: item.product.price,
              quantity: item.quantity,
              size: item.size,
              color: item.color,
              image: item.product.images[0] || null,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // 5. Empty the user's cart
      await tx.cartItem.deleteMany({
        where: { userId: session.user.id },
      });

      return newOrder;
    });

    return NextResponse.json({ data: order }, { status: 201 });
  } catch (error: any) {
    console.error('Checkout transaction error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during checkout. Please try again.' },
      { status: 400 }
    );
  }
}
