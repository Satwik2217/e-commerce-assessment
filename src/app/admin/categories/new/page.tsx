'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Tag } from 'lucide-react';

export default function AdminNewCategoryPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name) {
      setError('Category name is required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, image: image || null }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to create category');
      } else {
        router.push('/admin/categories');
        router.refresh();
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <Link
        href="/admin/categories"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Categories
      </Link>

      <PageHeader title="Add Category" description="Create a new product category" />

      <Card>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive font-semibold">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                placeholder="e.g. Winter Wear"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the category..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                placeholder="https://example.com/image.jpg"
                value={image}
                onChange={(e) => setImage(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                Optional. Leave blank to use a default placeholder image.
              </p>
            </div>
          </CardContent>
          <CardFooter className="border-t p-6 flex justify-end gap-3">
            <Link href="/admin/categories">
              <Button type="button" variant="outline" disabled={loading}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading} className="gap-2 font-semibold">
              <Tag className="h-4 w-4" />
              {loading ? 'Creating...' : 'Create Category'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
