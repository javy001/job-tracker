import { XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Props {
  // "HH:mm", or null when no time is set
  value: string | null;
  onChange: (val: string | null) => void;
  id?: string;
  className?: string;
}

// Native time input (styled to match) with a button to clear the time
export function TimePicker({ value, onChange, id, className }: Props) {
  return (
    <div className={cn('relative', className)}>
      <Input
        id={id}
        type="time"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="pr-8"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Clear time"
          className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground"
          onClick={() => onChange(null)}
        >
          <XIcon />
        </Button>
      )}
    </div>
  );
}
