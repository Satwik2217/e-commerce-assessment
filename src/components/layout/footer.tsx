import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card text-foreground">
      <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="rounded-lg bg-primary p-1.5 text-primary-foreground group-hover:scale-105 transition-transform duration-300">
                <ShoppingBag className="h-4.5 w-4.5" />
              </div>
              <span className="font-bold tracking-tight text-gradient text-lg">ShopMyUniform</span>
            </Link>
            <p className="text-sm text-muted-foreground/80 max-w-sm">
              Discover a curated collection of fashion and apparel. Elegant designs built for the
              modern individual, combining classic comfort with futuristic luxury.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3 text-xs font-semibold text-muted-foreground/90 uppercase tracking-wide">
              <li>
                <Link
                  href="/products"
                  className="hover:text-primary transition-colors duration-200"
                >
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-primary transition-colors duration-200">
                  Cart
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-primary transition-colors duration-200">
                  My Orders
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4">
              Account
            </h3>
            <ul className="space-y-3 text-xs font-semibold text-muted-foreground/90 uppercase tracking-wide">
              <li>
                <Link href="/login" className="hover:text-primary transition-colors duration-200">
                  Login
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="hover:text-primary transition-colors duration-200"
                >
                  Register
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-border/20 pt-8 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
          &copy; {new Date().getFullYear()} ShopMyUniform. Crafted for the future of apparel.
        </div>
      </div>
    </footer>
  );
}
