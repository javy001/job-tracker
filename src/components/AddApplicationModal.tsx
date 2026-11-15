import React from 'react';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import ClearIcon from '@mui/icons-material/Clear';
import { useQueryClient } from '@tanstack/react-query';
import { DatePicker } from './DatePicker';
import dayjs from 'dayjs';
import { isValidEmail } from '../validation';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 560,
  maxHeight: '90vh',
  overflowY: 'auto',
  bgcolor: 'background.paper',
  boxShadow: 24,
  borderRadius: '5px',
  p: 4,
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddApplicationModal({ open, onClose }: Props) {
  const [companyName, setCompanyName] = React.useState('');
  const [role, setRole] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [contactName, setContactName] = React.useState('');
  const [contactEmail, setContactEmail] = React.useState('');
  const [source, setSource] = React.useState<'outbound' | 'inbound'>('outbound');
  const [date, setDate] = React.useState(dayjs());
  // Salary is optional: kept as strings so an empty input means "no value"
  const [salaryMin, setSalaryMin] = React.useState('');
  const [salaryMax, setSalaryMax] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const queryClient = useQueryClient();

  const salaryInvalid =
    salaryMin !== '' && salaryMax !== '' && Number(salaryMin) > Number(salaryMax);
  const emailInvalid = !isValidEmail(contactEmail);
  const hasSalary = salaryMin !== '' || salaryMax !== '';
  const toSalary = (val: string) => (val === '' ? null : Number(val));

  // The modal stays mounted in App, so clear the form after a successful save
  const resetForm = () => {
    setCompanyName('');
    setRole('');
    setLocation('');
    setContactName('');
    setContactEmail('');
    setSource('outbound');
    setDate(dayjs());
    setSalaryMin('');
    setSalaryMax('');
    setNotes('');
  };

  const addApplication = () => {
    setSaving(true);
    fetch('/api/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: companyName,
        status: 'applied',
        role,
        date: date.format('YYYY-MM-DD'),
        source,
        location: location || null,
        point_of_contact_name: contactName.trim() || null,
        point_of_contact_email: contactEmail.trim() || null,
        salary_min: toSalary(salaryMin),
        salary_max: toSalary(salaryMax),
        notes: notes || null,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to add application');
        }
        queryClient.invalidateQueries({ queryKey: ['applications'] });
        resetForm();
        onClose();
      })
      .catch((err) => console.error(err))
      .finally(() => setSaving(false));
  };

  const noAutofill = { htmlInput: { autoComplete: 'new-password' } };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <TextField
            label="Company Name"
            variant="outlined"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            slotProps={noAutofill}
          />
          <TextField
            label="Role"
            variant="outlined"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            slotProps={noAutofill}
          />
          <TextField
            label="Location"
            variant="outlined"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            slotProps={noAutofill}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <TextField
              label="Contact Name"
              variant="outlined"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              style={{ flex: 1 }}
              slotProps={noAutofill}
            />
            <TextField
              label="Contact Email"
              type="email"
              variant="outlined"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              error={emailInvalid}
              helperText={emailInvalid ? 'Enter a valid email' : undefined}
              style={{ flex: 1 }}
              slotProps={noAutofill}
            />
          </div>
          <TextField
            select
            label="Source"
            variant="outlined"
            value={source}
            onChange={(e) => setSource(e.target.value as 'inbound' | 'outbound')}
          >
            <MenuItem value="outbound">Outbound</MenuItem>
            <MenuItem value="inbound">Inbound</MenuItem>
          </TextField>
          <DatePicker value={date} onChange={(val) => setDate(val)} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Salary Range (optional)
            {hasSalary && (
              <Button
                size="small"
                color="error"
                startIcon={<ClearIcon />}
                onClick={() => {
                  setSalaryMin('');
                  setSalaryMax('');
                }}
              >
                Clear
              </Button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <TextField
              label="Min"
              type="number"
              size="small"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              error={salaryInvalid}
              helperText={salaryInvalid ? 'Min must be ≤ max' : undefined}
              autoComplete="off"
              style={{ flex: 1 }}
              slotProps={{
                input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                htmlInput: { min: 0, step: 1000 },
              }}
            />
            <TextField
              label="Max"
              type="number"
              size="small"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              error={salaryInvalid}
              autoComplete="off"
              style={{ flex: 1 }}
              slotProps={{
                input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                htmlInput: { min: 0, step: 1000 },
              }}
            />
          </div>
          <TextField
            label="Notes"
            variant="outlined"
            multiline
            minRows={3}
            maxRows={10}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button
            size="small"
            variant="contained"
            disabled={!role.length || !companyName.length || salaryInvalid || emailInvalid || saving}
            onClick={addApplication}
          >
            Save
          </Button>
        </div>
      </Box>
    </Modal>
  );
}
