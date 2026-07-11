import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { WishlistItem } from '@/components/products/wishlist-item';
import { DbConnectionError } from '@/components/shared/db-error';

export const dynamic = 'force-dynamic';

export default async function WishlistPage() {
  try {
    const session = await auth();
    if (!session?.user) {
      redirect('/login?callbackUrl=/wishlist');
    }

    // Fetch wishlist items from database
    const wishlistItems = await prisma.wishlist.findMany({
      where: { userId: session.user.id },
      include: {
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedItems = wishlistItems.map((item) => ({
      productId: item.productId,
      product: {
        ...item.product,
        price: Number(item.product.price),
      },
    }));

    return (
      <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader title="My Wishlist" description="Review items you've saved for later" />

        <div className="mt-8">
          {formattedItems.length === 0 ? (
            <EmptyState
              title="Your wishlist is empty"
              description="Explore our store catalog and click the heart icon on items you love."
            />
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {formattedItems.map((item) => (
                <WishlistItem key={item.productId} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    return <DbConnectionError error={error} />;
  }
}
