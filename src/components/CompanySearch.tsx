import React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import type { JobApplication } from '../types';
import { useApplications } from '../hooks/useApplications';
import { UpdateApplicationModal } from './UpdateApplicationModal';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

// Company search box: typing filters the page (via the search context) and
// lists matching applications underneath; picking one opens its edit modal.
export function CompanySearch({ value, onChange }: Props) {
  // Already filtered by the page-wide search term (CompanySearchContext)
  const { data = [] } = useApplications();
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<JobApplication>();

  const term = value.trim().toLowerCase();

  return (
    <>
      <Autocomplete<JobApplication, false, false, true>
        freeSolo
        size="small"
        sx={{ width: 300 }}
        options={data}
        value={null}
        open={open && term.length > 0}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        inputValue={value}
        onInputChange={(_, newValue, reason) => {
          // Keep what the user typed after they pick a result
          if (reason !== 'reset') onChange(newValue);
        }}
        onChange={(_, option) => {
          if (option && typeof option !== 'string') setSelected(option);
        }}
        filterOptions={(options) =>
          options.filter((a) => (a.name ?? '').toLowerCase().includes(term))
        }
        getOptionLabel={(option) => (typeof option === 'string' ? option : option.name ?? '')}
        getOptionKey={(option) => (typeof option === 'string' ? option : option.id)}
        renderOption={({ key, ...props }, option) => (
          <li key={key} {...props}>
            <div>
              <div style={{ fontWeight: 600 }}>{option.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {[option.role, option.status].filter(Boolean).join(' · ')}
              </div>
            </div>
          </li>
        )}
        renderInput={(params) => <TextField {...params} placeholder="Search by company" />}
      />
      {selected && (
        <UpdateApplicationModal
          key={selected.id}
          open
          onClose={() => setSelected(undefined)}
          data={selected}
        />
      )}
    </>
  );
}
