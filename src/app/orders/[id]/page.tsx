import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatDate } from '@/lib/utils';
import { Check, Clock, Package, Truck, Calendar, MapPin, ArrowLeft } from 'lucide-react';
import { ORDER_STATUS_LABELS } from '@/lib/constants';

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/orders/${id}`);
  }

  // Fetch order from database
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
    },
  });

  if (!order) {
    notFound();
  }

  // Authorize: Only the placing user or an ADMIN can view this order details page
  if (order.userId !== session.user.id && session.user.role !== 'ADMIN') {
    redirect('/orders');
  }

  // Order status mapping index to check progression
  const statusSteps = ['PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  const currentStatusIndex = statusSteps.indexOf(order.status);
  const isCancelled = order.status === 'CANCELLED';

  const statusColors: Record<string, string> = {
    PLACED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    PROCESSING: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    SHIPPED: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    DELIVERED: 'bg-green-500/10 text-green-600 border-green-500/20',
    CANCELLED: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  // Timeline configuration
  const timelineSteps = [
    {
      title: 'Order Placed',
      description: 'We have received your order and are validating details.',
      icon: Calendar,
      statusKey: 'PLACED',
    },
    {
      title: 'Processing',
      description: 'Your order is being prepared and packed in our facility.',
      icon: Clock,
      statusKey: 'PROCESSING',
    },
    {
      title: 'Shipped',
      description: 'Your package is on its way. Track carrier details.',
      icon: Truck,
      statusKey: 'SHIPPED',
    },
    {
      title: 'Delivered',
      description: 'Your order has been safely delivered to your doorstep.',
      icon: Package,
      statusKey: 'DELIVERED',
    },
  ];

  const subtotal = order.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  const discountAmount = Number(order.discountAmount);
  const shippingCost = subtotal >= 499 ? 0 : 99;
  const grandTotal = Number(order.totalAmount);

  return (
    <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8 max-w-4xl">
      {/* Back Button */}
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 hover:text-foreground mb-8 bg-muted/40 border border-border/20 px-4 py-2.5 rounded-xl w-fit transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to My Orders
      </Link>

      <PageHeader title="Order Details" description="Track your package shipment lifecycle">
        <Badge
          className={`border uppercase text-[9px] font-bold tracking-wider px-2.5 py-1 ${statusColors[order.status]}`}
          variant="outline"
        >
          {ORDER_STATUS_LABELS[order.status] || order.status}
        </Badge>
      </PageHeader>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Left Side: Timeline and Shipping Address */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tracking Timeline */}
          <Card className="border border-border/40 shadow-premium rounded-2xl">
            <CardHeader className="border-b border-border/20 pb-5">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">
                Order Tracking
              </CardTitle>
              <h3 className="text-xl font-bold tracking-tight text-foreground uppercase mt-1">
                Lifecycle Tracking
              </h3>
            </CardHeader>
            <CardContent className="pt-6">
              {isCancelled ? (
                <div className="rounded-xl border bg-destructive/10 p-6 text-center text-destructive font-semibold border-destructive/20 text-xs uppercase tracking-wide">
                  This order was cancelled. If you believe this was an error, please contact
                  customer support.
                </div>
              ) : (
                <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-muted/40">
                  {timelineSteps.map((step, idx) => {
                    const stepIndex = statusSteps.indexOf(step.statusKey);
                    const isCompleted = stepIndex <= currentStatusIndex;
                    const isActive = stepIndex === currentStatusIndex;

                    return (
                      <div key={idx} className="relative flex gap-4 items-start group">
                        {/* Timeline Node */}
                        <div
                          className={`absolute -left-[27px] flex h-[22px] w-[22px] items-center justify-center rounded-full border bg-background transition-colors ${
                            isCompleted
                              ? 'bg-primary border-primary ring-4 ring-primary/20 scale-105'
                              : 'border-muted bg-background'
                          }`}
                        >
                          {isCompleted && (
                            <Check className="h-3 w-3 text-primary-foreground font-bold" />
                          )}
                        </div>

                        {/* Timeline Content */}
                        <div className="flex-1">
                          <h4
                            className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isCompleted ? 'text-foreground font-black' : 'text-muted-foreground/70'}`}
                          >
                            <step.icon
                              className={`h-4 w-4 ${isCompleted ? 'text-primary' : 'text-muted-foreground/60'}`}
                            />
                            {step.title}
                            {isActive && (
                              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[9px] font-bold text-primary uppercase tracking-wide animate-pulse">
                                Current Status
                              </span>
                            )}
                          </h4>
                          <p className="mt-2 text-xs font-semibold text-muted-foreground/90 leading-relaxed">
                            {step.description}
                          </p>
                          {isActive && (
                            <p className="text-[10px] font-bold text-primary uppercase tracking-wider mt-2 bg-accent/40 px-2.5 py-1 rounded-md w-fit">
                              Updated on {formatDate(order.updatedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Details */}
          <Card className="border border-border/40 shadow-premium rounded-2xl">
            <CardHeader className="border-b border-border/20 pb-5">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Shipping Details
              </CardTitle>
              <h3 className="text-xl font-bold tracking-tight text-foreground uppercase mt-1">
                Delivery Address
              </h3>
            </CardHeader>
            <CardContent className="pt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground space-y-4">
              <div className="flex justify-between items-center">
                <span>Recipient Name</span>
                <span className="font-bold text-foreground">{order.shippingName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Street Address</span>
                <span className="font-bold text-foreground text-right max-w-xs">
                  {order.shippingAddress}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>City & Postal Code</span>
                <span className="font-bold text-foreground">
                  {order.shippingCity} - {order.shippingPostal}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Country</span>
                <span className="font-bold text-foreground">{order.shippingCountry}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Order Summary */}
        <div>
          <Card className="border border-border/40 shadow-premium rounded-2xl">
            <CardHeader className="border-b border-border/20 pb-5">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">
                Order Invoice
              </CardTitle>
              <h3 className="text-xl font-bold tracking-tight text-foreground uppercase mt-1">
                Receipt Details
              </h3>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Items List */}
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 text-xs border-b border-border/20 pb-4 last:border-0 last:pb-0 items-center"
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border/30 bg-muted">
                      <img
                        src={item.image || 'https://placehold.co/100x100?text=Product'}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-bold uppercase tracking-wide truncate text-foreground/95">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground/80 font-bold uppercase tracking-wider">
                        Qty: {item.quantity} {item.size ? `• Size: ${item.size}` : ''}
                      </p>
                      <p className="font-black text-primary text-[11px] tracking-wide mt-1">
                        {formatPrice(Number(item.price))} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border/20 pt-4 space-y-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <div className="flex justify-between items-center">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-foreground">{formatPrice(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold items-center">
                    <span>Coupon Discount</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span>Shipping Cost</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">FREE</span>
                    ) : (
                      <span className="font-bold text-foreground">{formatPrice(shippingCost)}</span>
                    )}
                  </span>
                </div>
                <div className="border-t border-border/20 pt-4 flex justify-between font-black text-sm text-foreground">
                  <span>Grand Total</span>
                  <span className="text-primary">{formatPrice(grandTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
