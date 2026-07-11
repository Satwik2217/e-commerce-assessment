import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { categorySchema } from '@/lib/validations';
import { slugify } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

    // Verify unique name
    const existing = await prisma.category.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { error: 'A category with this name already exists' },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        image: image || '/images/products/placeholder.svg',
      },
    });

    return NextResponse.json({ data: category }, { status: 201 });
  } catch (error) {
    console.error('Admin create category error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
