import React from 'react';
import { CheckIcon, ListFilterIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';

export interface FilterOption {
  value: string;
  label: string;
}

interface Props {
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  // Allow picking several options (otherwise picking one replaces the other)
  multiple?: boolean;
  // Show a search box above the options
  searchable?: boolean;
}

// A filter icon button for a column header that opens a list of options to pick from
export function ColumnFilter({ label, options, selected, onChange, multiple, searchable }: Props) {
  const [open, setOpen] = React.useState(false);
  const active = selected.length > 0;

  const toggle = (value: string) => {
    if (multiple) {
      onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
    } else {
      onChange(selected.includes(value) ? [] : [value]);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Filter ${label}`}
          className={cn(
            'relative text-muted-foreground hover:text-foreground',
            (active || open) && 'text-foreground',
          )}
          // The header cell sorts on click; don't let the filter button trigger it
          onClick={(e) => e.stopPropagation()}
        >
          <ListFilterIcon />
          {active && (
            <span className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-primary" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-56 p-0"
        // Content is portaled, but React still bubbles its clicks to the header cell
        onClick={(e) => e.stopPropagation()}
      >
        <Command>
          {searchable && <CommandInput placeholder={`Search ${label.toLowerCase()}…`} />}
          <CommandList>
            <CommandEmpty>No matches.</CommandEmpty>
            <CommandGroup>
              {options.map((o) => {
                const checked = selected.includes(o.value);
                return (
                  <CommandItem
                    key={o.value}
                    value={`${o.label} ${o.value}`}
                    onSelect={() => toggle(o.value)}
                    className="text-xs"
                  >
                    <CheckIcon className={cn('size-3.5', !checked && 'invisible')} />
                    <span className="truncate">{o.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {active && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    value="__clear__"
                    forceMount
                    onSelect={() => onChange([])}
                    className="justify-center text-xs"
                  >
                    Clear filter
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
