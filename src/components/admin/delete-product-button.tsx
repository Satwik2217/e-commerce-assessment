'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface DeleteProductButtonProps {
  id: string;
  name: string;
}

export function DeleteProductButton({ id, name }: DeleteProductButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete the product "${name}"?`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Failed to delete product');
      } else {
        if (json.data?.softDeleted) {
          alert(json.data.message);
        }
        router.refresh();
      }
    } catch (err) {
      console.error('Delete product error:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={deleting}
      onClick={handleDelete}
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      <Trash2 className="h-4 w-4" />
      <span className="sr-only">Delete product</span>
    </Button>
  );
}
