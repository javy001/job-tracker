import React from 'react';
import { XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Field } from './Field';

// Pieces shared by the add and edit application modals

type Source = 'inbound' | 'outbound';

export function SourceSelect({
  value,
  onChange,
}: {
  value: Source | null | undefined;
  onChange: (value: Source) => void;
}) {
  const id = React.useId();
  return (
    <Field label="Source" htmlFor={id}>
      <Select value={value ?? undefined} onValueChange={(v) => onChange(v as Source)}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="Select a source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="outbound">Outbound</SelectItem>
          <SelectItem value="inbound">Inbound</SelectItem>
        </SelectContent>
      </Select>
    </Field>
  );
}

function MoneyInput({
  label,
  value,
  onChange,
  invalid,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  invalid: boolean;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
        $
      </span>
      <Input
        type="number"
        min={0}
        step={1000}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid || undefined}
        placeholder={label}
        aria-label={`${label} salary`}
        className="pl-6"
      />
    </div>
  );
}

// Optional min / max salary, with a Clear button once either is set
export function SalaryRangeFields({
  min,
  max,
  onMinChange,
  onMaxChange,
  invalid,
}: {
  min: string;
  max: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  invalid: boolean;
}) {
  const hasSalary = min !== '' || max !== '';
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-1.5 border-0 p-0">
      <div className="flex h-6 items-center justify-between">
        <legend className="p-0 text-xs font-medium text-muted-foreground">
          Salary range (optional)
        </legend>
        {hasSalary && (
          <Button
            variant="ghost"
            size="xs"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              onMinChange('');
              onMaxChange('');
            }}
          >
            <XIcon />
            Clear
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <MoneyInput label="Min" value={min} onChange={onMinChange} invalid={invalid} />
        <MoneyInput label="Max" value={max} onChange={onMaxChange} invalid={invalid} />
      </div>
      {invalid && <p className="m-0 text-xs text-destructive">Min must be ≤ max</p>}
    </fieldset>
  );
}
