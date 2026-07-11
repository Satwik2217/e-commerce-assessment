'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCart } from '@/context/cart-provider';
import { useToast } from '@/context/toast-context';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, Check, HeartCrack } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductInteractionsProps {
  productId: string;
  sizes: string[];
  colors: string[];
  stockQuantity: number;
  initialWishlisted: boolean;
  productData: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
  };
}

export function ProductInteractions({
  productId,
  sizes,
  colors,
  stockQuantity,
  initialWishlisted,
  productData,
}: ProductInteractionsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSession();
  const { addItem } = useCart();
  const { toast } = useToast();

  const [selectedSize, setSelectedSize] = useState<string | null>(
    sizes.length > 0 ? sizes[0] : null
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(
    colors.length > 0 ? colors[0] : null
  );
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
  const [addingToCart, setAddingToCart] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);

  const isOutOfStock = stockQuantity === 0;

  async function handleAddToCart() {
    if (isOutOfStock) return;

    if (status !== 'authenticated') {
      toast('Please sign in to add items to your cart.', 'info');
      setTimeout(() => {
        router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      }, 1000);
      return;
    }

    setAddingToCart(true);
    const success = await addItem(productId, quantity, selectedSize, selectedColor, productData);
    setAddingToCart(false);
    if (success) {
      toast('Added to cart', 'success');
    }
  }

  async function handleToggleWishlist() {
    if (status !== 'authenticated') {
      router.push(`/login?callbackUrl=/products/${productData.slug}`);
      return;
    }

    setTogglingWishlist(true);
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      if (res.ok) {
        const json = await res.json();
        setIsWishlisted(json.data.isWishlisted);
      }
    } catch (err) {
      console.error('Wishlist toggle error:', err);
    } finally {
      setTogglingWishlist(false);
    }
  }

  const colorMap: Record<string, string> = {
    red: '#e11d48',
    blue: '#2563eb',
    black: '#09090b',
    white: '#ffffff',
    navy: '#0f172a',
    green: '#16a34a',
    pink: '#db2777',
    beige: '#d6cbb5',
    grey: '#4b5563',
    gray: '#4b5563',
    indigo: '#4f46e5',
    purple: '#9333ea',
    yellow: '#ca8a04',
    orange: '#ea580c',
  };

  return (
    <div className="space-y-6">
      {/* Size Selector */}
      {sizes.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
            Select Size
          </h3>
          <div className="flex flex-wrap gap-2">
            {sizes.map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setSelectedSize(sz)}
                className={cn(
                  'flex h-10 min-w-10 items-center justify-center rounded-xl border text-xs font-bold transition-all focus:outline-none duration-250',
                  selectedSize === sz
                    ? 'border-primary bg-primary text-primary-foreground font-black shadow-premium-sm scale-105'
                    : 'border-border/80 bg-card hover:bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color Selector */}
      {colors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
              Select Color
            </h3>
            {selectedColor && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                {selectedColor}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {colors.map((col) => {
              const bgCol = colorMap[col.toLowerCase()] || col.toLowerCase();
              const isLight =
                bgCol === '#ffffff' ||
                bgCol === 'white' ||
                bgCol === '#d6cbb5' ||
                bgCol === 'beige';
              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => setSelectedColor(col)}
                  className={cn(
                    'relative flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring/40',
                    selectedColor === col
                      ? 'ring-2 ring-primary ring-offset-2 border-transparent scale-110'
                      : 'border-border/80 hover:scale-105',
                    isLight && 'border-border'
                  )}
                  style={{ backgroundColor: bgCol }}
                  title={col}
                >
                  {selectedColor === col && (
                    <Check
                      className={cn('h-3.5 w-3.5', isLight ? 'text-slate-900' : 'text-white')}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity Selector */}
      {!isOutOfStock && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
            Select Quantity
          </h3>
          <div className="flex items-center gap-3 bg-muted/40 border border-border/40 w-fit p-1 rounded-xl shadow-premium-sm">
            <button
              type="button"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => q - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/20 bg-card hover:bg-muted text-sm font-bold disabled:opacity-50 transition-colors"
            >
              -
            </button>
            <span className="w-8 text-center text-xs font-bold text-foreground">{quantity}</span>
            <button
              type="button"
              disabled={quantity >= Math.min(stockQuantity, 10)}
              onClick={() => setQuantity((q) => q + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/20 bg-card hover:bg-muted text-sm font-bold disabled:opacity-50 transition-colors"
            >
              +
            </button>
            <span className="pr-3 text-[10px] text-muted-foreground/80 font-bold uppercase tracking-wider">
              {stockQuantity} Available
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row pt-4 border-t border-border/20">
        <Button
          size="lg"
          onClick={handleAddToCart}
          disabled={isOutOfStock || addingToCart}
          className="flex-1 gap-2 font-bold uppercase tracking-wider text-xs py-6 rounded-xl shadow-premium"
        >
          <ShoppingCart className="h-4.5 w-4.5" />
          {isOutOfStock ? 'Out of Stock' : addingToCart ? 'Adding...' : 'Add to Cart'}
        </Button>

        <Button
          size="lg"
          variant={isWishlisted ? 'secondary' : 'outline'}
          onClick={handleToggleWishlist}
          disabled={togglingWishlist}
          className={cn(
            'gap-2 font-bold uppercase tracking-wider text-xs py-6 rounded-xl',
            isWishlisted ? 'text-destructive border-destructive/20 hover:bg-destructive/5' : ''
          )}
        >
          <Heart
            className={cn(
              'h-4.5 w-4.5 transition-transform duration-300',
              isWishlisted ? 'fill-destructive text-destructive scale-110' : ''
            )}
          />
          {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
        </Button>
      </div>
    </div>
  );
}
