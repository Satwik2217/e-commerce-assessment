import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { DeleteCategoryButton } from '@/components/admin/delete-category-button';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-8">
      <PageHeader title="Categories" description="Manage product categories">
        <Link href="/admin/categories/new">
          <Button className="font-semibold text-xs h-9">Add Category</Button>
        </Link>
      </PageHeader>

      {categories.length === 0 ? (
        <EmptyState
          title="No categories found"
          description="Click 'Add Category' to get started."
        />
      ) : (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/20 text-muted-foreground text-xs uppercase font-semibold">
                  <th className="px-6 py-3">Image</th>
                  <th className="px-6 py-3">Category Name</th>
                  <th className="px-6 py-3">Slug</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3 text-center">Products Count</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="h-10 w-10 overflow-hidden rounded-md border bg-muted">
                        <img
                          src={cat.image || 'https://placehold.co/100x100?text=Category'}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">{cat.name}</td>
                    <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                      {cat.slug}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground max-w-xs truncate">
                      {cat.description || '—'}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold">{cat._count.products}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-1">
                        <Link href={`/admin/categories/edit?id=${cat.id}`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            <span className="sr-only">Edit category</span>
                          </Button>
                        </Link>
                        <DeleteCategoryButton id={cat.id} name={cat.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
