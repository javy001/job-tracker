import React from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Props {
  value: Dayjs;
  onChange: (val: Dayjs) => void;
  id?: string;
  className?: string;
}

// A button showing the date that opens a month calendar
export function DatePicker({ value, onChange, id, className }: Props) {
  const [open, setOpen] = React.useState(false);
  const date = value.isValid() ? value.toDate() : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn('h-9 justify-start px-3 text-[13px] font-normal', className)}
        >
          <CalendarIcon className="text-muted-foreground" />
          {date ? value.format('MMM D, YYYY') : <span className="text-muted-foreground">Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          onSelect={(d) => {
            if (d) onChange(dayjs(d));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
