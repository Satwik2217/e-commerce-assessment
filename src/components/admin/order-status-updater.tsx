'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface OrderStatusUpdaterProps {
  orderId: string;
  initialStatus: string;
}

export function OrderStatusUpdater({ orderId, initialStatus }: OrderStatusUpdaterProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [updating, setUpdating] = useState(false);

  const statuses = [
    { value: 'PLACED', label: 'Placed' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'SHIPPED', label: 'Shipped' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  async function handleStatusChange(newStatus: string) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Failed to update order status');
        setStatus(status); // Reset
      } else {
        setStatus(newStatus);
        router.refresh();
      }
    } catch (err) {
      console.error('Update order status error:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setUpdating(false);
    }
  }

  const borderColors: Record<string, string> = {
    PLACED: 'border-blue-500 text-blue-600',
    PROCESSING: 'border-yellow-500 text-yellow-600',
    SHIPPED: 'border-purple-500 text-purple-600',
    DELIVERED: 'border-green-500 text-green-600',
    CANCELLED: 'border-destructive text-destructive',
  };

  return (
    <select
      disabled={updating}
      value={status}
      onChange={(e) => handleStatusChange(e.target.value)}
      className={`rounded-md border bg-background px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer uppercase tracking-wider disabled:opacity-50 ${
        borderColors[status] || 'border-input text-muted-foreground'
      }`}
    >
      {statuses.map((st) => (
        <option
          key={st.value}
          value={st.value}
          className="text-foreground uppercase bg-background font-semibold"
        >
          {st.label}
        </option>
      ))}
    </select>
  );
}
