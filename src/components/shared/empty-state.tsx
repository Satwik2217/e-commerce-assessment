import { Package } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center border border-dashed border-border/60 rounded-2xl bg-card/45 backdrop-blur-sm max-w-lg mx-auto">
      <div className="rounded-2xl bg-accent p-4 text-primary shadow-premium-sm">
        {icon || <Package className="h-7 w-7" />}
      </div>
      <h3 className="mt-5 text-base font-bold uppercase tracking-wider text-foreground">{title}</h3>
      <p className="mt-2 text-xs font-semibold text-muted-foreground/80 max-w-xs leading-relaxed">
        {description}
      </p>
    </div>
  );
}
