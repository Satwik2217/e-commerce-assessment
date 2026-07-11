import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { productSchema } from '@/lib/validations';
import { slugify } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

    // Make slug unique if it already exists
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const product = await prisma.product.create({
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

    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    console.error('Admin create product error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
