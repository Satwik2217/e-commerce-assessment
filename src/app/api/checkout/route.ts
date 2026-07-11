import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkoutSchema } from '@/lib/validations';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

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

    // Calculate subtotal using Prisma.Decimal to prevent floating point issues
    let subtotal = new Prisma.Decimal(0);
    for (const item of cartItems) {
      const price = new Prisma.Decimal(item.product.price);
      subtotal = subtotal.plus(price.times(item.quantity));
    }

    const shippingThreshold = new Prisma.Decimal(499);
    const shippingCost = subtotal.gte(shippingThreshold)
      ? new Prisma.Decimal(0)
      : new Prisma.Decimal(99);

    // Execute atomic Prisma transaction
    const order = await prisma.$transaction(async (tx) => {
      // 1. Validate stock and decrement it for each product (concurrency-safe atomic check-and-update)
      for (const item of cartItems) {
        try {
          await tx.product.update({
            where: {
              id: item.productId,
              stockQuantity: {
                gte: item.quantity,
              },
            },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          });
        } catch (error: any) {
          // If update fails because target row does not match the gte constraint (insufficient stock) or doesn't exist
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new Error(`Product ${item.product.name} not found`);
          }

          throw new Error(
            `Insufficient stock for ${product.name}. Only ${product.stockQuantity} items available.`
          );
        }
      }

      // 2. Validate and apply coupon inside transaction (concurrency-safe)
      let discountAmount = new Prisma.Decimal(0);
      let couponId: string | null = null;

      if (couponCode) {
        // Query the coupon within the transaction block
        const coupon = await tx.coupon.findUnique({
          where: { code: couponCode },
        });

        if (!coupon || !coupon.isActive) {
          throw new Error('Invalid or inactive coupon code');
        }

        if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
          throw new Error('Coupon code has expired');
        }

        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          throw new Error('Coupon usage limit has been reached');
        }

        if (coupon.minOrderValue && subtotal.lt(new Prisma.Decimal(coupon.minOrderValue))) {
          throw new Error(`Minimum order value for this coupon is ${Number(coupon.minOrderValue)}`);
        }

        couponId = coupon.id;
        if (coupon.discountType === 'PERCENTAGE') {
          const discountValue = new Prisma.Decimal(coupon.discountValue);
          discountAmount = subtotal.times(discountValue).div(100);
        } else {
          discountAmount = new Prisma.Decimal(coupon.discountValue);
        }

        // Ensure discount doesn't exceed subtotal
        if (discountAmount.gt(subtotal)) {
          discountAmount = subtotal;
        }

        // Increment coupon usage
        await tx.coupon.update({
          where: { id: couponId },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        });
      }

      // Calculate final total amount
      const totalAmount = subtotal.minus(discountAmount).plus(shippingCost);

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
