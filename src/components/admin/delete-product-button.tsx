'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/context/toast-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface DeleteProductButtonProps {
  id: string;
  name: string;
}

export function DeleteProductButton({ id, name }: DeleteProductButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });

      const json = await res.json();
      if (!res.ok) {
        toast(json.error || 'Failed to delete product', 'error');
      } else {
        if (json.data?.softDeleted) {
          toast(json.data.message, 'info');
        } else {
          toast('Product deleted successfully', 'success');
        }
        router.refresh();
      }
    } catch (err) {
      console.error('Delete product error:', err);
      toast('Something went wrong. Please try again.', 'error');
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        disabled={deleting}
        onClick={() => setShowConfirm(true)}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Delete product</span>
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader className="flex flex-col items-center sm:items-start">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-destructive/10 p-2.5 text-destructive border border-destructive/20 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <DialogTitle className="uppercase tracking-wider">Confirm Deletion</DialogTitle>
            </div>
            <DialogDescription className="font-semibold text-muted-foreground/80 mt-3 text-center sm:text-left leading-relaxed">
              Are you sure you want to delete the product{' '}
              <strong className="text-foreground">"{name}"</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              className="uppercase text-[10px] font-bold tracking-wider py-5 rounded-xl flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={handleDelete}
              className="uppercase text-[10px] font-bold tracking-wider py-5 rounded-xl flex-1 shadow-premium"
            >
              {deleting ? 'Deleting...' : 'Delete Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
