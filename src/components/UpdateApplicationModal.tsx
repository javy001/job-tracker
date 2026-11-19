import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ApplicationEvent, ApplicationEventType, JobApplication } from '../types';
import { DatePicker } from './DatePicker';
import { TimePicker } from './TimePicker';
import { EventCalendarLink } from './EventCalendarLink';
import { Field } from './Field';
import { SalaryRangeFields, SourceSelect } from './ApplicationFields';
import {
  DEFAULT_EVENT_DURATION,
  durationOptions,
  eventSortKey,
  eventTypes,
  formatDuration,
} from '../eventTypes';
import { isValidEmail } from '../validation';

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
  const id = React.useId();

  // Invites linked to this application when the modal opened
  const ownUids = React.useMemo(
    () => new Set((data.events ?? []).flatMap((e) => (e.calendar_uid ? [e.calendar_uid] : []))),
    [data.events]
  );
  const uidsLinkedExcept = (id: string) =>
    new Set(events.flatMap((e) => (e._id !== id && e.calendar_uid ? [e.calendar_uid] : [])));

  const salaryInvalid =
    salaryMin !== '' && salaryMax !== '' && Number(salaryMin) > Number(salaryMax);
  const emailInvalid = !isValidEmail(contactEmail);
  const toSalary = (val: string) => (val === '' ? null : Number(val));

  const updateEvent = (id: string, changes: Partial<ApplicationEvent>) => {
    setEvents((prev) => prev.map((e) => (e._id === id ? { ...e, ...changes } : e)));
  };

  const addEvent = () => {
    setEvents((prev) => [
      ...prev,
      withId({
        type: 'phone_screen',
        date: dayjs().format('YYYY-MM-DD'),
        duration: DEFAULT_EVENT_DURATION,
        notes: '',
      }),
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
      // Linking/unlinking changes which invites are new and which have changes
      queryClient.invalidateQueries({ queryKey: ['calendar-invites'] });
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
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        className="max-h-[90vh] grid-cols-[minmax(0,1fr)] overflow-y-auto sm:max-w-[560px]"
      >
        <DialogHeader>
          <DialogTitle className="text-base">Edit application</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Field label="Company name" htmlFor={`${id}-company`}>
            <Input
              id={`${id}-company`}
              value={companyName ?? ''}
              onChange={(e) => setCompanyName(e.target.value)}
              autoComplete="off"
            />
          </Field>
          <Field label="Role" htmlFor={`${id}-role`}>
            <Input
              id={`${id}-role`}
              value={role ?? ''}
              onChange={(e) => setRole(e.target.value)}
              autoComplete="off"
            />
          </Field>
          <Field label="Location" htmlFor={`${id}-location`}>
            <Input
              id={`${id}-location`}
              value={location ?? ''}
              onChange={(e) => setLocation(e.target.value)}
              autoComplete="off"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Contact name" htmlFor={`${id}-contact-name`}>
              <Input
                id={`${id}-contact-name`}
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                autoComplete="off"
              />
            </Field>
            <Field
              label="Contact email"
              htmlFor={`${id}-contact-email`}
              error={emailInvalid ? 'Enter a valid email' : undefined}
            >
              <Input
                id={`${id}-contact-email`}
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                aria-invalid={emailInvalid || undefined}
                autoComplete="off"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SourceSelect value={source} onChange={setSource} />
            <Field label="Application date" htmlFor={`${id}-date`}>
              <DatePicker
                id={`${id}-date`}
                value={applicationDate}
                onChange={setApplicationDate}
              />
            </Field>
          </div>
          <SalaryRangeFields
            min={salaryMin}
            max={salaryMax}
            onMinChange={setSalaryMin}
            onMaxChange={setSalaryMax}
            invalid={salaryInvalid}
          />

          <div className="mt-1 flex items-center justify-between">
            <h3 className="m-0 text-[13px] font-semibold">Interviews</h3>
            <Button variant="ghost" size="sm" onClick={addEvent}>
              <PlusIcon />
              Add event
            </Button>
          </div>
          {events.length === 0 && (
            <p className="m-0 rounded-md border border-dashed px-3 py-4 text-center text-xs text-subtle-foreground">
              No events yet
            </p>
          )}
          {events.toReversed().map((e) => (
            <div
              key={e._id}
              className="flex flex-col gap-2 rounded-md border border-l-[3px] bg-muted/40 p-3"
              style={{ borderLeftColor: eventTypes[e.type]?.color ?? 'var(--subtle-foreground)' }}
            >
              <div className="flex items-center gap-2">
                <Select
                  value={e.type}
                  onValueChange={(v) => updateEvent(e._id, { type: v as ApplicationEventType })}
                >
                  <SelectTrigger aria-label="Event type" className="flex-1 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(eventTypes).map(([value, { label, color }]) => (
                      <SelectItem key={value} value={value}>
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: color }}
                          aria-hidden="true"
                        />
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove event"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => removeEvent(e._id)}
                >
                  <Trash2Icon />
                </Button>
              </div>
              <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2">
                <DatePicker
                  value={dayjs(e.date)}
                  onChange={(val) => updateEvent(e._id, { date: val.format('YYYY-MM-DD') })}
                  className="bg-background"
                />
                <TimePicker
                  value={e.time ?? null}
                  onChange={(time) => updateEvent(e._id, { time })}
                />
                <Select
                  value={String(e.duration ?? DEFAULT_EVENT_DURATION)}
                  onValueChange={(v) => updateEvent(e._id, { duration: Number(v) })}
                >
                  <SelectTrigger aria-label="Duration" className="w-full bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[...new Set([...durationOptions, e.duration ?? DEFAULT_EVENT_DURATION])]
                      .sort((a, b) => a - b)
                      .map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {formatDuration(m)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                aria-label="Event notes"
                placeholder="Event notes"
                value={e.notes ?? ''}
                onChange={(ev) => updateEvent(e._id, { notes: ev.target.value })}
                autoComplete="off"
                className="bg-background"
              />
              <EventCalendarLink
                event={e}
                takenUids={uidsLinkedExcept(e._id)}
                ownUids={ownUids}
                onChange={(changes) => updateEvent(e._id, changes)}
              />
            </div>
          ))}

          <Field label="Notes" htmlFor={`${id}-notes`}>
            <Textarea
              id={`${id}-notes`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-20 max-h-60"
            />
          </Field>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirmDeleteOpen(true)}
          >
            <Trash2Icon />
            Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={!role?.length || !companyName?.length || salaryInvalid || emailInvalid}
              onClick={updateApplication}
            >
              Save
            </Button>
          </div>
        </DialogFooter>
        <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete application?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the {data.role} application at {data.name},
                including its events and notes. This can't be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-white hover:bg-destructive/90"
                disabled={deleting}
                onClick={(ev) => {
                  // Keep the dialog open until the delete finishes
                  ev.preventDefault();
                  deleteApplication();
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
