import React from 'react';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import type { ApplicationEvent, ApplicationEventType, JobApplication } from '../types';
import { useQueryClient } from '@tanstack/react-query';
import { DatePicker } from './DatePicker';
import { TimePicker } from './TimePicker';
import { eventSortKey, eventTypes } from '../eventTypes';
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
  // border: '2px solid #000',
  boxShadow: 24,
  borderRadius: '5px',
  p: 4,
};

// Client-only id so React can track event rows across add/remove/reorder.
// Stripped before saving, so it never reaches the server.
type EditableEvent = ApplicationEvent & { _id: string };

const withId = (e: ApplicationEvent): EditableEvent => ({ ...e, _id: crypto.randomUUID() });

interface Props {
  open: boolean;
  onClose: () => void;
  data: JobApplication;
}

export function UpdateApplicationModal({ open, onClose, data }: Props) {
  const [companyName, setCompanyName] = React.useState<string | null>(data.name);
  const [role, setRole] = React.useState<string | null>(data.role);
  const [location, setLocation] = React.useState<string | null>(data.location);
  const [source, setSource] = React.useState<JobApplication['source']>(data.source);
  const [contactName, setContactName] = React.useState<string>(data.point_of_contact_name ?? '');
  const [contactEmail, setContactEmail] = React.useState<string>(
    data.point_of_contact_email ?? ''
  );
  // Salary is optional: kept as strings so an empty input means "no value"
  const [salaryMin, setSalaryMin] = React.useState<string>(
    data.salary_min != null ? String(Number(data.salary_min)) : ''
  );
  const [salaryMax, setSalaryMax] = React.useState<string>(
    data.salary_max != null ? String(Number(data.salary_max)) : ''
  );
  const [applicationDate, setApplicationDate] = React.useState(dayjs(data.date_applied));
  const [notes, setNotes] = React.useState<string>(data.notes ?? '');
  const [events, setEvents] = React.useState<EditableEvent[]>(() =>
    (data.events ?? []).map(withId)
  );
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const queryClient = useQueryClient();

  const salaryInvalid =
    salaryMin !== '' && salaryMax !== '' && Number(salaryMin) > Number(salaryMax);
  const emailInvalid = !isValidEmail(contactEmail);
  const hasSalary = salaryMin !== '' || salaryMax !== '';
  const toSalary = (val: string) => (val === '' ? null : Number(val));

  const updateEvent = (id: string, changes: Partial<ApplicationEvent>) => {
    setEvents((prev) => prev.map((e) => (e._id === id ? { ...e, ...changes } : e)));
  };

  const addEvent = () => {
    setEvents((prev) => [
      ...prev,
      withId({ type: 'phone_screen', date: dayjs().format('YYYY-MM-DD'), notes: '' }),
    ]);
  };

  const removeEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e._id !== id));
  };

  const updateApplication = () => {
    fetch(`/api/applications/${data.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: companyName,
        status: data.status,
        role: role,
        id: data.id,
        location: location,
        source: source ?? undefined,
        date: applicationDate.format('YYYY-MM-DD'),
        salary_min: toSalary(salaryMin),
        salary_max: toSalary(salaryMax),
        notes: notes,
        point_of_contact_name: contactName.trim(),
        point_of_contact_email: contactEmail.trim(),
        events: events
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .map(({ _id, ...e }) => e)
          .sort((a, b) => eventSortKey(a).localeCompare(eventSortKey(b))),
      }),
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setCompanyName(null);
      setRole(null);
      onClose();
    });
  };

  const deleteApplication = () => {
    setDeleting(true);
    fetch(`/api/applications/${data.id}`, { method: 'DELETE' })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to delete application');
        }
        queryClient.invalidateQueries({ queryKey: ['applications'] });
        setConfirmDeleteOpen(false);
        onClose();
      })
      .catch((err) => {
        console.error(err);
        setDeleting(false);
      });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <TextField
            label="Company Name"
            variant="outlined"
            onChange={(e) => {
              setCompanyName(e.target.value);
            }}
            value={companyName}
            autoComplete="off"
          />
          <TextField
            label="Role"
            variant="outlined"
            onChange={(e) => {
              setRole(e.target.value);
            }}
            value={role}
            autoComplete="off"
          />
          <TextField
            label="Location"
            variant="outlined"
            onChange={(e) => {
              setLocation(e.target.value);
            }}
            value={location}
            autoComplete="off"
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <TextField
              label="Contact Name"
              variant="outlined"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              style={{ flex: 1 }}
              autoComplete="off"
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
              autoComplete="off"
            />
          </div>
          <TextField
            select
            label="Source"
            variant="outlined"
            value={source ?? ''}
            onChange={(e) => {
              setSource(e.target.value as 'inbound' | 'outbound');
            }}
          >
            <MenuItem value="outbound">Outbound</MenuItem>
            <MenuItem value="inbound">Inbound</MenuItem>
          </TextField>
          <DatePicker
            value={applicationDate}
            onChange={(val) => setApplicationDate(val)}
          />
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Interviews
            <Button size="small" startIcon={<AddIcon />} onClick={addEvent}>
              Add Event
            </Button>
          </div>
          {events.toReversed().map((e) => (
            <div
              key={e._id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '10px',
                borderLeft: `3px solid ${eventTypes[e.type]?.color ?? '#b8b8b8'}`,
                backgroundColor: '#f8fafc',
                borderRadius: '4px',
              }}
            >
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <TextField
                  select
                  label="Type"
                  size="small"
                  value={e.type}
                  onChange={(ev) =>
                    updateEvent(e._id, { type: ev.target.value as ApplicationEventType })
                  }
                  style={{ flex: 1 }}
                >
                  {Object.entries(eventTypes).map(([value, { label }]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </TextField>
                <IconButton aria-label="Remove event" onClick={() => removeEvent(e._id)}>
                  <DeleteOutlineIcon />
                </IconButton>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <DatePicker
                  label="Date"
                  value={dayjs(e.date)}
                  onChange={(val) => updateEvent(e._id, { date: val.format('YYYY-MM-DD') })}
                />
                <TimePicker
                  value={e.time ? dayjs(`${e.date}T${e.time}`) : null}
                  onChange={(val) => updateEvent(e._id, { time: val ? val.format('HH:mm') : null })}
                />
              </div>
              <TextField
                label="Event Notes"
                size="small"
                value={e.notes ?? ''}
                onChange={(ev) => updateEvent(e._id, { notes: ev.target.value })}
                autoComplete="off"
              />
            </div>
          ))}
          <TextField
            label="Notes"
            variant="outlined"
            multiline
            minRows={3}
            maxRows={10}
            onChange={(e) => {
              setNotes(e.target.value);
            }}
            value={notes}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
            <Button
              size="small"
              color="error"
              startIcon={<DeleteOutlineIcon />}
              onClick={() => setConfirmDeleteOpen(true)}
            >
              Delete
            </Button>
            <Button
              size="small"
              variant="contained"
              disabled={!role?.length || !companyName?.length || salaryInvalid || emailInvalid}
              onClick={updateApplication}
            >
              Save
            </Button>
          </div>
        </div>
        <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
          <DialogTitle>Delete application?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This will permanently delete the {data.role} application at {data.name},
              including its events and notes. This can't be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              color="error"
              variant="contained"
              onClick={deleteApplication}
              disabled={deleting}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Modal>
  );
}
