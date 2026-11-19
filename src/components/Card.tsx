import React from 'react';

interface Props {
  children: React.ReactNode;
}

// Floating surface, used for chart tooltips
export function Card({ children }: Props) {
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
      {children}
    </div>
  );
}
