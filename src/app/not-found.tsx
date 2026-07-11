import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center text-center px-4 overflow-hidden">
      {/* Background glow blobs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-accent/10 blur-[130px] pointer-events-none" />

      <div className="relative z-10 space-y-6 max-w-md">
        <h1 className="text-8xl sm:text-9xl font-black tracking-tight text-gradient leading-none">
          404
        </h1>
        <div className="space-y-2">
          <h2 className="text-lg font-bold uppercase tracking-wider text-foreground">
            Page Not Found
          </h2>
          <p className="text-xs font-semibold text-muted-foreground/80 leading-relaxed uppercase tracking-wider">
            The page you are looking for does not exist or has been relocated.
          </p>
        </div>
        <div className="pt-4">
          <Link href="/">
            <Button className="font-bold uppercase tracking-wider text-xs px-8 py-5 rounded-xl shadow-premium">
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
