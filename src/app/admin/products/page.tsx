import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { Edit } from 'lucide-react';
import { DeleteProductButton } from '@/components/admin/delete-product-button';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-8">
      <PageHeader title="Products" description="Manage your product catalog and inventory levels">
        <Link href="/admin/products/new">
          <Button className="font-semibold text-xs h-9">Add Product</Button>
        </Link>
      </PageHeader>

      {products.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Click 'Add Product' to populate your catalog."
        />
      ) : (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/20 text-muted-foreground text-xs uppercase font-semibold">
                  <th className="px-6 py-3">Image</th>
                  <th className="px-6 py-3">Product Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3 text-center">Stock</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="h-10 w-10 overflow-hidden rounded-md border bg-muted">
                        <img
                          src={prod.images[0] || 'https://placehold.co/100x100?text=Product'}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">{prod.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{prod.category.name}</td>
                    <td className="px-6 py-4 font-bold text-primary">
                      {formatPrice(Number(prod.price))}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`font-semibold ${prod.stockQuantity === 0 ? 'text-destructive font-bold' : ''}`}
                      >
                        {prod.stockQuantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold border ${
                          prod.isActive
                            ? 'bg-green-500/10 text-green-600 border-green-500/20'
                            : 'bg-destructive/10 text-destructive border-destructive/20'
                        }`}
                      >
                        {prod.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-1">
                        <Link href={`/admin/products/edit?id=${prod.id}`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            <span className="sr-only">Edit product</span>
                          </Button>
                        </Link>
                        <DeleteProductButton id={prod.id} name={prod.name} />
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
