'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Tag, ShoppingCart, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Tag },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border/40 bg-card lg:block">
      <div className="flex h-full flex-col">
        <div className="p-6 border-b border-border/20">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
            Control Center
          </h2>
          <p className="text-lg font-bold tracking-tight text-foreground mt-0.5">Admin Panel</p>
        </div>
        <nav className="flex-1 space-y-1.5 px-4 py-6">
          {sidebarLinks.map((link) => {
            const isActive =
              link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-300 relative group',
                  isActive
                    ? 'bg-accent/80 text-primary shadow-premium-sm border-l-3 border-primary'
                    : 'text-muted-foreground/80 hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <link.icon
                  className={cn(
                    'h-4 w-4 transition-transform duration-300 group-hover:scale-110',
                    isActive ? 'text-primary' : 'text-muted-foreground/60'
                  )}
                />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border/20 p-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 hover:bg-muted/50 hover:text-foreground transition-all duration-300 border border-border/30"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Store
          </Link>
        </div>
      </div>
    </aside>
  );
}
