import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const textareaVariants = cva(
  'flex min-h-[80px] w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-premium-sm transition-all placeholder:text-muted-foreground/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-ring/60 hover:border-muted-foreground/30 disabled:cursor-not-allowed disabled:opacity-50'
);

export interface TextareaProps
  extends
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return <textarea className={cn(textareaVariants({ className }))} ref={ref} {...props} />;
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
