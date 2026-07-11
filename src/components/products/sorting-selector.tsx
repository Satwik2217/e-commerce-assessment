'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface SortingSelectorProps {
  currentSort: string;
}

export function SortingSelector({ currentSort }: SortingSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSortChange(newSort: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', newSort);
    params.set('page', '1');
    router.push(`/products?${params.toString()}`);
  }

  return (
    <select
      className="rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
      value={currentSort}
      onChange={(e) => handleSortChange(e.target.value)}
    >
      <option value="newest">Newest</option>
      <option value="oldest">Oldest</option>
      <option value="price-asc">Price: Low to High</option>
      <option value="price-desc">Price: High to Low</option>
    </select>
  );
}
