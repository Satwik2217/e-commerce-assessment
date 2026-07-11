import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/shared/page-header';
import { ProductForm } from '@/components/admin/product-form';
import { ArrowLeft } from 'lucide-react';

interface EditProductPageProps {
  searchParams: Promise<{
    id?: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function AdminEditProductPage({ searchParams }: EditProductPageProps) {
  const resolvedParams = await searchParams;
  const id = resolvedParams.id;

  if (!id) {
    notFound();
  }

  // Fetch product and categories
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
    }),
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </Link>

      <PageHeader title="Edit Product" description={`Editing product: ${product.name}`} />

      <ProductForm categories={categories} initialData={product} />
    </div>
  );
}
