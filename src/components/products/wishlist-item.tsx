'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/cart-provider';
import { useToast } from '@/context/toast-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { ShoppingCart, Trash2 } from 'lucide-react';

interface WishlistItemProps {
  item: {
    productId: string;
    product: {
      id: string;
      name: string;
      slug: string;
      price: number;
      images: string[];
      stockQuantity: number;
      sizes: string[];
      colors: string[];
    };
  };
}

export function WishlistItem({ item }: WishlistItemProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [removing, setRemoving] = useState(false);
  const [adding, setAdding] = useState(false);

  const { product } = item;
  const isOutOfStock = product.stockQuantity === 0;

  async function handleRemove() {
    setRemoving(true);
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error('Error removing wishlist item:', err);
    } finally {
      setRemoving(false);
    }
  }

  async function handleAddToCart() {
    if (isOutOfStock) return;
    setAdding(true);

    const defaultSize = product.sizes.length > 0 ? product.sizes[0] : null;
    const defaultColor = product.colors.length > 0 ? product.colors[0] : null;

    const productData = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: Number(product.price),
      images: product.images,
    };

    const success = await addItem(product.id, 1, defaultSize, defaultColor, productData);
    setAdding(false);
    if (success) {
      toast('Added to cart', 'success');
    }
  }

  return (
    <Card className="group overflow-hidden flex flex-col h-full bg-card hover-lift rounded-2xl border border-border/40 relative shadow-premium-sm">
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={product.images[0] || 'https://placehold.co/400x400?text=Product'}
            alt={product.name}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
          {isOutOfStock && (
            <Badge
              className="absolute left-3 top-3 bg-muted/95 text-muted-foreground border border-border/30"
              variant="secondary"
            >
              Out of Stock
            </Badge>
          )}
        </div>
      </Link>
      <CardHeader className="p-5 pb-1 flex-1">
        <Link href={`/products/${product.slug}`} className="hover:text-primary transition-colors">
          <CardTitle className="mt-1 text-sm font-bold uppercase tracking-wide truncate">
            {product.name}
          </CardTitle>
        </Link>
      </CardHeader>
      <CardContent className="px-5 py-0 mt-2 pb-5">
        <span className="text-base font-black text-foreground">
          {formatPrice(Number(product.price))}
        </span>
      </CardContent>
      <CardFooter className="p-5 pt-4 border-t border-border/25 mt-auto flex gap-2 bg-muted/10">
        <Button
          onClick={handleAddToCart}
          disabled={isOutOfStock || adding}
          className="flex-1 text-[10px] font-bold uppercase tracking-wider gap-1.5 h-10 rounded-xl shadow-premium"
          size="sm"
        >
          <ShoppingCart className="h-4 w-4" />
          {adding ? 'Adding...' : 'Add to Cart'}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRemove}
          disabled={removing}
          className="h-10 w-10 text-destructive/80 hover:bg-destructive/10 hover:text-destructive shrink-0 rounded-xl"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Remove</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
