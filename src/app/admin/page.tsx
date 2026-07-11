import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatDate } from '@/lib/utils';
import { ORDER_STATUS_LABELS } from '@/lib/constants';
import { ShoppingBag, Users, DollarSign, Package, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // Execute aggregation queries to construct KPIs
  const [totalProducts, totalOrders, revenueAggregate, activeUsers, recentOrders] =
    await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: {
          totalAmount: true,
        },
        where: {
          status: { not: 'CANCELLED' },
        },
      }),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      }),
    ]);

  const revenue = Number(revenueAggregate._sum.totalAmount || 0);

  const stats = [
    {
      label: 'Total Products',
      value: totalProducts,
      icon: Package,
      color: 'text-indigo-600 bg-indigo-500/10',
    },
    {
      label: 'Total Orders',
      value: totalOrders,
      icon: ShoppingBag,
      color: 'text-violet-600 bg-violet-500/10',
    },
    {
      label: 'Revenue (Actual)',
      value: formatPrice(revenue),
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-500/10',
    },
    {
      label: 'Shoppers Registered',
      value: activeUsers,
      icon: Users,
      color: 'text-cyan-600 bg-cyan-500/10',
    },
  ];

  const statusColors: Record<string, string> = {
    PLACED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    PROCESSING: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    SHIPPED: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    DELIVERED: 'bg-green-500/10 text-green-600 border-green-500/20',
    CANCELLED: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
          Dashboard Overview
        </h1>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mt-1">
          Overview stats and recently placed orders
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border/40 bg-card p-6 text-card-foreground shadow-premium-sm flex items-center justify-between hover-lift transition-all duration-300"
          >
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">
                {stat.label}
              </p>
              <p className="text-2xl font-black text-foreground leading-none">{stat.value}</p>
            </div>
            <div className={`rounded-xl p-3.5 ${stat.color} border border-white/10`}>
              <stat.icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders List Table */}
      <div className="rounded-2xl border border-border/40 bg-card text-card-foreground shadow-premium">
        <div className="border-b border-border/20 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">
              Logs
            </h2>
            <h3 className="text-base font-bold text-foreground uppercase mt-0.5">
              Recent Customer Orders
            </h3>
          </div>
          <Link
            href="/admin/orders"
            className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline flex items-center gap-1"
          >
            Manage Orders
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="p-0 overflow-x-auto">
          {recentOrders.length === 0 ? (
            <div className="p-12 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
              No orders placed yet.
            </div>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border/25 bg-muted/20 text-muted-foreground/80 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Placed Date</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-muted/10 transition-colors font-semibold">
                    <td className="px-6 py-4 font-mono font-bold text-foreground/80 max-w-[120px] truncate">
                      {ord.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground uppercase tracking-wide">
                        {ord.user.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 font-medium lowercase tracking-normal">
                        {ord.user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground/85">
                      {formatDate(ord.createdAt)}
                    </td>
                    <td className="px-6 py-4 font-black text-primary">
                      {formatPrice(Number(ord.totalAmount))}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge
                        className={`border uppercase text-[9px] font-bold tracking-wider px-2 py-0.5 ${statusColors[ord.status]}`}
                        variant="outline"
                      >
                        {ORDER_STATUS_LABELS[ord.status] || ord.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
