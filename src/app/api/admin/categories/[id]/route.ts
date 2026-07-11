import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { categorySchema } from '@/lib/validations';
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
    const result = categorySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description, image } = result.data;
    const slug = slugify(name);

    // Verify name unique among other categories
    const existing = await prisma.category.findFirst({
      where: {
        name,
        id: { not: id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A category with this name already exists' },
        { status: 409 }
      );
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        image: image || '/images/products/placeholder.svg',
      },
    });

    return NextResponse.json({ data: category });
  } catch (error) {
    console.error('Admin edit category error:', error);
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

    // Check if any products are linked to this category
    const productsCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category containing active products. Re-assign products first.' },
        { status: 409 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('Admin delete category error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
