import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  title: ReactNode;
  // Controls shown on the right of the header
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

// A bordered panel with a compact header row, used for each dashboard block
export function Section({ title, actions, className, bodyClassName, children }: Props) {
  return (
    <section className={cn('rounded-lg border bg-card text-card-foreground', className)}>
      <header className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-b px-4 py-1.5">
        <h2 className="m-0 text-sm font-semibold">{title}</h2>
        {actions && <div className="flex flex-wrap items-center gap-1">{actions}</div>}
      </header>
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </section>
  );
}
