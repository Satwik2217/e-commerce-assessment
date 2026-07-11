'use client';

import { Database, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DbConnectionError({ error }: { error?: any }) {
  return (
    <div className="container mx-auto px-4 py-20 max-w-xl text-center">
      <div className="flex flex-col items-center justify-center space-y-8 p-8 border border-border/40 rounded-2xl bg-card shadow-premium">
        <div className="rounded-2xl bg-destructive/10 p-5 text-destructive animate-pulse shadow-premium-sm border border-destructive/20">
          <Database className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl text-gradient">
            Connection Failed
          </h1>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
            The application is unable to reach the database server.
          </p>
        </div>

        <div className="w-full text-left rounded-xl border border-border/30 bg-muted/20 p-6 space-y-4 text-xs leading-relaxed">
          <div className="flex items-center gap-2 font-bold text-destructive uppercase tracking-wider">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Connection Error Details</span>
          </div>
          <p className="font-mono text-muted-foreground bg-muted/50 p-3 rounded-lg overflow-x-auto max-w-full border border-border/30">
            {error?.message || "Can't reach database server at localhost:5432"}
          </p>
          <div className="pt-2 space-y-2 text-muted-foreground/90">
            <p className="font-bold text-foreground uppercase tracking-wider text-[10px]">
              Troubleshooting Steps:
            </p>
            <ol className="list-decimal pl-4 space-y-2">
              <li>Ensure Docker Desktop or your local PostgreSQL service is running.</li>
              <li>
                Start the database container:{' '}
                <code className="bg-muted px-2 py-0.5 rounded font-mono font-bold text-foreground border border-border/30">
                  docker compose up -d
                </code>
              </li>
              <li>
                Initialize and seed database:{' '}
                <code className="bg-muted px-2 py-0.5 rounded font-mono font-bold text-foreground border border-border/30">
                  npm run db:push && npm run db:seed
                </code>
              </li>
              <li>
                Check your connection settings in your{' '}
                <code className="font-mono text-foreground font-bold border border-border/30 px-1.5 py-0.5 rounded bg-muted">
                  .env
                </code>{' '}
                file.
              </li>
            </ol>
          </div>
        </div>

        <Button onClick={() => window.location.reload()} className="gap-2 font-bold text-xs">
          <RefreshCw className="h-4 w-4" />
          Retry Connection
        </Button>
      </div>
    </div>
  );
}
