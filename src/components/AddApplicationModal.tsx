import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from './DatePicker';
import { Field } from './Field';
import { SalaryRangeFields, SourceSelect } from './ApplicationFields';
import { isValidEmail } from '../validation';

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

  // Stops browsers offering saved addresses/passwords in these fields
  const noAutofill = 'new-password';

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        className="max-h-[90vh] grid-cols-[minmax(0,1fr)] overflow-y-auto sm:max-w-[560px]"
      >
        <DialogHeader>
          <DialogTitle className="text-base">Add application</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Field label="Company name" htmlFor="add-company">
            <Input
              id="add-company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              autoComplete={noAutofill}
            />
          </Field>
          <Field label="Role" htmlFor="add-role">
            <Input
              id="add-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              autoComplete={noAutofill}
            />
          </Field>
          <Field label="Location" htmlFor="add-location">
            <Input
              id="add-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              autoComplete={noAutofill}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Contact name" htmlFor="add-contact-name">
              <Input
                id="add-contact-name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                autoComplete={noAutofill}
              />
            </Field>
            <Field
              label="Contact email"
              htmlFor="add-contact-email"
              error={emailInvalid ? 'Enter a valid email' : undefined}
            >
              <Input
                id="add-contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                aria-invalid={emailInvalid || undefined}
                autoComplete={noAutofill}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SourceSelect value={source} onChange={setSource} />
            <Field label="Application date" htmlFor="add-date">
              <DatePicker id="add-date" value={date} onChange={setDate} />
            </Field>
          </div>
          <SalaryRangeFields
            min={salaryMin}
            max={salaryMax}
            onMinChange={setSalaryMin}
            onMaxChange={setSalaryMax}
            invalid={salaryInvalid}
          />
          <Field label="Notes" htmlFor="add-notes">
            <Textarea
              id="add-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-20 max-h-60"
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!role.length || !companyName.length || salaryInvalid || emailInvalid || saving}
            onClick={addApplication}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
