'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, User, Menu } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useSession, signOut } from 'next-auth/react';
import { useCart } from '@/context/cart-provider';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Shop' },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/75 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="rounded-lg bg-primary p-1.5 text-primary-foreground group-hover:scale-105 transition-transform duration-300">
              <ShoppingBag className="h-4.5 w-4.5" />
            </div>
            <span className="font-bold tracking-tight text-gradient text-base sm:text-lg">
              ShopMyUniform
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative py-2 text-xs font-bold uppercase tracking-wider transition-colors duration-300',
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="navIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative group hover:bg-accent/80">
              <ShoppingBag className="h-5 w-5 transition-transform duration-300 group-hover:scale-105" />
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-1 -top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shadow-premium-sm ring-2 ring-background"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
              <span className="sr-only">Cart</span>
            </Button>
          </Link>
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-accent/80">
                  <User className="h-5 w-5" />
                  <span className="sr-only">User Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1 py-1">
                    <p className="text-sm font-semibold text-foreground leading-none">
                      {session.user.name}
                    </p>
                    <p className="text-xs text-muted-foreground leading-none">
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {session.user.role === 'ADMIN' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="w-full cursor-pointer py-2">
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/orders" className="w-full cursor-pointer py-2">
                    My Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer py-2"
                  onClick={() => signOut({ redirectTo: '/' })}
                >
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="icon" className="hover:bg-accent/80">
                <User className="h-5 w-5" />
                <span className="sr-only">Account</span>
              </Button>
            </Link>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden hover:bg-accent/80">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <div className="flex flex-col gap-6 h-full justify-between">
                <div className="flex flex-col gap-6">
                  <Link
                    href="/"
                    className="flex items-center gap-2 group"
                    onClick={() => setOpen(false)}
                  >
                    <div className="rounded-lg bg-primary p-1.5 text-primary-foreground">
                      <ShoppingBag className="h-4.5 w-4.5" />
                    </div>
                    <span className="font-bold tracking-tight text-gradient text-lg">
                      ShopMyUniform
                    </span>
                  </Link>
                  <nav className="flex flex-col gap-4">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'text-sm font-bold uppercase tracking-wider transition-colors duration-300 py-1.5 border-b border-border/20',
                          pathname === link.href
                            ? 'text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                    <Link
                      href="/cart"
                      onClick={() => setOpen(false)}
                      className="text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground py-1.5 border-b border-border/20"
                    >
                      Cart
                    </Link>
                    {session && (
                      <Link
                        href="/orders"
                        onClick={() => setOpen(false)}
                        className="text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground py-1.5 border-b border-border/20"
                      >
                        My Orders
                      </Link>
                    )}
                    {session?.user.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        onClick={() => setOpen(false)}
                        className="text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground py-1.5 border-b border-border/20"
                      >
                        Admin Panel
                      </Link>
                    )}
                  </nav>
                </div>
                <div className="pt-6 border-t border-border/40">
                  {session ? (
                    <button
                      onClick={() => {
                        setOpen(false);
                        signOut({ redirectTo: '/' });
                      }}
                      className="w-full text-center text-xs font-bold uppercase tracking-wider text-destructive hover:bg-destructive/5 py-3 rounded-xl border border-destructive/20 transition-all"
                    >
                      Sign Out
                    </button>
                  ) : (
                    <Link href="/login" onClick={() => setOpen(false)}>
                      <Button className="w-full py-3">Sign In</Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
