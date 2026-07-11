'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCart } from '@/context/cart-provider';
import { useToast } from '@/context/toast-context';
import { Heart, ShoppingBag, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProductCardActionsProps {
  productId: string;
  initialWishlisted: boolean;
  stockQuantity: number;
  sizes: string[];
  colors: string[];
  productData: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
  };
}

export function ProductCardActions({
  productId,
  initialWishlisted,
  stockQuantity,
  sizes,
  colors,
  productData,
}: ProductCardActionsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSession();
  const { addItem } = useCart();
  const { toast } = useToast();

  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
  const [addingToCart, setAddingToCart] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);
  const [added, setAdded] = useState(false);

  const isOutOfStock = stockQuantity === 0;

  async function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || addingToCart) return;

    if (status !== 'authenticated') {
      toast('Please sign in to add items to your cart.', 'info');
      setTimeout(() => {
        router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      }, 1000);
      return;
    }

    setAddingToCart(true);
    const selectedSize = sizes.length > 0 ? sizes[0] : null;
    const selectedColor = colors.length > 0 ? colors[0] : null;

    const success = await addItem(productId, 1, selectedSize, selectedColor, productData);

    setAddingToCart(false);
    if (success) {
      toast('Added to cart', 'success');
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  }

  async function handleToggleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (status !== 'authenticated') {
      router.push(`/login?callbackUrl=/products`);
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

  return (
    <>
      {/* Wishlist Heart Overlay (Absolute Top Right of product image) */}
      <button
        type="button"
        onClick={handleToggleWishlist}
        disabled={togglingWishlist}
        className={cn(
          'absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 dark:bg-card/70 backdrop-blur-md text-foreground shadow-premium border border-white/20 dark:border-white/5 transition-all hover:scale-105 active:scale-95 disabled:opacity-50',
          isWishlisted ? 'text-destructive' : 'text-muted-foreground/80 hover:text-foreground'
        )}
      >
        <Heart
          className={cn(
            'h-4 w-4 transition-transform duration-300',
            isWishlisted ? 'fill-destructive scale-110' : ''
          )}
        />
      </button>

      {/* Quick Add Button Overlay (Bottom slide-in or footer button) */}
      <div className="absolute inset-x-3 bottom-3 z-10 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 pointer-events-none">
        <Button
          type="button"
          disabled={isOutOfStock || addingToCart}
          onClick={handleQuickAdd}
          className={cn(
            'w-full h-9 py-0 text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-premium pointer-events-auto',
            added ? 'bg-emerald-500 text-white hover:bg-emerald-500' : ''
          )}
        >
          {addingToCart ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : added ? (
            <>
              <Check className="h-3.5 w-3.5 mr-1" />
              Added
            </>
          ) : isOutOfStock ? (
            'Out of Stock'
          ) : (
            <>
              <ShoppingBag className="h-3.5 w-3.5 mr-1" />
              Quick Add
            </>
          )}
        </Button>
      </div>
    </>
  );
}
