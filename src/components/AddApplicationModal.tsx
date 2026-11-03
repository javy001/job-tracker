import React from 'react';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import { TextField } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  // border: '2px solid #000',
  boxShadow: 24,
  borderRadius: '5px',
  p: 4,
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddApplicationModal({ open, onClose }: Props) {
  const [companyName, setCompanyName] = React.useState<string>();
  const [role, setRole] = React.useState<string>();
  const [source, setSource] = React.useState<'outbound' | 'inbound'>('outbound');
  const [date, setDate] = React.useState(dayjs());

  const queryClient = useQueryClient();

  const addApplication = () => {
    fetch('/api/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: companyName,
        status: 'applied',
        role: role,
        date: date.format('YYYY-MM-DD'),
        source
      }),
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setCompanyName(undefined);
      onClose();
    });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
          <TextField
            label="Company Name"
            variant="outlined"
            onChange={(e) => {
              setCompanyName(e.target.value);
            }}
            slotProps={{
              htmlInput: {
                autoComplete: 'new-password',
              },
            }}
          />
          <TextField
            label="Role"
            variant="outlined"
            onChange={(e) => {
              setRole(e.target.value);
            }}
            slotProps={{
              htmlInput: {
                autoComplete: 'new-password',
              },
            }}
          />
          <Select
            value={source}
            label="Type"
            onChange={(e) => {
              setSource(e.target.value);
            }}
          >
            <MenuItem value={'outbound'}>Outbound</MenuItem>
            <MenuItem value={'inbound'}>Inbound</MenuItem>
          </Select>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Application Date"
              value={date}
              onChange={(newValue) => {
                if (newValue) setDate(newValue);
              }}
            />
          </LocalizationProvider>
          <Button
            size="small"
            variant="contained"
            disabled={!role?.length || !companyName?.length}
            onClick={addApplication}
          >
            Save
          </Button>
        </div>
      </Box>
    </Modal>
  );
}
