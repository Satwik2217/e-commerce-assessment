import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatDate } from '@/lib/utils';
import { ShoppingBag, FileText, ArrowRight } from 'lucide-react';
import { ORDER_STATUS_LABELS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login?callbackUrl=/orders');
  }

  // Fetch orders placed by this user
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const statusColors: Record<string, string> = {
    PLACED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    PROCESSING: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    SHIPPED: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    DELIVERED: 'bg-green-500/10 text-green-600 border-green-500/20',
    CANCELLED: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  return (
    <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8 max-w-4xl">
      <PageHeader title="My Orders" description="View and track your order history" />

      <div className="mt-8">
        {orders.length === 0 ? (
          <div>
            <EmptyState
              title="You haven't placed any orders yet"
              description="Once you purchase products, they will appear here."
              icon={<ShoppingBag className="h-6 w-6" />}
            />
            <div className="mt-8 flex justify-center">
              <Link href="/products">
                <Button className="font-bold uppercase tracking-wider text-xs px-8 py-5 rounded-xl shadow-premium">
                  Start Shopping
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
              const statusLabel = ORDER_STATUS_LABELS[order.status] || order.status;

              return (
                <Card
                  key={order.id}
                  className="group overflow-hidden rounded-2xl border border-border/40 hover:border-border/80 transition-all duration-300 bg-card shadow-premium-sm"
                >
                  <CardHeader className="bg-muted/30 border-b border-border/20 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-6 sm:gap-10">
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground/80 font-bold uppercase tracking-wider">
                          ORDER PLACED
                        </p>
                        <p className="text-xs font-bold text-foreground">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground/80 font-bold uppercase tracking-wider">
                          TOTAL AMOUNT
                        </p>
                        <p className="text-xs font-black text-primary">
                          {formatPrice(Number(order.totalAmount))}
                        </p>
                      </div>
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <p className="text-[10px] text-muted-foreground/80 font-bold uppercase tracking-wider">
                          ORDER ID
                        </p>
                        <p className="text-xs font-mono font-bold text-foreground truncate max-w-[200px] sm:max-w-none">
                          {order.id}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={`border uppercase text-[9px] font-bold tracking-wider px-2.5 py-1 ${statusColors[order.status]}`}
                      variant="outline"
                    >
                      {statusLabel}
                    </Badge>
                  </CardHeader>

                  <CardContent className="p-6">
                    {/* Items preview list */}
                    <div className="divide-y divide-border/25">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex gap-4 py-4 first:pt-0 last:pb-0 items-center"
                        >
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border/30 bg-muted">
                            <img
                              src={item.image || 'https://placehold.co/100x100?text=Product'}
                              alt={item.name}
                              className="h-full w-full object-cover object-center"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate text-foreground uppercase tracking-wide">
                              {item.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground/85 font-bold uppercase tracking-wider mt-1">
                              Quantity: {item.quantity} {item.size ? `• Size: ${item.size}` : ''}{' '}
                              {item.color ? `• Color: ${item.color}` : ''}
                            </p>
                          </div>
                          <div className="text-sm font-black text-foreground text-right shrink-0">
                            {formatPrice(Number(item.price))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>

                  <CardFooter className="bg-muted/10 border-t border-border/20 p-4 flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground/80 font-bold uppercase tracking-wider">
                      Contains {totalItems} {totalItems === 1 ? 'item' : 'items'}
                    </span>
                    <Link href={`/orders/${order.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-[10px] font-bold uppercase tracking-wider rounded-xl"
                      >
                        <FileText className="h-4 w-4" />
                        Track & View Order
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
