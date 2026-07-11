import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/shared/page-header';
import { EditCategoryForm } from '@/components/admin/edit-category-form';
import { ArrowLeft } from 'lucide-react';

interface EditCategoryPageProps {
  searchParams: Promise<{
    id?: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function AdminEditCategoryPage({ searchParams }: EditCategoryPageProps) {
  const resolvedParams = await searchParams;
  const id = resolvedParams.id;

  if (!id) {
    notFound();
  }

  // Fetch category details
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-xl">
      <Link
        href="/admin/categories"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Categories
      </Link>

      <PageHeader title="Edit Category" description={`Editing category: ${category.name}`} />

      <EditCategoryForm category={category} />
    </div>
  );
}
