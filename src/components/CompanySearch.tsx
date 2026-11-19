import React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { SearchIcon, XIcon } from 'lucide-react';
import { Command, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import type { JobApplication } from '../types';
import { useApplications } from '../hooks/useApplications';
import { UpdateApplicationModal } from './UpdateApplicationModal';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

// Company search box: typing filters the page (via the search context) and
// lists matching applications underneath; picking one opens its edit modal.
export function CompanySearch({ value, onChange }: Props) {
  // Already filtered by the page-wide search term (CompanySearchContext)
  const { data = [] } = useApplications();
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<JobApplication>();

  const term = value.trim().toLowerCase();
  const matches = data.filter((a) => (a.name ?? '').toLowerCase().includes(term));

  return (
    <>
      <Command
        shouldFilter={false}
        className="relative h-auto w-full max-w-[300px] overflow-visible bg-transparent"
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
        }}
      >
        <div className="flex h-8 items-center gap-2 rounded-md border border-input bg-transparent px-2.5 shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:bg-input/30">
          <SearchIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <CommandPrimitive.Input
            value={value}
            onValueChange={(v) => {
              onChange(v);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            placeholder="Search by company"
            className="h-full w-full min-w-0 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
          />
          {value && (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Clear search"
              className="-mr-1 text-muted-foreground"
              // Keep focus in the input so the list doesn't flicker closed
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onChange('')}
            >
              <XIcon />
            </Button>
          )}
        </div>
        {open && term.length > 0 && (
          <div className="absolute top-full right-0 left-0 z-50 mt-1 rounded-md border bg-popover text-popover-foreground shadow-md">
            <CommandList className="p-1">
              {matches.length === 0 ? (
                <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                  No matching companies
                </div>
              ) : (
                matches.map((a) => (
                  <CommandItem
                    key={a.id}
                    value={a.id}
                    // Prevent the input's blur from closing the list before the click lands
                    onMouseDown={(e) => e.preventDefault()}
                    onSelect={() => {
                      setSelected(a);
                      setOpen(false);
                    }}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium">{a.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {[a.role, a.status].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  </CommandItem>
                ))
              )}
            </CommandList>
          </div>
        )}
      </Command>
      {selected && (
        <UpdateApplicationModal
          key={selected.id}
          open
          onClose={() => setSelected(undefined)}
          data={selected}
        />
      )}
    </>
  );
}
