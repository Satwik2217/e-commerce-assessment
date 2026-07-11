import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { formatPrice } from '@/lib/utils';
import { Star, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { ProductInteractions } from '@/components/products/product-interactions';
import { AddReviewForm } from '@/components/products/add-review-form';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { DbConnectionError } from '@/components/shared/db-error';

interface ProductDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  try {
    const { slug } = await params;

    // Fetch product from database
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        reviews: {
          include: {
            user: {
              select: { name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product || !product.isActive) {
      notFound();
    }

    // Determine if product is already in the user's wishlist
    const session = await auth();
    let initialWishlisted = false;

    if (session?.user) {
      const wish = await prisma.wishlist.findUnique({
        where: {
          userId_productId: {
            userId: session.user.id,
            productId: product.id,
          },
        },
      });
      initialWishlisted = !!wish;
    }

    // Calculate review metrics
    const reviewCount = product.reviews.length;
    const averageRating =
      reviewCount > 0 ? product.reviews.reduce((sum, rev) => sum + rev.rating, 0) / reviewCount : 0;

    // Convert decimal to number for display
    const price = Number(product.price);
    const compareAtPrice = product.compareAtPrice ? Number(product.compareAtPrice) : null;
    const discount =
      compareAtPrice && compareAtPrice > price
        ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
        : 0;

    const productData = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price,
      images: product.images,
    };

    return (
      <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="mb-8 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 flex flex-wrap items-center gap-1.5 bg-muted/40 border border-border/20 px-4 py-2.5 rounded-xl w-fit">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span className="text-muted-foreground/35">/</span>
          <Link href="/products" className="hover:text-primary transition-colors">
            Shop
          </Link>
          <span className="text-muted-foreground/35">/</span>
          <Link
            href={`/products?category=${product.category.slug}`}
            className="hover:text-primary transition-colors"
          >
            {product.category.name}
          </Link>
          <span className="text-muted-foreground/35">/</span>
          <span className="text-foreground font-black truncate">{product.name}</span>
        </nav>

        {/* Product Details Grid */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Gallery */}
          <div className="space-y-6">
            <div className="aspect-square overflow-hidden rounded-2xl border border-border/40 bg-card p-4 shadow-premium group">
              <img
                src={product.images[0] || 'https://placehold.co/600x600?text=Product'}
                alt={product.name}
                className="h-full w-full object-cover object-center rounded-xl transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="aspect-square overflow-hidden rounded-xl border border-border/40 bg-card p-1.5 cursor-pointer shadow-premium-sm transition-all duration-300 hover:scale-105 hover:border-primary/55"
                  >
                    <img
                      src={img}
                      alt=""
                      className="h-full w-full object-cover object-center rounded-lg hover:opacity-90"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/75 bg-accent/40 px-3 py-1.5 rounded-full w-fit">
                  {product.category.name}
                </p>
                <h1 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-5xl uppercase leading-none">
                  {product.name}
                </h1>

                {/* Ratings summary */}
                {reviewCount > 0 && (
                  <div className="mt-4 flex items-center gap-2 bg-accent/30 px-3 py-1 rounded-full w-fit border border-border/20">
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className={`h-3.5 w-3.5 ${
                            idx < Math.round(averageRating)
                              ? 'fill-yellow-500 text-yellow-500'
                              : 'text-muted-foreground/20'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-black text-foreground">
                      {averageRating.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      ({reviewCount} reviews)
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-4">
                  <span className="text-3xl font-black tracking-tight text-foreground">
                    {formatPrice(price)}
                  </span>
                  {compareAtPrice && compareAtPrice > price && (
                    <>
                      <span className="text-base text-muted-foreground/60 line-through font-semibold">
                        {formatPrice(compareAtPrice)}
                      </span>
                      <Badge
                        className="bg-destructive/10 text-destructive border border-destructive/20 font-bold"
                        variant="destructive"
                      >
                        Save {discount}%
                      </Badge>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">
                  Inclusive of all taxes
                </p>
              </div>

              <Separator />

              {/* Description */}
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                  Product Description
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground/90 leading-relaxed font-semibold">
                  {product.description}
                </p>
              </div>

              <Separator />

              {/* Client Interactions */}
              <ProductInteractions
                productId={product.id}
                sizes={product.sizes}
                colors={product.colors}
                stockQuantity={product.stockQuantity}
                initialWishlisted={initialWishlisted}
                productData={productData}
              />
            </div>

            {/* Core Trust Badges */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-10 pt-8 border-t border-border/20">
              <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card p-4 shadow-premium-sm">
                <div className="rounded-xl bg-accent p-2 text-primary">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground">
                    Free Delivery
                  </h3>
                  <p className="text-[9px] text-muted-foreground font-semibold mt-0.5">
                    Orders above ₹499
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card p-4 shadow-premium-sm">
                <div className="rounded-xl bg-accent p-2 text-primary">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground">
                    Easy Returns
                  </h3>
                  <p className="text-[9px] text-muted-foreground font-semibold mt-0.5">
                    7 Days Policy
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card p-4 shadow-premium-sm">
                <div className="rounded-xl bg-accent p-2 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground">
                    100% Genuine
                  </h3>
                  <p className="text-[9px] text-muted-foreground font-semibold mt-0.5">
                    Premium Quality
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews & Ratings Section */}
        <div className="mt-20 border-t border-border/20 pt-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/75">
            Feedback
          </h2>
          <h3 className="text-2xl font-black text-foreground mt-1 uppercase mb-8">
            Customer Reviews
          </h3>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Write a review form */}
            <div className="md:col-span-1 space-y-4">
              {session?.user ? (
                <AddReviewForm productId={product.id} />
              ) : (
                <div className="rounded-2xl border border-border/40 bg-card/65 p-6 text-center shadow-premium-sm backdrop-blur-sm">
                  <p className="text-xs text-muted-foreground/80 font-bold uppercase tracking-wider leading-relaxed">
                    Please{' '}
                    <Link
                      href={`/login?callbackUrl=/products/${product.slug}`}
                      className="text-primary underline"
                    >
                      Sign In
                    </Link>{' '}
                    to write a review for this product.
                  </p>
                </div>
              )}
            </div>

            {/* Existing reviews list */}
            <div className="md:col-span-2">
              {product.reviews.length === 0 ? (
                <div className="rounded-2xl border border-border/40 bg-card/45 p-12 text-center h-full flex flex-col justify-center items-center shadow-premium-sm border-dashed">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    No reviews yet
                  </h4>
                  <p className="mt-2 text-xs font-semibold text-muted-foreground/80 max-w-xs leading-relaxed">
                    There are no reviews for this product. Be the first to share your thoughts!
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {product.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="rounded-2xl border border-border/40 p-6 bg-card shadow-premium-sm space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-foreground uppercase tracking-wide">
                            {rev.user.name}
                          </p>
                          <div className="mt-1 flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <Star
                                key={idx}
                                className={`h-3 w-3 ${
                                  idx < rev.rating
                                    ? 'fill-yellow-500 text-yellow-500'
                                    : 'text-muted-foreground/20'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                          {new Intl.DateTimeFormat('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          }).format(new Date(rev.createdAt))}
                        </span>
                      </div>
                      {rev.comment && (
                        <p className="text-xs sm:text-sm text-muted-foreground/90 font-semibold leading-relaxed border-t border-border/20 pt-4">
                          {rev.comment}
                        </p>
                      )}
                    </div>
                  ))}
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
