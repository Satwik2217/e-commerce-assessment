'use client';

import Link from 'next/link';
import { useCart } from '@/context/cart-provider';
import { useSession } from 'next-auth/react';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CartPage() {
  const { status } = useSession();
  const { items, total, loading, updateItem, removeItem } = useCart();

  const shippingThreshold = 499;
  const shippingCost = total >= shippingThreshold || total === 0 ? 0 : 99;
  const grandTotal = total + shippingCost;

  if (loading && items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader title="Shopping Cart" description="Review your items before checkout" />
        <div className="mt-12 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader title="Shopping Cart" description="Review your items before checkout" />

      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Your cart is empty"
            description="Explore our products catalog and add items to your cart."
            icon={<ShoppingBag className="h-6 w-6" />}
          />
          <div className="mt-8 flex justify-center">
            <Link href="/products">
              <Button className="font-bold uppercase tracking-wider text-xs px-8 py-5 rounded-xl shadow-premium">
                Shop Our Collection
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const itemSubtotal = item.product.price * item.quantity;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-6 rounded-2xl border border-border/40 bg-card p-4 sm:p-5 shadow-premium-sm hover:border-border/80 transition-all duration-300"
                >
                  {/* Thumbnail */}
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border/30 bg-muted group relative">
                    <img
                      src={item.product.images[0] || 'https://placehold.co/100x100?text=Product'}
                      alt={item.product.name}
                      className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="font-bold text-sm sm:text-base hover:text-primary text-foreground block truncate uppercase tracking-wider transition-colors duration-200"
                    >
                      {item.product.name}
                    </Link>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground/80 font-semibold uppercase tracking-wide">
                      {item.size && (
                        <span>
                          Size: <strong className="text-foreground">{item.size}</strong>
                        </span>
                      )}
                      {item.color && (
                        <span>
                          Color: <strong className="text-foreground">{item.color}</strong>
                        </span>
                      )}
                    </div>
                    <div className="mt-3 text-sm font-black text-foreground sm:hidden">
                      {formatPrice(item.product.price)} x {item.quantity}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3 bg-muted/40 border border-border/40 p-1 rounded-xl shadow-premium-sm">
                    <button
                      type="button"
                      disabled={item.quantity <= 1}
                      onClick={() => updateItem(item.id, item.quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/20 bg-card hover:bg-muted text-xs font-bold disabled:opacity-50 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-foreground">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={item.quantity >= 10}
                      onClick={() => updateItem(item.id, item.quantity + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/20 bg-card hover:bg-muted text-xs font-bold disabled:opacity-50 transition-colors"
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal & Delete (Desktop/Tablet) */}
                  <div className="hidden sm:block text-right shrink-0 min-w-[100px]">
                    <p className="text-sm sm:text-base font-black text-foreground">
                      {formatPrice(itemSubtotal)}
                    </p>
                    <p className="text-[10px] text-muted-foreground/75 font-bold uppercase tracking-wider mt-0.5">
                      {formatPrice(item.product.price)} each
                    </p>
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    className="text-destructive/80 hover:bg-destructive/10 hover:text-destructive shrink-0 rounded-xl"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove item</span>
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-6">
            <Card className="border border-border/40 shadow-premium rounded-2xl">
              <CardHeader className="border-b border-border/20 pb-5">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">
                  Pricing Summary
                </CardTitle>
                <h3 className="text-xl font-bold tracking-tight text-foreground uppercase mt-1">
                  Order Summary
                </h3>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                  <span>Subtotal</span>
                  <span className="font-bold text-foreground">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                  <span>Shipping</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">FREE</span>
                    ) : (
                      <span className="font-bold text-foreground">{formatPrice(shippingCost)}</span>
                    )}
                  </span>
                </div>
                {shippingCost > 0 && (
                  <p className="text-[10px] text-muted-foreground bg-accent/30 p-2.5 rounded-lg border border-border/20 font-bold uppercase tracking-wider leading-relaxed">
                    Add {formatPrice(shippingThreshold - total)} more to qualify for free shipping!
                  </p>
                )}
                <div className="border-t border-border/20 pt-4 flex justify-between font-black text-sm sm:text-base uppercase tracking-wider text-foreground">
                  <span>Total Amount</span>
                  <span className="text-primary">{formatPrice(grandTotal)}</span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4 border-t border-border/20 pt-5">
                <Link href="/checkout" className="w-full">
                  <Button className="w-full gap-2 font-bold uppercase tracking-wider text-xs py-6 rounded-xl shadow-premium">
                    Proceed to Checkout
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>

                {status !== 'authenticated' && (
                  <div className="rounded-xl bg-amber-500/10 p-4 text-[10px] font-bold uppercase tracking-wider leading-relaxed text-amber-700 dark:text-amber-500 border border-amber-500/20 text-center">
                    Please{' '}
                    <Link
                      href="/login?callbackUrl=/cart"
                      className="underline font-black text-amber-800 dark:text-amber-400"
                    >
                      Sign In
                    </Link>{' '}
                    to persist your cart and complete checkout.
                  </div>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
