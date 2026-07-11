import Link from 'next/link';
import { ArrowRight, ShoppingBag, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/prisma';
import { formatPrice } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { DbConnectionError } from '@/components/shared/db-error';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  try {
    // Fetch categories and latest products from database
    const [categories, newArrivals] = await Promise.all([
      prisma.category.findMany({
        take: 6,
        orderBy: { name: 'asc' },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        take: 4,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return (
      <div className="flex flex-col gap-16 pb-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-card border-b border-border/40 py-20 lg:py-32">
          {/* Subtle design accents */}
          <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-accent/20 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-royal-purple/5 rounded-full blur-3xl -z-10" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mx-auto max-w-3xl space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/65 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                <Sparkles className="h-3.5 w-3.5 text-royal-purple animate-pulse" />
                Collection 2026 Live
              </div>
              <h1 className="text-5xl font-black tracking-tight sm:text-7xl lg:text-8xl text-gradient uppercase">
                Fashion <br className="sm:hidden" /> Forward
              </h1>
              <p className="mx-auto max-w-xl text-sm sm:text-base text-muted-foreground/80 leading-relaxed font-medium">
                Discover modern apparel designed for individuality. Curated premium capsule
                collections engineered for style, luxury, and daily versatility.
              </p>
              <div className="flex items-center justify-center gap-4 pt-4">
                <Link href="/products">
                  <Button
                    size="lg"
                    className="font-bold uppercase tracking-wider text-xs gap-2 py-6 px-8 rounded-xl shadow-premium"
                  >
                    Shop Now
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/products">
                  <Button
                    variant="outline"
                    size="lg"
                    className="font-bold uppercase tracking-wider text-xs py-6 px-8 rounded-xl hover:bg-muted/40"
                  >
                    View Lookbook
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Grid Section */}
        {categories.length > 0 && (
          <section className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4 border-b border-border/20 pb-6">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                  Shop by Category
                </h2>
                <h3 className="text-2xl font-black text-foreground mt-1 uppercase">
                  Curated Capsules
                </h3>
              </div>
              <Link
                href="/products"
                className="text-xs font-bold uppercase tracking-wider text-primary hover:underline flex items-center gap-1.5 self-start sm:self-auto"
              >
                View All Categories
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/products?category=${cat.slug}`}>
                  <Card className="group overflow-hidden cursor-pointer hover-lift rounded-2xl border border-border/40">
                    <div className="aspect-square relative overflow-hidden bg-muted">
                      <img
                        src={cat.image || 'https://placehold.co/300x300?text=Category'}
                        alt={cat.name}
                        className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/35 group-hover:bg-black/45 transition-colors duration-300 flex items-center justify-center p-4">
                        <h4 className="text-center font-bold uppercase text-white text-xs sm:text-sm tracking-widest border-b border-white/20 pb-1 group-hover:border-white/80 transition-colors">
                          {cat.name}
                        </h4>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* New Arrivals Section */}
        {newArrivals.length > 0 && (
          <section className="bg-card border-y border-border/30 py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4 border-b border-border/20 pb-6">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                    Recently Added
                  </h2>
                  <h3 className="text-2xl font-black text-foreground mt-1 uppercase">
                    New Arrivals
                  </h3>
                </div>
                <Link
                  href="/products?sort=newest"
                  className="text-xs font-bold uppercase tracking-wider text-primary hover:underline flex items-center gap-1.5 self-start sm:self-auto"
                >
                  Explore More
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {newArrivals.map((prod) => (
                  <Card
                    key={prod.id}
                    className="group overflow-hidden flex flex-col h-full bg-card hover-lift rounded-2xl border border-border/40"
                  >
                    <Link href={`/products/${prod.slug}`}>
                      <div className="aspect-square overflow-hidden bg-muted relative">
                        <img
                          src={prod.images[0] || 'https://placehold.co/400x400?text=Product'}
                          alt={prod.name}
                          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="rounded-full bg-primary/10 backdrop-blur-md px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-primary">
                            New
                          </span>
                        </div>
                      </div>
                    </Link>
                    <CardContent className="p-5 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <Link
                          href={`/products/${prod.slug}`}
                          className="group-hover:text-primary transition-colors"
                        >
                          <h4 className="font-bold text-sm truncate uppercase tracking-wider">
                            {prod.name}
                          </h4>
                        </Link>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-border/20 pt-4">
                        <span className="text-sm font-black text-foreground">
                          {formatPrice(Number(prod.price))}
                        </span>
                        <Link href={`/products/${prod.slug}`}>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary hover:underline transition-colors flex items-center gap-1">
                            Details
                            <ArrowRight className="h-3 w-3" />
                          </span>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    );
  } catch (error) {
    return <DbConnectionError error={error} />;
  }
}
