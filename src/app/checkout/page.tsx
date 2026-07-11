'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCart } from '@/context/cart-provider';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { CheckCircle2, CreditCard, MapPin, ShoppingBag, ArrowRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function CheckoutPage() {
  const router = useRouter();
  const { status } = useSession();
  const { items, total, loading: cartLoading, clearCart } = useCart();

  // Redirect if logged out
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/checkout');
    }
  }, [status, router]);

  // Form states
  const [shippingName, setShippingName] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingPostal, setShippingPostal] = useState('');
  const [shippingCountry, setShippingCountry] = useState('India');

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Submit states
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [placedOrder, setPlacedOrder] = useState<any>(null);

  // Calculations
  const shippingThreshold = 499;
  const shippingCost = total >= shippingThreshold ? 0 : 99;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const grandTotal = total - discountAmount + shippingCost;

  async function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    setCouponError('');
    setAppliedCoupon(null);

    if (!couponCode) {
      setCouponError('Enter a coupon code first');
      return;
    }

    setValidatingCoupon(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, subtotal: total }),
      });

      const json = await res.json();
      if (!res.ok) {
        setCouponError(json.error || 'Failed to validate coupon');
      } else {
        setAppliedCoupon(json.data);
      }
    } catch (err) {
      setCouponError('Something went wrong. Please try again.');
    } finally {
      setValidatingCoupon(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');

    if (!shippingName || !shippingAddress || !shippingCity || !shippingPostal || !shippingCountry) {
      setSubmitError('Please fill in all shipping details');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingName,
          shippingAddress,
          shippingCity,
          shippingPostal,
          shippingCountry,
          couponCode: appliedCoupon?.code || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setSubmitError(json.error || 'Checkout transaction failed. Check stock levels.');
      } else {
        setPlacedOrder(json.data);
        clearCart(); // Clear local state cart
      }
    } catch (err) {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'loading' || (cartLoading && items.length === 0)) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Order Confirmation State
  if (placedOrder) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
        <div className="flex flex-col items-center justify-center space-y-8 p-6 sm:p-10 border border-border/40 bg-card rounded-2xl shadow-premium">
          <div className="rounded-full bg-emerald-500/10 p-5 text-emerald-600 border border-emerald-500/20">
            <CheckCircle2 className="h-16 w-16" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gradient sm:text-4xl uppercase">
              Order Confirmed
            </h1>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mt-2">
              Thank you for shopping with us. Your order is registered.
            </p>
          </div>

          <Card className="w-full text-left bg-muted/20 border border-border/30 rounded-xl shadow-premium-sm">
            <CardHeader className="border-b border-border/30 pb-4">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex justify-between items-center">
                <span>Receipt Details</span>
                <span className="text-primary font-mono text-[10px] tracking-normal">
                  {placedOrder.id}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <div className="flex justify-between items-center">
                <span>Deliver To:</span>
                <span className="font-bold text-foreground">{placedOrder.shippingName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Address:</span>
                <span className="font-bold text-foreground text-right max-w-xs truncate">
                  {placedOrder.shippingAddress}, {placedOrder.shippingCity}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Payment Mode:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  Sandbox Success
                </span>
              </div>
              <div className="border-t border-border/35 pt-4 flex justify-between font-black text-sm text-foreground">
                <span>Paid Amount:</span>
                <span className="text-primary">{formatPrice(Number(placedOrder.totalAmount))}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <Link href="/products" className="flex-1 max-w-xs">
              <Button className="w-full font-bold uppercase tracking-wider text-xs py-5 rounded-xl shadow-premium">
                Continue Shopping
              </Button>
            </Link>
            <Link href="/orders" className="flex-1 max-w-xs">
              <Button
                variant="outline"
                className="w-full font-bold uppercase tracking-wider text-xs py-5 rounded-xl"
              >
                View My Orders
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader title="Checkout" description="Complete your shipping & billing information" />

      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Your cart is empty"
            description="Add items to your cart before proceeding to checkout."
            icon={<ShoppingBag className="h-6 w-6" />}
          />
          <div className="mt-8 flex justify-center">
            <Link href="/products">
              <Button className="font-bold uppercase tracking-wider text-xs px-8 py-5 rounded-xl shadow-premium">
                Shop Our Catalog
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* Shipping Form */}
          <div className="lg:col-span-2">
            <Card className="border border-border/40 shadow-premium rounded-2xl">
              <CardHeader className="border-b border-border/20 pb-5">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Shipping Address
                </CardTitle>
                <h3 className="text-xl font-bold tracking-tight text-foreground uppercase mt-1">
                  Delivery Info
                </h3>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-5 pt-6">
                  {submitError && (
                    <div className="rounded-xl bg-destructive/10 p-4 text-xs text-destructive border border-destructive/20 font-bold uppercase tracking-wider leading-relaxed">
                      {submitError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name">Recipient Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Jane Doe"
                      value={shippingName}
                      onChange={(e) => setShippingName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      placeholder="123 Main St, Apartment 4B"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="Mumbai"
                        value={shippingCity}
                        onChange={(e) => setShippingCity(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postal">Postal Code</Label>
                      <Input
                        id="postal"
                        placeholder="400001"
                        value={shippingPostal}
                        onChange={(e) => setShippingPostal(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        placeholder="India"
                        value={shippingCountry}
                        onChange={(e) => setShippingCountry(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <Separator className="my-2" />

                  <div className="rounded-2xl border border-border/30 bg-muted/20 p-5 space-y-3">
                    <h3 className="font-bold text-xs uppercase tracking-wider flex items-center gap-2 text-foreground">
                      <CreditCard className="h-4 w-4 text-primary" />
                      Payment Method
                    </h3>
                    <div className="flex items-center space-x-3 rounded-xl border border-border/40 bg-card p-4 shadow-premium-sm">
                      <input
                        type="radio"
                        id="simulated"
                        checked
                        readOnly
                        className="h-4 w-4 accent-primary cursor-pointer"
                      />
                      <label
                        htmlFor="simulated"
                        className="text-xs font-bold uppercase tracking-wider leading-none cursor-pointer text-foreground/80"
                      >
                        Simulated Gateway (Internship Sandbox)
                      </label>
                    </div>
                    <p className="text-[10px] font-semibold text-muted-foreground/85 leading-relaxed uppercase tracking-wider">
                      Placing an order will automatically simulate a successful checkout. No real
                      payment parameters requested.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border/20 bg-muted/10 p-6">
                  <Button
                    type="submit"
                    className="w-full gap-2 font-bold uppercase tracking-wider text-xs py-6 rounded-xl shadow-premium"
                    disabled={submitting}
                  >
                    {submitting ? 'Placing Order...' : 'Confirm & Place Order'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          {/* Checkout Summary sidebar */}
          <div className="space-y-6">
            <Card className="border border-border/40 shadow-premium rounded-2xl">
              <CardHeader className="border-b border-border/20 pb-5">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">
                  Details
                </CardTitle>
                <h3 className="text-xl font-bold tracking-tight text-foreground uppercase mt-1">
                  Review Items
                </h3>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                {/* Checkout items preview */}
                <div className="max-h-64 overflow-y-auto space-y-4 pr-1">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 text-xs">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border/30 bg-muted">
                        <img
                          src={item.product.images[0]}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="font-bold uppercase tracking-wide truncate text-foreground/95">
                          {item.product.name}
                        </p>
                        <p className="text-muted-foreground/80 font-bold uppercase tracking-wider text-[10px]">
                          {item.quantity} x {formatPrice(item.product.price)}
                        </p>
                        <div className="flex gap-x-2 text-[9px] font-bold uppercase text-muted-foreground/60">
                          {item.size && <span>Sz: {item.size}</span>}
                          {item.color && <span>Col: {item.color}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Coupon Form */}
                <form onSubmit={handleApplyCoupon} className="space-y-3">
                  <Label htmlFor="coupon">Apply Promo Coupon</Label>
                  <div className="flex gap-2">
                    <Input
                      id="coupon"
                      placeholder="e.g. SAVE10"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="h-11 uppercase"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      variant="outline"
                      className="h-11 font-bold uppercase tracking-wider text-xs px-4"
                      disabled={validatingCoupon}
                    >
                      {validatingCoupon ? 'Wait' : 'Apply'}
                    </Button>
                  </div>
                  {couponError && (
                    <p className="text-[10px] text-destructive font-bold uppercase tracking-wider">
                      {couponError}
                    </p>
                  )}
                  {appliedCoupon && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider leading-relaxed">
                      Applied: saved {formatPrice(appliedCoupon.discountAmount)} (
                      {appliedCoupon.code})
                    </p>
                  )}
                </form>

                <Separator />

                {/* Pricing summary */}
                <div className="space-y-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <div className="flex justify-between items-center">
                    <span>Items Subtotal</span>
                    <span className="font-bold text-foreground">{formatPrice(total)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold items-center">
                      <span>Promo Discount</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span>Shipping Cost</span>
                    <span>
                      {shippingCost === 0 ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          FREE
                        </span>
                      ) : (
                        <span className="font-bold text-foreground">
                          {formatPrice(shippingCost)}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="border-t border-border/20 pt-4 flex justify-between font-black text-sm text-foreground">
                    <span>Total Cost</span>
                    <span className="text-primary">{formatPrice(grandTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
