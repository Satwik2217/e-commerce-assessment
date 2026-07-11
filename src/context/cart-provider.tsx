'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from './toast-context';

export interface CartItemData {
  id: string;
  quantity: number;
  size: string | null;
  color: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
  };
}

interface CartContextType {
  items: CartItemData[];
  itemCount: number;
  total: number;
  loading: boolean;
  addItem: (
    productId: string,
    quantity: number,
    size: string | null,
    color: string | null,
    productData: CartItemData['product']
  ) => Promise<boolean>;
  updateItem: (itemId: string, quantity: number) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const { toast } = useToast();
  const [items, setItems] = useState<CartItemData[]>([]);
  const [loading, setLoading] = useState(false);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);

  // Sync server cart
  const refreshCart = useCallback(async () => {
    if (status !== 'authenticated') return;
    setLoading(true);
    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const json = await res.json();
        setItems(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  }, [status]);

  // Reset local items when unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      setItems([]);
    }
  }, [status]);

  // Fetch cart on login transition
  useEffect(() => {
    if (status === 'authenticated') {
      refreshCart();
    }
  }, [status, refreshCart]);

  const addItem = useCallback(
    async (
      productId: string,
      quantity: number,
      size: string | null,
      color: string | null,
      productData: CartItemData['product']
    ) => {
      if (status !== 'authenticated') {
        return false;
      }

      const previousItems = [...items];

      // Optimistic UI updates
      setItems((prev) => {
        const existing = prev.find(
          (i) => i.product.id === productId && i.size === size && i.color === color
        );
        if (existing) {
          return prev.map((i) =>
            i.id === existing.id ? { ...i, quantity: i.quantity + quantity } : i
          );
        }
        const tempId = `temp-${Date.now()}`;
        return [...prev, { id: tempId, quantity, size, color, product: productData }];
      });

      try {
        const res = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, quantity, size, color }),
        });
        if (res.ok) {
          await refreshCart();
          return true;
        }
        const data = await res.json();
        toast(data.error || 'Failed to add item to cart', 'error');
        setItems(previousItems); // Rollback
        return false;
      } catch (err) {
        console.error('Error adding cart item:', err);
        setItems(previousItems); // Rollback
        return false;
      }
    },
    [status, items, refreshCart, toast]
  );

  const updateItem = useCallback(
    async (itemId: string, quantity: number) => {
      if (status !== 'authenticated') {
        return false;
      }

      const previousItems = [...items];

      // Optimistic UI updates
      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity } : i)));

      try {
        const res = await fetch(`/api/cart?id=${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity }),
        });
        if (res.ok) {
          await refreshCart();
          return true;
        }
        const data = await res.json();
        toast(data.error || 'Failed to update quantity', 'error');
        setItems(previousItems); // Rollback
        return false;
      } catch (err) {
        console.error('Error updating cart item:', err);
        setItems(previousItems); // Rollback
        return false;
      }
    },
    [status, items, refreshCart, toast]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (status !== 'authenticated') {
        return false;
      }

      const previousItems = [...items];

      // Optimistic UI updates
      setItems((prev) => prev.filter((i) => i.id !== itemId));

      try {
        const res = await fetch(`/api/cart?id=${itemId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          await refreshCart();
          return true;
        }
        setItems(previousItems); // Rollback
        return false;
      } catch (err) {
        console.error('Error removing cart item:', err);
        setItems(previousItems); // Rollback
        return false;
      }
    },
    [status, items, refreshCart]
  );

  const clearCart = useCallback(async () => {
    if (status !== 'authenticated') {
      return false;
    }

    const previousItems = [...items];
    setItems([]);

    try {
      const res = await fetch('/api/cart?clear=true', {
        method: 'DELETE',
      });
      if (res.ok) {
        return true;
      }
      setItems(previousItems); // Rollback
      return false;
    } catch (err) {
      console.error('Error clearing cart:', err);
      setItems(previousItems); // Rollback
      return false;
    }
  }, [status, items]);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        total,
        loading,
        addItem,
        updateItem,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
