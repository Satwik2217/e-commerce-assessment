'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { signIn } from 'next-auth/react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="glassmorphism rounded-2xl border border-white/25 dark:border-white/5 shadow-premium overflow-hidden bg-card/60 backdrop-blur-md">
      <CardHeader className="text-center pb-2 pt-8">
        <CardTitle className="text-2xl font-black text-gradient uppercase tracking-wide">
          Welcome Back
        </CardTitle>
        <CardDescription className="text-xs uppercase font-bold tracking-wider text-muted-foreground/70">
          Sign in to your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 px-6 sm:px-8 pt-4">
          {error && (
            <div className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20 font-bold uppercase tracking-wider text-center leading-relaxed">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11"
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 px-6 sm:px-8 pb-8 pt-4">
          <Button
            type="submit"
            className="w-full font-bold uppercase tracking-wider text-xs py-5 rounded-xl shadow-premium"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
          <p className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary font-black hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card className="glassmorphism rounded-2xl border border-white/25 dark:border-white/5 shadow-premium overflow-hidden bg-card/60 backdrop-blur-md">
          <div className="p-8 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Loading login form...
          </div>
        </Card>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
