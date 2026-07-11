'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { DEFAULT_SIZES, DEFAULT_COLORS } from '@/lib/constants';
import { Save, Loader2 } from 'lucide-react';
import { ImageUpload, ImageUploadHandle } from '@/components/admin/image-upload';

interface ProductFormProps {
  categories: {
    id: string;
    name: string;
  }[];
  initialData?: {
    id: string;
    name: string;
    description: string;
    price: any;
    compareAtPrice: any | null;
    stockQuantity: number;
    categoryId: string;
    sizes: string[];
    colors: string[];
    images: string[];
    isActive: boolean;
  };
}

export function ProductForm({ categories, initialData }: ProductFormProps) {
  const router = useRouter();
  const imageUploadRef = useRef<ImageUploadHandle>(null);

  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [price, setPrice] = useState(initialData ? Number(initialData.price).toString() : '');
  const [compareAtPrice, setCompareAtPrice] = useState(
    initialData?.compareAtPrice ? Number(initialData.compareAtPrice).toString() : ''
  );
  const [stockQuantity, setStockQuantity] = useState(
    initialData ? initialData.stockQuantity.toString() : '0'
  );
  const [categoryId, setCategoryId] = useState(
    initialData?.categoryId || (categories[0]?.id ?? '')
  );
  const [sizes, setSizes] = useState<string[]>(initialData?.sizes || []);
  const [colors, setColors] = useState<string[]>(initialData?.colors || []);
  const [imageUrls, setImageUrls] = useState<string[]>(initialData?.images || []);
  const [isActive, setIsActive] = useState(initialData ? initialData.isActive : true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!initialData;

  function handleSizeToggle(sz: string) {
    setSizes((prev) => (prev.includes(sz) ? prev.filter((s) => s !== sz) : [...prev, sz]));
  }

  function handleColorToggle(col: string) {
    setColors((prev) => (prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const parsedPrice = parseFloat(price);
    const parsedCompare = compareAtPrice ? parseFloat(compareAtPrice) : null;
    const parsedStock = parseInt(stockQuantity, 10);

    if (!name) return setError('Product name is required');
    if (!description || description.length < 10)
      return setError('Description must be at least 10 characters');
    if (isNaN(parsedPrice) || parsedPrice <= 0) return setError('Price must be a positive number');
    if (isNaN(parsedStock) || parsedStock < 0) return setError('Stock quantity cannot be negative');
    if (!categoryId) return setError('Please select a category');
    if (sizes.length === 0) return setError('Select at least one size variant');
    if (colors.length === 0) return setError('Select at least one color variant');

    if (imageUploadRef.current?.hasPending()) {
      setLoading(true);
      setError('Uploading images, please wait...');
      const ok = await imageUploadRef.current.uploadPending();
      if (!ok) {
        setError('Image upload failed. Please try again.');
        setLoading(false);
        return;
      }
    }

    if (imageUrls.length === 0) return setError('Provide at least one image');

    setLoading(true);
    try {
      const url = isEdit ? `/api/admin/products/${initialData.id}` : '/api/admin/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          price: parsedPrice,
          compareAtPrice: parsedCompare,
          stockQuantity: parsedStock,
          categoryId,
          sizes,
          colors,
          images: imageUrls,
          isActive,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to submit product');
      } else {
        router.push('/admin/products');
        router.refresh();
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                placeholder="Classic Oxford Shirt"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring h-10"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                <option value="">Select a Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Premium oxford weave construction..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="499.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comparePrice">Compare At Price (₹)</Label>
              <Input
                id="comparePrice"
                type="number"
                step="0.01"
                placeholder="e.g. 699.00"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input
                id="stock"
                type="number"
                placeholder="100"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sizes</Label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_SIZES.map((sz) => {
                const checked = sizes.includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handleSizeToggle(sz)}
                    className={`h-9 px-3 text-xs font-semibold rounded-md border transition-colors ${
                      checked
                        ? 'bg-primary text-primary-foreground border-primary font-bold'
                        : 'border-input bg-background hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Colors</Label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_COLORS.map((col) => {
                const checked = colors.includes(col);
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => handleColorToggle(col)}
                    className={`h-9 px-3 text-xs font-semibold rounded-md border transition-colors ${
                      checked
                        ? 'bg-primary text-primary-foreground border-primary font-bold'
                        : 'border-input bg-background hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    {col}
                  </button>
                );
              })}
            </div>
          </div>

          <ImageUpload
            ref={imageUploadRef}
            existingImages={imageUrls}
            onImagesChange={setImageUrls}
            maxImages={5}
            folder="shopmyuniform/products"
          />

          <div className="flex items-center space-x-2 rounded-lg border bg-card p-3 shadow-xs max-w-[200px]">
            <input
              type="checkbox"
              id="active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <label htmlFor="active" className="text-xs font-semibold leading-none cursor-pointer">
              Product is Active
            </label>
          </div>
        </CardContent>
        <CardFooter className="border-t p-6 flex justify-end gap-3">
          <Link href="/admin/products">
            <Button type="button" variant="outline" disabled={loading}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="gap-2 font-semibold">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
