import { TimePicker as TPicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import type { Dayjs } from 'dayjs';

interface Props {
  value: Dayjs | null;
  onChange: (val: Dayjs | null) => void;
  label?: string;
}

export function TimePicker({ value, onChange, label = 'Time' }: Props) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <TPicker
        label={label}
        value={value}
        onChange={(newValue) => {
          if (newValue === null || newValue.isValid()) onChange(newValue);
        }}
        slotProps={{ field: { clearable: true } }}
      />
    </LocalizationProvider>
  );
}
