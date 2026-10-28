import { DatePicker as DPicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import type { Dayjs } from 'dayjs';

interface Props {
  value: Dayjs;
  onChange: (val: Dayjs) => void;
  label?: string;
}

export function DatePicker({ value, onChange, label = 'Application Date' }: Props) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DPicker
        label={label}
        value={value}
        onChange={(newValue) => {
          if (newValue) onChange(newValue);
        }}
      />
    </LocalizationProvider>
  );
}
