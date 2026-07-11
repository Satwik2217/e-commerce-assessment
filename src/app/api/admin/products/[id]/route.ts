import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { productSchema } from '@/lib/validations';
import { slugify } from '@/lib/utils';

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
    const result = productSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      price,
      compareAtPrice,
      stockQuantity,
      categoryId,
      sizes,
      colors,
      images,
      isActive,
    } = result.data;

    let slug = slugify(name);

    // Make slug unique if it already exists among other products
    const existing = await prisma.product.findFirst({
      where: {
        slug,
        id: { not: id },
      },
    });

    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        price,
        compareAtPrice: compareAtPrice || null,
        stockQuantity,
        categoryId,
        sizes,
        colors,
        images,
        isActive,
      },
    });

    return NextResponse.json({ data: product });
  } catch (error) {
    console.error('Admin edit product error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Check if the product has been ordered
    const orderItemsCount = await prisma.orderItem.count({
      where: { productId: id },
    });

    if (orderItemsCount > 0) {
      // Soft delete: turn active status off so orders history is not broken
      const updated = await prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        data: {
          success: true,
          softDeleted: true,
          message:
            'Product is linked to existing customer orders. It has been deactivated instead of deleted.',
        },
      });
    }

    // Hard delete
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ data: { success: true, softDeleted: false } });
  } catch (error) {
    console.error('Admin delete product error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
