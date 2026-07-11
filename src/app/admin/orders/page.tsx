import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { formatPrice, formatDate } from '@/lib/utils';
import { Eye } from 'lucide-react';
import { OrderStatusUpdater } from '@/components/admin/order-status-updater';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      user: {
        select: { name: true, email: true },
      },
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Orders Management"
        description="Track shop orders and update shipment lifecycles"
      />

      {orders.length === 0 ? (
        <EmptyState
          title="No orders found"
          description="Customer orders will appear here once purchases are made."
        />
      ) : (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/20 text-muted-foreground text-xs uppercase font-semibold">
                  <th className="px-6 py-3">Order ID</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-center">Items</th>
                  <th className="px-6 py-3">Total Amount</th>
                  <th className="px-6 py-3 text-center">Status (Lifecycle)</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((ord) => {
                  const totalItems = ord.items.reduce((sum, item) => sum + item.quantity, 0);

                  return (
                    <tr key={ord.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-xs max-w-[120px] truncate">
                        {ord.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">{ord.user.name}</div>
                        <div className="text-xs text-muted-foreground">{ord.user.email}</div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatDate(ord.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-center font-medium">{totalItems}</td>
                      <td className="px-6 py-4 font-bold text-primary">
                        {formatPrice(Number(ord.totalAmount))}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <OrderStatusUpdater orderId={ord.id} initialStatus={ord.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/orders/${ord.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            <span className="sr-only">View customer order receipt</span>
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
