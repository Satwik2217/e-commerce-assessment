import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, className, children }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border/20 mb-8',
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-gradient">{title}</h1>
        {description && (
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground/70 uppercase tracking-wider">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3 self-start sm:self-auto">{children}</div>
      )}
    </div>
  );
}
