import type { CSSProperties } from 'react';

// Event block shared by the week calendar and follow-ups list. Pair it with
// eventBlockStyle(color) for the colored left bar and tinted background.
export const eventBlock =
  'cursor-pointer rounded-[4px] border-l-[3px] px-2 py-1.5 text-xs text-foreground shadow-xs transition-[filter] hover:brightness-125 dark:shadow-black/40';

// Tint the block with its event color so it stands out from the grid in both themes
export const eventBlockStyle = (color: string): CSSProperties => ({
  borderLeftColor: color,
  backgroundColor: `color-mix(in srgb, ${color} 18%, var(--card))`,
});
