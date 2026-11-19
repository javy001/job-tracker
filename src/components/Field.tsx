import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface Props {
  label: ReactNode;
  // id of the control, so clicking the label focuses it
  htmlFor?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}

// A label above a form control, with an optional error message below it
export function Field({ label, htmlFor, error, className, children }: Props) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
      {error && <p className="m-0 text-xs text-destructive">{error}</p>}
    </div>
  );
}
