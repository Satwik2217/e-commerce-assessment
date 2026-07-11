import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/shared/page-header';
import { ProductForm } from '@/components/admin/product-form';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminNewProductPage() {
  // Fetch categories for the select dropdown
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </Link>

      <PageHeader title="Add Product" description="Create a new product catalog item" />

      <ProductForm categories={categories} />
    </div>
  );
}
