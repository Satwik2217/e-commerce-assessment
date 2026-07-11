'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface DeleteCategoryButtonProps {
  id: string;
  name: string;
}

export function DeleteCategoryButton({ id, name }: DeleteCategoryButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete the category "${name}"?`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Failed to delete category');
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error('Delete category error:', err);
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
      <span className="sr-only">Delete category</span>
    </Button>
  );
}
