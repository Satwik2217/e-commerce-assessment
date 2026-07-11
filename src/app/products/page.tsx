import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { Search, SlidersHorizontal, Star } from 'lucide-react';
import { DEFAULT_SIZES, DEFAULT_COLORS } from '@/lib/constants';
import { SortingSelector } from '@/components/products/sorting-selector';
import { DbConnectionError } from '@/components/shared/db-error';
import { auth } from '@/lib/auth';
import { ProductCardActions } from '@/components/products/product-card-actions';

interface ProductsPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    size?: string;
    color?: string;
    page?: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  try {
    const resolvedParams = await searchParams;
    const q = resolvedParams.q || '';
    const category = resolvedParams.category || '';
    const sort = resolvedParams.sort || 'newest';
    const minPrice = resolvedParams.minPrice || '';
    const maxPrice = resolvedParams.maxPrice || '';
    const size = resolvedParams.size || '';
    const color = resolvedParams.color || '';
    const page = parseInt(resolvedParams.page || '1', 10);
    const limit = 9;

    // Build query filters
    const where: any = { isActive: true };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = { slug: category };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (size) {
      where.sizes = { has: size };
    }

    if (color) {
      where.colors = { has: color };
    }

    // Build sorting parameters
    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price-asc') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price-desc') {
      orderBy = { price: 'desc' };
    } else if (sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    }

    const session = await auth();
    const wishlistedIds = new Set<string>();

    // Execute database queries
    const [products, totalCount, categories] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: true,
          reviews: {
            select: { rating: true },
          },
        },
      }),
      prisma.product.count({ where }),
      prisma.category.findMany({
        orderBy: { name: 'asc' },
      }),
    ]);

    if (session?.user) {
      const userWishlist = await prisma.wishlist.findMany({
        where: { userId: session.user.id },
        select: { productId: true },
      });
      userWishlist.forEach((w) => wishlistedIds.add(w.productId));
    }

    const totalPages = Math.ceil(totalCount / limit);

    // Helper to build URL query strings
    const getQueryUrl = (params: Record<string, string | null>) => {
      const nextParams = new URLSearchParams();
      if (q) nextParams.set('q', q);
      if (category) nextParams.set('category', category);
      if (sort && sort !== 'newest') nextParams.set('sort', sort);
      if (minPrice) nextParams.set('minPrice', minPrice);
      if (maxPrice) nextParams.set('maxPrice', maxPrice);
      if (size) nextParams.set('size', size);
      if (color) nextParams.set('color', color);

      Object.entries(params).forEach(([key, val]) => {
        if (val === null) {
          nextParams.delete(key);
        } else {
          nextParams.set(key, val);
        }
      });

      return `/products?${nextParams.toString()}`;
    };

    return (
      <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          title="Store Catalog"
          description={
            category
              ? `Browsing products in "${categories.find((c) => c.slug === category)?.name || category}"`
              : 'Explore our premium collections'
          }
        />

        <div className="mt-8 flex flex-col gap-10 lg:flex-row">
          {/* Filters Sidebar (Desktop) */}
          <aside className="w-full shrink-0 lg:w-72">
            <div className="sticky top-24 rounded-2xl border border-border/40 bg-card p-6 shadow-premium">
              <div className="flex items-center justify-between border-b border-border/20 pb-4 mb-4">
                <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                  Filter Options
                </h2>
                {(category || q || minPrice || maxPrice || size || color) && (
                  <Link
                    href="/products"
                    className="text-[10px] font-bold uppercase tracking-wider text-destructive hover:underline"
                  >
                    Clear All
                  </Link>
                )}
              </div>

              {/* Category Filter */}
              <div className="border-b border-border/20 py-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                  Categories
                </h3>
                <div className="space-y-2">
                  <Link
                    href={getQueryUrl({ category: null, page: '1' })}
                    className={`block text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${!category ? 'text-primary font-bold' : 'text-muted-foreground/70 hover:text-foreground'}`}
                  >
                    All Categories
                  </Link>
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={getQueryUrl({ category: cat.slug, page: '1' })}
                      className={`block text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${category === cat.slug ? 'text-primary font-bold' : 'text-muted-foreground/70 hover:text-foreground'}`}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Price Filter Form */}
              <form
                action="/products"
                method="GET"
                className="border-b border-border/20 py-4 space-y-3"
              >
                {/* Keep other filter state as hidden fields */}
                {q && <input type="hidden" name="q" value={q} />}
                {category && <input type="hidden" name="category" value={category} />}
                {sort && <input type="hidden" name="sort" value={sort} />}
                {size && <input type="hidden" name="size" value={size} />}
                {color && <input type="hidden" name="color" value={color} />}

                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                  Price Range
                </h3>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    name="minPrice"
                    placeholder="Min"
                    defaultValue={minPrice}
                    className="h-10 text-xs"
                  />
                  <span className="text-xs text-muted-foreground/60 font-semibold">to</span>
                  <Input
                    type="number"
                    name="maxPrice"
                    placeholder="Max"
                    defaultValue={maxPrice}
                    className="h-10 text-xs"
                  />
                </div>
                <Button
                  type="submit"
                  size="sm"
                  className="w-full text-[10px] uppercase font-bold tracking-wider py-5 rounded-lg shadow-premium"
                >
                  Apply Price
                </Button>
              </form>

              {/* Size Filter */}
              <div className="border-b border-border/20 py-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                  Sizes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_SIZES.map((sz) => {
                    const isSelected = size === sz;
                    return (
                      <Link
                        key={sz}
                        href={getQueryUrl({ size: isSelected ? null : sz, page: '1' })}
                      >
                        <Button
                          variant={isSelected ? 'default' : 'outline'}
                          className={`h-9 px-3.5 text-xs font-bold ${isSelected ? '' : 'text-muted-foreground/80'}`}
                        >
                          {sz}
                        </Button>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Color Filter */}
              <div className="py-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                  Colors
                </h3>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_COLORS.map((col) => {
                    const isSelected = color === col;
                    return (
                      <Link
                        key={col}
                        href={getQueryUrl({ color: isSelected ? null : col, page: '1' })}
                      >
                        <Button
                          variant={isSelected ? 'default' : 'outline'}
                          className={`h-9 px-3.5 text-xs font-bold ${isSelected ? '' : 'text-muted-foreground/80'}`}
                        >
                          {col}
                        </Button>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid & Controls */}
          <div className="flex-1 space-y-8">
            {/* Controls Bar */}
            <div className="flex flex-col gap-4 border-b border-border/20 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <form action="/products" method="GET" className="relative flex-1 max-w-md">
                {category && <input type="hidden" name="category" value={category} />}
                {sort && <input type="hidden" name="sort" value={sort} />}
                {minPrice && <input type="hidden" name="minPrice" value={minPrice} />}
                {maxPrice && <input type="hidden" name="maxPrice" value={maxPrice} />}
                {size && <input type="hidden" name="size" value={size} />}
                {color && <input type="hidden" name="color" value={color} />}

                <Input
                  name="q"
                  type="search"
                  placeholder="Search products..."
                  defaultValue={q}
                  className="pl-10 h-11 text-xs"
                />
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground/60" />
              </form>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <span className="text-[10px] text-muted-foreground/80 font-bold uppercase tracking-wider shrink-0">
                  Sort by:
                </span>
                <SortingSelector currentSort={sort} />
              </div>
            </div>

            {/* Results Grid */}
            <div>
              {products.length === 0 ? (
                <EmptyState
                  title="No products found"
                  description="Try adjusting your keywords or clearing some filters."
                />
              ) : (
                <div className="space-y-12">
                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {products.map((prod) => {
                      // Calculate ratings average
                      const ratings = prod.reviews.map((r) => r.rating);
                      const avgRating =
                        ratings.length > 0
                          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
                          : 0;

                      // Calculate discount badge
                      const priceNum = Number(prod.price);
                      const compareAtPriceNum = prod.compareAtPrice
                        ? Number(prod.compareAtPrice)
                        : 0;
                      const discount =
                        compareAtPriceNum > priceNum
                          ? Math.round(((compareAtPriceNum - priceNum) / compareAtPriceNum) * 100)
                          : 0;

                      return (
                        <Card
                          key={prod.id}
                          className="group overflow-hidden flex flex-col h-full bg-card hover-lift rounded-2xl border border-border/40 relative"
                        >
                          <Link href={`/products/${prod.slug}`}>
                            <div className="relative aspect-square overflow-hidden bg-muted">
                              <img
                                src={prod.images[0] || 'https://placehold.co/400x400?text=Product'}
                                alt={prod.name}
                                className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                              />
                              {discount > 0 && (
                                <Badge
                                  className="absolute left-3 top-3 bg-destructive/10 text-destructive border border-destructive/20"
                                  variant="destructive"
                                >
                                  {discount}% OFF
                                </Badge>
                              )}
                              {!prod.stockQuantity && (
                                <Badge
                                  className="absolute left-3 top-3 bg-muted/95 text-muted-foreground border border-border/30"
                                  variant="secondary"
                                >
                                  Out of Stock
                                </Badge>
                              )}

                              <ProductCardActions
                                productId={prod.id}
                                initialWishlisted={wishlistedIds.has(prod.id)}
                                stockQuantity={prod.stockQuantity}
                                sizes={prod.sizes}
                                colors={prod.colors}
                                productData={{
                                  id: prod.id,
                                  name: prod.name,
                                  slug: prod.slug,
                                  price: priceNum,
                                  images: prod.images,
                                }}
                              />
                            </div>
                          </Link>

                          <CardHeader className="p-5 pb-1 flex-1">
                            <p className="text-[10px] text-muted-foreground/80 font-bold uppercase tracking-wider">
                              {prod.category.name}
                            </p>
                            <Link
                              href={`/products/${prod.slug}`}
                              className="hover:text-primary transition-colors"
                            >
                              <CardTitle className="mt-1 text-sm font-bold uppercase tracking-wide truncate">
                                {prod.name}
                              </CardTitle>
                            </Link>
                            {avgRating > 0 && (
                              <div className="mt-2 flex items-center gap-1.5 bg-accent/40 px-2 py-0.5 rounded-full w-fit">
                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                <span className="text-[10px] font-bold text-foreground">
                                  {avgRating.toFixed(1)}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-semibold">
                                  ({ratings.length})
                                </span>
                              </div>
                            )}
                          </CardHeader>

                          <CardContent className="px-5 py-0 mt-2 pb-5">
                            <div className="flex items-baseline gap-2">
                              <span className="text-base font-black text-foreground">
                                {formatPrice(priceNum)}
                              </span>
                              {compareAtPriceNum > priceNum && (
                                <span className="text-xs text-muted-foreground/60 line-through">
                                  {formatPrice(compareAtPriceNum)}
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 pt-6 border-t border-border/20">
                      <Link
                        href={getQueryUrl({ page: String(Math.max(1, page - 1)) })}
                        className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs font-semibold py-4 rounded-xl"
                        >
                          Previous
                        </Button>
                      </Link>

                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: totalPages }).map((_, idx) => {
                          const pNum = idx + 1;
                          const isCurrent = page === pNum;
                          return (
                            <Link key={pNum} href={getQueryUrl({ page: String(pNum) })}>
                              <Button
                                variant={isCurrent ? 'default' : 'outline'}
                                size="sm"
                                className="h-9 w-9 p-0 rounded-lg text-xs font-bold"
                              >
                                {pNum}
                              </Button>
                            </Link>
                          );
                        })}
                      </div>

                      <Link
                        href={getQueryUrl({ page: String(Math.min(totalPages, page + 1)) })}
                        className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs font-semibold py-4 rounded-xl"
                        >
                          Next
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return <DbConnectionError error={error} />;
  }
}
